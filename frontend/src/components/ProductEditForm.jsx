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
  Ruler,
  ChevronDown,
  UploadCloud,
  Camera,
  Sparkles,
  Loader2,
  Tags,
  Boxes
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import FormTipsPanel from './organisms/FormTipsPanel';
import { generateProductSku, generateVariantSku } from '../data/mockProducts';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import FileInput from './molecules/FileInput';
import IconButton from './atoms/IconButton';
import ConfirmationModal from './ConfirmationModal';
import { categoryService } from '../services/categoryService';
import { vendorService } from '../services/vendorService';
import { productService } from '../services/productService';

const EMPTY_ARRAY = [];

export default function ProductEditForm({
  product = null,
  categories = EMPTY_ARRAY,
  vendors = EMPTY_ARRAY,
  products = EMPTY_ARRAY,
  onUpdateProduct = () => {},
  onCancel = () => {},
  onNavigateToCategories = () => {},
  onNavigateToSuppliers = () => {},
  onShowToast = () => {}
}) {
  const [categoryList, setCategoryList] = useState(categories);
  const [vendorList, setVendorList] = useState(vendors);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const handleNavigateToCategories = () => {
    setPendingNavigation('categories');
  };

  const handleNavigateToSuppliers = () => {
    if (onNavigateToSuppliers) {
      setPendingNavigation('suppliers');
    }
  };

  const confirmNavigation = () => {
    const dest = pendingNavigation;
    setPendingNavigation(null);
    if (dest === 'categories') {
      onNavigateToCategories();
    } else if (dest === 'suppliers') {
      onNavigateToSuppliers();
    }
  };

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryList(categories);
    } else {
      let isMounted = true;
      categoryService.fetchCategories().then(res => {
        if (isMounted && res?.data && res.data.length > 0) {
          setCategoryList(res.data);
        }
      }).catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [categories]);

  useEffect(() => {
    if (vendors && vendors.length > 0) {
      setVendorList(vendors);
    }
  }, [vendors]);

  useEffect(() => {
    if (!vendors || vendors.length === 0) {
      let isMounted = true;
      vendorService.fetchVendors().then(res => {
        if (isMounted && res?.data && res.data.length > 0) {
          setVendorList(res.data);
        }
      }).catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, []);
  if (!product) {
    return (
      <div className="p-8 text-center bg-white border border-neutral-200">
        <p className="text-sm font-bold text-neutral-700">Pilih produk yang ingin diedit.</p>
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
  const initialCategoryIds = Array.isArray(product.category_ids) && product.category_ids.length > 0
    ? product.category_ids
    : (Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories.map(c => c.id)
      : (product.category_id ? [product.category_id] : (categories[0]?.id ? [categories[0].id] : [])));
  const [categoryIds, setCategoryIds] = useState(initialCategoryIds);
  const primaryCategoryId = categoryIds[0] || product.category_id || categories[0]?.id || 1;
  const categoryId = primaryCategoryId;
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
  const [pointType, setPointType] = useState(product.point_type || 'manual');
  const [pointValue, setPointValue] = useState(
    product.point_value !== undefined && product.point_value !== null
      ? product.point_value
      : (product.reward_points !== undefined && product.reward_points !== null ? product.reward_points : 0)
  );
  const [stock, setStock] = useState(product.stock || 0);
  const [stockMinimum, setStockMinimum] = useState(product.stock_minimum || 5);

  // Images
  const [imageUrl, setImageUrl] = useState(product.image_url || '');
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState(() => {
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      return [...product.gallery];
    }
    return product.image_url ? [product.image_url] : [];
  });
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
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

  const calculatedRewardPoints = useMemo(() => {
    const numVal = Number(pointValue) || 0;
    const numPrice = Number(price) || 0;
    if (pointType === 'percentage') {
      return Math.round(numPrice * (numVal / 100));
    }
    return Math.round(numVal);
  }, [pointType, pointValue, price]);

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
    const origCatIds = Array.isArray(product.category_ids) && product.category_ids.length > 0
      ? product.category_ids
      : (Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories.map(c => c.id)
        : (product.category_id ? [product.category_id] : (categories[0]?.id ? [categories[0].id] : [])));
    setCategoryIds(origCatIds);
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
    setPointType(product.point_type || 'manual');
    setPointValue(
      product.point_value !== undefined && product.point_value !== null
        ? product.point_value
        : (product.reward_points !== undefined && product.reward_points !== null ? product.reward_points : 0)
    );
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

  // Image upload helpers (Uploads directly to Cloudflare R2 / backend storage)
  const handleMainImageFileUpload = async (fileOrEvent) => {
    const file = fileOrEvent?.target ? fileOrEvent.target.files?.[0] : fileOrEvent;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (typeof onShowToast === 'function') {
        onShowToast('File harus berupa gambar (JPG, PNG, WEBP, dll.)', { type: 'error' });
      }
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImageUrl(localPreview);

    try {
      setIsUploadingMainImage(true);
      const res = await productService.uploadImage(file);
      const uploadedUrl = res?.url || res?.data?.url || (typeof res === 'string' ? res : null);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
      }
    } catch (err) {
      console.warn('Upload gambar langsung gagal, fallback ke Data URL:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingMainImage(false);
    }
  };

  const handleGalleryFilesUpload = async (filesOrEvent) => {
    const files = Array.isArray(filesOrEvent)
      ? filesOrEvent
      : filesOrEvent?.target
      ? Array.from(filesOrEvent.target.files || [])
      : [filesOrEvent].filter(Boolean);
    if (files.length === 0) return;

    try {
      setIsUploadingGallery(true);
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const res = await productService.uploadImage(file);
          const uploadedUrl = res?.url || res?.data?.url || (typeof res === 'string' ? res : null);
          if (uploadedUrl) {
            setGalleryUrls(prev => [...prev, uploadedUrl]);
          }
        } catch (err) {
          console.warn('Upload gambar galeri gagal, fallback ke Data URL:', err);
          const reader = new FileReader();
          reader.onload = (event) => {
            setGalleryUrls(prev => [...prev, event.target.result]);
          };
          reader.readAsDataURL(file);
        }
      }
    } finally {
      setIsUploadingGallery(false);
    }
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
      if (typeof onShowToast === 'function') onShowToast('Nama produk wajib diisi!', { type: 'error' });
      return;
    }

    if (!categoryIds || categoryIds.length === 0) {
      if (typeof onShowToast === 'function') onShowToast('Pilih minimal satu kategori produk!', { type: 'error' });
      return;
    }

    if (isSkuDuplicate) {
      if (typeof onShowToast === 'function') onShowToast(`Kode SKU "${sku.trim().toUpperCase()}" sudah digunakan oleh produk lain! Harap gunakan SKU yang unik.`, { type: 'error' });
      return;
    }

    if (hasVariants && variantsList.length > 0) {
      for (let i = 0; i < variantsList.length; i++) {
        const v = variantsList[i];
        const vSku = (v.sku || '').trim().toUpperCase();
        const key = v.id || i;
        const st = variantSkuStatusMap[key];
        if (!vSku) {
          if (typeof onShowToast === 'function') onShowToast(`Varian "${v.name || `Baris ${i + 1}`}" belum memiliki Kode SKU!`, { type: 'error' });
          return;
        }
        if (st && st.isDuplicate) {
          if (typeof onShowToast === 'function') onShowToast(`Kode SKU "${vSku}" pada varian "${v.name || `Baris ${i + 1}`}" tidak unik (${st.message})! Setiap varian wajib memiliki SKU unik.`, { type: 'error' });
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
      category_id: Number(categoryIds[0] || categoryId),
      category_ids: categoryIds.map(id => Number(id)),
      categories: (categories || categoryList || []).filter(c => categoryIds.some(id => Number(id) === Number(c.id))),
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
      point_type: pointType,
      point_value: Number(pointValue) || 0,
      stock: Number(stock) || 0,
      stock_minimum: Number(stockMinimum) || 5,
      image_url: imageUrl.trim(),
      gallery: galleryUrls.length > 0 ? galleryUrls : (imageUrl.trim() ? [imageUrl.trim()] : []),
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

      {/* Form Content (3/4 form + 1/4 tips) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Informasi Dasar */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Package size={16} className="text-amber-500" />
              <span>1. Informasi Dasar Produk</span>
            </h2>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Nama Lengkap Produk <span className="text-rose-500">*</span>
              </label>
              <TextInput
                type="text"
                value={name}
                onChange={setName}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900 whitespace-nowrap">
                    Kategori Produk (Bisa Pilih Lebih Dari Satu) <span className="text-rose-500">*</span>
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
                  isMulti={true}
                  value={categoryIds}
                  onChange={(val) => setCategoryIds(val)}
                  loadOptions={categoryService.loadOptions.bind(categoryService)}
                  options={categoryList.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Pilih satu atau beberapa kategori produk..."
                  scrollPadding={35}
                />
                {categoryList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-neutral-400 font-sport uppercase tracking-wider">Kategori Cepat:</span>
                    {categoryList.slice(0, 6).map(c => {
                      const isSelected = categoryIds.some(id => Number(id) === Number(c.id));
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setCategoryIds(categoryIds.filter(id => Number(id) !== Number(c.id)));
                            } else {
                              setCategoryIds([...categoryIds, c.id]);
                            }
                          }}
                          className={`px-2 py-0.5 text-[10px] font-sport uppercase tracking-wider rounded-none border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          {isSelected ? `✓ ${c.name}` : `+ ${c.name}`}
                        </button>
                      );
                    })}
                  </div>
                )}
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
              <TextInput
                type="text"
                weight="mono"
                value={sku}
                onChange={(val) => setSku(val.toUpperCase())}
                placeholder="TSK-CAT-PROD-001"
                className={
                  isSkuDuplicate
                    ? '!border-rose-500 !bg-rose-50/50 text-rose-950 focus:!border-rose-600'
                    : sku.trim()
                    ? '!border-emerald-500 !bg-emerald-50/30 text-neutral-950 focus:!border-emerald-600'
                    : ''
                }
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
              <TextArea
                rows={4}
                value={description}
                onChange={setDescription}
                placeholder="Jelaskan keunggulan performa, teknologi kain, dan petunjuk perawatan..."
                className="leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Penentuan Harga & Alokasi Stok */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
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
                  <TextInput
                    type="number"
                    min="0"
                    value={price}
                    onChange={setPrice}
                    placeholder="0"
                    required
                    prefix="Rp"
                    weight="mono"
                  />
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
                  <TextInput
                    type="number"
                    min="0"
                    value={originalPrice}
                    onChange={setOriginalPrice}
                    placeholder="0"
                    prefix="Rp"
                    weight="mono"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Tampil dicoret jika sedang masa promo
                  </span>
                </div>

                {/* 3. Harga Modal Beli / HPP */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Harga Modal Beli / HPP
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={setCostPrice}
                    placeholder="0"
                    prefix="Rp"
                    weight="mono"
                  />
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

              {/* Reward Poin Pembeli (Loyalty Points) */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-none space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-neutral-950 text-amber-400 font-sport font-black text-xs flex items-center justify-center rounded-none">
                        ★
                      </div>
                      <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-950">
                        Skema Reward Poin Pembeli
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Tentukan reward poin loyalitas yang didapatkan pembeli untuk setiap 1 unit produk ini.
                    </p>
                  </div>

                  {/* Selector Tipe Poin: Manual vs Persentase */}
                  <div className="inline-flex border border-neutral-300 bg-white p-0.5 rounded-none self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPointType('manual')}
                      className={`px-3 py-1 text-xs font-sport font-black uppercase tracking-wider transition-all rounded-none cursor-pointer ${
                        pointType === 'manual'
                          ? 'bg-neutral-950 text-amber-400 shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      Poin Manual / Tetap
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointType('percentage')}
                      className={`px-3 py-1 text-xs font-sport font-black uppercase tracking-wider transition-all rounded-none cursor-pointer ${
                        pointType === 'percentage'
                          ? 'bg-neutral-950 text-amber-400 shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      Persentase Harga Jual (%)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      {pointType === 'percentage' ? 'Persentase Poin dari Harga Jual' : 'Nominal Poin Tetap per Unit'}
                    </label>
                    <TextInput
                      type="number"
                      step={pointType === 'percentage' ? '0.1' : '1'}
                      min="0"
                      value={pointValue}
                      onChange={setPointValue}
                      placeholder={pointType === 'percentage' ? 'contoh: 2 (untuk 2%)' : 'contoh: 50'}
                      suffix={pointType === 'percentage' ? '%' : 'PTS'}
                      weight="bold"
                    />
                  </div>

                  {/* Live Estimation Badge */}
                  <div className="sm:col-span-6 bg-white p-2.5 border border-dashed border-amber-400/80 rounded-none flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-sport font-bold uppercase tracking-wider text-neutral-500">
                        Estimasi Perolehan Pembeli:
                      </div>
                      <div className="font-mono font-black text-sm text-neutral-950 flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">+{calculatedRewardPoints.toLocaleString('id-ID')} PTS</span>
                        <span className="text-[11px] font-normal text-neutral-500">/ unit</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-sport text-neutral-500 max-w-[140px] leading-tight hidden sm:block">
                      {pointType === 'percentage'
                        ? `${pointValue || 0}% dari Rp ${(Number(price) || 0).toLocaleString('id-ID')}`
                        : 'Reward flat per unit'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pemisah Manajemen Stok Fisik */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Stok Fisik — Read-only, dikelola via PO/GRN */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Total Stok Fisik
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    value={stock}
                    disabled={true}
                    readOnly
                    weight="mono"
                  />
                  <div className="mt-1.5 flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-none">
                    <span className="text-amber-700 text-[10px] leading-tight">
                      🔒 Dikelola via Purchase Order (PO) — Penambahan &amp; pengurangan stok hanya dilakukan melalui alur PO &amp; GRN.
                    </span>
                  </div>
                </div>

                {/* Batas Stok Minimum */}
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Batas Stok Minimum (Safety Stock)
                  </label>
                  <TextInput
                    type="number"
                    min="1"
                    value={stockMinimum}
                    onChange={setStockMinimum}
                    placeholder="5"
                    weight="mono"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Peringatan otomatis muncul saat sisa stok &le; batas minimum ini
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Varian & Matriks Varian */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Grid size={16} className="text-amber-500" />
                <span>3. Matriks Varian Produk</span>
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                  <Checkbox
                    checked={hasVariants}
                    onChange={setHasVariants}
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
                            <TextInput
                              type="text"
                              weight="bold"
                              value={v.name || `${v.color || ''} ${v.size ? '/ ' + v.size : ''}`.trim() || `Varian ${idx + 1}`}
                              onChange={(val) => handleUpdateVariant(idx, 'name', val)}
                              placeholder="cth: Merah / XL atau 10 kg"
                              className="text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div>
                              <TextInput
                                type="text"
                                weight="mono"
                                value={v.sku || ''}
                                onChange={(val) => handleUpdateVariant(idx, 'sku', val.toUpperCase())}
                                placeholder="TSK-PRD-VAR-01"
                                className={`px-2 py-1 text-xs ${
                                  isDup
                                    ? '!border-rose-500 !bg-rose-50/50 text-rose-950 focus:!border-rose-600'
                                    : isUniq
                                    ? '!border-emerald-500 !bg-emerald-50/20 text-neutral-950 focus:!border-emerald-600'
                                    : ''
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
                          <TextInput
                            type="number"
                            weight="mono"
                            value={v.price || 0}
                            onChange={(val) => handleUpdateVariant(idx, 'price', val)}
                            className="w-28 text-right font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <TextInput
                            type="number"
                            weight="mono"
                            value={v.stock || 0}
                            disabled={true}
                            readOnly
                            title="Stok dikelola via Purchase Order (PO) & GRN"
                            className="w-20 text-right"
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
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
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
                <TextInput
                  type="number"
                  min="0"
                  step={weightUnit === 'kg' ? '0.1' : '1'}
                  value={weightValue}
                  onChange={setWeightValue}
                  placeholder={weightUnit === 'kg' ? '0.5' : '500'}
                  weight="bold"
                  className="flex-1"
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
                      <TextInput
                        type="number"
                        min="0"
                        value={dimLength}
                        onChange={setDimLength}
                        placeholder="40"
                        className="font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sport font-bold uppercase text-neutral-700 mb-1">
                        Lebar (cm)
                      </label>
                      <TextInput
                        type="number"
                        min="0"
                        value={dimWidth}
                        onChange={setDimWidth}
                        placeholder="30"
                        className="font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sport font-bold uppercase text-neutral-700 mb-1">
                        Tinggi (cm)
                      </label>
                      <TextInput
                        type="number"
                        min="0"
                        value={dimHeight}
                        onChange={setDimHeight}
                        placeholder="20"
                        className="font-semibold"
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
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
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
                  <div className="w-1/3">
                    <TextInput
                      type="text"
                      weight="bold"
                      value={spec.key}
                      onChange={(val) => handleUpdateSpec(idx, 'key', val)}
                      placeholder="Nama Parameter (cth: Bobot)"
                    />
                  </div>
                  <div className="flex-1">
                    <TextInput
                      type="text"
                      value={spec.value}
                      onChange={(val) => handleUpdateSpec(idx, 'value', val)}
                      placeholder="Nilai Spesifikasi (cth: 120 gram)"
                    />
                  </div>
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
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
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
                <FileInput
                  accept="image/*"
                  onChange={handleMainImageFileUpload}
                >
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/20 transition-colors cursor-pointer group rounded-none">
                    <div className="w-10 h-10 bg-neutral-200 group-hover:bg-amber-400 text-neutral-700 group-hover:text-neutral-950 flex items-center justify-center transition-colors mb-2 rounded-none">
                      <UploadCloud size={20} />
                    </div>
                    <span className="font-sport font-black text-xs uppercase tracking-wider text-neutral-900 group-hover:text-neutral-950 text-center">
                      Upload Foto Asli (Pilih File)
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-0.5 text-center">
                      Klik atau tarik file foto (JPG, PNG, WEBP)
                    </span>
                  </div>
                </FileInput>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden border border-neutral-300 bg-neutral-100 rounded-none group">
                  <img
                    src={imageUrl}
                    alt="Foto Utama"
                    className="w-full h-full object-cover"
                  />
                  {isUploadingMainImage && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white z-10">
                      <Loader2 size={24} className="animate-spin text-amber-400" />
                      <span className="text-[11px] font-sport font-black uppercase tracking-wider text-amber-400">
                        Menyimpan ke Storage...
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <FileInput
                      accept="image/*"
                      onChange={handleMainImageFileUpload}
                    >
                      <div className="px-3 py-1.5 bg-white text-neutral-950 text-xs font-sport font-black uppercase cursor-pointer hover:bg-amber-400 transition-colors rounded-none flex items-center gap-1.5">
                        <Camera size={13} />
                        <span>Ganti Foto</span>
                      </div>
                    </FileInput>
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
                    <TextInput
                      type="url"
                      weight="mono"
                      value={imageUrl}
                      onChange={setImageUrl}
                      placeholder="https://images.unsplash.com/..."
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
              <FileInput
                accept="image/*"
                multiple
                onChange={handleGalleryFilesUpload}
              >
                <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/20 transition-colors cursor-pointer text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:text-neutral-950 rounded-none">
                  {isUploadingGallery ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-amber-500" />
                      <span className="text-amber-600">Mengunggah galeri ke storage...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} className="text-amber-500" />
                      <span>+ Upload Foto Galeri Asli (Bisa Banyak)</span>
                    </>
                  )}
                </div>
              </FileInput>

              {/* URL input fallback */}
              <div className="flex gap-1.5 items-center">
                <div className="flex-1">
                  <TextInput
                    type="text"
                    weight="mono"
                    value={newGalleryInput}
                    onChange={setNewGalleryInput}
                    placeholder="Atau tempel URL foto..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 text-amber-400 text-xs font-sport font-black uppercase transition-colors cursor-pointer rounded-none shrink-0"
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
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
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
                <Checkbox
                  checked={freeShipping}
                  onChange={setFreeShipping}
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
                <Checkbox
                  checked={isOfficial}
                  onChange={setIsOfficial}
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

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Edit Produk"
          tips={[
            { icon: Package, heading: 'Nama Produk Deskriptif', text: 'Pastikan nama tetap jelas dan konsisten, mis. merek + jenis + teknologi kain agar mudah ditemukan pembeli.' },
            { icon: Tags, heading: 'Kategori Multi-Pilih', text: 'Perbarui kategori bila produk masuk lini baru; boleh memilih lebih dari satu agar muncul di banyak etalase.' },
            { icon: ImageIcon, heading: 'Foto Utama & Galeri', text: 'Ganti foto utama bila visual lama usang dan tambah foto galeri dari sudut berbeda untuk meyakinkan pembeli.' },
            { icon: DollarSign, heading: 'Harga vs Harga Coret', text: 'Ubah harga jual bila biaya berubah; isi harga coret lebih tinggi hanya saat promo agar badge diskon muncul.' },
            { icon: Boxes, heading: 'SKU Otomatis & Stok Minimum', text: 'Jaga keunikan SKU induk dan varian; sesuaikan stok minimum sebagai batas pengingat restok gudang.' },
            { icon: Eye, heading: 'Status Publikasi', text: 'Nonaktifkan sementara bila stok habis atau produk direvisi, lalu aktifkan kembali saat siap dijual.' }
          ]}
        />
      </div>

      {/* Modal Konfirmasi Navigasi Saat Form Kotor */}
      <ConfirmationModal
        isOpen={!!pendingNavigation}
        onClose={() => setPendingNavigation(null)}
        onConfirm={confirmNavigation}
        title="Perubahan Belum Disimpan"
        subtitle="Perubahan form edit produk belum tersimpan ke server."
        message={`Apakah Anda yakin ingin beralih ke halaman ${pendingNavigation === 'categories' ? 'Master Kategori' : 'Master Supplier'}? Perubahan yang belum disimpan akan hilang.`}
        confirmText="Beralih Halaman"
        cancelText="Tetap di Form"
        variant="warning"
      />
    </div>
  );
}
