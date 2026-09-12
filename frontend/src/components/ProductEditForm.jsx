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
  Edit3,
  Grid
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import ServerSideSelect from './molecules/ServerSideSelect';

export default function ProductEditForm({
  product = null,
  categories = [],
  onUpdateProduct = () => {},
  onCancel = () => {}
}) {
  if (!product) {
    return (
      <div className="p-8 text-center bg-white border border-gray-200">
        <p className="text-sm font-bold text-gray-700">Pilih produk yang ingin diedit.</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 px-4 py-2 bg-amber-400 text-neutral-950 font-black text-xs border border-amber-500 cursor-pointer"
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
  const handleUpdateVariant = (index, field, val) => {
    const updated = [...variantsList];
    updated[index][field] = field === 'price' || field === 'stock' ? Number(val) : val;
    setVariantsList(updated);
  };

  const handleRemoveVariant = (index) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  const handleAddVariantRow = () => {
    setVariantsList([
      ...variantsList,
      {
        id: `v_new_${Date.now()}`,
        sku: `${sku || 'TSK'}-NEW`,
        color: 'Standar',
        size: 'All Size',
        price: Number(price) || 0,
        stock: 10
      }
    ]);
  };

  // Submit Handler
  const handleSubmit = (targetStatus = status) => {
    if (!name.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }

    // Build specs dictionary
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
      sku: sku.trim(),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer border border-gray-300"
            title="Kembali ke Daftar Produk"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-neutral-900 text-amber-400">
                Edit SKU: {product.sku}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight mt-0.5">
              Edit Data Produk & Varian
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetToOriginal}
            className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Kembalikan data ke awal sebelum diedit"
          >
            <RotateCcw size={14} />
            <span>Reset Perubahan</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('active')}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Form Content (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Informasi Dasar */}
          <div className="bg-white p-5 sm:p-6 border border-gray-200 space-y-4">
            <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-3">
              <Package size={16} className="text-amber-500" />
              <span>1. Informasi Dasar Produk</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Lengkap Produk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Produk</label>
                <ServerSideSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Pilih Kategori Produk..."
                  scrollPadding={35}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kode SKU Induk</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Berat Paket (Gram)</label>
                <input
                  type="number"
                  min="1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi Pengiriman Toko</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Lengkap Produk</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Varian & Matriks Varian */}
          <div className="bg-white p-5 sm:p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Grid size={16} className="text-amber-500" />
                <span>2. Matriks Varian Produk</span>
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Produk Bervarian</span>
                </label>
                {hasVariants && (
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="px-2.5 py-1 bg-neutral-900 text-amber-400 text-xs font-bold border border-neutral-900 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Tambah Baris</span>
                  </button>
                )}
              </div>
            </div>

            {hasVariants && (
              <div className="border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">SKU Varian</th>
                      <th className="py-2.5 px-3">Warna / Opsi</th>
                      <th className="py-2.5 px-3">Ukuran / Size</th>
                      <th className="py-2.5 px-3 text-right">Harga Khusus (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Stok Fisik</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variantsList.map((v, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.color || ''}
                            onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.size || ''}
                            onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={v.price || 0}
                            onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-mono text-right font-bold text-gray-900"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={v.stock || 0}
                            onChange={(e) => handleUpdateVariant(idx, 'stock', e.target.value)}
                            className="w-20 px-2 py-1 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-mono text-right font-bold text-gray-900"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Spesifikasi Teknis */}
          <div className="bg-white p-5 sm:p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                <span>3. Spesifikasi Teknis Produk</span>
              </h2>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2">
              {specList.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                    placeholder="Parameter"
                    className="w-1/3 px-3 py-2 text-xs bg-gray-50 border border-gray-300 text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="Nilai"
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pricing, Inventory & Status */}
        <div className="space-y-6">
          {/* Pricing & Stock Card */}
          <div className="bg-white p-5 border border-gray-200 space-y-4">
            <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-3">
              <DollarSign size={16} className="text-amber-500" />
              <span>Harga & Modal HPP</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Jual Ritel (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-extrabold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Harga Coret (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 text-gray-700 font-medium"
                />
              </div>

              {discountPercent > 0 && (
                <div className="flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black">
                  Diskon {discountPercent}%
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Harga Modal Beli / HPP (Rp)</label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 text-gray-800 font-semibold"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Estimasi Gross Profit: <span className="font-bold text-emerald-700">{formatRupiah(marginInfo.profit)}</span> ({marginInfo.marginPercent}%)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Total Stok Fisik</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  disabled={hasVariants}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-black bg-gray-50 border border-gray-300 text-gray-900 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Safety Min</label>
                <input
                  type="number"
                  min="1"
                  value={stockMinimum}
                  onChange={(e) => setStockMinimum(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-300 text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Media & Images Card */}
          <div className="bg-white p-5 border border-gray-200 space-y-4">
            <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-3">
              <ImageIcon size={16} className="text-amber-500" />
              <span>Foto & Galeri Produk</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">URL Foto Utama</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 text-gray-800 font-mono"
              />
            </div>

            {imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden border border-gray-200 bg-gray-100">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Additional Gallery */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="block text-[11px] font-bold text-gray-600">Tambah Foto Galeri (URL):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGalleryInput}
                  onChange={(e) => setNewGalleryInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 text-gray-800 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-300 transition-colors cursor-pointer"
                >
                  Tambah
                </button>
              </div>

              {galleryUrls.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative w-14 h-14 overflow-hidden border border-gray-200 group">
                      <img src={url} alt="Thumb" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(idx)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility Card */}
          <div className="bg-white p-5 border border-gray-200 space-y-4">
            <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-3">
              <Eye size={16} className="text-amber-500" />
              <span>Status & Visibilitas</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status Publikasi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'active' 
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black' 
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span>🟢 Aktif (Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`py-2 text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'inactive' 
                      ? 'bg-gray-800 text-white border-gray-800 font-black' 
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span>⚪ Nonaktif (Draft)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-150 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-gray-800">Badge Bebas Ongkir (Gratis Ongkir)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-gray-800">Badge Tusko Pro (Official Flagship)</span>
              </label>
            </div>

            <div className="pt-3 border-t border-gray-150 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit('active')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
