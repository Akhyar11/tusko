import { apiClient } from './apiClient';

/**
 * Service: Dashboard BI admin (T19.2) — ringkasan agregat + cache.
 */
export const dashboardService = {
  async fetchSummary() {
    const res = await apiClient.get('/api/dashboard/summary');
    return res?.data || null;
  }
};
