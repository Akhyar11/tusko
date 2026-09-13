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
  Grid,
  X,
  FolderKanban,
  Building2,
  Scale,
  ChevronDown,
  UploadCloud,
  Camera,
  Sparkles
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { generateProductSku, generateVariantSku } from '../data/mockProducts';
import ServerSideSelect from './molecules/ServerSideSelect';
import IconButton from './atoms/IconButton';
import CategoryMasterModal from './organisms/CategoryMasterModal';
import { categoryService } from '../services/categoryService';
import { vendorService } from '../services/vendorService';

export default function ProductEditForm({
  product = null,
  categories = [],
  vendors = [],
  products = [],
  onUpdateProduct = () => {},
  onCancel = () => {},
  onNavigateToCategories = () => {},
  onNavigateToSuppliers = () => {}
}) {
  const [isCategoryMasterOpen, setIsCategoryMasterOpen] = useState(false);
  const [categoryList, setCategoryList] = useState(categories);
  const [vendorList, setVendorList] = useState(vendors);

  const handleNavigateToCategories = () => {
    if (onNavigateToCategories) {
      if (!window.confirm('Form edit produk belum disimpan. Apakah Anda yakin ingin beralih ke halaman Master Kategori? Perubahan yang belum disimpan akan hilang.')) {
        return;
      }
      onNavigateToCategories();
    } else {
      setIsCategoryMasterOpen(true);
    }
  };

  const handleNavigateToSuppliers = () => {
    if (onNavigateToSuppliers) {
      if (!window.confirm('Form edit produk belum disimpan. Beralih ke halaman Master Supplier? Perubahan yang belum disimpan akan hilang.')) {
        return;
      }
      onNavigateToSuppliers();
    }
  };

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryList(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (vendors && vendors.length > 0) {
      setVendorList(vendors);
    } else {
      vendorService.fetchVendors().then(res => {
        if (res?.data && res.data.length > 0) {
          setVendorList(res.data);
        }
      }).catch(() => {});
    }
  }, [vendors]);
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
  const [vendorId, setVendorId] = useState(product.vendor_id || '');
  const [sku, setSku] = useState(product.sku || '');

  // SKU Uniqueness validation check (excluding current product)
  const isSkuDuplicate = useMemo(() => {
    if (!sku.trim()) return false;
    const upper = sku.trim().toUpperCase();
    return (products || []).some(p => {
      if (p.id === product?.id) return false;
      if (p.sku && p.sku.toUpperCase() === upper) return true;
      if (Array.isArray(p.variants) && p.variants.some(v => v.sku && v.sku.toUpperCase() === upper)) return true;
      return false;
    });
  }, [sku, products, product?.id]);

  // Auto generate guaranteed unique SKU
  const handleGenerateSku = () => {
    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const generated = generateProductSku(selectedCat?.slug || selectedCat?.name || 'prd', name || 'PROD', products);
    setSku(generated);
  };

  // ── Weight System ──────────────────────────────────────────────────────────
  const productWeightGrams = product.weight || 250;
  const [weightUnit, setWeightUnit] = useState('g');
  const [weightValue, setWeightValue] = useState(productWeightGrams.toString());
  const [showDimensions, setShowDimensions] = useState(false);
  const [dimLength, setDimLength] = useState('');
  const [dimWidth, setDimWidth] = useState('');
  const [dimHeight, setDimHeight] = useState('');

  const weightGrams = useMemo(() => {
    const v = parseFloat(weightValue) || 0;
    return weightUnit === 'kg' ? Math.round(v * 1000) : Math.round(v);
  }, [weightValue, weightUnit]);

  const volumetricInfo = useMemo(() => {
    const p = parseFloat(dimLength) || 0;
    const l = parseFloat(dimWidth)  || 0;
    const t = parseFloat(dimHeight) || 0;
    if (!p || !l || !t) return null;
    const volCm3 = p * l * t;
    const volKg  = volCm3 / 6000;
    const actualKg = weightGrams / 1000;
    const chargedKg = Math.max(actualKg, volKg);
    return { volCm3, volKg, actualKg, chargedKg, isVolumetric: volKg > actualKg };
  }, [dimLength, dimWidth, dimHeight, weightGrams]);

  // ── End Weight System ──────────────────────────────────────────────────────

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
    setWeightUnit('g');
    setWeightValue((product.weight || 250).toString());
    setShowDimensions(false);
    setDimLength('');
    setDimWidth('');
    setDimHeight('');
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

  // Image upload helpers (Local real file upload via FileReader)
  const handleMainImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WEBP, dll.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setGalleryUrls(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
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
    const finalVal = field === 'sku' ? String(val || '').toUpperCase() : (field === 'price' || field === 'stock' ? Number(val) : val);
    updated[index][field] = finalVal;
    setVariantsList(updated);
  };

  const handleRemoveVariant = (index) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  // Set of all other SKUs across catalog & other products (excluding current product's original variants)
  const globalOtherSkus = useMemo(() => {
    const set = new Set();
    if (sku.trim()) set.add(sku.trim().toUpperCase());
    (products || []).forEach(p => {
      if (p.id === product?.id) return;
      if (p?.sku) set.add(p.sku.toUpperCase());
      if (Array.isArray(p?.variants)) {
        p.variants.forEach(v => {
          if (v?.sku) set.add(v.sku.toUpperCase());
        });
      }
    });
    try {
      const stored = JSON.parse(localStorage.getItem('tusko_products') || '[]');
      if (Array.isArray(stored)) {
        stored.forEach(p => {
          if (p.id === product?.id) return;
          if (p?.sku) set.add(p.sku.toUpperCase());
          if (Array.isArray(p?.variants)) {
            p.variants.forEach(v => {
              if (v?.sku) set.add(v.sku.toUpperCase());
            });
          }
        });
      }
    } catch (_) {}
    return set;
  }, [sku, products, product?.id]);

  // Validation map for each row in variantsList
  const variantSkuStatusMap = useMemo(() => {
    const counts = {};
    variantsList.forEach(v => {
      const s = (v.sku || '').trim().toUpperCase();
      if (s) {
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    const statusMap = {};
    variantsList.forEach((v, idx) => {
      const s = (v.sku || '').trim().toUpperCase();
      const key = v.id || idx;
      if (!s) {
        statusMap[key] = { isDuplicate: false, isEmpty: true, message: 'SKU wajib diisi' };
      } else if (counts[s] > 1) {
        statusMap[key] = { isDuplicate: true, message: 'Duplikat di varian lain' };
      } else if (s === (sku || '').trim().toUpperCase()) {
        statusMap[key] = { isDuplicate: true, message: 'Sama dengan SKU Induk' };
      } else if (globalOtherSkus.has(s)) {
        statusMap[key] = { isDuplicate: true, message: 'Dipakai produk/varian lain' };
      } else {
        statusMap[key] = { isDuplicate: false, isUnique: true };
      }
    });
    return statusMap;
  }, [variantsList, globalOtherSkus, sku]);

  // Synchronize/regenerate all variant SKUs to be guaranteed unique
  const handleRegenerateAllVariantSkus = () => {
    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const catCode = (selectedCat?.slug || selectedCat?.name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD';
    const nameCode = (name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PROD';
    const effectiveBaseSku = sku.trim() || product?.sku || `TSK-${catCode}-${nameCode}`;

    const takenSkus = new Set();
    if (effectiveBaseSku) takenSkus.add(effectiveBaseSku.toUpperCase());

    setVariantsList(prev => prev.map((v, idx) => {
      const attrs = v.name ? v.name.split(' / ') : [v.color, v.size].filter(Boolean);
      const newSku = generateVariantSku(effectiveBaseSku, attrs.length ? attrs : `VAR-${idx + 1}`, products, takenSkus);
      takenSkus.add(newSku);
      return {
        ...v,
        sku: newSku
      };
    }));
  };

  const handleAddVariantRow = () => {
    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const catCode = (selectedCat?.slug || selectedCat?.name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD';
    const nameCode = (name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PROD';
    const effectiveBaseSku = sku.trim() || product?.sku || `TSK-${catCode}-${nameCode}`;

    const takenSkus = new Set();
    if (effectiveBaseSku) takenSkus.add(effectiveBaseSku.toUpperCase());
    variantsList.forEach(v => {
      if (v.sku) takenSkus.add(v.sku.toUpperCase());
    });

    const newSku = generateVariantSku(effectiveBaseSku, `VAR-${variantsList.length + 1}`, products, takenSkus);

    setVariantsList([
      ...variantsList,
      {
        id: `v_new_${Date.now()}`,
        name: `Varian ${variantsList.length + 1}`,
        sku: newSku,
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

    if (isSkuDuplicate) {
      alert(`Kode SKU "${sku.trim().toUpperCase()}" sudah digunakan oleh produk lain! Harap gunakan SKU yang unik.`);
      return;
    }

    if (hasVariants && variantsList.length > 0) {
      for (let i = 0; i < variantsList.length; i++) {
        const v = variantsList[i];
        const vSku = (v.sku || '').trim().toUpperCase();
        const key = v.id || i;
        const st = variantSkuStatusMap[key];
        if (!vSku) {
          alert(`Varian "${v.name || `Baris ${i + 1}`}" belum memiliki Kode SKU!`);
          return;
        }
        if (st && st.isDuplicate) {
          alert(`Kode SKU "${vSku}" pada varian "${v.name || `Baris ${i + 1}`}" tidak unik (${st.message})! Setiap varian wajib memiliki SKU unik.`);
          return;
        }
      }
    }

    // Build specs dictionary
    const specificationsObj = {};
    specList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specificationsObj[item.key.trim()] = item.value.trim();
      }
    });

    const selectedVendor = (vendorList || []).find(v => v.id === Number(vendorId));
    const updatedProduct = {
      ...product,
      name: name.trim(),
      category_id: Number(categoryId),
      vendor_id: Number(vendorId) || null,
      vendor_name: selectedVendor?.company_name || null,
      sku: sku.trim(),
      weight: weightGrams || 250,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onCancel}
            title="Kembali ke Daftar Produk"
            variant="outline"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Edit Data Produk &amp; Varian
            </h1>
          </div>
        </div>

        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={RotateCcw}
            onClick={handleResetToOriginal}
            title="Reset Perubahan ke Data Awal"
            variant="secondary"
          />

          {onNavigateToCategories && (
            <IconButton
              icon={FolderKanban}
              onClick={handleNavigateToCategories}
              title="Halaman Master Kategori Produk"
              variant="secondary"
            />
          )}

          {onNavigateToSuppliers && (
            <IconButton
              icon={Building2}
              onClick={handleNavigateToSuppliers}
              title="Halaman Master Supplier / Vendor"
              variant="secondary"
            />
          )}

          <IconButton
            icon={X}
            onClick={onCancel}
            title="Batal"
            variant="secondary"
          />

          <IconButton
            icon={Save}
            onClick={() => handleSubmit('active')}
            title="Simpan Perubahan"
            variant="primary"
          />
        </div>
      </div>

      {/* Form Content (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
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
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-medium rounded-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900 whitespace-nowrap">
                    Kategori Produk <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleNavigateToCategories}
                    className="text-[11px] font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
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
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900 whitespace-nowrap">
                    Mitra Supplier
                  </label>
                  {onNavigateToSuppliers && (
                    <button
                      type="button"
                      onClick={handleNavigateToSuppliers}
                      className="text-[11px] font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                    >
                      <Building2 size={12} />
                      <span>Master Supplier</span>
                    </button>
                  )}
                </div>
                <ServerSideSelect
                  value={vendorId}
                  onChange={(val) => setVendorId(val)}
                  loadOptions={vendorService.loadOptions.bind(vendorService)}
                  options={vendorList.map((v) => ({
                    value: v.id,
                    label: v.code ? `[${v.code}] ${v.company_name}` : v.company_name
                  }))}
                  placeholder="Pilih mitra supplier..."
                  isClearable={true}
                  scrollPadding={35}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Kode SKU Induk <span className="text-rose-500">*</span>
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
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="TSK-CAT-PROD-001"
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-semibold rounded-none border focus:outline-none transition-colors ${
                  isSkuDuplicate
                    ? 'border-rose-500 bg-rose-50/50 text-rose-950 focus:border-rose-600'
                    : sku.trim()
                    ? 'border-emerald-500 bg-emerald-50/30 text-neutral-950 focus:border-emerald-600'
                    : 'border-neutral-300 bg-neutral-50 focus:bg-white focus:border-amber-500 text-neutral-950'
                }`}
              />
              {sku.trim() && (
                <div className="mt-1.5">
                  {isSkuDuplicate ? (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-sport font-bold tracking-wide">
                      <AlertCircle size={14} className="shrink-0 text-rose-600" />
                      <span>SKU "{sku}" sudah digunakan oleh produk lain! Harap buat SKU unik.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-sport font-bold tracking-wide">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                      <span>SKU unik &amp; siap digunakan</span>
                    </div>
                  )}
                </div>
              )}
            </div>


            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Deskripsi Lengkap Produk
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 leading-relaxed rounded-none"
              />
            </div>
          </div>

          {/* Section 2: Penentuan Harga & Alokasi Stok */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-5">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <DollarSign size={16} className="text-amber-500" />
              <span>2. Penentuan Harga &amp; Alokasi Stok</span>
            </h2>

            {/* Skema Harga (3 Kolom Sejajar Sempurna) */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Harga Jual Ritel */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Harga Jual Ritel <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono font-black text-neutral-400 select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-black font-mono rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Harga final yang dibayar oleh pembeli
                  </span>
                </div>

                {/* 2. Harga Coret (Normal) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                      Harga Coret (Normal)
                    </label>
                    {discountPercent > 0 && (
                      <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-sport font-black uppercase">
                        Diskon {discountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono font-bold text-neutral-400 select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-800 font-bold font-mono rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Tampil dicoret jika sedang masa promo
                  </span>
                </div>

                {/* 3. Harga Modal Beli / HPP */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Harga Modal Beli / HPP
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono font-bold text-neutral-400 select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-900 font-bold font-mono rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Biaya pokok produksi / pengadaan vendor
                  </span>
                </div>
              </div>

              {/* Strip Informasi Margin Profit & Promo Sejajar */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-600">
                    Estimasi Gross Profit:
                  </span>
                  <span className="font-mono font-black text-sm">
                    <span className={marginInfo.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      {formatRupiah(marginInfo.profit)}
                    </span>{' '}
                    <span className="text-neutral-400 font-semibold text-xs">
                      ({marginInfo.marginPercent}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-600">
                    Status Promo:
                  </span>
                  {discountPercent > 0 ? (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-sport font-black uppercase tracking-wider">
                      Promo Diskon {discountPercent}% Aktif
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500 font-medium">
                      Harga Normal (Tidak Ada Diskon)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pemisah Manajemen Stok Fisik */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Stok Fisik */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Total Stok Fisik {!hasVariants && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    disabled={hasVariants}
                    placeholder="0"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-none border focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      hasVariants 
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-500 cursor-not-allowed' 
                        : 'bg-neutral-50 focus:bg-white border-neutral-300 focus:border-amber-500 text-neutral-950 font-black'
                    }`}
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    {hasVariants 
                      ? 'Terkunci — dihitung otomatis dari akumulasi stok varian' 
                      : 'Jumlah unit fisik produk yang tersedia di gudang'}
                  </span>
                </div>

                {/* Batas Stok Minimum */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Batas Stok Minimum (Safety Stock)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockMinimum}
                    onChange={(e) => setStockMinimum(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold font-mono bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-900 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Peringatan otomatis muncul saat sisa stok &le; batas minimum ini
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Varian & Matriks Varian */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Grid size={16} className="text-amber-500" />
                <span>3. Matriks Varian Produk</span>
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerateAllVariantSkus}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold border border-neutral-300 cursor-pointer flex items-center gap-1 rounded-none transition-colors"
                      title="Perbarui seluruh SKU varian agar otomatis serasi dan 100% unik"
                    >
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Sinkronkan SKU</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-bold border border-neutral-900 cursor-pointer flex items-center gap-1 rounded-none transition-colors"
                    >
                      <Plus size={12} />
                      <span>Tambah Baris</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {hasVariants && (
              <div className="border border-neutral-300 rounded-none overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-600">
                  <thead className="bg-neutral-950 text-white uppercase text-[10px] tracking-wider font-sport font-black">
                    <tr>
                      <th className="py-2.5 px-3">Nama / Kombinasi Varian</th>
                      <th className="py-2.5 px-3">SKU Varian</th>
                      <th className="py-2.5 px-3 text-right">Harga Khusus (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Stok Fisik</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {variantsList.map((v, idx) => {
                      const key = v.id || idx;
                      const st = variantSkuStatusMap[key];
                      const isDup = st?.isDuplicate;
                      const isUniq = st?.isUnique;
                      const isEmpty = st?.isEmpty;
                      return (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="py-2 px-3 font-semibold">
                            <input
                              type="text"
                              value={v.name || `${v.color || ''} ${v.size ? '/ ' + v.size : ''}`.trim() || `Varian ${idx + 1}`}
                              onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                              placeholder="cth: Merah / XL atau 10 kg"
                              className="w-full px-2 py-1 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 font-bold text-neutral-950 text-xs rounded-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div>
                              <input
                                type="text"
                                value={v.sku || ''}
                                onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value.toUpperCase())}
                                placeholder="TSK-PRD-VAR-01"
                                className={`w-full px-2 py-1 font-mono text-xs rounded-none border focus:outline-none transition-colors ${
                                  isDup
                                    ? 'border-rose-500 bg-rose-50/50 text-rose-950 focus:border-rose-600'
                                    : isUniq
                                    ? 'border-emerald-500 bg-emerald-50/20 text-neutral-950 focus:border-emerald-600'
                                    : 'border-neutral-300 bg-white focus:border-amber-500 text-neutral-950'
                                }`}
                              />
                              {isDup && (
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-rose-600 font-sport font-bold tracking-tight">
                                  <AlertCircle size={11} className="shrink-0 text-rose-600" />
                                  <span>{st.message}</span>
                                </div>
                              )}
                              {isUniq && (
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 font-sport font-bold tracking-tight">
                                  <CheckCircle2 size={11} className="shrink-0 text-emerald-600" />
                                  <span>Unik</span>
                                </div>
                              )}
                              {isEmpty && (
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600 font-sport font-bold tracking-tight">
                                  <AlertCircle size={11} className="shrink-0 text-amber-600" />
                                  <span>Wajib diisi</span>
                                </div>
                              )}
                            </div>
                          </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={v.price || 0}
                            onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 font-mono text-right font-bold text-neutral-950 rounded-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={v.stock || 0}
                            onChange={(e) => handleUpdateVariant(idx, 'stock', e.target.value)}
                            className="w-20 px-2 py-1 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 font-mono text-right font-bold text-neutral-950 rounded-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer rounded-none"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Sistem Berat & Logistik Pengiriman */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Scale size={16} className="text-amber-500" />
              <span>4. Sistem Berat &amp; Logistik Pengiriman</span>
            </h2>

            {/* Input Berat Utama dengan Unit Switcher */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Berat Paket <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-0">
                <input
                  type="number"
                  min="0"
                  step={weightUnit === 'kg' ? '0.1' : '1'}
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  placeholder={weightUnit === 'kg' ? '0.5' : '500'}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-extrabold rounded-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (weightUnit !== 'g') {
                      setWeightUnit('g');
                      setWeightValue(weightGrams ? weightGrams.toString() : '');
                    }
                  }}
                  className={`px-4 py-2.5 text-xs font-sport font-black uppercase border-y border-neutral-300 transition-colors cursor-pointer rounded-none ${
                    weightUnit === 'g'
                      ? 'bg-neutral-950 text-amber-400 border-neutral-950'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  gram
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (weightUnit !== 'kg') {
                      setWeightUnit('kg');
                      setWeightValue(weightGrams ? (weightGrams / 1000).toFixed(3).replace(/\.?0+$/, '') : '');
                    }
                  }}
                  className={`px-4 py-2.5 text-xs font-sport font-black uppercase border border-neutral-300 transition-colors cursor-pointer rounded-none ${
                    weightUnit === 'kg'
                      ? 'bg-neutral-950 text-amber-400 border-neutral-950'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  kg
                </button>
              </div>
              {weightGrams > 0 && (
                <p className="mt-1.5 text-[11px] text-neutral-500 font-medium">
                  Disimpan sebagai:{' '}
                  <span className="font-black text-neutral-800">
                    {weightGrams.toLocaleString('id-ID')} gram
                  </span>{' '}
                  ({(weightGrams / 1000).toFixed(3).replace(/\.?0+$/, '')} kg)
                </p>
              )}
            </div>

            {/* Toggle Dimensi Volumetrik */}
            <div>
              <button
                type="button"
                onClick={() => setShowDimensions(!showDimensions)}
                className="flex items-center gap-2 text-xs font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                <Ruler size={14} />
                <span>Sertakan Dimensi Paket (Kalkulasi Berat Volumetrik)</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showDimensions ? 'rotate-180' : ''}`}
                />
              </button>

              {showDimensions && (
                <div className="mt-3 space-y-3 bg-neutral-50 border border-neutral-200 p-4 rounded-none">
                  <p className="text-[10px] text-neutral-500 font-medium flex items-start gap-1.5">
                    <Info size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    Ekspedisi menagih berdasarkan nilai terbesar antara berat fisik vs berat
                    volumetrik (P×L×T ÷ 6.000 dalam kg). Masukkan dimensi dalam satuan
                    <strong className="text-neutral-700"> sentimeter (cm)</strong>.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-sport font-bold uppercase text-neutral-700 mb-1">
                        Panjang (cm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={dimLength}
                        onChange={(e) => setDimLength(e.target.value)}
                        placeholder="40"
                        className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sport font-bold uppercase text-neutral-700 mb-1">
                        Lebar (cm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={dimWidth}
                        onChange={(e) => setDimWidth(e.target.value)}
                        placeholder="30"
                        className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sport font-bold uppercase text-neutral-700 mb-1">
                        Tinggi (cm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={dimHeight}
                        onChange={(e) => setDimHeight(e.target.value)}
                        placeholder="20"
                        className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                      />
                    </div>
                  </div>

                  {volumetricInfo && (
                    <div className={`p-3 border rounded-none ${
                      volumetricInfo.isVolumetric
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-emerald-50 border-emerald-300'
                    }`}>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-medium">
                        <span className="text-neutral-600">
                          Volume: <strong className="text-neutral-900">{volumetricInfo.volCm3.toLocaleString('id-ID')} cm³</strong>
                        </span>
                        <span className="text-neutral-600">
                          Berat Volumetrik: <strong className="text-neutral-900">{volumetricInfo.volKg.toFixed(2)} kg</strong>
                        </span>
                        <span className="text-neutral-600">
                          Berat Fisik: <strong className="text-neutral-900">{volumetricInfo.actualKg.toFixed(3)} kg</strong>
                        </span>
                      </div>
                      <p className={`mt-1.5 text-xs font-black font-sport uppercase ${
                        volumetricInfo.isVolumetric ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {volumetricInfo.isVolumetric
                          ? `⚠ Ekspedisi menagih berat volumetrik: ${volumetricInfo.chargedKg.toFixed(2)} kg (lebih besar dari berat fisik)`
                          : `✓ Ekspedisi menagih berat fisik: ${volumetricInfo.chargedKg.toFixed(3)} kg`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Spesifikasi Teknis */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                <span>5. Spesifikasi Teknis &amp; Material</span>
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

        {/* Right 1 Col: Media & Visibilitas */}
        <div className="space-y-6">
          {/* Media & Images Card */}
          <div className="bg-white p-5 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-xs font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-2.5">
              <ImageIcon size={15} className="text-amber-500" />
              <span>Foto &amp; Galeri Produk</span>
            </h2>

            {/* Foto Utama */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-sport font-black uppercase tracking-wider text-neutral-900">
                  Foto Utama Produk <span className="text-rose-500">*</span>
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[10px] font-sport font-bold uppercase text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              {/* Upload Dropzone / File Picker */}
              {!imageUrl ? (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/20 transition-colors cursor-pointer group rounded-none">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 bg-neutral-200 group-hover:bg-amber-400 text-neutral-700 group-hover:text-neutral-950 flex items-center justify-center transition-colors mb-2 rounded-none">
                    <UploadCloud size={20} />
                  </div>
                  <span className="font-sport font-black text-xs uppercase tracking-wider text-neutral-900 group-hover:text-neutral-950 text-center">
                    Upload Foto Asli (Pilih File)
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 text-center">
                    Klik atau tarik file foto (JPG, PNG, WEBP)
                  </span>
                </label>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden border border-neutral-300 bg-neutral-100 rounded-none group">
                  <img
                    src={imageUrl}
                    alt="Foto Utama"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="px-3 py-1.5 bg-white text-neutral-950 text-xs font-sport font-black uppercase cursor-pointer hover:bg-amber-400 transition-colors rounded-none flex items-center gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageFileUpload}
                        className="hidden"
                      />
                      <Camera size={13} />
                      <span>Ganti Foto</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-sport font-black uppercase cursor-pointer hover:bg-rose-700 transition-colors rounded-none flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-neutral-950/80 text-amber-400 text-[9px] font-sport font-black uppercase tracking-wider">
                    Foto Utama
                  </span>
                </div>
              )}

              {/* Opsi alternatif input URL */}
              <div className="mt-2">
                <details className="text-xs group">
                  <summary className="cursor-pointer text-[10px] font-sport font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 select-none">
                    + Atau masukkan URL foto eksternal
                  </summary>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono rounded-none focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </details>
              </div>
            </div>

            {/* Galeri Foto Tambahan */}
            <div className="space-y-2 pt-3 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700">
                  Foto Galeri Tambahan ({galleryUrls.length})
                </label>
              </div>

              {/* Upload Multi-Files Dropzone */}
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/20 transition-colors cursor-pointer text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:text-neutral-950 rounded-none">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesUpload}
                  className="hidden"
                />
                <UploadCloud size={15} className="text-amber-500" />
                <span>+ Upload Foto Galeri Asli (Bisa Banyak)</span>
              </label>

              {/* URL input fallback */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newGalleryInput}
                  onChange={(e) => setNewGalleryInput(e.target.value)}
                  placeholder="Atau tempel URL foto..."
                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 font-mono rounded-none focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-amber-400 text-xs font-sport font-black uppercase transition-colors cursor-pointer rounded-none"
                >
                  Tambah
                </button>
              </div>

              {/* Gallery Thumbnails */}
              {galleryUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden border border-neutral-300 rounded-none group">
                      <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(idx)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-none"
                        title="Hapus foto ini"
                      >
                        <Trash2 size={14} className="text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility Card */}
          <div className="bg-white p-5 border border-neutral-300 rounded-none space-y-4">
            <h2 className="text-xs font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-2.5">
              <Eye size={15} className="text-amber-500" />
              <span>Status &amp; Visibilitas</span>
            </h2>

            <div>
              <label className="block text-[11px] font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Status Publikasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 px-3 text-xs font-sport font-black uppercase tracking-wider border transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-none ${
                    status === 'active' 
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                      : 'bg-neutral-50 text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-none inline-block ${status === 'active' ? 'bg-emerald-300' : 'bg-neutral-400'}`} />
                  <span>Aktif (Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`py-2 px-3 text-xs font-sport font-black uppercase tracking-wider border transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-none ${
                    status === 'inactive' 
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                      : 'bg-neutral-50 text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-none inline-block ${status === 'inactive' ? 'bg-amber-400' : 'bg-neutral-400'}`} />
                  <span>Nonaktif (Draft)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2.5 border-t border-neutral-200 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer p-2 hover:bg-neutral-50 border border-neutral-200 transition-colors rounded-none">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-sport font-bold uppercase text-[11px] text-neutral-900 block leading-tight">
                    Bebas Ongkir (Gratis Ongkir)
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Tampilkan badge bebas biaya pengiriman
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-2 hover:bg-neutral-50 border border-neutral-200 transition-colors rounded-none bg-neutral-50/50">
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-sport font-bold uppercase text-[11px] text-neutral-900 block leading-tight">
                    Tusko Pro (Official Flagship)
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Produk resmi prioritas bergaransi performa tinggi
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit('active')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>Simpan Perubahan</span>
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
