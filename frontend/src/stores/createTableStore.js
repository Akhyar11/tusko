import { create } from 'zustand';

/**
 * Standard Server-Side Table Zustand Store Factory
 * 
 * Mengelola state filter, pagination, limit, dan sorting terpusat untuk tabel data
 * dengan eksekusi 100% Server-Side (tidak ada client-side slice, in-memory filter, atau sort).
 *
 * @param {Object} config
 * @param {Function} config.fetchFn - Async function (params) => Promise<{ data: [], total: number, meta?: {}, summary?: {} }>
 * @param {Object} [config.initialFilters] - Objek filter default (misal { search: '', status: 'all', ... })
 * @param {string} [config.defaultSortBy] - Kolom sort default (default: 'created_at')
 * @param {string} [config.defaultSortDir] - Arah sort default ('desc' | 'asc')
 * @param {number} [config.defaultLimit] - Limit baris per halaman (default: 10)
 * @param {string} [config.name] - Nama entitas untuk debugging/logging
 */
export function createTableStore({
  fetchFn,
  initialFilters = {},
  defaultSortBy = 'created_at',
  defaultSortDir = 'desc',
  defaultLimit = 10,
  name = 'table'
}) {
  return create((set, get) => ({
    // Query State
    page: 1,
    limit: defaultLimit,
    sortBy: defaultSortBy,
    sortDirection: defaultSortDir,
    filters: { ...initialFilters },

    // Data State (Directly from Server)
    data: [],
    total: 0,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: defaultLimit,
      total: 0
    },
    summary: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,

    // Actions
    setPage: (newPage) => {
      const currentPage = get().page;
      if (newPage === currentPage) return;
      set({ page: newPage });
      get().fetchData();
    },

    setLimit: (newLimit) => {
      const currentLimit = get().limit;
      if (Number(newLimit) === Number(currentLimit)) return;
      set({ limit: Number(newLimit), page: 1 });
      get().fetchData();
    },

    setSort: (sortBy, sortDirection) => {
      const state = get();
      const nextDir = sortDirection || (state.sortBy === sortBy && state.sortDirection === 'asc' ? 'desc' : 'asc');
      set({ sortBy, sortDirection: nextDir, page: 1 });
      get().fetchData();
    },

    setFilter: (key, value) => {
      const currentFilters = get().filters;
      if (currentFilters[key] === value) return;
      set({
        filters: { ...currentFilters, [key]: value },
        page: 1
      });
      get().fetchData();
    },

    setFilters: (newFilters) => {
      const currentFilters = get().filters;
      set({
        filters: { ...currentFilters, ...newFilters },
        page: 1
      });
      get().fetchData();
    },

    resetFilters: () => {
      set({
        filters: { ...initialFilters },
        page: 1,
        sortBy: defaultSortBy,
        sortDirection: defaultSortDir
      });
      get().fetchData();
    },

    fetchData: async (overrideParams = {}) => {
      if (!fetchFn) return;
      set({ isLoading: true, error: null });

      const state = get();
      const queryParams = {
        page: state.page,
        per_page: state.limit,
        limit: state.limit,
        sort_by: state.sortBy,
        sort_direction: state.sortDirection,
        order: state.sortDirection,
        ...state.filters,
        ...overrideParams
      };

      try {
        const response = await fetchFn(queryParams);
        const records = Array.isArray(response?.data) 
          ? response.data 
          : (Array.isArray(response) ? response : []);
        
        const serverMeta = response?.meta || {
          current_page: state.page,
          per_page: state.limit,
          total: response?.total !== undefined ? response.total : records.length,
          last_page: Math.max(1, Math.ceil((response?.total || records.length) / state.limit))
        };

        const totalCount = serverMeta.total !== undefined ? serverMeta.total : (response?.total || records.length);

        set({
          data: records,
          total: totalCount,
          meta: serverMeta,
          summary: response?.summary || null,
          isLoading: false,
          lastFetchedAt: Date.now()
        });

        return response;
      } catch (err) {
        console.error(`[${name}Store] Fetch error:`, err);
        set({
          isLoading: false,
          error: err?.message || 'Gagal memuat data dari server'
        });
        throw err;
      }
    },

    // Mutasi data lokal yang sudah disinkronkan dengan server (optimistic updates/refresh)
    setData: (newDataOrUpdater) => {
      set((state) => ({
        data: typeof newDataOrUpdater === 'function' ? newDataOrUpdater(state.data) : newDataOrUpdater
      }));
    }
  }));
}
