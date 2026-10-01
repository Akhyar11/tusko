/**
 * Checkout Service for Tusko Performance
 * Wrapper endpoint checkout server-side (`POST /api/checkout`).
 */

import { apiClient } from './apiClient';
import { getCartSessionId } from './cartService';

/**
 * Bangun path order TANPA meng-encode '/' menjadi %2F (Apache menolak encoded slash
 * -> 404). Setiap segmen di-encode, garis miring tetap sebagai pemisah path
 * sehingga route `/{idOrOrderNumber}` dengan `.*` tetap cocok (mendukung id maupun
 * order_number seperti INV/20260928/TK/123).
 */
function orderPath(ref) {
  return String(ref ?? '')
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

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
   * Ambil daftar rekening bank tujuan transfer manual (dinamis dari Admin, T07.2).
   */
  async getManualBanks() {
    const response = await apiClient.get('/api/payment-methods/manual-banks');
    return { data: response.data || [], configured: Boolean(response.configured) };
  },

  /**
   * Katalog metode pembayaran dinamis (T07.6).
   */
  async getPaymentMethods() {
    const response = await apiClient.get('/api/payment-methods');
    return response.data || {};
  },

  /**
   * Konfigurasi biaya checkout (publik) — T08.3/G6 (tanpa hardcode di FE).
   */
  async getCheckoutConfig() {
    const response = await apiClient.get('/api/checkout/config');
    return response.data || {};
  },

  /**
   * Validasi kupon server-authoritative (T08.2/T08.3).
   */
  async validateVoucher({ code, items = [], subtotal = null, appliedCodes = [], turnstileToken = null } = {}) {
    const response = await apiClient.post('/api/vouchers/validate', {
      code,
      items,
      subtotal,
      applied_codes: appliedCodes,
      cf_turnstile_response: turnstileToken || undefined,
    });
    return response.data;
  },

  /**
   * Kirim konfirmasi transfer manual + bukti (multipart) — T07.2.
   */
  async confirmManualPayment(orderRef, formData) {
    return await apiClient.post(`/api/orders/${orderPath(orderRef)}/confirm-payment`, formData);
  },

  /**
   * Ambil tarif pengiriman (layanan kurir) dari agregator yang dikonfigurasi admin.
   */
  async getShippingRates({ origin, destination, destinationDistrictCode, subdistrictDestination, destinationBiteshipAreaId, originBiteshipAreaId, destinationPostalCode, originPostalCode, weight, courier, length, width, height, itemName, itemValue, insurance } = {}) {
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (destinationDistrictCode) params.set('destination_district_code', destinationDistrictCode);
    if (subdistrictDestination) params.set('subdistrict_destination', String(subdistrictDestination));
    if (destinationBiteshipAreaId) params.set('destination_biteship_area_id', destinationBiteshipAreaId);
    if (originBiteshipAreaId) params.set('origin_biteship_area_id', originBiteshipAreaId);
    if (destinationPostalCode) params.set('destination_postal_code', destinationPostalCode);
    if (originPostalCode) params.set('origin_postal_code', originPostalCode);
    if (weight) params.set('weight', String(weight));
    if (courier) params.set('courier', courier);
    if (length) params.set('length', String(length));
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (itemName) params.set('item_name', itemName);
    if (itemValue) params.set('item_value', String(itemValue));
    if (insurance !== undefined && insurance !== null && insurance !== '') params.set('insurance', String(insurance));

    const response = await apiClient.get(`/api/shipping/rates?${params.toString()}`);
    return { data: response.data || [], provider: response.provider, configured: response.configured };
  },

  /**
   * T40.5: cari Area ID Biteship (proxy /v1/maps/areas).
   */
  async searchShippingAreas(search) {
    const params = new URLSearchParams({ search: String(search || '') });
    const response = await apiClient.get(`/api/shipping/areas?${params.toString()}`);
    return { data: response.data || [], configured: response.configured };
  },

  /**
   * T40.8: lacak pengiriman (riwayat Biteship) sebuah pesanan.
   */
  async getOrderTracking(idOrOrderNumber) {
    const response = await apiClient.get(`/api/orders/${orderPath(idOrOrderNumber)}/tracking`);
    return response.data;
  },

  /**
   * T40.7: buat order pengiriman Biteship untuk sebuah pesanan (admin).
   */
  async createBiteshipShipment(idOrOrderNumber) {
    return await apiClient.post(`/api/admin/orders/${orderPath(idOrOrderNumber)}/shipment`);
  },

  /**
   * Ambil layanan kurir lokal aktif (`expedition_services`) untuk fallback.
   */
  async getLocalShippingServices() {
    const response = await apiClient.get('/api/shipping/services');
    return response.data || [];
  },

  /**
   * T07.9: buat charge Core API (VA/Mandiri/QRIS) dan ambil instruksi bayar.
   */
  async chargeOrder(idOrOrderNumber, paymentMethod) {
    const response = await apiClient.post(
      `/api/orders/${orderPath(idOrOrderNumber)}/charge`,
      { payment_method: paymentMethod }
    );
    return response.data;
  },

  /**
   * T07.10: rekonsiliasi status pembayaran dari Midtrans (Cek Status).
   */
  async syncPaymentStatus(idOrOrderNumber) {
    const response = await apiClient.post(`/api/orders/${orderPath(idOrOrderNumber)}/sync-payment`);
    return response.data;
  },

  /**
   * Ambil detail pesanan berdasarkan ID atau nomor pesanan.
   */
  async getOrder(idOrOrderNumber) {
    const response = await apiClient.get(`/api/orders/${idOrOrderNumber}`);
    return response.data;
  },
};
