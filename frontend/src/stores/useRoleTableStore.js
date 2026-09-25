import { createTableStore } from './createTableStore';
import { roleService } from '../services/roleService';

/**
 * Zustand Table Store untuk Master Role admin (T24.3).
 * Filter, pagination, limit, dan sorting dieksekusi 100% Server-Side.
 */
export const useRoleTableStore = createTableStore({
  name: 'RoleTable',
  fetchFn: (params) => roleService.fetchRoles(params),
  initialFilters: {
    searchQuery: '',
    nameSearchQuery: '',
    displayNameSearchQuery: '',
    systemFilter: 'all',
    usersMin: '',
    usersMax: '',
    menusMin: '',
    menusMax: ''
  },
  defaultSortBy: 'name',
  defaultSortDir: 'asc',
  defaultLimit: 15
});
