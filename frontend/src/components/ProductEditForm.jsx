import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCcw, 
  Save, 
  FileText, 
  Tag, 
  Truck, 
  Eye,
  Info,
  Edit3
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductEditForm({
  product = null,
  categories = [],
  onUpdateProduct = () => {},
  onCancel = () => {}
}) {
  if (!product) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <p className="text-sm font-bold text-gray-700">Pilih produk yang ingin diedit.</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 px-4 py-2 bg-amber-500 text-neutral-950 font-black text-xs rounded-xl"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  // Basic Information
  const [name, setName] = useState(product.name || '');
  const [categoryId, setCategoryId] = useState(product.category_id || categories[0]?.id || 1);
  const [sku, setSku] = useState(product.sku || '');
  const [weight, setWeight] = useState(product.weight || 250);
  const [location, setLocation] = useState(product.location || 'Jakarta Barat');
  const [freeShipping, setFreeShipping] = useState(Boolean(product.free_shipping));
  const [isOfficial, setIsOfficial] = useState(Boolean(product.is_official));
  const [status, setStatus] = useState(product.status || (product.active ? 'active' : 'inactive'));

  // Description & Specs
  const [description, setDescription] = useState(product.description || '');
  const [specList, setSpecList] = useState(() => {
    if (product.specifications && typeof product.specifications === 'object') {
      const entries = Object.entries(product.specifications);
      if (entries.length > 0) {
        return entries.map(([key, value]) => ({ key, value: String(value) }));
      }
    }
    return [
      { key: 'Bahan', value: '100% Recycled Polyester' },
      { key: 'Fitting', value: 'Regular Fit' }
    ];
  });

  // Pricing & Stock
  const [price, setPrice] = useState(product.price || 0);
  const [originalPrice, setOriginalPrice] = useState(product.original_price || product.price || 0);
  const [costPrice, setCostPrice] = useState(product.cost_price || Math.round((product.price || 0) * 0.6));
  const [stock, setStock] = useState(product.stock || 0);
  const [stockMinimum, setStockMinimum] = useState(product.stock_minimum || 5);

  // Images
  const [imageUrl, setImageUrl] = useState(product.image_url || '');
  const [galleryUrls, setGalleryUrls] = useState(() => {
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      return [...product.gallery];
    }
    return product.image_url ? [product.image_url] : [];
  });
  const [newGalleryInput, setNewGalleryInput] = useState('');

  // Variants
  const [hasVariants, setHasVariants] = useState(() => Array.isArray(product.variants) && product.variants.length > 0);
  const [variantsList, setVariantsList] = useState(() => Array.isArray(product.variants) ? [...product.variants] : []);

  // Recalculate discount & margin
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

  // Recalculate total stock when variant stocks change
  useEffect(() => {
    if (hasVariants && variantsList.length > 0) {
      const sumStock = variantsList.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
      setStock(sumStock);
    }
  }, [hasVariants, variantsList]);

  // Reset to original product data
  const handleResetToOriginal = () => {
    setName(product.name || '');
    setCategoryId(product.category_id || categories[0]?.id || 1);
    setSku(product.sku || '');
    setWeight(product.weight || 250);
    setLocation(product.location || 'Jakarta Barat');
    setFreeShipping(Boolean(product.free_shipping));
    setIsOfficial(Boolean(product.is_official));
    setStatus(product.status || (product.active ? 'active' : 'inactive'));
    setDescription(product.description || '');
    setPrice(product.price || 0);
    setOriginalPrice(product.original_price || product.price || 0);
    setCostPrice(product.cost_price || Math.round((product.price || 0) * 0.6));
    setStock(product.stock || 0);
    setStockMinimum(product.stock_minimum || 5);
    setImageUrl(product.image_url || '');
    setGalleryUrls(Array.isArray(product.gallery) ? [...product.gallery] : [product.image_url]);
    setVariantsList(Array.isArray(product.variants) ? [...product.variants] : []);
  };

  // Specs helper
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

  // Variant helper
  const handleUpdateVariantStock = (idx, newStock) => {
    const updated = [...variantsList];
    updated[idx] = { ...updated[idx], stock: Math.max(0, Number(newStock)) };
    setVariantsList(updated);
  };

  const handleUpdateVariantPrice = (idx, newPrice) => {
    const updated = [...variantsList];
    updated[idx] = { ...updated[idx], price: Math.max(0, Number(newPrice)) };
    setVariantsList(updated);
  };

  // Submit Handler
  const handleSubmit = (targetStatus = status) => {
    if (!name.trim()) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }

    // Build specifications dictionary
    const specificationsObj = {};
    specList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specificationsObj[item.key.trim()] = item.value.trim();
      }
    });

    const updatedProduct = {
      ...product,
      name: name.trim(),
      category_id: Number(categoryId),
      sku: sku.trim() || product.sku,
      weight: Number(weight) || 250,
      location,
      free_shipping: freeShipping,
      is_official: isOfficial,
      status: targetStatus,
      active: targetStatus === 'active',
      description: description.trim(),
      price: Number(price) || 0,
      original_price: Number(originalPrice) || Number(price) || 0,
      cost_price: Number(costPrice) || Math.round(Number(price) * 0.6),
      discount_percentage: Number(originalPrice) > Number(price)
        ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
        : 0,
      stock: Number(stock) || 0,
      stock_minimum: Number(stockMinimum) || 5,
      image_url: imageUrl.trim(),
      gallery: galleryUrls.length > 0 ? galleryUrls : [imageUrl.trim()],
      specifications: specificationsObj,
      variants: hasVariants ? variantsList : []
    };

    onUpdateProduct(updatedProduct);
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
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-black">
              <Edit3 size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                Edit Produk: {product.name}
              </h1>
              <p className="text-xs text-gray-500">
                Ubah informasi produk, sesuaikan harga jual, margin, stok varian, dan kelola status etalase.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToOriginal}
            className="px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset ke data awal produk"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
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
            onClick={() => handleSubmit(status)}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-gray-900 font-medium transition-all"
              />
            </div>

            {/* Kategori & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kategori Produk
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  SKU Induk (Kode Produk)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-mono font-semibold"
                />
              </div>
            </div>

            {/* Bobot Paket & Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Berat Pengiriman (Gram)
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
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kota Gudang / Asal Pengiriman
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-semibold"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Deskripsi Produk
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Spesifikasi Produk */}
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
                    placeholder="Parameter"
                    className="w-1/3 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="Nilai"
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

          {/* Section 3: Varian Produk Eksisting */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
                <Layers size={16} className="text-amber-500" />
                <span>Daftar Varian Produk ({variantsList.length})</span>
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

            {hasVariants && variantsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">SKU Varian</th>
                      <th className="py-2.5 px-3">Kombinasi Opsi</th>
                      <th className="py-2.5 px-3">Harga Khusus</th>
                      <th className="py-2.5 px-3">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variantsList.map((variant, idx) => (
                      <tr key={variant.id || idx} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-700">
                          {variant.sku || `VAR-${idx + 1}`}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 font-semibold">
                          {[variant.color, variant.size, variant.sleeve].filter(Boolean).join(' • ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleUpdateVariantPrice(idx, e.target.value)}
                            className="w-28 px-2.5 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleUpdateVariantStock(idx, e.target.value)}
                            className="w-20 px-2.5 py-1 text-xs font-black bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Produk ini tidak memiliki varian bertingkat. Stok dan harga diatur secara terpusat pada form di samping.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
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
                  Total Stok <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  disabled={hasVariants && variantsList.length > 0}
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-black bg-gray-50 border border-gray-200 rounded-xl text-gray-900 disabled:bg-gray-100"
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

          {/* Media Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              <ImageIcon size={16} className="text-amber-500" />
              <span>Foto Produk & Galeri</span>
            </div>

            {/* Thumbnail URL Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                URL Foto Utama
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
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
                />
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
                  placeholder="URL foto..."
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

          {/* Status & Options Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              <Tag size={16} className="text-amber-500" />
              <span>Status & Visibilitas</span>
            </div>

            {/* Status Live / Draft */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Status Etalase
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
                <span className="font-semibold text-gray-800">Badge Bebas Ongkir</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-gray-800">Badge Tusko Pro (Official)</span>
              </label>
            </div>

            {/* Bottom Save */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit(status)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
