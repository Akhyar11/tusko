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
   * Ambil tarif pengiriman (layanan kurir) dari agregator yang dikonfigurasi admin.
   */
  async getShippingRates({ origin, destination, weight, courier } = {}) {
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (weight) params.set('weight', String(weight));
    if (courier) params.set('courier', courier);

    const response = await apiClient.get(`/api/shipping/rates?${params.toString()}`);
    return { data: response.data || [], provider: response.provider, configured: response.configured };
  },

  /**
   * Ambil detail pesanan berdasarkan ID atau nomor pesanan.
   */
  async getOrder(idOrOrderNumber) {
    const response = await apiClient.get(`/api/orders/${idOrOrderNumber}`);
    return response.data;
  },
};
