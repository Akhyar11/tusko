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
      if (params.search) searchParams.append('search', params.search);
      if (params.category_id) searchParams.append('category_id', params.category_id);
      if (params.category) searchParams.append('category', params.category);
      if (params.status) searchParams.append('status', params.status);
      if (params.active !== undefined) searchParams.append('active', params.active);
      if (params.stock_status) searchParams.append('stock_status', params.stock_status);
      if (params.min_price) searchParams.append('min_price', params.min_price);
      if (params.max_price) searchParams.append('max_price', params.max_price);
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.page) searchParams.append('page', params.page);
      if (params.per_page) searchParams.append('per_page', params.per_page);
      if (params.include_inactive) searchParams.append('include_inactive', '1');

      const queryString = searchParams.toString();
      const url = queryString ? `/api/products?${queryString}` : '/api/products';
      const res = await apiClient.get(url);

      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (list.length > 0) {
        setCachedProducts(list);
      }
      return {
        data: list,
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
