export const categories = [];

export const mockProducts = [];

/**
 * Helper: Generate guaranteed unique product SKU
 * Format: TSK-[CAT]-[NAME]-[001, 002, ...] with collision prevention
 */
export function generateProductSku(categorySlug = 'gen', name = '', existingProducts = []) {
  const catCode = (categorySlug || 'GEN').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'GEN';
  const nameCode = (name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD';
  const prefix = `TSK-${catCode}-${nameCode}`;

  // Build a Set of all existing SKUs from passed products and localStorage
  const existingSet = new Set();
  if (Array.isArray(existingProducts)) {
    existingProducts.forEach(p => {
      if (p?.sku) existingSet.add(p.sku.toUpperCase());
      if (Array.isArray(p?.variants)) {
        p.variants.forEach(v => {
          if (v?.sku) existingSet.add(v.sku.toUpperCase());
        });
      }
    });
  }

  try {
    const stored = JSON.parse(localStorage.getItem('tusko_products') || '[]');
    if (Array.isArray(stored)) {
      stored.forEach(p => {
        if (p?.sku) existingSet.add(p.sku.toUpperCase());
        if (Array.isArray(p?.variants)) {
          p.variants.forEach(v => {
            if (v?.sku) existingSet.add(v.sku.toUpperCase());
          });
        }
      });
    }
  } catch (_) {}

  // Find next available sequence number starting from 001
  let seq = 1;
  let candidate = `${prefix}-${seq.toString().padStart(3, '0')}`;
  
  while (existingSet.has(candidate)) {
    seq++;
    if (seq <= 999) {
      candidate = `${prefix}-${seq.toString().padStart(3, '0')}`;
    } else {
      candidate = `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
      if (!existingSet.has(candidate)) break;
    }
  }

  return candidate;
}

/**
 * Helper: Generate guaranteed unique variant SKU
 * Format: [baseSku]-[ATTR1]-[ATTR2] with collision prevention
 */
export function generateVariantSku(baseSku = 'TSK-PRD', attributes = [], existingProducts = [], takenSkus = new Set()) {
  const cleanBase = (baseSku || 'TSK-PRD').trim().toUpperCase();

  // Format attribute suffix (e.g. "MERA-S")
  let suffix = '';
  if (Array.isArray(attributes)) {
    suffix = attributes
      .map(val => String(val || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase())
      .filter(Boolean)
      .join('-');
  } else if (typeof attributes === 'string') {
    suffix = attributes.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  }

  const rawCandidate = suffix ? `${cleanBase}-${suffix}` : `${cleanBase}-VAR`;

  // Build a Set of all existing SKUs from passed products, takenSkus, and localStorage
  const existingSet = new Set();
  if (cleanBase) existingSet.add(cleanBase);
  if (takenSkus instanceof Set) {
    takenSkus.forEach(s => {
      if (s) existingSet.add(String(s).toUpperCase());
    });
  }

  if (Array.isArray(existingProducts)) {
    existingProducts.forEach(p => {
      if (p?.sku) existingSet.add(p.sku.toUpperCase());
      if (Array.isArray(p?.variants)) {
        p.variants.forEach(v => {
          if (v?.sku) existingSet.add(v.sku.toUpperCase());
        });
      }
    });
  }

  try {
    const stored = JSON.parse(localStorage.getItem('tusko_products') || '[]');
    if (Array.isArray(stored)) {
      stored.forEach(p => {
        if (p?.sku) existingSet.add(p.sku.toUpperCase());
        if (Array.isArray(p?.variants)) {
          p.variants.forEach(v => {
            if (v?.sku) existingSet.add(v.sku.toUpperCase());
          });
        }
      });
    }
  } catch (_) {}

  // If rawCandidate is unique, return it immediately
  if (!existingSet.has(rawCandidate.toUpperCase())) {
    return rawCandidate.toUpperCase();
  }

  // Otherwise, append sequential suffix: -01, -02, etc.
  let counter = 1;
  let candidate = `${rawCandidate}-${String(counter).padStart(2, '0')}`;
  while (existingSet.has(candidate.toUpperCase())) {
    counter++;
    if (counter <= 99) {
      candidate = `${rawCandidate}-${String(counter).padStart(2, '0')}`;
    } else {
      candidate = `${rawCandidate}-${Date.now().toString(36).toUpperCase().slice(-3)}${Math.floor(10 + Math.random() * 90)}`;
      if (!existingSet.has(candidate.toUpperCase())) break;
    }
  }

  return candidate.toUpperCase();
}

/**
 * Helper: Add new mock product to state list
 */
export function createMockProduct(productData) {
  const newId = Date.now();
  const sku = productData.sku || generateProductSku(productData.slug || 'prd', productData.name);
  const slug = productData.slug || (productData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Calculate total stock from variants if provided
  let calculatedStock = productData.stock || 0;
  if (Array.isArray(productData.variants) && productData.variants.length > 0) {
    calculatedStock = productData.variants.reduce((total, v) => total + (Number(v.stock) || 0), 0);
  }

  return {
    id: newId,
    category_id: Number(productData.category_id) || null,
    vendor_id: Number(productData.vendor_id) || null,
    vendor_name: productData.vendor_name || null,
    sku,
    name: productData.name || 'Produk Baru Tanpa Nama',
    slug,
    description: productData.description || 'Deskripsi produk belum diisi.',
    price: Number(productData.price) || 0,
    original_price: Number(productData.original_price) || Number(productData.price) || 0,
    cost_price: Number(productData.cost_price) || Math.round((Number(productData.price) || 0) * 0.6),
    discount_percentage: productData.original_price > productData.price
      ? Math.round(((productData.original_price - productData.price) / productData.original_price) * 100)
      : 0,
    weight: Number(productData.weight) || 250,
    stock: calculatedStock,
    stock_minimum: Number(productData.stock_minimum) || 5,
    status: productData.status || 'active',
    active: productData.status !== 'inactive',
    image_url: productData.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    gallery: productData.gallery?.length ? productData.gallery : [
      productData.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: productData.specifications || {},
    variant_levels: productData.variant_levels || [],
    variants: productData.variants || [],
    rating: 5.0,
    rating_count: 0,
    sold_count: 0,
    location: productData.location || 'Jakarta Barat',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: Boolean(productData.free_shipping),
    created_at: new Date().toISOString()
  };
}

/**
 * Helper: Update mock product
 */
export function updateMockProduct(productList, id, updatedData) {
  return productList.map((item) => {
    if (item.id === id) {
      const merged = { ...item, ...updatedData };
      if (updatedData.variants) {
        merged.stock = updatedData.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
      }
      if (updatedData.status) {
        merged.active = updatedData.status === 'active';
      }
      return merged;
    }
    return item;
  });
}

/**
 * Helper: Delete mock product
 */
export function deleteMockProduct(productList, id) {
  return productList.filter((item) => item.id !== id);
}

/**
 * Helper: Toggle mock product active status
 */
export function toggleMockProductStatus(productList, id) {
  return productList.map((item) => {
    if (item.id === id) {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      return {
        ...item,
        status: nextStatus,
        active: nextStatus === 'active'
      };
    }
    return item;
  });
}

/**
 * Helper: Filter mock products
 */
export function filterMockProducts(productList, {
  query = '',
  categoryId = null,
  status = 'all', // 'all' | 'active' | 'inactive'
  minPrice = null,
  maxPrice = null,
  sortBy = 'relevant'
} = {}) {
  return productList.filter((prod) => {
    // Search query
    if (query) {
      const q = query.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSku = prod.sku?.toLowerCase().includes(q);
      const matchDesc = prod.description?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchDesc) return false;
    }

    // Category
    if (categoryId && prod.category_id !== Number(categoryId)) {
      return false;
    }

    // Status
    if (status !== 'all') {
      if (status === 'active' && prod.status !== 'active') return false;
      if (status === 'inactive' && prod.status !== 'inactive') return false;
    }

    // Price range
    if (minPrice && prod.price < Number(minPrice)) return false;
    if (maxPrice && prod.price > Number(maxPrice)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'lowest_price') return a.price - b.price;
    if (sortBy === 'highest_price') return b.price - a.price;
    if (sortBy === 'highest_rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'most_sold') return (b.sold_count || 0) - (a.sold_count || 0);
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return 0; // relevant
  });
}
