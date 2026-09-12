import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle, 
  DollarSign, 
  Sparkles, 
  Save, 
  FileText, 
  Eye,
  Grid,
  X,
  FolderKanban
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { createMockProduct, generateProductSku } from '../data/mockProducts';
import ServerSideSelect from './molecules/ServerSideSelect';
import IconButton from './atoms/IconButton';
import CategoryMasterModal from './organisms/CategoryMasterModal';
import { categoryService } from '../services/categoryService';

const WAREHOUSE_OPTIONS = [
  { value: 'Gudang Pusat Jakarta (Cakung DC)', label: 'Gudang Pusat Jakarta (Cakung DC)' },
  { value: 'Hub Logistik Bandung (Gedebage)', label: 'Hub Logistik Bandung (Gedebage)' },
  { value: 'Hub Logistik Surabaya (Rungkut)', label: 'Hub Logistik Surabaya (Rungkut)' },
  { value: 'Hub Logistik Medan (Belawan)', label: 'Hub Logistik Medan (Belawan)' },
  { value: 'Hub Logistik Makassar', label: 'Hub Logistik Makassar' },
];

export default function ProductCreateForm({
  categories = [],
  onSaveProduct = () => {},
  onCancel = () => {}
}) {
  // Basic Information (Starts Clean / Blank)
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCategoryMasterOpen, setIsCategoryMasterOpen] = useState(false);
  const [categoryList, setCategoryList] = useState(categories);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryList(categories);
    }
  }, [categories]);
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState(250);
  const [location, setLocation] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);
  const [isOfficial, setIsOfficial] = useState(true);
  const [status, setStatus] = useState('active'); // 'active' | 'inactive'
  const [errorMessage, setErrorMessage] = useState('');

  // Description & Specs
  const [description, setDescription] = useState('');
  const [specList, setSpecList] = useState([
    { key: 'Bahan', value: '' },
    { key: 'Fitting', value: '' }
  ]);

  // Pricing & Stock
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimum, setStockMinimum] = useState(5);

  // Images
  const [imageUrl, setImageUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');

  // Nested Multi-Attribute Variant Matrix
  const [hasVariants, setHasVariants] = useState(false);
  const [variantColorInput, setVariantColorInput] = useState('');
  const [variantSizeInput, setVariantSizeInput] = useState('');
  const [variantMatrix, setVariantMatrix] = useState([]);

  // Auto-calculated fields
  const discountPercent = useMemo(() => {
    const p = Number(price) || 0;
    const op = Number(originalPrice) || 0;
    if (op > p && op > 0 && p > 0) {
      return Math.round(((op - p) / op) * 100);
    }
    return 0;
  }, [price, originalPrice]);

  const marginInfo = useMemo(() => {
    const p = Number(price) || 0;
    const cp = Number(costPrice) || 0;
    const profit = p - cp;
    const marginPercent = p > 0 ? Math.round((profit / p) * 100) : 0;
    return { profit, marginPercent };
  }, [price, costPrice]);

  // Generate Matrix rows from inputs
  const handleRegenerateMatrix = () => {
    const colors = variantColorInput.split(',').map(s => s.trim()).filter(Boolean);
    const sizes = variantSizeInput.split(',').map(s => s.trim()).filter(Boolean);

    const baseSku = sku || 'TSK-PRD';
    const rows = [];
    let count = 1;

    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(col => {
        sizes.forEach(sz => {
          rows.push({
            id: `vm_${Date.now()}_${count++}`,
            sku: `${baseSku}-${col.slice(0, 3).toUpperCase()}-${sz}`,
            name: `${col} / ${sz}`,
            color: col,
            size: sz,
            price: Number(price) || 0,
            stock: Math.max(1, Math.floor(stock / (colors.length * sizes.length)))
          });
        });
      });
    } else if (colors.length > 0) {
      colors.forEach(col => {
        rows.push({
          id: `vm_${Date.now()}_${count++}`,
          sku: `${baseSku}-${col.slice(0, 3).toUpperCase()}`,
          name: col,
          color: col,
          size: 'All Size',
          price: Number(price) || 0,
          stock: Math.max(1, Math.floor(stock / colors.length))
        });
      });
    } else if (sizes.length > 0) {
      sizes.forEach(sz => {
        rows.push({
          id: `vm_${Date.now()}_${count++}`,
          sku: `${baseSku}-${sz}`,
          name: sz,
          color: 'Standard',
          size: sz,
          price: Number(price) || 0,
          stock: Math.max(1, Math.floor(stock / sizes.length))
        });
      });
    }

    setVariantMatrix(rows);
  };

  const handleUpdateMatrixRow = (rowId, field, value) => {
    setVariantMatrix(prev => prev.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          [field]: field === 'price' || field === 'stock' ? Number(value) : value
        };
      }
      return r;
    }));
  };

  const handleRemoveMatrixRow = (rowId) => {
    setVariantMatrix(prev => prev.filter(r => r.id !== rowId));
  };

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
    setLocation('Hub Logistik Bandung (Gedebage)');
    setFreeShipping(true);
    setIsOfficial(true);
    setStatus('active');
    setDescription('Singlet lari ultra-ringan dengan panel ventilasi micro-mesh laser cut di area dada dan punggung. Didesain khusus untuk pelari half dan full marathon yang membutuhkan sirkulasi udara maksimal dan jahitan tanpa gesekan.');
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
    setVariantMatrix([
      { id: 'vm_1', sku: 'TSK-RUN-SGL-VOLT-S', name: 'Neon Volt / S', color: 'Neon Volt', size: 'S', price: 229000, stock: 15 },
      { id: 'vm_2', sku: 'TSK-RUN-SGL-VOLT-M', name: 'Neon Volt / M', color: 'Neon Volt', size: 'M', price: 229000, stock: 20 },
      { id: 'vm_3', sku: 'TSK-RUN-SGL-WHT-L', name: 'Arctic White / L', color: 'Arctic White', size: 'L', price: 229000, stock: 15 },
      { id: 'vm_4', sku: 'TSK-RUN-SGL-BLK-XL', name: 'Shadow Black / XL', color: 'Shadow Black', size: 'XL', price: 239000, stock: 10 }
    ]);
  };

  // Submit Handler with inline validation
  const handleSubmit = (targetStatus = status) => {
    if (!name.trim()) {
      setErrorMessage('Nama lengkap produk wajib diisi!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!categoryId) {
      setErrorMessage('Kategori produk wajib dipilih!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setErrorMessage('Harga jual ritel produk harus lebih besar dari Rp 0!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMessage('');

    // Build specifications dictionary
    const specificationsObj = {};
    specList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specificationsObj[item.key.trim()] = item.value.trim();
      }
    });

    // Build variants & levels
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

      variants = variantMatrix.map((r, idx) => ({
        id: r.id || `v_${idx + 1}`,
        sku: r.sku,
        color: r.color,
        size: r.size,
        price: Number(r.price) || numPrice,
        stock: Number(r.stock) || 0
      }));
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
      description: description.trim() || 'Deskripsi produk resmi performa tinggi dari Tusko Official.',
      price: numPrice,
      original_price: Number(originalPrice) || numPrice,
      cost_price: Number(costPrice) || Math.round(numPrice * 0.6),
      stock: Number(stock) || 0,
      stock_minimum: Number(stockMinimum) || 5,
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      gallery: galleryUrls.length > 0 ? galleryUrls : [imageUrl.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'],
      specifications: specificationsObj,
      variant_levels: variantLevels,
      variants
    });

    onSaveProduct(newProduct);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onCancel}
            title="Kembali ke Daftar Produk"
            variant="outline"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-950 text-amber-400 rounded-none">
                Katalog Admin ERP
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 mt-0.5">
              Tambah Produk & Varian Baru
            </h1>
          </div>
        </div>

        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={Sparkles}
            onClick={handleFillDemoData}
            title="Isi Data Demo Singlet"
            variant="outline"
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          />

          <IconButton
            icon={X}
            onClick={onCancel}
            title="Batal"
            variant="secondary"
          />

          <IconButton
            icon={Save}
            onClick={() => handleSubmit('active')}
            title="Simpan & Publikasikan"
            variant="primary"
          />
        </div>
      </div>

      {/* Inline Validation Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage('')} 
            className="text-rose-600 hover:text-rose-950 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Form Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details & Variant Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Informasi Dasar */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Package size={16} className="text-amber-500" />
              <span>1. Informasi Dasar Produk</span>
            </h2>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Nama Lengkap Produk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Tusko Pro Matchday Football Jersey 2026 AeroTech"
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-medium rounded-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                    Kategori Produk <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryMasterOpen(true)}
                    className="text-[11px] font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FolderKanban size={12} />
                    <span>Master Kategori</span>
                  </button>
                </div>
                <ServerSideSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  loadOptions={categoryService.loadOptions.bind(categoryService)}
                  options={categoryList.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Pilih kategori produk..."
                  scrollPadding={35}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                    Kode SKU Induk
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    Otomatis Buat SKU
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="TSK-CAT-PROD-2026"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-mono font-semibold rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Berat Paket (Gram)
                </label>
                <input
                  type="number"
                  min="1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="250"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Lokasi Pengiriman Gudang Toko
                </label>
                <ServerSideSelect
                  value={location}
                  onChange={(val) => setLocation(val)}
                  options={WAREHOUSE_OPTIONS}
                  placeholder="Pilih lokasi gudang pengiriman..."
                  scrollPadding={35}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Deskripsi Lengkap Produk
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan keunggulan performa, teknologi kain, dan petunjuk perawatan..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 leading-relaxed rounded-none"
              />
            </div>
          </div>

          {/* Section 2: Nested Variant Matrix Generator */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Grid size={16} className="text-amber-500" />
                <span>2. Generator Matriks Varian Bertingkat</span>
              </h2>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Aktifkan Varian</span>
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-4">
                <div className="bg-neutral-50 p-4 border border-neutral-300 rounded-none space-y-3 text-xs">
                  <div>
                    <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      Pilihan Warna (Pisahkan dengan koma):
                    </label>
                    <input
                      type="text"
                      value={variantColorInput}
                      onChange={(e) => setVariantColorInput(e.target.value)}
                      placeholder="Triple Black, Crimson Red, Navy Blue"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      Pilihan Ukuran / Size (Pisahkan dengan koma):
                    </label>
                    <input
                      type="text"
                      value={variantSizeInput}
                      onChange={(e) => setVariantSizeInput(e.target.value)}
                      placeholder="S, M, L, XL"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateMatrix}
                    className="px-4 py-2 bg-neutral-950 text-amber-400 hover:bg-neutral-800 font-sport font-black uppercase text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-none"
                  >
                    <Sparkles size={13} />
                    <span>Generate Matriks Kombinasi Varian</span>
                  </button>
                </div>

                {/* Matrix Table */}
                {variantMatrix.length > 0 && (
                  <div className="border border-neutral-300 rounded-none overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-600">
                      <thead className="bg-neutral-950 text-white uppercase text-[10px] tracking-wider font-sport font-black">
                        <tr>
                          <th className="py-2.5 px-3">Kombinasi Varian</th>
                          <th className="py-2.5 px-3">SKU Turunan</th>
                          <th className="py-2.5 px-3 text-right">Harga Jual (Rp)</th>
                          <th className="py-2.5 px-3 text-right">Alokasi Stok</th>
                          <th className="py-2.5 px-3 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {variantMatrix.map((row) => (
                          <tr key={row.id} className="hover:bg-neutral-50">
                            <td className="py-2 px-3 font-bold text-neutral-950">
                              {row.name}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.sku}
                                onChange={(e) => handleUpdateMatrixRow(row.id, 'sku', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 font-mono text-xs rounded-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={row.price}
                                onChange={(e) => handleUpdateMatrixRow(row.id, 'price', e.target.value)}
                                className="w-28 px-2 py-1 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 font-mono text-right font-bold text-neutral-950 rounded-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={row.stock}
                                onChange={(e) => handleUpdateMatrixRow(row.id, 'stock', e.target.value)}
                                className="w-20 px-2 py-1 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 font-mono text-right font-bold text-neutral-950 rounded-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveMatrixRow(row.id)}
                                className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer rounded-none"
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
            )}
          </div>

          {/* Section 3: Spesifikasi Teknis */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                <span>3. Spesifikasi Teknis & Material</span>
              </h2>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-sport font-black uppercase border border-neutral-300 transition-colors flex items-center gap-1 cursor-pointer rounded-none"
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
                    placeholder="Nama Parameter (cth: Bobot)"
                    className="w-1/3 px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:border-amber-500 rounded-none"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="Nilai Spesifikasi (cth: 120 gram)"
                    className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:border-amber-500 rounded-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer rounded-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Pricing, Inventory Stock & Images */}
        <div className="space-y-6">
          {/* Pricing & Stock Card */}
          <div className="bg-white p-5 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <DollarSign size={16} className="text-amber-500" />
              <span>Harga & Modal HPP</span>
            </h2>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Harga Jual Ritel (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299000"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-extrabold rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Harga Coret (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="399000"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 text-neutral-800 font-medium rounded-none"
                />
              </div>

              {discountPercent > 0 && (
                <div className="flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sport font-black uppercase rounded-none">
                  Diskon {discountPercent}%
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Harga Modal Beli / HPP (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="160000"
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 font-semibold rounded-none"
              />
              <p className="text-[10px] text-neutral-500 mt-1 font-medium">
                Estimasi Gross Profit: <span className="font-bold text-emerald-700">{formatRupiah(marginInfo.profit)}</span> ({marginInfo.marginPercent}%)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
              <div>
                <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Total Stok Fisik
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="40"
                  className="w-full px-3 py-2 text-xs font-black bg-neutral-50 border border-neutral-300 text-neutral-950 rounded-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Safety Min
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockMinimum}
                  onChange={(e) => setStockMinimum(e.target.value)}
                  placeholder="8"
                  className="w-full px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Media & Images Card */}
          <div className="bg-white p-5 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <ImageIcon size={16} className="text-amber-500" />
              <span>Foto & Galeri Produk</span>
            </h2>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                URL Foto Utama
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono rounded-none"
              />
            </div>

            {imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden border border-neutral-300 bg-neutral-100 rounded-none">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            )}

            {/* Additional Gallery */}
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700">
                Tambah Foto Galeri (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGalleryInput}
                  onChange={(e) => setNewGalleryInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono rounded-none"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-sport font-black uppercase border border-neutral-300 transition-colors cursor-pointer rounded-none"
                >
                  Tambah
                </button>
              </div>

              {galleryUrls.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative w-14 h-14 overflow-hidden border border-neutral-300 rounded-none group">
                      <img src={url} alt="Thumb" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(idx)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility & Badges Card */}
          <div className="bg-white p-5 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Eye size={16} className="text-amber-500" />
              <span>Status & Visibilitas</span>
            </h2>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Status Publikasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 text-xs font-sport font-black uppercase tracking-wider border transition-colors cursor-pointer flex items-center justify-center gap-1.5 rounded-none ${
                    status === 'active' 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <span>🟢 Aktif (Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`py-2 text-xs font-sport font-black uppercase tracking-wider border transition-colors cursor-pointer flex items-center justify-center gap-1.5 rounded-none ${
                    status === 'inactive' 
                      ? 'bg-neutral-950 text-white border-neutral-950' 
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <span>⚪ Nonaktif (Draft)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-200 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold font-sport uppercase text-[11px] text-neutral-800">
                  Badge Bebas Ongkir (Gratis Ongkir)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold font-sport uppercase text-[11px] text-neutral-800">
                  Badge Tusko Pro (Official Flagship)
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit('active')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>Simpan Produk</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('inactive')}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
              >
                Simpan sebagai Draft Nonaktif
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Master Modal */}
      <CategoryMasterModal
        isOpen={isCategoryMasterOpen}
        onClose={() => setIsCategoryMasterOpen(false)}
        onCategoriesChange={(updatedList) => {
          setCategoryList(updatedList);
        }}
      />
    </div>
  );
}
