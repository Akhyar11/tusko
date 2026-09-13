import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2,
  DollarSign, 
  Sparkles, 
  Save, 
  FileText, 
  Eye,
  Grid,
  X,
  FolderKanban,
  Building2,
  Scale,
  Ruler,
  ChevronDown,
  UploadCloud,
  Camera
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { createMockProduct, generateProductSku, generateVariantSku } from '../data/mockProducts';
import ServerSideSelect from './molecules/ServerSideSelect';
import IconButton from './atoms/IconButton';
import CategoryMasterModal from './organisms/CategoryMasterModal';
import { categoryService } from '../services/categoryService';
import { vendorService } from '../services/vendorService';
export default function ProductCreateForm({
  categories = [],
  vendors = [],
  products = [],
  onSaveProduct = () => {},
  onCancel = () => {},
  onNavigateToCategories = () => {},
  onNavigateToSuppliers = () => {}
}) {
  // Basic Information (Starts Clean / Blank)
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [isCategoryMasterOpen, setIsCategoryMasterOpen] = useState(false);
  const [categoryList, setCategoryList] = useState(categories);
  const [vendorList, setVendorList] = useState(vendors);

  const handleNavigateToCategories = () => {
    if (onNavigateToCategories) {
      if (name.trim() || price || description.trim()) {
        if (!window.confirm('Form produk belum disimpan. Apakah Anda yakin ingin beralih ke halaman Master Kategori? Data yang belum disimpan akan hilang.')) {
          return;
        }
      }
      onNavigateToCategories();
    } else {
      setIsCategoryMasterOpen(true);
    }
  };

  const handleNavigateToSuppliers = () => {
    if (onNavigateToSuppliers) {
      if (name.trim() || price || description.trim()) {
        if (!window.confirm('Form produk belum disimpan. Apakah Anda yakin ingin beralih ke halaman Master Supplier? Data yang belum disimpan akan hilang.')) {
          return;
        }
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
  const [sku, setSku] = useState('');

  // ── Weight System ──────────────────────────────────────────────────────────
  // weightValue: angka yang diinput admin (bisa gram atau kg)
  // weightUnit : 'g' | 'kg'
  // weightGrams: nilai final dalam gram yang dikirim ke backend
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');
  const [showDimensions, setShowDimensions] = useState(false);
  const [dimLength, setDimLength] = useState(''); // cm
  const [dimWidth, setDimWidth] = useState('');   // cm
  const [dimHeight, setDimHeight] = useState(''); // cm

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

  // Nested Multi-Attribute Variant Matrix (Fully Dynamic Attributes)
  const [hasVariants, setHasVariants] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState([
    { id: 'attr_1', name: 'Warna', values: '' },
    { id: 'attr_2', name: 'Ukuran', values: '' }
  ]);
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

  // Variant Attribute Management
  const handleAddVariantAttribute = () => {
    setVariantAttributes(prev => [
      ...prev,
      { id: `attr_${Date.now()}`, name: '', values: '' }
    ]);
  };

  const handleUpdateVariantAttribute = (id, field, val) => {
    setVariantAttributes(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  const handleRemoveVariantAttribute = (id) => {
    setVariantAttributes(prev => prev.filter(a => a.id !== id));
  };

  // Calculated preview of combinations
  const combinationEstimate = useMemo(() => {
    const counts = variantAttributes
      .map(a => a.values.split(',').map(v => v.trim()).filter(Boolean).length)
      .filter(c => c > 0);
    if (counts.length === 0) return 0;
    return counts.reduce((acc, c) => acc * c, 1);
  }, [variantAttributes]);

  const [removedRowNames, setRemovedRowNames] = useState(new Set());

  // Auto-generate / sync Matrix rows reactively when variantAttributes change
  useEffect(() => {
    if (!hasVariants) {
      setVariantMatrix([]);
      setRemovedRowNames(new Set());
      return;
    }

    const activeAttrs = variantAttributes
      .map(a => ({
        name: a.name.trim(),
        options: a.values.split(',').map(v => v.trim()).filter(Boolean)
      }))
      .filter(a => a.name && a.options.length > 0);

    if (activeAttrs.length === 0) {
      setVariantMatrix([]);
      return;
    }

    // Cartesian product helper for N arrays
    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(a => curr.map(b => [...a, b]));
      }, [[]]);
    };

    const combinations = cartesian(activeAttrs.map(a => a.options));
    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const catCode = (selectedCat?.slug || selectedCat?.name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD';
    const nameCode = (name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PROD';
    const effectiveBaseSku = sku.trim() || `TSK-${catCode}-${nameCode}`;

    const numPrice = Number(price) || 0;
    const numStock = Number(stock) || 0;
    const distributedStock = combinations.length > 0 && numStock > 0
      ? Math.max(1, Math.floor(numStock / combinations.length))
      : 1;

    setVariantMatrix(prev => {
      const prevMap = new Map();
      prev.forEach(r => {
        if (r.name) prevMap.set(r.name, r);
      });

      const takenMatrixSkus = new Set();
      if (effectiveBaseSku) takenMatrixSkus.add(effectiveBaseSku.toUpperCase());

      return combinations
        .filter(combo => !removedRowNames.has(combo.join(' / ')))
        .map((combo, idx) => {
          const comboName = combo.join(' / ');

          const attrValues = {};
          activeAttrs.forEach((attr, i) => {
            const key = attr.name.toLowerCase();
            let code = key.replace(/[^a-z0-9]/g, '_');
            if (key.includes('warna') || key.includes('color')) code = 'color';
            if (key.includes('ukuran') || key.includes('size')) code = 'size';
            attrValues[code] = combo[i];
          });

          const existing = prevMap.get(comboName);
          if (existing && existing.sku) {
            takenMatrixSkus.add(existing.sku.toUpperCase());
            return {
              ...existing,
              ...attrValues,
              attribute_values: attrValues,
              color: attrValues.color || existing.color,
              size: attrValues.size || existing.size
            };
          }

          const uniqueVariantSku = generateVariantSku(effectiveBaseSku, combo, products, takenMatrixSkus);
          takenMatrixSkus.add(uniqueVariantSku);

          return {
            id: existing?.id || `vm_${Date.now()}_${idx + 1}`,
            sku: uniqueVariantSku,
            name: comboName,
            price: existing?.price !== undefined ? existing.price : numPrice,
            stock: existing?.stock !== undefined ? existing.stock : distributedStock,
            color: attrValues.color || undefined,
            size: attrValues.size || undefined,
            ...attrValues,
            attribute_values: attrValues
          };
        });
    });
  }, [hasVariants, variantAttributes, sku, price, stock, removedRowNames, categoryId, categories, categoryList, name, products]);

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
    setVariantMatrix(prev => {
      const target = prev.find(r => r.id === rowId);
      if (target && target.name) {
        setRemovedRowNames(prevSet => new Set([...prevSet, target.name]));
      }
      return prev.filter(r => r.id !== rowId);
    });
  };

  // SKU Uniqueness validation check for Parent SKU
  const isSkuDuplicate = useMemo(() => {
    if (!sku.trim()) return false;
    const upper = sku.trim().toUpperCase();
    return (products || []).some(p => {
      if (p.sku && p.sku.toUpperCase() === upper) return true;
      if (Array.isArray(p.variants) && p.variants.some(v => v.sku && v.sku.toUpperCase() === upper)) return true;
      return false;
    });
  }, [sku, products]);

  // Set of all other SKUs across catalog & other products
  const globalOtherSkus = useMemo(() => {
    const set = new Set();
    if (sku.trim()) set.add(sku.trim().toUpperCase());
    (products || []).forEach(p => {
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
  }, [sku, products]);

  // Validation status map for each row in variant matrix
  const matrixSkuStatusMap = useMemo(() => {
    const counts = {};
    variantMatrix.forEach(r => {
      const s = (r.sku || '').trim().toUpperCase();
      if (s) {
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    const statusMap = {};
    variantMatrix.forEach(r => {
      const s = (r.sku || '').trim().toUpperCase();
      if (!s) {
        statusMap[r.id] = { isDuplicate: false, isEmpty: true, message: 'SKU wajib diisi' };
      } else if (counts[s] > 1) {
        statusMap[r.id] = { isDuplicate: true, message: 'Duplikat di varian lain' };
      } else if (s === (sku || '').trim().toUpperCase()) {
        statusMap[r.id] = { isDuplicate: true, message: 'Sama dengan SKU Induk' };
      } else if (globalOtherSkus.has(s)) {
        statusMap[r.id] = { isDuplicate: true, message: 'Dipakai produk/varian lain' };
      } else {
        statusMap[r.id] = { isDuplicate: false, isUnique: true };
      }
    });
    return statusMap;
  }, [variantMatrix, globalOtherSkus, sku]);

  const hasDuplicateVariantSku = useMemo(() => {
    return Object.values(matrixSkuStatusMap).some(st => st.isDuplicate || st.isEmpty);
  }, [matrixSkuStatusMap]);

  // Regenerate all variant SKUs to be guaranteed unique
  const handleRegenerateAllVariantSkus = () => {
    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const catCode = (selectedCat?.slug || selectedCat?.name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD';
    const nameCode = (name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PROD';
    const effectiveBaseSku = sku.trim() || `TSK-${catCode}-${nameCode}`;

    const takenSkus = new Set();
    if (effectiveBaseSku) takenSkus.add(effectiveBaseSku.toUpperCase());

    setVariantMatrix(prev => prev.map(row => {
      const attrs = row.attribute_values ? Object.values(row.attribute_values) : row.name.split(' / ');
      const newSku = generateVariantSku(effectiveBaseSku, attrs, products, takenSkus);
      takenSkus.add(newSku);
      return {
        ...row,
        sku: newSku
      };
    }));
  };

  // Auto generate guaranteed unique Parent SKU
  const handleGenerateSku = () => {
    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const generated = generateProductSku(selectedCat?.slug || selectedCat?.name || 'prd', name || 'PROD', products);
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

  // Fill Quick Demo Data
  const handleFillDemoData = () => {
    setName('Tusko AirSprint Lightweight Carbon Marathon Singlet');
    setCategoryId(5); // Running
    setSku('TSK-RUN-SGL-2026');
    setWeightValue('95');
    setWeightUnit('g');
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
    setVariantAttributes([
      { id: 'attr_1', name: 'Warna', values: 'Neon Volt, Arctic White, Shadow Black' },
      { id: 'attr_2', name: 'Ukuran', values: 'S, M, L, XL' }
    ]);
    setVariantMatrix([
      { id: 'vm_1', sku: 'TSK-RUN-SGL-VOLT-S', name: 'Neon Volt / S', color: 'Neon Volt', size: 'S', price: 229000, stock: 15, attribute_values: { color: 'Neon Volt', size: 'S' } },
      { id: 'vm_2', sku: 'TSK-RUN-SGL-VOLT-M', name: 'Neon Volt / M', color: 'Neon Volt', size: 'M', price: 229000, stock: 20, attribute_values: { color: 'Neon Volt', size: 'M' } },
      { id: 'vm_3', sku: 'TSK-RUN-SGL-WHT-L', name: 'Arctic White / L', color: 'Arctic White', size: 'L', price: 229000, stock: 15, attribute_values: { color: 'Arctic White', size: 'L' } },
      { id: 'vm_4', sku: 'TSK-RUN-SGL-BLK-XL', name: 'Shadow Black / XL', color: 'Shadow Black', size: 'XL', price: 239000, stock: 10, attribute_values: { color: 'Shadow Black', size: 'XL' } }
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
    if (isSkuDuplicate) {
      setErrorMessage(`Kode SKU "${sku.trim().toUpperCase()}" sudah terdaftar pada produk lain. Setiap produk wajib memiliki SKU unik!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (hasVariants && variantMatrix.length > 0) {
      for (const row of variantMatrix) {
        const rowSku = (row.sku || '').trim().toUpperCase();
        if (!rowSku) {
          setErrorMessage(`Varian "${row.name}" belum memiliki Kode SKU Turunan!`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const st = matrixSkuStatusMap[row.id];
        if (st && st.isDuplicate) {
          setErrorMessage(`Kode SKU Turunan "${rowSku}" pada varian "${row.name}" tidak unik (${st.message})! Setiap varian wajib memiliki SKU unik.`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }
    setErrorMessage('');

    // Build specifications dictionary
    const specificationsObj = {};
    specList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specificationsObj[item.key.trim()] = item.value.trim();
      }
    });

    // Build variants & levels dynamically
    let variants = [];
    let variantLevels = [];
    if (hasVariants) {
      const activeAttrs = variantAttributes
        .map(a => ({
          name: a.name.trim(),
          options: a.values.split(',').map(v => v.trim()).filter(Boolean)
        }))
        .filter(a => a.name && a.options.length > 0);

      variantLevels = activeAttrs.map(attr => {
        const key = attr.name.toLowerCase();
        let code = key.replace(/[^a-z0-9]/g, '_');
        if (key.includes('warna') || key.includes('color')) code = 'color';
        if (key.includes('ukuran') || key.includes('size')) code = 'size';
        return {
          name: attr.name,
          code,
          options: attr.options
        };
      });

      variants = variantMatrix.map((r, idx) => ({
        id: r.id || `v_${idx + 1}`,
        sku: r.sku,
        name: r.name,
        price: Number(r.price) || numPrice,
        stock: Number(r.stock) || 0,
        ...r.attribute_values,
        color: r.color || (r.attribute_values && r.attribute_values.color) || undefined,
        size: r.size || (r.attribute_values && r.attribute_values.size) || undefined
      }));
    }

    const selectedCat = (categories || []).find(c => c.id === Number(categoryId)) || (categoryList || []).find(c => c.id === Number(categoryId));
    const selectedVendor = (vendorList || []).find(v => v.id === Number(vendorId));
    const newProduct = createMockProduct({
      name: name.trim(),
      category_id: Number(categoryId),
      vendor_id: Number(vendorId) || null,
      vendor_name: selectedVendor?.company_name || null,
      sku: sku.trim() || generateProductSku(selectedCat?.slug || selectedCat?.name || 'prd', name, products),
      weight: weightGrams || 250,
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
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Tambah Produk &amp; Varian Baru
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
                placeholder="Jelaskan keunggulan performa, teknologi kain, dan petunjuk perawatan..."
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

          {/* Section 3: Nested Variant Matrix Generator */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Grid size={16} className="text-amber-500" />
                <span>3. Generator Matriks Varian Bertingkat</span>
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
                {/* Daftar Dimensi Atribut Dinamis */}
                <div className="space-y-3">
                  {variantAttributes.map((attr, index) => (
                    <div
                      key={attr.id}
                      className="bg-neutral-50 p-4 border border-neutral-300 rounded-none space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sport font-black uppercase tracking-wider text-neutral-900 text-[11px] flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-neutral-950 text-amber-400 font-mono flex items-center justify-center text-[10px]">
                            {index + 1}
                          </span>
                          <span>Tipe Varian {index + 1}</span>
                        </span>
                        {variantAttributes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantAttribute(attr.id)}
                            className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title="Hapus tipe varian ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                            Nama Tipe Varian:
                          </label>
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => handleUpdateVariantAttribute(attr.id, 'name', e.target.value)}
                            placeholder="cth: Warna, Ukuran, Berat, Rasa"
                            className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-sport font-bold uppercase tracking-wider text-neutral-700 mb-1">
                            Pilihan Nilai / Opsi (Pisahkan dengan koma):
                          </label>
                          <input
                            type="text"
                            value={attr.values}
                            onChange={(e) => handleUpdateVariantAttribute(attr.id, 'values', e.target.value)}
                            placeholder={
                              attr.name.toLowerCase().includes('warna')
                                ? 'Triple Black, Crimson Red, Navy Blue'
                                : attr.name.toLowerCase().includes('ukuran')
                                ? 'S, M, L, XL atau 39, 40, 41, 42'
                                : attr.name.toLowerCase().includes('berat')
                                ? '2.5 kg, 5 kg, 10 kg, 20 kg'
                                : attr.name.toLowerCase().includes('rasa')
                                ? 'Cokelat, Vanila, Stroberi'
                                : 'Opsi 1, Opsi 2, Opsi 3'
                            }
                            className="w-full px-3 py-2 bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-semibold rounded-none"
                          />
                          <p className="text-[10px] text-neutral-500 mt-1">
                            Masukkan beberapa pilihan nilai dipisahkan tanda koma.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tombol Tambah Tipe Varian & Info Kombinasi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2">
                  <button
                    type="button"
                    onClick={handleAddVariantAttribute}
                    className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 font-sport font-black uppercase text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-none self-start"
                  >
                    <Plus size={13} />
                    <span>Tambah Tipe Varian Baru</span>
                  </button>

                  {variantMatrix.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-neutral-600 font-medium">
                        Total <strong className="text-neutral-950 font-bold">{variantMatrix.length} kombinasi varian</strong> otomatis dibuat
                      </span>
                      <button
                        type="button"
                        onClick={handleRegenerateAllVariantSkus}
                        className="text-[11px] font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                        title="Perbarui seluruh SKU varian agar otomatis serasi dan 100% unik"
                      >
                        <Sparkles size={12} />
                        <span>Sinkronkan SKU Unik</span>
                      </button>
                    </div>
                  )}
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
                        {variantMatrix.map((row) => {
                          const st = matrixSkuStatusMap[row.id];
                          const isDup = st?.isDuplicate;
                          const isUniq = st?.isUnique;
                          const isEmpty = st?.isEmpty;
                          return (
                            <tr key={row.id} className="hover:bg-neutral-50">
                              <td className="py-2 px-3 font-bold text-neutral-950">
                                {row.name}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.sku}
                                  onChange={(e) => handleUpdateMatrixRow(row.id, 'sku', e.target.value.toUpperCase())}
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
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                {/* Unit Toggle Buttons */}
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
              {/* Konversi Live */}
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
                className="flex items-center gap-2 text-xs font-sport font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 cursor-pointer group"
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

        {/* Right 1 Column: Media & Visibilitas */}
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

          {/* Visibility & Badges Card */}
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
