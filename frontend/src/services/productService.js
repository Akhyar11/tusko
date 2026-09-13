/**
 * Service: Product Master & Catalog API Client
 * Manages server-side product fetching, CRUD operations, status toggling, and caching.
 */
import { apiClient } from './apiClient';

const STORAGE_KEY = 'tusko_products';

function getCachedProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function setCachedProducts(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const productService = {
  /**
   * Fetch products from server with optional filtering, search, and pagination.
   */
  async fetchProducts(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      const search = params.search || params.searchName;
      if (search) searchParams.append('search', search);

      const sku = params.sku || params.searchSku;
      if (sku) searchParams.append('sku', sku);

      const catId = params.category_id || params.category;
      if (catId && catId !== 'all') searchParams.append('category_id', catId);

      const status = params.status;
      if (status && status !== 'all') searchParams.append('status', status);

      if (params.active !== undefined && params.active !== 'all') searchParams.append('active', params.active);

      const stockStatus = params.stock_status || params.stockCondition;
      if (stockStatus && stockStatus !== 'all') searchParams.append('stock_status', stockStatus);

      const minPrice = params.min_price || params.minPrice;
      if (minPrice !== undefined && minPrice !== '') searchParams.append('min_price', minPrice);

      const maxPrice = params.max_price || params.maxPrice;
      if (maxPrice !== undefined && maxPrice !== '') searchParams.append('max_price', maxPrice);

      const sortBy = params.sort_by || params.sortBy;
      if (sortBy) searchParams.append('sort_by', sortBy);

      const sortDir = params.sort_direction || params.sortDirection || params.order;
      if (sortDir) searchParams.append('sort_direction', sortDir);

      const page = params.page || 1;
      searchParams.append('page', page);

      const perPage = params.per_page || params.limit || 10;
      searchParams.append('per_page', perPage);

      if (params.include_inactive !== undefined) {
        searchParams.append('include_inactive', params.include_inactive ? '1' : '0');
      } else {
        searchParams.append('include_inactive', '1');
      }

      const queryString = searchParams.toString();
      const url = queryString ? `/api/products?${queryString}` : '/api/products';
      const res = await apiClient.get(url);

      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (list.length > 0) {
        setCachedProducts(list);
      }
      return {
        data: list,
        total: res.meta?.total !== undefined ? res.meta.total : list.length,
        summary: res.summary || null,
        meta: res.meta || null,
      };
    } catch (err) {
      console.warn('productService.fetchProducts: using cached products.', err.message);
      let list = getCachedProducts();
      return {
        data: list,
        summary: null,
        meta: { total: list.length },
      };
    }
  },

  /**
   * Fetch a single product by ID or slug.
   */
  async getProduct(idOrSlug) {
    try {
      const res = await apiClient.get(`/api/products/${idOrSlug}`);
      return res.data || res;
    } catch (err) {
      console.warn('productService.getProduct: falling back to cached product.', err.message);
      const list = getCachedProducts();
      return list.find(p => String(p.id) === String(idOrSlug) || p.slug === idOrSlug) || null;
    }
  },

  /**
   * Create a new product.
   */
  async createProduct(data) {
    const res = await apiClient.post('/api/products', data);
    const created = res.data || res;
    const current = getCachedProducts();
    setCachedProducts([created, ...current]);
    return created;
  },

  /**
   * Update an existing product.
   */
  async updateProduct(idOrSlug, data) {
    const res = await apiClient.put(`/api/products/${idOrSlug}`, data);
    const updated = res.data || res;
    const current = getCachedProducts();
    setCachedProducts(current.map(p => (String(p.id) === String(idOrSlug) || p.slug === idOrSlug ? updated : p)));
    return updated;
  },

  /**
   * Delete a product.
   */
  async deleteProduct(idOrSlug) {
    await apiClient.delete(`/api/products/${idOrSlug}`);
    const current = getCachedProducts();
    setCachedProducts(current.filter(p => String(p.id) !== String(idOrSlug) && p.slug !== idOrSlug));
    return true;
  },

  /**
   * Toggle product active/status.
   */
  async toggleProductStatus(idOrSlug) {
    const res = await apiClient.post(`/api/products/${idOrSlug}/toggle-status`);
    const toggled = res.data || res;
    const current = getCachedProducts();
    setCachedProducts(current.map(p => (String(p.id) === String(idOrSlug) || p.slug === idOrSlug ? toggled : p)));
    return toggled;
  },
};
