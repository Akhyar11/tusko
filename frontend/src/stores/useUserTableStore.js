import { createTableStore } from './createTableStore';
import { userService } from '../services/userService';

/**
 * Zustand Table Store untuk Master Users admin (T38.3).
 * Filter, pagination, limit, dan sorting dieksekusi 100% Server-Side.
 */
export const useUserTableStore = createTableStore({
  name: 'UserTable',
  fetchFn: (params) => userService.fetchUsers(params),
  initialFilters: {
    searchQuery: '',
    nameSearchQuery: '',
    emailSearchQuery: '',
    phoneSearchQuery: '',
    roleFilter: 'all',
    roleIdFilter: 'all',
    statusFilter: 'all',
    verifiedFilter: 'all'
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 15
});
