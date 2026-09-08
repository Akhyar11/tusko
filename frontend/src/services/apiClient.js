/**
 * Central API Client for Tusko Performance Storefront
 * Handles HTTP requests to Laravel Sanctum REST API with Bearer token authentication.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

/**
 * Base request dispatcher
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

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
      throw error;
    }

    return data;
  } catch (error) {
    // Tangani kemungkinan server backend sedang tidak aktif (Network Error / Failed to fetch)
    if (!error.status && (error.name === 'TypeError' || error.message.includes('fetch'))) {
      error.isNetworkError = true;
      error.message = 'Tidak dapat terhubung ke server backend (Offline).';
    }
    throw error;
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
