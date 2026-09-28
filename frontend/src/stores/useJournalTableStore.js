import { createTableStore } from './createTableStore';
import { reportService } from '../services/reportService';

/**
 * Zustand Table Store untuk Viewer Jurnal (T34.11).
 * Filter + pagination + sorting dieksekusi 100% Server-Side.
 */
export const useJournalTableStore = createTableStore({
  name: 'JournalTable',
  fetchFn: async (params) => {
    return await reportService.fetchJournalEntries(params);
  },
  initialFilters: {
    searchQuery: '',
    accountCode: 'all',
    startDate: '',
    endDate: '',
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 20,
});
