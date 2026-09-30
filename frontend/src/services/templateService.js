import { apiClient } from './apiClient';

/**
 * T45.3 — Template email/resi & log notifikasi (API-backed).
 */
export const templateService = {
  async getEmailTemplates() {
    const response = await apiClient.get('/api/templates/emails');
    return response.data || [];
  },

  async updateEmailTemplate(idOrKey, payload) {
    const response = await apiClient.put(`/api/templates/emails/${encodeURIComponent(idOrKey)}`, payload);
    return response.data || response;
  },

  async resetEmailTemplates() {
    const response = await apiClient.post('/api/templates/emails/reset');
    return response;
  },

  async getReceiptTemplate() {
    const response = await apiClient.get('/api/templates/receipt');
    return response.data || null;
  },

  async saveReceiptTemplate(payload) {
    const response = await apiClient.post('/api/templates/receipt', payload);
    return response.data || response;
  },

  async resetReceiptTemplate() {
    const response = await apiClient.post('/api/templates/receipt/reset');
    return response;
  },

  async getEmailLogs({ search = '', page = 1, perPage = 15 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    return await apiClient.get(`/api/admin/email-logs?${params.toString()}`);
  },
};
