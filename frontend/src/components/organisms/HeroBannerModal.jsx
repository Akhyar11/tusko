import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Image as ImageIcon, 
  Search, 
  Check, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Package,
  Eye,
  Sliders
} from 'lucide-react';
import TextInput from '../molecules/TextInput';
import TextArea from '../molecules/TextArea';
import ToggleSwitch from '../molecules/ToggleSwitch';
import { formatRupiah } from '../../utils/formatters';

const TEMPLATE_STYLES = [
  { id: 'featured_gallery', label: 'Utama + Galeri', desc: 'Foto utama dominan dengan strip aksen foto galeri produk' },
  { id: 'split_hero', label: 'Editorial Klasik', desc: 'Foto utama penuh dengan badge harga kontras' },
  { id: 'grid_showcase', label: 'Multi-Angle Grid', desc: 'Kombinasi grid 2-3 sudut foto produk bersanding' },
];

export default function HeroBannerModal({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  initialData = null,
  products = [],
}) {
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [priceBadge, setPriceBadge] = useState('');
  const [ctaPrimary, setCtaPrimary] = useState('BELI SEKARANG');
  const [ctaSecondary, setCtaSecondary] = useState('LIHAT PRODUK');
  const [templateStyle, setTemplateStyle] = useState('featured_gallery');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);

  // Cari produk terpilih
  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [productId, products]);

  // Kumpulan seluruh foto produk (foto utama + galeri)
  const availableProductImages = useMemo(() => {
    if (!selectedProduct) return [];
    const imgs = [];
    if (selectedProduct.image_url) {
      imgs.push({ id: 'primary', url: selectedProduct.image_url, isPrimary: true });
    }
    if (Array.isArray(selectedProduct.images)) {
      selectedProduct.images.forEach((g, idx) => {
        const url = g.image_url || g;
        if (url && url !== selectedProduct.image_url) {
          imgs.push({ id: `gallery-${idx}`, url, isPrimary: false });
        }
      });
    }
    return imgs;
  }, [selectedProduct]);

  // Inisialisasi data form saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setProductId(initialData.product_id ? String(initialData.product_id) : '');
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setBadge(initialData.badge || '');
      setPriceBadge(initialData.price_badge || '');
      setCtaPrimary(initialData.cta_primary || 'BELI SEKARANG');
      setCtaSecondary(initialData.cta_secondary || 'LIHAT PRODUK');
      setTemplateStyle(initialData.template_style || 'featured_gallery');
      setSelectedImages(Array.isArray(initialData.image_urls) ? initialData.image_urls : []);
      setIsActive(initialData.active !== false);
    } else {
      setProductId('');
      setTitle('');
      setDescription('');
      setBadge('EDISI RESMI TUSKO');
      setPriceBadge('');
      setCtaPrimary('BELI SEKARANG');
      setCtaSecondary('LIHAT PRODUK');
      setTemplateStyle('featured_gallery');
      setSelectedImages([]);
      setIsActive(true);
    }
    setProductSearch('');
    setError(null);
  }, [isOpen, initialData]);

  // Saat produk dipilih, auto-fill field yang masih kosong
  const handleSelectProduct = (prod) => {
    setProductId(String(prod.id));
    if (!title || title.trim() === '') {
      setTitle(prod.name.toUpperCase());
    }
    if (!description || description.trim() === '') {
      setDescription(prod.description ? prod.description.slice(0, 160) : 'Performa tanding atletis dengan material premium berstandar internasional.');
    }
    if (!badge || badge.trim() === '') {
      setBadge(prod.category?.name ? `${prod.category.name.toUpperCase()} SERIES` : 'EDISI RESMI TUSKO');
    }
    if (!priceBadge || priceBadge.trim() === '') {
      setPriceBadge(prod.price ? `Mulai ${formatRupiah(prod.price)}` : '');
    }

    // Auto-select seluruh gambar produk
    const imgs = [];
    if (prod.image_url) imgs.push(prod.image_url);
    if (Array.isArray(prod.images)) {
      prod.images.forEach((g) => {
        const url = g.image_url || g;
        if (url && !imgs.includes(url)) imgs.push(url);
      });
    }
    setSelectedImages(imgs);
  };

  const toggleImageSelection = (url) => {
    setSelectedImages((prev) => {
      if (prev.includes(url)) {
        if (prev.length <= 1) return prev; // Minimal 1 gambar aktif
        return prev.filter((u) => u !== url);
      }
      return [...prev, url];
    });
  };

  // Filter list produk untuk pencarian
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter((p) => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [products, productSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul Hero wajib diisi.');
      return;
    }
    if (!productId) {
      setError('Silakan pilih produk yang ditautkan ke hero banner ini.');
      return;
    }
    if (selectedImages.length === 0 && selectedProduct?.image_url) {
      selectedImages.push(selectedProduct.image_url);
    }

    const bannerData = {
      id: initialData?.id || `hero-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      product_id: Number(productId),
      badge: badge.trim(),
      price_badge: priceBadge.trim() || (selectedProduct?.price ? `Mulai ${formatRupiah(selectedProduct.price)}` : ''),
      cta_primary: ctaPrimary.trim() || 'BELI SEKARANG',
      cta_secondary: ctaSecondary.trim() || 'LIHAT PRODUK',
      template_style: templateStyle,
      image_urls: selectedImages,
      active: isActive,
      product: selectedProduct ? {
        id: selectedProduct.id,
        name: selectedProduct.name,
        slug: selectedProduct.slug,
        sku: selectedProduct.sku,
        price: selectedProduct.price,
        image_url: selectedProduct.image_url,
      } : null
    };

    onSave(bannerData);
    onClose();
  };

  if (!isOpen) return null;

  const displayImages = selectedImages.length > 0 
    ? selectedImages 
    : (selectedProduct?.image_url ? [selectedProduct.image_url] : ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-none border border-neutral-300 shadow-2xl w-full max-w-5xl my-auto overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-none bg-neutral-900 border border-neutral-800 text-amber-400 flex items-center justify-center">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-sm font-sport font-black uppercase tracking-wider text-white">
                {initialData ? 'Ubah Hero Banner' : 'Tambah Hero Banner Baru'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-normal">
                Konfigurasi slide hero berbasis produk untuk carousel storefront
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-none hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alertbox */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 text-xs font-sport font-bold uppercase flex items-center justify-between rounded-none">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="cursor-pointer text-rose-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Content: 2 Kolom (Kiri: Form Controls, Kanan: Live Template Preview) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SISI KIRI: Formulir Konfigurasi (col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. Pemilihan Produk */}
            <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-950">
                  Pilih Produk Terkait <span className="text-rose-500">*</span>
                </label>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductId('');
                      setProductSearch('');
                    }}
                    className="text-[10.5px] font-sport font-bold uppercase text-amber-600 hover:underline cursor-pointer"
                  >
                    Ganti Produk
                  </button>
                )}
              </div>

              {!selectedProduct ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Ketik nama atau SKU produk..."
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 rounded-none font-medium text-neutral-950"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-neutral-200 bg-white divide-y divide-neutral-100 rounded-none">
                    {filteredProducts.length === 0 ? (
                      <p className="p-3 text-[11px] text-neutral-400 text-center">Produk tidak ditemukan.</p>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-9 h-9 object-cover border border-neutral-200 rounded-none shrink-0" />
                          ) : (
                            <div className="w-9 h-9 bg-neutral-200 flex items-center justify-center text-neutral-500 rounded-none shrink-0">
                              <Package size={14} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-neutral-900 truncate uppercase">{p.name}</div>
                            <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-2">
                              <span>{p.sku || `ID #${p.id}`}</span>
                              <span>•</span>
                              <span className="text-neutral-900 font-bold">{formatRupiah(p.price)}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3.5 p-3 bg-white border border-neutral-300 rounded-none">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-12 h-12 object-cover border border-neutral-200 rounded-none shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-neutral-100 flex items-center justify-center text-neutral-400 rounded-none shrink-0">
                      <Package size={18} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9.5px] font-sport font-black uppercase tracking-wider rounded-none mb-0.5">
                      {selectedProduct.category?.name || 'Katalog Tusko'}
                    </span>
                    <div className="text-xs font-black uppercase text-neutral-950 font-sport truncate">
                      {selectedProduct.name}
                    </div>
                    <div className="text-[10.5px] font-mono font-bold text-neutral-600 mt-0.5">
                      {formatRupiah(selectedProduct.price)} • {availableProductImages.length} Foto Produk Tersedia
                    </div>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                </div>
              )}
            </div>

            {/* 2. Judul & Deskripsi */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Judul Hero <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  value={title}
                  onChange={setTitle}
                  placeholder="Contoh: BENTUK KECEPATAN TANPA BATAS"
                  weight="medium"
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Deskripsi / Subjudul Hero
                </label>
                <TextArea
                  rows={2}
                  value={description}
                  onChange={setDescription}
                  placeholder="Deskripsi singkat performa dan keunggulan produk..."
                />
              </div>
            </div>

            {/* 3. Badge & Tombol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Badge Kecil Hero
                </label>
                <TextInput
                  value={badge}
                  onChange={setBadge}
                  placeholder="Contoh: EDISI RESMI MATCHDAY"
                />
              </div>
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Badge Harga
                </label>
                <TextInput
                  value={priceBadge}
                  onChange={setPriceBadge}
                  placeholder="Contoh: Mulai Rp 389.000"
                />
              </div>
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Teks Tombol Utama
                </label>
                <TextInput
                  value={ctaPrimary}
                  onChange={setCtaPrimary}
                  placeholder="BELI SEKARANG"
                />
              </div>
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Teks Tombol Sekunder
                </label>
                <TextInput
                  value={ctaSecondary}
                  onChange={setCtaSecondary}
                  placeholder="LIHAT PRODUK"
                />
              </div>
            </div>

            {/* 4. Pemilihan Template Gaya Visual */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-2">
                Pilih Gaya Template Hero
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TEMPLATE_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTemplateStyle(st.id)}
                    className={`p-2.5 text-left border rounded-none transition-colors cursor-pointer ${
                      templateStyle === st.id
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="text-[11px] font-sport font-black uppercase tracking-wide">
                      {st.label}
                    </div>
                    <div className={`text-[10px] mt-1 leading-tight ${templateStyle === st.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {st.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Kombinasi Foto Produk yang Dipilih */}
            {availableProductImages.length > 0 && (
              <div className="bg-neutral-50 p-3.5 border border-neutral-200 rounded-none space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-sport font-black uppercase tracking-wider text-neutral-900">
                    Kombinasi Foto Produk ({selectedImages.length}/{availableProductImages.length} Dipilih)
                  </label>
                  <span className="text-[10px] text-neutral-500">Klik untuk menyertakan/melepas</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {availableProductImages.map((img) => {
                    const isPicked = selectedImages.includes(img.url);
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => toggleImageSelection(img.url)}
                        className={`relative w-14 h-14 shrink-0 border-2 rounded-none transition-all cursor-pointer overflow-hidden ${
                          isPicked ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-neutral-300 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt="Produk" className="w-full h-full object-cover" />
                        {isPicked && (
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                        {img.isPrimary && (
                          <div className="absolute bottom-0 inset-x-0 bg-neutral-950/80 text-[8px] font-sport font-bold text-white text-center uppercase">
                            Utama
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. Toggle Status */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-none">
              <div>
                <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900 block">
                  Aktifkan di Carousel
                </span>
                <span className="text-[10.5px] text-neutral-500">
                  Slide ini akan ditampilkan pada carousel etalase halaman depan
                </span>
              </div>
              <ToggleSwitch checked={isActive} onChange={setIsActive} ariaLabel="Status Aktif Hero Banner" />
            </div>

          </div>

          {/* SISI KANAN: Live Template Preview (col-span-5) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-sport font-black uppercase tracking-wider text-neutral-700">
              <Eye size={14} className="text-amber-500" />
              <span>Pratinjau Template Hero</span>
            </div>

            {/* Container Preview Mini Storefront Hero */}
            <div className="bg-black text-white border border-neutral-800 rounded-none overflow-hidden shadow-xl p-4 sm:p-5 flex flex-col justify-between min-h-[360px]">
              
              {/* Top: Badge & Judul */}
              <div className="space-y-2">
                <span className="inline-block bg-white text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none font-sport">
                  {badge || 'EDISI RESMI TUSKO'}
                </span>
                <h3 className="font-sport font-black text-lg sm:text-xl uppercase italic tracking-tight leading-tight line-clamp-2">
                  {title || 'JUDUL HERO BANNER'}
                </h3>
                <p className="text-neutral-400 text-[10.5px] leading-relaxed line-clamp-3">
                  {description || 'Deskripsi banner hero produk Tusko...'}
                </p>
              </div>

              {/* Middle: Visual Template Kombinasi Gambar Produk */}
              <div className="my-3 relative bg-neutral-900 border border-neutral-800 rounded-none overflow-hidden">
                {templateStyle === 'featured_gallery' ? (
                  /* Style 1: Foto utama besar + strip galeri aksen */
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img 
                      src={displayImages[0]} 
                      alt="Hero Preview" 
                      className="w-full h-full object-cover" 
                    />
                    {displayImages.length > 1 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-xs p-1 border border-neutral-700">
                        {displayImages.slice(1, 4).map((url, i) => (
                          <img key={i} src={url} alt="Galeri" className="w-8 h-8 object-cover border border-neutral-600 rounded-none" />
                        ))}
                      </div>
                    )}
                    {priceBadge && (
                      <div className="absolute bottom-2 right-2 bg-black/90 border border-neutral-700 px-2 py-1 text-right">
                        <div className="text-[8px] text-amber-400 font-bold uppercase tracking-wider">Tusko Pro</div>
                        <div className="text-[10px] font-sport font-black text-white uppercase">{priceBadge}</div>
                      </div>
                    )}
                  </div>
                ) : templateStyle === 'grid_showcase' ? (
                  /* Style 2: Grid 2-3 foto bersanding */
                  <div className="grid grid-cols-2 gap-1 aspect-video w-full p-1 bg-neutral-950">
                    <div className="relative h-full overflow-hidden">
                      <img src={displayImages[0]} alt="Hero" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1 h-full overflow-hidden">
                      <div className="flex-1 overflow-hidden">
                        <img src={displayImages[1] || displayImages[0]} alt="Angle 2" className="w-full h-full object-cover" />
                      </div>
                      {displayImages[2] && (
                        <div className="flex-1 overflow-hidden">
                          <img src={displayImages[2]} alt="Angle 3" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Style 3: Split full cover */
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img src={displayImages[0]} alt="Hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <div className="font-sport font-black text-xs text-amber-400 uppercase tracking-wider">
                        {priceBadge || 'Performa Maksimal'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom: Mock Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <div className="flex-1 py-1.5 px-3 bg-white text-black font-sport font-black text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 rounded-none">
                  <span>{ctaPrimary || 'Beli Sekarang'}</span>
                  <ArrowRight size={11} />
                </div>
                <div className="flex-1 py-1.5 px-3 border border-white text-white font-sport font-black text-[10px] uppercase tracking-wider text-center rounded-none">
                  {ctaSecondary || 'Lihat Produk'}
                </div>
              </div>

            </div>

            <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-none text-[11px] text-neutral-600 space-y-1">
              <span className="font-bold text-neutral-800 block uppercase font-sport">Kombinasi Dinamis:</span>
              <p>
                Ketika banner ini tayang di etalase, tombol aksi akan langsung membuka produk atau memasukkannya ke keranjang belanja pelanggan secara otomatis.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Simpan Banner</span>
          </button>
        </div>

      </div>
    </div>
  );
}
