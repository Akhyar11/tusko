import { apiClient } from './apiClient';

/**
 * T42 — Profil toko publik (identitas bisnis, kontak, sosial, isi kebijakan),
 * seluruhnya dinamis dari Settings Hub.
 */
export const storeService = {
  async getStoreProfile() {
    try {
      const response = await apiClient.get('/api/store/profile');
      return response.data || {};
    } catch {
      return {};
    }
  },
};
