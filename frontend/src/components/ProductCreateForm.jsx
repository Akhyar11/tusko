import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Layers, 
  Sparkles, 
  Save, 
  FileText, 
  Tag, 
  Truck, 
  Eye,
  Info
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { createMockProduct, generateProductSku } from '../data/mockProducts';

export default function ProductCreateForm({
  categories = [],
  onSaveProduct = () => {},
  onCancel = () => {}
}) {
  // Basic Information
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState(250);
  const [location, setLocation] = useState('Jakarta Barat');
  const [freeShipping, setFreeShipping] = useState(true);
  const [isOfficial, setIsOfficial] = useState(true);
  const [status, setStatus] = useState('active'); // 'active' | 'inactive'

  // Description & Specs
  const [description, setDescription] = useState('');
  const [specList, setSpecList] = useState([
    { key: 'Bahan', value: '100% Recycled Polyester Pro Grade' },
    { key: 'Fitting', value: 'Athletic Slim Fit' },
    { key: 'Garansi', value: 'Garansi Resmi Tusko 30 Hari' }
  ]);

  // Pricing & Stock
  const [price, setPrice] = useState(299000);
  const [originalPrice, setOriginalPrice] = useState(399000);
  const [costPrice, setCostPrice] = useState(160000);
  const [stock, setStock] = useState(40);
  const [stockMinimum, setStockMinimum] = useState(8);

  // Images
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80');
  const [galleryUrls, setGalleryUrls] = useState([
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
  ]);
  const [newGalleryInput, setNewGalleryInput] = useState('');

  // Variants
  const [hasVariants, setHasVariants] = useState(true);
  const [variantColorInput, setVariantColorInput] = useState('Triple Black, Crimson Red, Royal Blue');
  const [variantSizeInput, setVariantSizeInput] = useState('M, L, XL');

  // Auto-calculated fields
  const discountPercent = useMemo(() => {
    if (originalPrice > price && originalPrice > 0) {
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    return 0;
  }, [price, originalPrice]);

  const marginInfo = useMemo(() => {
    const profit = price - costPrice;
    const marginPercent = price > 0 ? Math.round((profit / price) * 100) : 0;
    return { profit, marginPercent };
  }, [price, costPrice]);

  // Auto generate SKU if empty
  const handleGenerateSku = () => {
    const selectedCat = categories.find(c => c.id === Number(categoryId));
    const generated = generateProductSku(selectedCat?.slug || 'prd', name || 'PROD');
    setSku(generated);
  };

  // Specification helpers
  const handleAddSpecRow = () => {
    setSpecList([...specList, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (index, field, val) => {
    const updated = [...specList];
    updated[index][field] = val;
    setSpecList(updated);
  };

  const handleRemoveSpec = (index) => {
    setSpecList(specList.filter((_, i) => i !== index));
  };

  // Gallery helpers
  const handleAddGalleryUrl = () => {
    if (newGalleryInput.trim()) {
      setGalleryUrls([...galleryUrls, newGalleryInput.trim()]);
      setNewGalleryInput('');
    }
  };

  const handleRemoveGalleryUrl = (index) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  // Fill Quick Demo Data
  const handleFillDemoData = () => {
    setName('Tusko AirSprint Lightweight Carbon Marathon Singlet');
    setCategoryId(5); // Running
    setSku('TSK-RUN-SGL-2026');
    setWeight(95);
    setLocation('Bandung');
    setFreeShipping(true);
    setIsOfficial(true);
    setStatus('active');
    setDescription('Singlet lari ultra-ringan dengan panel ventilasi micro-mesh laser cut di area dada dan punggung. Didesain khusus untuk pelari half dan full marathon yang membutuhkan sirkulasi udara maksimal dan jahitan tanpa gesekan (zero-chafe bonded seams).');
    setPrice(229000);
    setOriginalPrice(299000);
    setCostPrice(115000);
    setStock(60);
    setStockMinimum(10);
    setImageUrl('https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80');
    setGalleryUrls([
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
    ]);
    setSpecList([
      { key: 'Bahan', value: '100% Micro-Aero Polypropylene Ultra-Dry' },
      { key: 'Bobot', value: '68 gram (Ukuran L)' },
      { key: 'Jahitan', value: 'Thermal Ultrasonic Bonded Seams (Anti Lecet)' },
      { key: 'Reflektor', value: '3M Scotchlite Reflective Logo Depan & Belakang' }
    ]);
    setHasVariants(true);
    setVariantColorInput('Neon Volt, Arctic White, Shadow Black');
    setVariantSizeInput('S, M, L, XL');
  };

  // Submit Handler
  const handleSubmit = (targetStatus = status) => {
    if (!name.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }

    // Build specifications dictionary
    const specificationsObj = {};
    specList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specificationsObj[item.key.trim()] = item.value.trim();
      }
    });

    // Build variants if enabled
    let variants = [];
    let variantLevels = [];
    if (hasVariants) {
      const colors = variantColorInput.split(',').map(s => s.trim()).filter(Boolean);
      const sizes = variantSizeInput.split(',').map(s => s.trim()).filter(Boolean);

      if (colors.length > 0) {
        variantLevels.push({ name: 'Warna', code: 'color', options: colors });
      }
      if (sizes.length > 0) {
        variantLevels.push({ name: 'Ukuran', code: 'size', options: sizes });
      }

      // Generate combinations
      let vid = 1;
      if (colors.length > 0 && sizes.length > 0) {
        colors.forEach(col => {
          sizes.forEach(sz => {
            variants.push({
              id: `v_new_${vid++}`,
              sku: `${sku || 'TSK'}-${col.slice(0, 3).toUpperCase()}-${sz}`,
              color: col,
              size: sz,
              price: Number(price),
              stock: Math.max(1, Math.floor(stock / (colors.length * sizes.length)))
            });
          });
        });
      } else if (colors.length > 0) {
        colors.forEach(col => {
          variants.push({
            id: `v_new_${vid++}`,
            sku: `${sku || 'TSK'}-${col.slice(0, 3).toUpperCase()}`,
            color: col,
            price: Number(price),
            stock: Math.max(1, Math.floor(stock / colors.length))
          });
        });
      } else if (sizes.length > 0) {
        sizes.forEach(sz => {
          variants.push({
            id: `v_new_${vid++}`,
            sku: `${sku || 'TSK'}-${sz}`,
            size: sz,
            price: Number(price),
            stock: Math.max(1, Math.floor(stock / sizes.length))
          });
        });
      }
    }

    const newProduct = createMockProduct({
      name: name.trim(),
      category_id: Number(categoryId),
      sku: sku.trim() || generateProductSku('prd', name),
      weight: Number(weight) || 250,
      location,
      free_shipping: freeShipping,
      is_official: isOfficial,
      status: targetStatus,
      description: description.trim() || 'Deskripsi produk berkualitas tinggi dari Tusko Official.',
      price: Number(price) || 0,
      original_price: Number(originalPrice) || Number(price) || 0,
      cost_price: Number(costPrice) || Math.round(Number(price) * 0.6),
      stock: Number(stock) || 0,
      stock_minimum: Number(stockMinimum) || 5,
      image_url: imageUrl.trim(),
      gallery: galleryUrls.length > 0 ? galleryUrls : [imageUrl.trim()],
      specifications: specificationsObj,
      variant_levels: variantLevels,
      variants
    });

    onSaveProduct(newProduct);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-gray-500 hover:text-amber-600 flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Daftar Produk</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <Plus size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                Tambah Produk Baru
              </h1>
              <p className="text-xs text-gray-500">
                Isi rincian produk, atur harga, modal, stok inventaris, foto galeri, dan varian barang.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleFillDemoData}
            className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Isi otomatis dengan data contoh produk running"
          >
            <Sparkles size={14} />
            <span>Isi Data Demo</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('active')}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan & Publikasikan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Core Details, Specs, Variants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Informasi Dasar */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              <Package size={16} className="text-amber-500" />
              <span>Informasi Dasar Produk</span>
            </div>

            {/* Nama Produk */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nama Produk Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Tusko Pro AeroTech Training Football Jersey 2026"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-gray-900 font-medium transition-all"
              />
            </div>

            {/* Kategori & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kategori Produk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-semibold cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    SKU Induk (Kode Produk)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                  >
                    Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="TSK-JRS-001"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-mono font-semibold"
                />
              </div>
            </div>

            {/* Bobot Paket & Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Berat Pengiriman (Gram) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-semibold pr-12"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-bold">gram</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Digunakan kurir ekspedisi untuk hitung ongkir.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kota Asal Pengiriman / Gudang
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jakarta Barat"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-semibold"
                />
              </div>
            </div>

            {/* Deskripsi Produk */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Deskripsi Lengkap Produk
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan keunggulan produk, detail material, petunjuk ukuran, dan teknologi yang disematkan..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Spesifikasi Produk Dinamis */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
                <FileText size={16} className="text-amber-500" />
                <span>Spesifikasi Produk</span>
              </div>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {specList.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                    placeholder="Parameter (misal: Bahan)"
                    className="w-1/3 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="Nilai (misal: 100% Recycled Polyester)"
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus baris spesifikasi"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Varian Produk Bertingkat */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
                <Layers size={16} className="text-amber-500" />
                <span>Varian Produk (Warna & Ukuran)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-bold text-gray-700">Aktifkan Varian</span>
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Pilihan Warna (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={variantColorInput}
                    onChange={(e) => setVariantColorInput(e.target.value)}
                    placeholder="Contoh: Triple Black, Deep Navy, Crimson Red"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Pilihan Ukuran / Tipe (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={variantSizeInput}
                    onChange={(e) => setVariantSizeInput(e.target.value)}
                    placeholder="Contoh: S, M, L, XL atau 39, 40, 41, 42"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Info size={13} className="text-amber-500 shrink-0" />
                  <span>Kombinasi varian akan otomatis dibuat dengan pembagian stok proporsional.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Pricing, Stock, Media, Status */}
        <div className="space-y-6">
          {/* Pricing & Stock Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              <DollarSign size={16} className="text-amber-500" />
              <span>Harga & Keuntungan</span>
            </div>

            {/* Harga Jual Ritel */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Harga Jual Ritel (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-extrabold"
              />
            </div>

            {/* Harga Asli & Diskon */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga Asli / Coret
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Diskon Otomatis
                </label>
                <div className="px-3 py-2 text-xs font-extrabold bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-center">
                  {discountPercent > 0 ? `Hemat ${discountPercent}%` : 'Tanpa Diskon'}
                </div>
              </div>
            </div>

            {/* Harga Modal / Pokok */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Modal / Pokok (HPP)
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-semibold"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Estimasi Laba Kotor:</span>
                <span className="font-extrabold text-emerald-600">
                  +{formatRupiah(marginInfo.profit)} ({marginInfo.marginPercent}%)
                </span>
              </div>
            </div>

            {/* Total Stok & Stok Minimum */}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Total Stok Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-black bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Batas Min. Stok
                </label>
                <input
                  type="number"
                  value={stockMinimum}
                  onChange={(e) => setStockMinimum(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Media & Galeri Foto Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              <ImageIcon size={16} className="text-amber-500" />
              <span>Gambar & Galeri Foto</span>
            </div>

            {/* Thumbnail URL Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                URL Foto Utama (Thumbnail) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-mono"
              />
            </div>

            {/* Live Thumbnail Preview */}
            {imageUrl && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <span className="absolute bottom-2 left-2 bg-neutral-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                  Foto Utama
                </span>
              </div>
            )}

            {/* Galeri Tambahan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Foto Galeri Tambahan ({galleryUrls.length})
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newGalleryInput}
                  onChange={(e) => setNewGalleryInput(e.target.value)}
                  placeholder="URL foto tambahan..."
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  + Tambah
                </button>
              </div>

              {galleryUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(idx)}
                        className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status & Badge Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              <Tag size={16} className="text-amber-500" />
              <span>Status & Visibilitas</span>
            </div>

            {/* Status Live / Draft */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Status Publikasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'active' 
                      ? 'bg-emerald-500 text-neutral-950 font-black' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-950"></span>
                  <span>🟢 Aktif (Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'inactive' 
                      ? 'bg-gray-800 text-white font-black' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  <span>⚪ Nonaktif (Draft)</span>
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-gray-800">Badge Bebas Ongkir (Gratis Ongkir)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-gray-800">Badge Tusko Pro (Official Flagship)</span>
              </label>
            </div>

            {/* Save Buttons at Bottom */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit('active')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>Simpan Produk</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('inactive')}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Simpan sebagai Draft Nonaktif
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
