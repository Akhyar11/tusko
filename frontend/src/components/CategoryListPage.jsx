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
import ConfirmationModal from './ConfirmationModal';
import { categoryService } from '../services/categoryService';
import { useCategoryTableStore } from '../stores/useCategoryTableStore';

export default function CategoryListPage({
  categories: initialCategories = [],
  products = [],
  onCategoriesChange = () => {},
  onShowToast = () => {},
  onBackToShopping = () => {},
  onNavigateToProducts = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {}
}) {
  const [categories, setCategories] = useState(initialCategories);
  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: tableCategories,
    total: totalCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useCategoryTableStore();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortOption, setSortOption] = useState('name_asc');
  const [errorMessage, setErrorMessage] = useState('');

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with prop
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Load categories from server
  const loadCategories = async () => {
    try {
      const res = await fetchData();
      if (res?.data) {
        setCategories(res.data);
        onCategoriesChange(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
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
    const activeList = tableCategories.length > 0 ? tableCategories : categories;
    const total = totalCount > 0 ? totalCount : activeList.length;
    let withProducts = 0;
    let emptyCount = 0;
    let totalAssignedProducts = 0;

    activeList.forEach(cat => {
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
  }, [tableCategories, totalCount, categories, products]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    if (filters.searchSlug && filters.searchSlug.trim() !== '') count++;
    if (filters.searchDescription && filters.searchDescription.trim() !== '') count++;
    if (filters.productStatusFilter && filters.productStatusFilter !== 'all') count++;
    if (filters.iconFilter && filters.iconFilter !== 'all') count++;
    if (sortOption !== 'name_asc') count++;
    return count;
  }, [filters, sortOption]);

  // Paginated records directly from server-side store
  const paginatedCategories = tableCategories.length > 0 || totalCount === 0 ? tableCategories : categories;
  const totalFiltered = totalCount > 0 || tableCategories.length > 0 ? totalCount : categories.length;

  // Sort option handler synchronized with table sortBy & sortDirection
  const handleSortOptionChange = (option) => {
    setSortOption(option);
    switch (option) {
      case 'name_desc':
        setSort('name', 'desc');
        break;
      case 'products_desc':
        setSort('products_count', 'desc');
        break;
      case 'products_asc':
        setSort('products_count', 'asc');
        break;
      case 'newest':
        setSort('id', 'desc');
        break;
      case 'name_asc':
      default:
        setSort('name', 'asc');
        break;
    }
  };

  const handleResetFilters = () => {
    resetFilters();
    setSortOption('name_asc');
  };

  const handleDeleteCategory = (cat) => {
    const activeProds = cat.products_count !== undefined 
      ? cat.products_count 
      : products.filter(p => p.category_id === cat.id).length;

    if (activeProds > 0) {
      onShowToast(`Kategori "${cat.name}" memiliki ${activeProds} produk aktif dan tidak dapat dihapus!`, { type: 'error' });
      return;
    }

    setCategoryToDelete(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      onShowToast(`Kategori "${categoryToDelete.name}" berhasil dihapus.`);
      setCategoryToDelete(null);
      await loadCategories();
    } catch (err) {
      onShowToast(err.data?.message || err.message || 'Gagal menghapus kategori.', { type: 'error' });
      setCategoryToDelete(null);
    }
  };



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

  const handleBulkDelete = () => {
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

    setIsBulkDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      for (const id of selectedCategoryIds) {
        await categoryService.deleteCategory(id);
      }
      onShowToast(`${selectedCategoryIds.length} kategori berhasil dihapus.`);
      setSelectedCategoryIds([]);
      setIsBulkDeleteOpen(false);
      await loadCategories();
    } catch (err) {
      onShowToast('Sebagian kategori gagal dihapus.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
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
                    onNavigateToEdit(cat);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Edit3 size={15} className="text-neutral-500" />
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
  ], [products, paginatedCategories, activeActionMenuId, onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
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
        </div>

        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2 self-start xl:self-auto">
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
            onClick={onNavigateToCreate}
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
        total={totalFiltered}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSort(newSortBy, newDir);
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

      {/* 5. Right-to-Left Category Filter Drawer */}
      <CategoryFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={totalFiltered}
        totalCategories={totalFiltered}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        searchSlug={filters.searchSlug || ''}
        onSearchSlugChange={(val) => setFilter('searchSlug', val)}
        searchDescription={filters.searchDescription || ''}
        onSearchDescriptionChange={(val) => setFilter('searchDescription', val)}
        productStatusFilter={filters.productStatusFilter || 'all'}
        onProductStatusFilterChange={(val) => setFilter('productStatusFilter', val)}
        iconFilter={filters.iconFilter || 'all'}
        onIconFilterChange={(val) => setFilter('iconFilter', val)}
        sortOption={sortOption}
        onSortOptionChange={handleSortOptionChange}
        onResetFilters={handleResetFilters}
      />

      {/* 7. Delete Category Confirmation Modal */}
      {/* Modal Konfirmasi Hapus Kategori Tunggal */}
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
        title="Konfirmasi Hapus Kategori"
        subtitle="Tindakan ini permanen dan tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus master kategori "${categoryToDelete?.name}"?`}
        confirmText="Hapus Kategori"
        variant="danger"
      >
        {categoryToDelete && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport text-neutral-600">
            <span className="font-bold">Slug:</span> <code className="font-mono text-neutral-900 bg-white px-1.5 py-0.5 border border-neutral-200">{categoryToDelete.slug}</code>
          </div>
        )}
      </ConfirmationModal>

      {/* Modal Konfirmasi Hapus Massal Kategori */}
      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Konfirmasi Hapus Massal Kategori"
        subtitle="Tindakan ini permanen dan tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus ${selectedCategoryIds.length} master kategori terpilih secara permanen? Semua relasi kategori akan dihapus.`}
        confirmText={`Hapus ${selectedCategoryIds.length} Kategori`}
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
