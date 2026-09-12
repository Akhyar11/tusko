import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Edit2, 
  Edit3,
  Trash2, 
  Package, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  AlertCircle,
  Check,
  Layers,
  X,
  SlidersHorizontal,
  MoreVertical
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import CategoryFilterDrawer from './organisms/CategoryFilterDrawer';
import { categoryService } from '../services/categoryService';

export default function CategoryListPage({
  categories: initialCategories = [],
  products = [],
  onCategoriesChange = () => {},
  onShowToast = () => {},
  onBackToShopping = () => {},
  onNavigateToProducts = () => {}
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Table pagination, sorting, and checkbox list selection states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Filter Drawer states
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [iconFilter, setIconFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name_asc');

  // Form Modal state: null | 'create' | 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('Tag');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with prop
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Load categories from server
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await categoryService.fetchCategories({ all: true });
      setCategories(res.data);
      onCategoriesChange(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    let withProducts = 0;
    let emptyCount = 0;
    let totalAssignedProducts = 0;

    categories.forEach(cat => {
      const count = cat.products_count !== undefined 
        ? cat.products_count 
        : products.filter(p => p.category_id === cat.id).length;

      if (count > 0) {
        withProducts++;
        totalAssignedProducts += count;
      } else {
        emptyCount++;
      }
    });

    return { total, withProducts, emptyCount, totalAssignedProducts };
  }, [categories, products]);

  // Filter categories by search, product association status, and icon
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSearch = 
          c.name.toLowerCase().includes(q) || 
          (c.slug && c.slug.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // Product association status filter
      const prodCount = c.products_count !== undefined 
        ? c.products_count 
        : products.filter(p => p.category_id === c.id).length;

      if (productStatusFilter === 'with_products' && prodCount === 0) return false;
      if (productStatusFilter === 'empty' && prodCount > 0) return false;

      // Icon filter
      if (iconFilter !== 'all' && (c.icon || 'Tag') !== iconFilter) return false;

      return true;
    });
  }, [categories, searchQuery, productStatusFilter, iconFilter, products]);

  // Sort option handler synchronized with table sortBy & sortDirection
  const handleSortOptionChange = (option) => {
    setSortOption(option);
    switch (option) {
      case 'name_desc':
        setSortBy('name');
        setSortDirection('desc');
        break;
      case 'products_desc':
        setSortBy('products_count');
        setSortDirection('desc');
        break;
      case 'products_asc':
        setSortBy('products_count');
        setSortDirection('asc');
        break;
      case 'newest':
        setSortBy('id');
        setSortDirection('desc');
        break;
      case 'name_asc':
      default:
        setSortBy('name');
        setSortDirection('asc');
        break;
    }
    setPage(1);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (productStatusFilter !== 'all') count++;
    if (iconFilter !== 'all') count++;
    if (sortOption !== 'name_asc') count++;
    return count;
  }, [productStatusFilter, iconFilter, sortOption]);

  const handleResetFilters = () => {
    setProductStatusFilter('all');
    setIconFilter('all');
    handleSortOptionChange('name_asc');
    setSearchQuery('');
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormIcon('Tag');
    setFormDescription('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug || '');
    setFormIcon(cat.icon || 'Tag');
    setFormDescription(cat.description || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setErrorMessage('');
  };

  const handleNameChange = (val) => {
    setFormName(val);
    if (!editingCategory || !formSlug) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(slug);
    }
  };

  const handleSaveCategory = async (e) => {
    e?.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Nama kategori wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, '-'),
        icon: formIcon,
        description: formDescription.trim()
      };

      if (editingCategory) {
        const updated = await categoryService.updateCategory(editingCategory.id, payload);
        onShowToast(`Kategori "${updated.name}" berhasil diperbarui!`);
      } else {
        const created = await categoryService.createCategory(payload);
        onShowToast(`Kategori "${created.name}" berhasil ditambahkan ke master!`);
      }

      await loadCategories();
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Gagal menyimpan kategori.';
      setErrorMessage(msg);
      onShowToast(msg, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const activeProds = cat.products_count !== undefined 
      ? cat.products_count 
      : products.filter(p => p.category_id === cat.id).length;

    if (activeProds > 0) {
      onShowToast(`Kategori "${cat.name}" memiliki ${activeProds} produk aktif dan tidak dapat dihapus!`, { type: 'error' });
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus master kategori "${cat.name}"?`)) {
      return;
    }

    try {
      await categoryService.deleteCategory(cat.id);
      onShowToast(`Kategori "${cat.name}" berhasil dihapus.`);
      await loadCategories();
    } catch (err) {
      onShowToast(err.data?.message || err.message || 'Gagal menghapus kategori.', { type: 'error' });
    }
  };

  // Sort categories
  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'products_count') {
        valA = a.products_count !== undefined ? a.products_count : products.filter(p => p.category_id === a.id).length;
        valB = b.products_count !== undefined ? b.products_count : products.filter(p => p.category_id === b.id).length;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCategories, sortBy, sortDirection, products]);

  // Paginate categories
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedCategories.slice(start, start + limit);
  }, [sortedCategories, page, limit]);

  // Checkbox list selection handlers
  const handleSelectRow = (id) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategoryIds.length === paginatedCategories.length && paginatedCategories.length > 0) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(paginatedCategories.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategoryIds.length === 0) return;

    const protectedCats = categories.filter(c => {
      if (!selectedCategoryIds.includes(c.id)) return false;
      const count = c.products_count !== undefined ? c.products_count : products.filter(p => p.category_id === c.id).length;
      return count > 0;
    });

    if (protectedCats.length > 0) {
      onShowToast(`${protectedCats.length} kategori tidak dapat dihapus karena masih memiliki produk katalog aktif.`, { type: 'error' });
      return;
    }

    if (!window.confirm(`Hapus ${selectedCategoryIds.length} master kategori terpilih?`)) {
      return;
    }

    try {
      for (const id of selectedCategoryIds) {
        await categoryService.deleteCategory(id);
      }
      setSelectedCategoryIds([]);
      onShowToast(`${selectedCategoryIds.length} kategori berhasil dihapus.`);
      await loadCategories();
    } catch (err) {
      onShowToast('Sebagian kategori gagal dihapus.', { type: 'error' });
    }
  };

  // Table Columns Definition for ServerSideTable
  const tableColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Nama Master Kategori',
      sortable: true,
      render: (name, cat) => (
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-amber-500 shrink-0" />
          <span className="font-sport font-bold text-neutral-950 text-sm">{name || cat?.name}</span>
        </div>
      )
    },
    {
      key: 'slug',
      label: 'Slug URL',
      sortable: true,
      render: (slug, cat) => (
        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 font-mono text-xs rounded-none text-neutral-700">
          {slug || cat?.slug}
        </span>
      )
    },
    {
      key: 'icon',
      label: 'Ikon',
      align: 'center',
      width: 'w-24',
      render: (icon, cat) => (
        <span className="px-2.5 py-0.5 bg-neutral-900 text-amber-400 text-[10px] font-mono font-bold rounded-none">
          {icon || cat?.icon || 'Tag'}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (description, cat) => (
        <span className="text-neutral-600 text-xs max-w-xs truncate block">
          {description || cat?.description || '—'}
        </span>
      )
    },
    {
      key: 'products_count',
      label: 'Jumlah Produk',
      align: 'center',
      sortable: true,
      width: 'w-32',
      render: (_, cat) => {
        const count = cat?.products_count !== undefined 
          ? cat.products_count 
          : products.filter(p => p.category_id === cat?.id).length;
        return (
          <span className={`px-2.5 py-0.5 text-xs font-mono font-black rounded-none border ${
            count > 0 
              ? 'bg-amber-50 border-amber-300 text-amber-900' 
              : 'bg-neutral-100 border-neutral-300 text-neutral-500'
          }`}>
            {count} Produk
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'right',
      width: 'w-24',
      render: (_, cat, rowIdx) => {
        const isOpen = activeActionMenuId === cat.id;
        const isNearBottom = rowIdx >= paginatedCategories.length - 2 && paginatedCategories.length > 3;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            {/* Tombol Titik 3 */}
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isOpen ? null : cat.id)}
              className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
              }`}
              title="Menu Aksi Kategori"
              aria-label="Menu Aksi Baris Kategori"
            >
              <MoreVertical size={16} />
            </button>

            {/* Popup Menu Dropdown */}
            {isOpen && (
              <div 
                className={`absolute right-0 ${
                  isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                } w-48 bg-white border border-neutral-300 rounded-none shadow-xl z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100 font-sans`}
              >
                {/* 1. Ubah Kategori */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    handleOpenEdit(cat);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 hover:text-sky-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Edit3 size={15} className="text-sky-600" />
                  <span>Ubah Kategori</span>
                </button>

                <div className="border-t border-neutral-200 my-1" />

                {/* 2. Hapus Kategori */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    handleDeleteCategory(cat);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={15} className="text-rose-600" />
                  <span>Hapus Kategori</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [products, paginatedCategories, activeActionMenuId]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
            <FolderKanban size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
              Master Kategori Produk
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Kelola master kategori produk, slug URL, standarisasi etalase, dan relasi katalog toko.
            </p>
          </div>
        </div>

        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2 shrink-0">
          {onNavigateToProducts && (
            <IconButton
              icon={Package}
              onClick={onNavigateToProducts}
              title="Kembali ke Daftar Produk"
              variant="secondary"
            />
          )}

          <IconButton
            icon={Plus}
            onClick={handleOpenCreate}
            title="Tambah Kategori Baru"
            variant="primary"
          />

          <IconButton
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            title="Buka Filter Kategori"
            variant={activeFilterCount > 0 ? 'dark' : 'secondary'}
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* 2. Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Kategori</span>
            <FolderKanban size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{metrics.total}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Master</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-600 font-bold border-t border-neutral-100 pt-1.5">
            <span>Tersinkronisasi Database</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Kategori Berisi</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-sport">{metrics.withProducts}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Aktif</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-bold border-t border-neutral-100 pt-1.5">
            <span>Memiliki Produk Katalog</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Kategori Kosong</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-sport">{metrics.emptyCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Kategori</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-bold border-t border-neutral-100 pt-1.5">
            <span>Belum Ada Produk</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Produk Terkait</span>
            <Package size={16} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{metrics.totalAssignedProducts}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Total Item</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-600 font-bold border-t border-neutral-100 pt-1.5">
            <span>Tersebar di Master</span>
          </div>
        </div>
      </div>

      {/* Master Categories ServerSideTable with Checkbox List */}
      <ServerSideTable
        columns={tableColumns}
        data={paginatedCategories}
        total={filteredCategories.length}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50]}
        onPageChange={(p) => {
          setPage(p);
          setActiveActionMenuId(null);
        }}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
          setActiveActionMenuId(null);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSortBy(newSortBy);
          setSortDirection(newDir);
          setActiveActionMenuId(null);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedCategoryIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        emptyMessage="Tidak Ada Master Kategori Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau buat master kategori baru."
        bulkActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-sport font-bold text-[11px] uppercase rounded-none transition-colors cursor-pointer"
          >
            Hapus Terpilih
          </button>
        }
      />

      {/* 5. Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-300 w-full max-w-lg rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-400 text-neutral-950 rounded-none">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black font-sport uppercase tracking-tight text-white">
                    {editingCategory ? `Edit: ${editingCategory.name}` : 'Kategori Produk Baru'}
                  </h3>
                </div>
              </div>
              <IconButton
                icon={X}
                onClick={handleCloseModal}
                title="Tutup Modal"
                variant="dark"
              />
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center gap-2 font-sport font-bold uppercase">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nama Master Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Jersey & Apparel"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-bold rounded-none"
                />
              </div>

              <div>
                <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Slug URL (Identifier Kategori)
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="jersey-apparel"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-mono text-xs rounded-none"
                />
              </div>

              <div>
                <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Simbol Ikon Kategori
                </label>
                <select
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-bold rounded-none"
                >
                  <option value="Shirt">Shirt (Jersey & Pakaian)</option>
                  <option value="Footprints">Footprints (Sepatu & Sepatu Olahraga)</option>
                  <option value="Dumbbell">Dumbbell (Peralatan & Gym)</option>
                  <option value="Shield">Shield (Aksesoris & Deker)</option>
                  <option value="Zap">Zap (Running & Marathon)</option>
                  <option value="Trophy">Trophy (Futsal & Sepakbola)</option>
                  <option value="Activity">Activity (Training & Fitness)</option>
                  <option value="Sparkles">Sparkles (Koleksi Pro Player)</option>
                  <option value="Tag">Tag (Kategori Umum)</option>
                </select>
              </div>

              <div>
                <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Penjelasan ringkas jenis produk dalam kategori ini..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-sport font-bold uppercase text-xs rounded-none transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-black font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Right-to-Left Category Filter Drawer */}
      <CategoryFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={filteredCategories.length}
        totalCategories={categories.length}
        searchQuery={searchQuery}
        onSearchQueryChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        productStatusFilter={productStatusFilter}
        onProductStatusFilterChange={(val) => {
          setProductStatusFilter(val);
          setPage(1);
        }}
        iconFilter={iconFilter}
        onIconFilterChange={(val) => {
          setIconFilter(val);
          setPage(1);
        }}
        sortOption={sortOption}
        onSortOptionChange={handleSortOptionChange}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
