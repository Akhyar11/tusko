import { apiClient } from './apiClient';

/**
 * Service: Master Role (T24.3) — CRUD roles (user -> role -> menu).
 */
function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  const search = params.search ?? params.searchQuery;
  if (search) qs.append('search', search);

  const name = params.name ?? params.nameSearchQuery;
  if (name) qs.append('name', name);

  const displayName = params.display_name ?? params.displayNameSearchQuery;
  if (displayName) qs.append('display_name', displayName);

  const isSystem = params.is_system ?? params.systemFilter;
  if (isSystem && isSystem !== 'all') {
    qs.append('is_system', isSystem === 'system' ? '1' : '0');
  }

  [['users_min', params.users_min ?? params.usersMin], ['users_max', params.users_max ?? params.usersMax],
   ['menus_min', params.menus_min ?? params.menusMin], ['menus_max', params.menus_max ?? params.menusMax]]
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.append(key, value);
    });

  const sortBy = params.sort_by ?? params.sortBy;
  if (sortBy) qs.append('sort_by', sortBy);

  const sortDir = params.sort_dir ?? params.sortDirection ?? params.order;
  if (sortDir) qs.append('sort_dir', sortDir);

  qs.append('page', params.page || 1);
  qs.append('per_page', params.per_page || params.limit || 15);

  return qs.toString();
}

export const roleService = {
  async fetchRoles(params = {}) {
    const res = await apiClient.get(`/api/admin/roles?${buildQuery(params)}`);
    const list = Array.isArray(res.data) ? res.data : [];

    return {
      data: list,
      total: res.total !== undefined ? res.total : list.length,
      meta: {
        current_page: res.current_page || params.page || 1,
        last_page: res.last_page || 1,
        per_page: res.per_page || params.limit || 15,
        total: res.total !== undefined ? res.total : list.length
      }
    };
  },

  async getRole(id) {
    const res = await apiClient.get(`/api/admin/roles/${id}`);
    return res?.data || null;
  },

  async createRole(payload) {
    const res = await apiClient.post('/api/admin/roles', payload);
    return res?.data || null;
  },

  async updateRole(id, payload) {
    const res = await apiClient.put(`/api/admin/roles/${id}`, payload);
    return res?.data || null;
  },

  async deleteRole(id) {
    return await apiClient.delete(`/api/admin/roles/${id}`);
  },

  async getRoleMenus(id) {
    const res = await apiClient.get(`/api/admin/roles/${id}/menus`);
    return res?.data || null;
  },

  async syncRoleMenus(id, menuIds) {
    const res = await apiClient.put(`/api/admin/roles/${id}/menus`, { menu_ids: menuIds });
    return res?.data || null;
  }
};
