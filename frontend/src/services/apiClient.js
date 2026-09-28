/**
 * Central API Client for Tusko Performance Storefront
 * Handles HTTP requests to Laravel Sanctum REST API with Bearer token authentication.
 */
let rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim();
if (rawBaseUrl && !rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

/**
 * Bangun URL absolut menuju backend berdasarkan base URL API (VITE_API_URL).
 * Dipakai untuk URL yang harus menunjuk backend (mis. webhook Biteship) agar
 * tetap benar saat backend berada di subfolder (mis. /backend) atau origin lain.
 * Fallback ke origin browser bila VITE_API_URL tidak diset.
 */
export function resolveBackendUrl(path = '') {
  const normalized = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalized}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${normalized}`;
  }

  return normalized;
}

export const TOKEN_STORAGE_KEY = 'tusko_auth_token';
export const USER_STORAGE_KEY = 'tusko_auth_user';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to persist auth token in localStorage:', err);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to persist auth user in localStorage:', err);
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear stored auth in localStorage:', err);
  }
}

// Retry untuk kegagalan transien (Render free cold-start/restart): edge/gateway
// mengembalikan 502/503/504 atau koneksi putus sebelum request diproses aplikasi.
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [1500, 4000, 8000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Base request dispatcher
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const isFormData = options.body instanceof FormData;
  const method = (options.method || 'GET').toUpperCase();
  // POST tidak di-retry pada error jaringan (berisiko dobel-proses); tetap di-retry
  // untuk 502/503/504 (request belum sampai aplikasi).
  const retryOnNetworkError = method !== 'POST';

  const headers = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const isLastAttempt = attempt === MAX_ATTEMPTS - 1;

    try {
      const response = await fetch(url, config);

      if (RETRYABLE_STATUS.has(response.status) && !isLastAttempt) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 8000);
        continue;
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        error.errors = data.errors || null;
        // Tampilkan detail error API di console agar mudah didiagnosis walau toast tertutup.
        console.error('[apiClient] API request failed:', {
          method: config.method,
          url,
          status: response.status,
          message: error.message,
          errors: error.errors,
          response: data,
        });
        throw error;
      }

      return data;
    } catch (error) {
      const isNetworkError = !error.status
        && (error.name === 'TypeError' || String(error.message).includes('fetch'));

      if (isNetworkError && retryOnNetworkError && !isLastAttempt) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 8000);
        continue;
      }

      // Tangani kemungkinan server backend sedang tidak aktif (Network Error / Failed to fetch)
      if (isNetworkError) {
        error.isNetworkError = true;
        error.message = `Server backend tidak terjangkau (${url}). Sedang bangun atau koneksi terputus — silakan coba lagi sebentar lagi.`;
        console.error('[apiClient] Network error:', { method: config.method, url, error: error.message });
      }
      throw error;
    }
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
