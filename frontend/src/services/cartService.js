import { apiClient, getStoredToken } from './apiClient';

const CART_SESSION_KEY = 'tusko_cart_session_id';

/**
 * Mendapatkan atau membuat session ID baru untuk tamu (guest).
 */
export function getCartSessionId() {
  try {
    let sessionId = localStorage.getItem(CART_SESSION_KEY);
    if (!sessionId) {
      sessionId = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem(CART_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return 'guest_fallback_session';
  }
}

/**
 * Menghapus session ID keranjang saat logout atau checkout selesai.
 */
export function clearCartSessionId() {
  try {
    localStorage.removeItem(CART_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Header dan parameter pendukung untuk request keranjang.
 */
function getCartParams() {
  const token = getStoredToken();
  const sessionId = getCartSessionId();
  return {
    headers: {
      'X-Session-ID': sessionId,
    },
    sessionId,
  };
}

export const cartService = {
  /**
   * Mengambil data keranjang aktif dari backend.
   */
  async getCart() {
    const { headers, sessionId } = getCartParams();
    const res = await apiClient.get(`/api/cart?session_id=${encodeURIComponent(sessionId)}`, { headers });
    return res.data;
  },

  /**
   * Menambahkan item ke keranjang di database backend.
   */
  async addItem(productId, quantity = 1, notes = '') {
    const { headers, sessionId } = getCartParams();
    const payload = {
      product_id: productId,
      quantity,
      notes: notes || null,
      session_id: sessionId,
    };
    const res = await apiClient.post('/api/cart/items', payload, { headers });
    return res.data;
  },

  /**
   * Memperbarui kuantitas atau catatan item keranjang.
   */
  async updateItem(itemId, quantity, notes = null) {
    const { headers, sessionId } = getCartParams();
    const payload = {
      quantity,
      session_id: sessionId,
      ...(notes !== null ? { notes } : {}),
    };
    const res = await apiClient.put(`/api/cart/items/${itemId}`, payload, { headers });
    return res.data;
  },

  /**
   * Menghapus item tertentu dari keranjang.
   */
  async removeItem(itemId) {
    const { headers, sessionId } = getCartParams();
    const res = await apiClient.delete(`/api/cart/items/${itemId}?session_id=${encodeURIComponent(sessionId)}`, { headers });
    return res.data;
  },

  /**
   * Mengosongkan seluruh keranjang.
   */
  async clearCart() {
    const { headers, sessionId } = getCartParams();
    const res = await apiClient.delete(`/api/cart/clear?session_id=${encodeURIComponent(sessionId)}`, { headers });
    return res.data;
  },
};
