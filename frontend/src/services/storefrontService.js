import { apiClient } from './apiClient';

/**
 * T43 — Konten storefront dinamis (navbar kategori + konten halaman).
 */
export const storefrontService = {
  /**
   * Pohon kategori untuk navbar (induk + sub), diatur admin.
   */
  async getNavbar() {
    try {
      const response = await apiClient.get('/api/storefront/navbar');
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Konten halaman depan (hero, popular, sports, promo, club, dsb) — dinamis.
   */
  async getContent() {
    try {
      const response = await apiClient.get('/api/storefront/content');
      return response.data || {};
    } catch {
      return {};
    }
  },
};
