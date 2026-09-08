/**
 * Authentication Service for Tusko Performance
 * Bridges frontend authentication with Laravel Sanctum API with robust offline fallback.
 */

import { 
  apiClient, 
  getStoredToken, 
  setStoredToken, 
  getStoredUser, 
  setStoredUser, 
  clearStoredAuth 
} from './apiClient';
import { mockDemoUsers } from '../data/mockAuthData';

export const authService = {
  /**
   * Login pengguna dengan email/no. handphone dan password.
   */
  async login(emailOrPhone, password) {
    const cleanIdentifier = emailOrPhone.trim();

    try {
      // 1. Coba request ke API Backend Laravel
      const response = await apiClient.post('/api/auth/login', {
        email: cleanIdentifier,
        password: password,
      });

      if (response.token) {
        setStoredToken(response.token);
      }
      if (response.user) {
        setStoredUser(response.user);
      }

      return {
        success: true,
        user: response.user,
        token: response.token,
        message: response.message || 'Login berhasil.',
        isLiveApi: true,
      };
    } catch (error) {
      // Jika error validasi kredensial (401/403/422), langsung lempar error agar pesan spesifik tampil
      if (error.status === 401 || error.status === 403 || error.status === 422) {
        throw error;
      }

      // Jika jaringan gagal / backend offline, gunakan mode fallback demo agar UX tetap lancar
      if (error.isNetworkError) {
        console.warn('Backend server offline. Menggunakan mode simulasi lokal.');

        const matchedUser = mockDemoUsers.find(
          (u) => u.email.toLowerCase() === cleanIdentifier.toLowerCase()
        ) || (cleanIdentifier.toLowerCase() === 'budi.pratama@gmail.com' ? mockDemoUsers[0] : null) || {
          id: Date.now(),
          name: cleanIdentifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          email: cleanIdentifier,
          role: cleanIdentifier.includes('admin') ? 'admin' : 'customer',
          phone: '0812-3456-7890',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          joinedDate: 'Maret 2026',
          membershipTier: cleanIdentifier.includes('admin') ? 'Super Admin' : 'Gold Member',
          points: 1250,
          defaultAddress: {
            recipient_name: cleanIdentifier.split('@')[0],
            phone: '0812-3456-7890',
            full_address: 'Jl. Kemang Raya No. 45',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postal_code: '12730'
          }
        };

        const simulatedToken = `demo_token_${Date.now()}`;
        setStoredToken(simulatedToken);
        setStoredUser(matchedUser);

        return {
          success: true,
          user: matchedUser,
          token: simulatedToken,
          message: `Login berhasil (Mode Demo). Selamat datang, ${matchedUser.name}!`,
          isLiveApi: false,
        };
      }

      throw error;
    }
  },

  /**
   * Pendaftaran akun pengguna baru.
   */
  async register(userData) {
    try {
      const payload = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password_confirmation || userData.passwordConfirmation || userData.password,
        phone: userData.phone || null,
        role: userData.role || 'customer',
      };

      const response = await apiClient.post('/api/auth/register', payload);

      if (response.token) {
        setStoredToken(response.token);
      }
      if (response.user) {
        setStoredUser(response.user);
      }

      return {
        success: true,
        user: response.user,
        token: response.token,
        message: response.message || 'Registrasi berhasil.',
        isLiveApi: true,
      };
    } catch (error) {
      if (error.status === 422 || error.status === 400) {
        throw error;
      }

      // Offline fallback
      if (error.isNetworkError) {
        console.warn('Backend server offline. Menggunakan registrasi simulasi lokal.');

        const fallbackUser = {
          id: Date.now(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '0812-3456-7890',
          role: 'customer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          joinedDate: 'Baru Bergabung',
          membershipTier: 'New Member',
          points: 150,
          defaultAddress: {
            recipient_name: userData.name,
            phone: userData.phone || '0812-3456-7890',
            full_address: 'Belum ada alamat tersimpan',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postal_code: '10000'
          }
        };

        const simulatedToken = `demo_token_${Date.now()}`;
        setStoredToken(simulatedToken);
        setStoredUser(fallbackUser);

        return {
          success: true,
          user: fallbackUser,
          token: simulatedToken,
          message: `Akun ${fallbackUser.name} berhasil dibuat (Mode Demo)!`,
          isLiveApi: false,
        };
      }

      throw error;
    }
  },

  /**
   * Ambil data profil user yang sedang aktif.
   */
  async getProfile() {
    const token = getStoredToken();
    if (!token) return null;

    try {
      const response = await apiClient.get('/api/auth/me');
      if (response.user) {
        setStoredUser(response.user);
        return response.user;
      }
      return null;
    } catch (error) {
      if (error.status === 401) {
        // Token sudah expired / revoked
        clearStoredAuth();
        return null;
      }
      // Jika offline, kembalikan user yang ada di cache
      return getStoredUser();
    }
  },

  /**
   * Logout dan cabut token akses.
   */
  async logout() {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Abaikan error saat logout jika jaringan bermasalah
    } finally {
      clearStoredAuth();
    }
  },

  /**
   * Ambil data user dari cache lokal.
   */
  getCurrentUser() {
    return getStoredUser();
  },

  /**
   * Ambil token dari cache lokal.
   */
  getToken() {
    return getStoredToken();
  }
};
