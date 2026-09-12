import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Sparkles, 
  Tag,
  AlertCircle,
  Package,
  Layers
} from 'lucide-react';
import IconButton from '../atoms/IconButton';
import SearchBar from '../molecules/SearchBar';
import { categoryService } from '../../services/categoryService';

export default function CategoryMasterModal({
  isOpen = false,
  onClose = () => {},
  onCategoriesChange = () => {}
}) {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form mode: null | 'create' | 'edit'
  const [formMode, setFormMode] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('Tag');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories on open
  useEffect(() => {
    if (isOpen) {
      loadCategoryData();
    }
  }, [isOpen]);

  const loadCategoryData = async () => {
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

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormIcon('Tag');
    setFormDescription('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenEdit = (cat) => {
    setFormMode('edit');
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug || '');
    setFormIcon(cat.icon || 'Tag');
    setFormDescription(cat.description || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelForm = () => {
    setFormMode(null);
    setEditingCategory(null);
    setErrorMessage('');
  };

  const handleNameChange = (val) => {
    setFormName(val);
    if (formMode === 'create' || !formSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generated);
    }
  };

  const handleSaveForm = async (e) => {
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

      if (formMode === 'create') {
        const created = await categoryService.createCategory(payload);
        setSuccessMessage(`Kategori "${created.name}" berhasil dibuat!`);
      } else if (formMode === 'edit' && editingCategory) {
        const updated = await categoryService.updateCategory(editingCategory.id, payload);
        setSuccessMessage(`Kategori "${updated.name}" berhasil diperbarui!`);
      }

      await loadCategoryData();
      setFormMode(null);
      setEditingCategory(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if ((cat.products_count || 0) > 0) {
      setErrorMessage(`Kategori "${cat.name}" memiliki ${cat.products_count} produk aktif dan tidak dapat dihapus!`);
      return;
    }

    if (!window.confirm(`Hapus master kategori "${cat.name}"?`)) {
      return;
    }

    try {
      await categoryService.deleteCategory(cat.id);
      setSuccessMessage(`Kategori "${cat.name}" berhasil dihapus.`);
      await loadCategoryData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Gagal menghapus kategori.');
    }
  };

  // Filter list by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.slug?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-300 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-none shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-neutral-950 rounded-none">
              <FolderKanban size={20} />
            </div>
            <div>
              <span className="text-[10px] font-sport font-black uppercase tracking-wider text-amber-400">
                Master Data ERP
              </span>
              <h2 className="text-base sm:text-lg font-black font-sport uppercase tracking-tight text-white">
                Master Kategori Produk
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!formMode && (
              <IconButton
                icon={Plus}
                onClick={handleOpenCreate}
                title="Tambah Kategori Baru"
                variant="primary"
              />
            )}
            <IconButton
              icon={X}
              onClick={onClose}
              title="Tutup Master Kategori"
              variant="dark"
            />
          </div>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between text-xs font-sport font-bold uppercase">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 cursor-pointer">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-none flex items-center justify-between text-xs font-sport font-bold uppercase">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-600 cursor-pointer">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Create / Edit Form Sub-panel */}
          {formMode && (
            <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-none space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <h3 className="text-xs font-sport font-black uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{formMode === 'create' ? 'Tambah Master Kategori' : `Edit Kategori: ${editingCategory?.name}`}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-neutral-500 hover:text-neutral-900 font-bold cursor-pointer uppercase font-sport"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1">
                      Nama Kategori <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Cth: Pakaian Latihan & Gym"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-bold rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1">
                      Slug URL
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="pakaian-latihan-gym"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-mono text-xs rounded-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1">
                    Ikon Kategori
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-bold rounded-none"
                  >
                    <option value="Shirt">Shirt (Jersey & Baju)</option>
                    <option value="Footprints">Footprints (Sepatu & Alas Kaki)</option>
                    <option value="Dumbbell">Dumbbell (Peralatan & Gym)</option>
                    <option value="Shield">Shield (Aksesoris & Deker)</option>
                    <option value="Zap">Zap (Running & Sprint)</option>
                    <option value="Trophy">Trophy (Futsal & Matchday)</option>
                    <option value="Activity">Activity (Training & Fitness)</option>
                    <option value="Sparkles">Sparkles (Pro Edition / Eksklusif)</option>
                    <option value="Tag">Tag (Umum)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1">
                    Deskripsi Kategori (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Deskripsi singkat mengenai jenis produk dalam kategori ini..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-3.5 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-sport font-bold uppercase text-xs rounded-none cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-black font-sport font-black uppercase text-xs rounded-none cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari master kategori berdasarkan nama atau slug..."
              />
            </div>
            {!formMode && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-3 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-amber-400 font-sport font-black uppercase text-xs flex items-center gap-1.5 rounded-none cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Tambah Kategori</span>
              </button>
            )}
          </div>

          {/* Categories Table */}
          <div className="border border-neutral-300 rounded-none overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-white uppercase text-[10px] tracking-wider font-sport font-black">
                <tr>
                  <th className="py-2.5 px-3">Nama Kategori</th>
                  <th className="py-2.5 px-3">Slug URL</th>
                  <th className="py-2.5 px-3 text-center">Ikon</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Produk</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500 font-sport font-bold uppercase">
                      Memuat master kategori dari server...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500 font-sport font-bold uppercase">
                      Tidak ada kategori ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2.5 px-3 font-sport font-bold text-neutral-950">
                        {cat.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600 text-[11px]">
                        {cat.slug}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800 text-[10px] font-mono rounded-none">
                          {cat.icon || 'Tag'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 font-mono font-bold text-[11px] rounded-none">
                          {cat.products_count ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200 border border-transparent hover:border-neutral-300 transition-colors cursor-pointer rounded-none"
                            title="Edit Kategori"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer rounded-none"
                            title="Hapus Kategori"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <span className="font-sport font-bold uppercase text-[11px]">
            Total: {categories.length} Master Kategori Terdaftar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-white font-sport font-black uppercase text-xs rounded-none cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
