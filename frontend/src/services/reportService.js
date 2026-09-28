import { apiClient, getStoredToken } from './apiClient';

/**
 * Layanan laporan keuangan & jurnal (T34.10-T34.12).
 * Seluruh angka berasal dari server (server-authoritative); FE tidak menghitung ulang.
 */
function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

async function downloadCsv(path, params, filename) {
  const token = getStoredToken();
  const url = `/api/${path}${buildQuery({ ...params, format: 'csv' })}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Gagal mengunduh CSV laporan.');
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

export const reportService = {
  async fetchChartOfAccounts() {
    const response = await apiClient.get('/api/chart-of-accounts');
    return response.data || [];
  },

  async fetchJournalEntries(params = {}) {
    const mapped = {
      page: params.page,
      per_page: params.per_page ?? params.limit,
      sort: params.sort_direction === 'asc' ? 'oldest' : 'latest',
      search: params.search || params.searchQuery,
      chart_of_account_id: params.chart_of_account_id,
      account_code: params.account_code || params.accountCode,
      start_date: params.start_date || params.startDate,
      end_date: params.end_date || params.endDate,
      transaction_id: params.transaction_id,
    };
    const response = await apiClient.get(`/api/journal-entries${buildQuery(mapped)}`);
    return {
      data: response.data || [],
      summary: response.summary || {},
      meta: response.meta || {},
    };
  },

  async fetchIncomeStatement({ start_date, end_date } = {}) {
    const response = await apiClient.get(`/api/reports/income-statement${buildQuery({ start_date, end_date })}`);
    return response.data || {};
  },

  async fetchTrialBalance({ start_date, end_date } = {}) {
    const response = await apiClient.get(`/api/reports/trial-balance${buildQuery({ start_date, end_date })}`);
    return {
      data: response.data || [],
      summary: response.summary || {},
      period: response.period || {},
    };
  },

  async fetchVendorAging({ as_of } = {}) {
    const response = await apiClient.get(`/api/reports/vendor-aging${buildQuery({ as_of })}`);
    return response.data || {};
  },

  async fetchProfit({ start_date, end_date } = {}) {
    const response = await apiClient.get(`/api/reports/profit${buildQuery({ start_date, end_date })}`);
    return {
      summary: response.summary || {},
      data: response.data || [],
      period: response.period || {},
    };
  },

  downloadIncomeStatementCsv: (params) => downloadCsv('reports/income-statement', params, 'laporan-laba-rugi.csv'),
  downloadTrialBalanceCsv: (params) => downloadCsv('reports/trial-balance', params, 'neraca-saldo.csv'),
  downloadVendorAgingCsv: (params) => downloadCsv('reports/vendor-aging', params, 'aging-hutang-vendor.csv'),
};
