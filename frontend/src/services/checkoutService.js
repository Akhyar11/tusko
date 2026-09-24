/**
 * Checkout Service for Tusko Performance
 * Wrapper endpoint checkout server-side (`POST /api/checkout`).
 */

import { apiClient } from './apiClient';
import { getCartSessionId } from './cartService';

export const checkoutService = {
  /**
   * Buat pesanan dari item yang dipilih / keranjang aktif.
   * Server menghitung/menormalkan berat & menyimpan order + item.
   */
  async createOrder(payload = {}) {
    const response = await apiClient.post('/api/checkout', {
      ...payload,
      session_id: payload.session_id ?? getCartSessionId(),
    });

    return response;
  },

  /**
   * Ambil detail pesanan berdasarkan ID atau nomor pesanan.
   */
  async getOrder(idOrOrderNumber) {
    const response = await apiClient.get(`/api/orders/${idOrOrderNumber}`);
    return response.data;
  },
};
