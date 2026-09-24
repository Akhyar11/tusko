/**
 * Service: Settings (Admin Settings Hub) API Client — T36.8
 * Mengakses registry pengaturan sistem per grup (nilai rahasia dimask oleh server).
 */
import { apiClient } from './apiClient';

export const settingsService = {
  /**
   * Daftar seluruh grup pengaturan beserta nilainya (secret dimask).
   */
  async listGroups() {
    const res = await apiClient.get('/api/admin/settings');
    return res.data || res;
  },

  /**
   * Detail satu grup pengaturan (nilai + metadata field registry).
   */
  async getGroup(group) {
    const res = await apiClient.get(`/api/admin/settings/${group}`);
    return res.data || res;
  },

  /**
   * Simpan nilai satu grup.
   */
  async updateGroup(group, values) {
    const res = await apiClient.put(`/api/admin/settings/${group}`, values);
    return res.data || res;
  },

  /**
   * Uji koneksi satu grup (shipping/payment/storage/notification).
   */
  async testConnection(group) {
    const res = await apiClient.post(`/api/admin/settings/${group}/test-connection`);
    return res.data || res;
  }
};
