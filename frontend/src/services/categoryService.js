/**
 * Service: Category Master API Client
 * Manages server-side category CRUD and options loader for ServerSideSelect.
 */
import { apiClient } from './apiClient';
import { categories as fallbackCategories } from '../data/mockProducts';

const STORAGE_KEY = 'tusko_categories_cache';

// Initialize cache with fallback if not present
function getCachedCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallbackCategories;
}

function setCachedCategories(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const categoryService = {
  /**
   * Fetch categories from server-side with optional search and pagination.
   */
  async fetchCategories({ search = '', all = true, page = 1, perPage = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (all) params.append('all', '1');
      else {
        params.append('page', page);
        params.append('per_page', perPage);
      }

      const res = await apiClient.get(`/api/categories?${params.toString()}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      setCachedCategories(list);
      return {
        data: list,
        total: res.total || list.length
      };
    } catch (err) {
      console.warn('categoryService.fetchCategories: using cached/fallback data.', err.message);
      let list = getCachedCategories();
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(c => c.name.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q));
      }
      return {
        data: list,
        total: list.length
      };
    }
  },

  /**
   * Create a new category on the server.
   */
  async createCategory(categoryData) {
    try {
      const res = await apiClient.post('/api/categories', categoryData);
      const newCat = res.data;
      const current = getCachedCategories();
      setCachedCategories([...current, newCat]);
      return newCat;
    } catch (err) {
      console.warn('categoryService.createCategory offline fallback:', err.message);
      const current = getCachedCategories();
      const newCat = {
        id: Date.now(),
        name: categoryData.name,
        slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        icon: categoryData.icon || 'Tag',
        description: categoryData.description || '',
        products_count: 0
      };
      setCachedCategories([...current, newCat]);
      return newCat;
    }
  },

  /**
   * Update category on the server.
   */
  async updateCategory(id, categoryData) {
    try {
      const res = await apiClient.put(`/api/categories/${id}`, categoryData);
      const updated = res.data;
      const current = getCachedCategories();
      setCachedCategories(current.map(c => c.id === id ? { ...c, ...updated } : c));
      return updated;
    } catch (err) {
      console.warn('categoryService.updateCategory offline fallback:', err.message);
      const current = getCachedCategories();
      const updated = { ...categoryData, id };
      setCachedCategories(current.map(c => c.id === id ? { ...c, ...updated } : c));
      return updated;
    }
  },

  /**
   * Delete category on the server.
   */
  async deleteCategory(id) {
    try {
      await apiClient.delete(`/api/categories/${id}`);
      const current = getCachedCategories();
      setCachedCategories(current.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.warn('categoryService.deleteCategory offline fallback:', err.message);
      const current = getCachedCategories();
      setCachedCategories(current.filter(c => c.id !== id));
      return true;
    }
  },

  /**
   * Server-side options loader formatted for ServerSideSelect.
   * @param {string} searchQuery
   * @param {number} pageNum
   * @returns {Promise<{ options: Array, hasMore: boolean }>}
   */
  async loadOptions(searchQuery = '', pageNum = 1) {
    const { data } = await this.fetchCategories({
      search: searchQuery,
      all: true
    });

    const pageSize = 15;
    const startIndex = (pageNum - 1) * pageSize;
    const sliced = data.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < data.length;

    return {
      options: sliced.map(c => ({
        value: c.id,
        label: c.name,
        slug: c.slug,
        icon: c.icon,
        products_count: c.products_count ?? 0
      })),
      hasMore
    };
  }
};
