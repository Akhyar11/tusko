import { apiClient } from './apiClient';

/**
 * Service: Master Users (T38.3) — CRUD akun pengguna + assign role (T38.2).
 */
function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  const search = params.search ?? params.searchQuery;
  if (search) qs.append('search', search);

  const name = params.name ?? params.nameSearchQuery;
  if (name) qs.append('name', name);

  const email = params.email ?? params.emailSearchQuery;
  if (email) qs.append('email', email);

  const phone = params.phone ?? params.phoneSearchQuery;
  if (phone) qs.append('phone', phone);

  const role = params.role ?? params.roleFilter;
  if (role && role !== 'all') qs.append('role', role);

  const roleId = params.role_id ?? params.roleIdFilter;
  if (roleId && roleId !== 'all') qs.append('role_id', roleId);

  const status = params.is_active ?? params.statusFilter;
  if (status !== undefined && status !== null && status !== '' && status !== 'all') {
    const isActive = status === true || status === 'active' || status === '1' || status === 1;
    qs.append('is_active', isActive ? '1' : '0');
  }

  const verified = params.email_verified ?? params.verifiedFilter;
  if (verified && verified !== 'all') {
    qs.append('email_verified', verified === 'verified' ? '1' : '0');
  }

  const sortBy = params.sort_by ?? params.sortBy;
  if (sortBy) qs.append('sort_by', sortBy);

  const sortDir = params.sort_dir ?? params.sortDirection ?? params.order;
  if (sortDir) qs.append('sort_dir', sortDir);

  qs.append('page', params.page || 1);
  qs.append('per_page', params.per_page || params.limit || 15);

  return qs.toString();
}

export const userService = {
  async fetchUsers(params = {}) {
    const res = await apiClient.get(`/api/admin/users?${buildQuery(params)}`);
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

  async getUser(id) {
    const res = await apiClient.get(`/api/admin/users/${id}`);
    return res?.data || null;
  },

  async createUser(payload) {
    const res = await apiClient.post('/api/admin/users', payload);
    return res?.data || null;
  },

  async updateUser(id, payload) {
    const res = await apiClient.put(`/api/admin/users/${id}`, payload);
    return res?.data || null;
  },

  async deleteUser(id) {
    return await apiClient.delete(`/api/admin/users/${id}`);
  },

  async assignRoles(id, roleIds) {
    const res = await apiClient.post(`/api/admin/users/${id}/roles`, { role_ids: roleIds });
    return res?.data || null;
  },

  async fetchRoleOptions() {
    const res = await apiClient.get('/api/admin/menus/role-options');
    return Array.isArray(res?.data) ? res.data : [];
  }
};
