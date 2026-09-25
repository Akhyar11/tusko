import { apiClient } from './apiClient';

/**
 * Service: Master Menu & Akses Role (T37.6)
 * Integrasi REST API backend Laravel untuk CRUD menu + assign menu ke role.
 */
function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  const search = params.search ?? params.searchQuery;
  if (search) qs.append('search', search);

  const pathSearch = params.pathSearch ?? params.pathSearchQuery;
  if (pathSearch) qs.append('pathSearch', pathSearch);

  const viewSearch = params.viewSearch ?? params.viewSearchQuery;
  if (viewSearch) qs.append('viewSearch', viewSearch);

  const sectionSearch = params.sectionSearch ?? params.sectionSearchQuery;
  if (sectionSearch) qs.append('sectionSearch', sectionSearch);

  const environment = params.environment ?? params.environmentFilter;
  if (environment && environment !== 'all') qs.append('environment', environment);

  const role = params.role_id ?? params.roleFilter;
  if (role && role !== 'all') qs.append('role_id', role);

  const status = params.is_active ?? params.statusFilter;
  if (status !== undefined && status !== null && status !== '' && status !== 'all') {
    const isActive = status === true || status === 'active' || status === '1' || status === 1;
    qs.append('is_active', isActive ? '1' : '0');
  }

  const featureFlag = params.feature_flag ?? params.featureFlagFilter;
  if (featureFlag && featureFlag !== 'all') {
    qs.append('feature_flag', featureFlag === 'with' ? '1' : '0');
  }

  const sortOrderMin = params.sort_order_min ?? params.sortOrderMin;
  if (sortOrderMin !== undefined && sortOrderMin !== null && sortOrderMin !== '') {
    qs.append('sort_order_min', sortOrderMin);
  }

  const sortOrderMax = params.sort_order_max ?? params.sortOrderMax;
  if (sortOrderMax !== undefined && sortOrderMax !== null && sortOrderMax !== '') {
    qs.append('sort_order_max', sortOrderMax);
  }

  const sortBy = params.sort_by ?? params.sortBy;
  if (sortBy) qs.append('sort_by', sortBy);

  const sortDir = params.sort_dir ?? params.sortDirection ?? params.order;
  if (sortDir) qs.append('sort_dir', sortDir);

  const page = params.page || 1;
  const perPage = params.per_page || params.limit || 10;
  qs.append('page', page);
  qs.append('per_page', perPage);

  return qs.toString();
}

export const menuService = {
  async fetchMenus(params = {}) {
    const res = await apiClient.get(`/api/admin/menus?${buildQuery(params)}`);
    const list = Array.isArray(res.data) ? res.data : [];

    return {
      data: list,
      total: res.total !== undefined ? res.total : list.length,
      meta: {
        current_page: res.current_page || params.page || 1,
        last_page: res.last_page || 1,
        per_page: res.per_page || params.limit || 10,
        total: res.total !== undefined ? res.total : list.length
      }
    };
  },

  async getMenu(id) {
    const res = await apiClient.get(`/api/admin/menus/${id}`);
    return res?.data || null;
  },

  async createMenu(payload) {
    const res = await apiClient.post('/api/admin/menus', payload);
    return res?.data || null;
  },

  async updateMenu(id, payload) {
    const res = await apiClient.put(`/api/admin/menus/${id}`, payload);
    return res?.data || null;
  },

  async deleteMenu(id) {
    return await apiClient.delete(`/api/admin/menus/${id}`);
  },

  async toggleStatus(id) {
    const res = await apiClient.post(`/api/admin/menus/${id}/toggle-status`);
    return res?.data || null;
  },

  async fetchRoleOptions() {
    const res = await apiClient.get('/api/admin/menus/role-options');
    return Array.isArray(res?.data) ? res.data : [];
  }
};
