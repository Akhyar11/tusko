import { apiClient } from './apiClient';

/**
 * Service untuk manajemen Gudang Pusat dan Label Kustom Tracking KiriminAja
 */
export const warehouseService = {
  /**
   * Mengambil data gudang pusat aktif dan daftar label checkpoint pelacakan KiriminAja
   */
  async getPrimaryWarehouse() {
    try {
      const res = await apiClient.get('/api/warehouses/primary');
      return res.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Mengambil seluruh daftar gudang
   */
  async getWarehouses() {
    try {
      const res = await apiClient.get('/api/warehouses');
      return res.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Memperbarui informasi gudang pusat
   */
  async updateWarehouse(id, payload) {
    const res = await apiClient.put(`/api/warehouses/${id}`, payload);
    return res.data;
  },

  /**
   * Menjadikan suatu gudang sebagai Gudang Pusat utama toko
   */
  async setPrimary(id) {
    const res = await apiClient.post(`/api/warehouses/${id}/set-primary`);
    return res.data;
  },

  /**
   * Memperbarui kustomisasi label respons pelacakan KiriminAja
   */
  async updateTrackingLabels(labels) {
    const res = await apiClient.post('/api/warehouses/tracking-labels', { labels });
    return res.data;
  }
};
