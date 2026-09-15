import React, { useState } from 'react';
import {
  Tag,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Shirt,
  Footprints,
  Dumbbell,
  Shield,
  Zap,
  Trophy,
  Activity,
  Sparkles,
  Hash,
  FileText,
  Info
} from 'lucide-react';
import { categoryService } from '../services/categoryService';
import FormTipsPanel from './organisms/FormTipsPanel';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import IconButton from './atoms/IconButton';

export default function CategoryCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {},
  onCategoriesChange = () => {}
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Shirt');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNameChange = (val) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama master kategori wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: icon || 'Tag',
        description: description.trim()
      };

      const created = await categoryService.createCategory(payload);
      onShowToast(`Kategori "${created.name}" berhasil ditambahkan ke master!`);
      if (onCategoriesChange) {
        onCategoriesChange();
      }
      onNavigateBack();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Gagal menambahkan kategori.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Master Kategori" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Tambah Kategori Baru</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('category-form')?.requestSubmit()} title="Simpan Kategori" variant="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Form Card */}
      <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3" aria-label="Tutup pesan error">
                ✕
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Nama Master Kategori <span className="text-rose-500">*</span>
            </label>
            <TextInput
              required
              value={name}
              onChange={handleNameChange}
              placeholder="Contoh: Jersey & Apparel"
              weight="bold"
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Nama kategori yang akan ditampilkan pada etalase toko dan navigasi filter publik
            </span>
          </div>

          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Slug URL (Identifier Kategori)
            </label>
            <TextInput
              value={slug}
              onChange={setSlug}
              placeholder="jersey-apparel"
              weight="mono"
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Alamat URL permanen kategori (otomatis digenerate dari nama kategori jika tidak diisi manual)
            </span>
          </div>

          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Simbol Ikon Kategori
            </label>
            <ServerSideSelect
              value={icon}
              onChange={(val) => setIcon(val)}
              options={[
                { value: 'Shirt', label: 'Shirt (Jersey & Pakaian)' },
                { value: 'Footprints', label: 'Footprints (Sepatu & Sepatu Olahraga)' },
                { value: 'Dumbbell', label: 'Dumbbell (Peralatan & Gym)' },
                { value: 'Shield', label: 'Shield (Aksesoris & Deker)' },
                { value: 'Zap', label: 'Zap (Running & Marathon)' },
                { value: 'Trophy', label: 'Trophy (Futsal & Sepakbola)' },
                { value: 'Activity', label: 'Activity (Training & Fitness)' },
                { value: 'Sparkles', label: 'Sparkles (Koleksi Pro Player)' },
                { value: 'Tag', label: 'Tag (Kategori Umum)' }
              ]}
              placeholder="Pilih ikon kategori..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Deskripsi Kategori (Opsional)
            </label>
            <TextArea
              rows={3}
              value={description}
              onChange={setDescription}
              placeholder="Penjelasan ringkas jenis produk dan perlengkapan dalam kategori ini..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateBack}
              disabled={isSubmitting}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      <FormTipsPanel
        className="lg:col-span-1"
        title="Panduan Kategori"
        tips={[
          { icon: Tag, heading: 'Format Nama', text: 'Gunakan nama singkat dan jelas seperti "Jersey & Apparel" agar mudah dikenali di etalase dan filter publik.' },
          { icon: Hash, heading: 'Slug Otomatis', text: 'Slug terisi otomatis dari nama. Gunakan huruf kecil dan tanda minus, biarkan kosong untuk generate otomatis.' },
          { icon: Shirt, heading: 'Pemilihan Ikon', text: 'Pilih ikon yang paling mewakili isi kategori agar navigasi toko terlihat konsisten dan mudah dipindai.' },
          { icon: FileText, heading: 'Deskripsi SEO', text: 'Tulis 1-2 kalimat ringkas berisi jenis produk dalam kategori untuk membantu pencarian dan filter.' },
          { icon: Info, heading: 'Wajib Diisi', text: 'Hanya nama kategori yang wajib. Slug, ikon, dan deskripsi boleh dilengkapi bertahap setelah kategori tersimpan.' },
        ]}
      />
      </div>
    </div>
  );
}
