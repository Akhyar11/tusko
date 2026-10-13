import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  Package, 
  CheckCircle2, 
  XCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import HeroBannerModal from '../organisms/HeroBannerModal';
import ConfirmationModal from '../organisms/ConfirmationModal';
import { formatRupiah } from '../../utils/formatters';

export default function HeroBannersTableField({
  value = '',
  onChange = () => {},
  products = []
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Parse value (JSON string atau array)
  const banners = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [value]);

  const emitChange = (nextList) => {
    onChange(JSON.stringify(nextList));
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setModalOpen(true);
  };

  const handleSaveBanner = (savedBanner) => {
    if (editingBanner) {
      const next = banners.map((b) => (b.id === editingBanner.id ? savedBanner : b));
      emitChange(next);
    } else {
      emitChange([...banners, savedBanner]);
    }
    setModalOpen(false);
    setEditingBanner(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const next = banners.filter((b) => b.id !== deleteTarget.id);
    emitChange(next);
    setDeleteTarget(null);
  };

  const handleMove = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    emitChange(next);
  };

  const handleToggleActive = (index) => {
    const next = banners.map((b, i) => (i === index ? { ...b, active: !b.active } : b));
    emitChange(next);
  };

  return (
    <div className="sm:col-span-2 space-y-3">
      {/* Header bar tabel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900 text-white rounded-none border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-amber-400" />
            <h3 className="text-xs font-sport font-black uppercase tracking-wider text-white">
              Tabel Slide Hero Carousel ({banners.length} Banner)
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Kelola daftar slide hero etalase toko. Setiap slide tertaut langsung ke produk katalog.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-sport font-black uppercase text-xs tracking-wider transition-all cursor-pointer rounded-none flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
        >
          <Plus size={15} />
          <span>Tambah Hero Banner</span>
        </button>
      </div>

      {/* Tabel Data Banner */}
      {banners.length === 0 ? (
        <div className="p-8 bg-neutral-50 border border-neutral-300 rounded-none text-center space-y-3">
          <div className="w-12 h-12 bg-neutral-200 text-neutral-500 mx-auto flex items-center justify-center rounded-none">
            <Sparkles size={22} />
          </div>
          <div>
            <h4 className="text-xs font-sport font-black uppercase tracking-wider text-neutral-800">
              Belum Ada Slide Hero Banner
            </h4>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-md mx-auto">
              Etalase saat ini menggunakan hero default bawaan. Klik tombol di atas untuk membuat slide banner hero yang ditautkan ke produk unggulan Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-900 font-sport font-black uppercase text-xs tracking-wider rounded-none cursor-pointer transition-colors"
          >
            + Buat Slide Pertama
          </button>
        </div>
      ) : (
        <div className="border border-neutral-300 bg-white rounded-none overflow-x-auto shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 text-[10.5px] font-sport font-black uppercase tracking-wider text-neutral-700">
                <th className="py-3 px-3 w-16 text-center">Urutan</th>
                <th className="py-3 px-3 w-20">Visual</th>
                <th className="py-3 px-4 min-w-[200px]">Judul & Deskripsi</th>
                <th className="py-3 px-4 min-w-[180px]">Produk Terpilih</th>
                <th className="py-3 px-3 w-28 text-center">Template</th>
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {banners.map((banner, idx) => {
                const prod = products.find((p) => String(p.id) === String(banner.product_id)) || banner.product;
                const thumb = (banner.image_urls && banner.image_urls[0]) || prod?.image_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80';

                return (
                  <tr key={banner.id || idx} className="hover:bg-neutral-50 transition-colors">
                    {/* Urutan */}
                    <td className="py-3 px-3 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-mono font-bold text-neutral-500 text-[11px]">#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            className="p-0.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-20 cursor-pointer"
                            title="Pindah ke Atas"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === banners.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            className="p-0.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-20 cursor-pointer"
                            title="Pindah ke Bawah"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Visual */}
                    <td className="py-3 px-3 align-middle">
                      <div className="w-14 h-14 bg-neutral-100 border border-neutral-300 rounded-none overflow-hidden shrink-0 relative">
                        <img src={thumb} alt={banner.title} className="w-full h-full object-cover" />
                        {banner.image_urls && banner.image_urls.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-neutral-950/80 text-[8px] font-mono text-white px-1">
                            +{banner.image_urls.length - 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Judul & Deskripsi */}
                    <td className="py-3 px-4 align-middle min-w-[200px]">
                      {banner.badge && (
                        <span className="inline-block px-1.5 py-0.5 bg-neutral-200 text-neutral-800 text-[9px] font-sport font-black uppercase tracking-wider rounded-none mb-1">
                          {banner.badge}
                        </span>
                      )}
                      <div className="font-sport font-black text-xs uppercase text-neutral-950 truncate max-w-xs">
                        {banner.title}
                      </div>
                      {banner.description && (
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 max-w-xs">
                          {banner.description}
                        </p>
                      )}
                    </td>

                    {/* Produk Terpilih */}
                    <td className="py-3 px-4 align-middle min-w-[180px]">
                      {prod ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-neutral-900 uppercase text-[11px] truncate max-w-[180px]">
                            {prod.name}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500">
                            {formatRupiah(prod.price)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-neutral-400 italic">Produk ID #{banner.product_id}</span>
                      )}
                    </td>

                    {/* Template Style */}
                    <td className="py-3 px-3 text-center align-middle">
                      <span className="inline-block px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-sport font-bold uppercase tracking-wider rounded-none">
                        {banner.template_style === 'featured_gallery' ? 'Utama + Galeri' :
                         banner.template_style === 'grid_showcase' ? 'Multi Grid' : 'Klasik'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(idx)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none cursor-pointer transition-colors ${
                          banner.active !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200'
                        }`}
                        title="Klik untuk mengubah status aktif"
                      >
                        {banner.active !== false ? (
                          <>
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} className="text-neutral-400" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 rounded-none transition-colors cursor-pointer"
                          title="Ubah Slide Banner"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(banner)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-none transition-colors cursor-pointer"
                          title="Hapus Slide Banner"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Tambah/Ubah */}
      <HeroBannerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveBanner}
        initialData={editingBanner}
        products={products}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Hero Banner"
        message={`Apakah Anda yakin ingin menghapus slide hero "${deleteTarget?.title || ''}" dari etalase?`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
