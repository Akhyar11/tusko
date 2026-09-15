import React, { useState, useEffect } from 'react';
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

export default function CategoryEditPage({
  category = null,
  onNavigateBack = () => {},
  onShowToast = () => {},
  onCategoriesChange = () => {}
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setIcon(category.icon || 'Tag');
      setDescription(category.description || '');
    }
  }, [category]);

  if (!category) {
    return (
      <div className="bg-white border border-neutral-300 p-8 text-center rounded-none max-w-2xl mx-auto space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="text-base font-sport font-black uppercase text-neutral-900">
          Data Kategori Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500">
          Silakan pilih kategori dari master untuk melakukan pengubahan data.
        </p>
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-4 py-2 bg-neutral-950 text-white text-xs font-sport font-bold uppercase rounded-none hover:bg-neutral-800 transition-colors"
        >
          Kembali ke Master Kategori
        </button>
      </div>
    );
  }

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

      const updated = await categoryService.updateCategory(category.id, payload);
      onShowToast(`Kategori "${updated.name}" berhasil diperbarui!`);
      if (onCategoriesChange) {
        onCategoriesChange();
      }
      onNavigateBack();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Gagal memperbarui kategori.';
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
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Edit Kategori: {category.name}</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('category-form')?.requestSubmit()} title="Simpan Perubahan Kategori" variant="primary" />
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
              onChange={setName}
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
              Identifier URL permanen kategori (gunakan huruf kecil dan tanda minus)
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
              <span>{isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}</span>
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
        title="Panduan Ubah Kategori"
        tips={[
          { icon: Tag, heading: 'Ubah Nama Hati-hati', text: 'Nama tampil di etalase dan filter. Pastikan tetap singkat dan konsisten dengan produk di dalamnya.' },
          { icon: Hash, heading: 'Slug Permanen', text: 'Slug adalah identifier URL. Hindari mengubahnya bila kategori sudah dipakai agar tautan lama tidak rusak.' },
          { icon: Shirt, heading: 'Ganti Ikon', text: 'Sesuaikan ikon bila isi kategori berubah agar simbol visual tetap mewakili produk di dalamnya.' },
          { icon: FileText, heading: 'Perbarui Deskripsi', text: 'Lengkapi deskripsi 1-2 kalimat setiap ada perluasan jenis produk agar filter dan pencarian tetap relevan.' },
          { icon: Info, heading: 'Simpan Perubahan', text: 'Perubahan tersimpan via tombol di dalam form. Batalkan bila ragu agar data master tidak ikut berubah.' },
        ]}
      />
      </div>
    </div>
  );
}
