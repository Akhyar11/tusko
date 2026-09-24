/**
 * Cart Service for Tusko Performance
 * Wrapper 5 endpoint keranjang Laravel Sanctum, mendukung keranjang guest
 * (session_id) maupun keranjang akun (Bearer token).
 */

import { apiClient } from './apiClient';

export const CART_SESSION_KEY = 'tusko_cart_session';

/**
 * Ambil (atau buat) session_id keranjang guest yang persisten.
 */
export function getCartSessionId() {
  try {
    let sessionId = localStorage.getItem(CART_SESSION_KEY);
    if (!sessionId) {
      const random = Math.random().toString(36).slice(2, 10);
      sessionId = `sess_${Date.now()}_${random}`;
      localStorage.setItem(CART_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return null;
  }
}

function sessionHeaders() {
  const sessionId = getCartSessionId();
  return sessionId ? { 'X-Session-ID': sessionId } : {};
}

export const cartService = {
  getSessionId: getCartSessionId,

  /**
   * GET /api/cart — konten keranjang + total.
   */
  async getCart() {
    const response = await apiClient.get('/api/cart', { headers: sessionHeaders() });
    return response.data;
  },

  /**
   * POST /api/cart/items — tambah produk (atau naikkan jumlah).
   */
  async addItem({ productId, quantity = 1, notes = null, productVariantId = null }) {
    const response = await apiClient.post(
      '/api/cart/items',
      {
        product_id: productId,
        product_variant_id: productVariantId,
        quantity,
        notes,
        session_id: getCartSessionId(),
      },
      { headers: sessionHeaders() }
    );

    return { message: response.message, cart: response.data };
  },

  /**
   * PUT /api/cart/items/{id} — ubah jumlah/catatan item.
   */
  async updateItem(id, { quantity, notes = null }) {
    const response = await apiClient.put(
      `/api/cart/items/${id}`,
      {
        quantity,
        notes,
        session_id: getCartSessionId(),
      },
      { headers: sessionHeaders() }
    );

    return { message: response.message, cart: response.data };
  },

  /**
   * DELETE /api/cart/items/{id} — hapus satu item.
   */
  async removeItem(id) {
    const response = await apiClient.delete(`/api/cart/items/${id}`, {
      headers: sessionHeaders(),
    });

    return { message: response.message, cart: response.data };
  },

  /**
   * DELETE /api/cart/clear — kosongkan seluruh keranjang.
   */
  async clearCart() {
    const response = await apiClient.delete('/api/cart/clear', {
      headers: sessionHeaders(),
    });

    return { message: response.message, cart: response.data };
  },
};
