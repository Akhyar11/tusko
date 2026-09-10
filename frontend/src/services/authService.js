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
   * Perbarui data biodata profil pengguna.
   */
  async updateProfile(profileData) {
    const payload = {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone || null,
      avatar: profileData.avatar || null,
      gender: profileData.gender || null,
      birth_date: profileData.birthDate || profileData.birth_date || null,
    };

    try {
      const response = await apiClient.put('/api/auth/profile', payload);
      if (response.user) {
        setStoredUser(response.user);
        return {
          success: true,
          user: response.user,
          message: response.message || 'Profil berhasil diperbarui.',
          isLiveApi: true,
        };
      }
      return { success: true, message: response.message, isLiveApi: true };
    } catch (error) {
      if (error.status === 422 || error.status === 400) {
        throw error;
      }
      // Offline fallback
      if (error.isNetworkError) {
        console.warn('Backend server offline. Memperbarui profil di penyimpanan lokal.');
        const currentUser = getStoredUser() || {};
        const updatedUser = {
          ...currentUser,
          ...profileData,
        };
        setStoredUser(updatedUser);
        return {
          success: true,
          user: updatedUser,
          message: 'Profil berhasil diperbarui (Mode Demo).',
          isLiveApi: false,
        };
      }
      throw error;
    }
  },

  /**
   * Perbarui kata sandi pengguna.
   */
  async updatePassword({ oldPassword, newPassword, confirmPassword }) {
    const payload = {
      old_password: oldPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    };

    try {
      const response = await apiClient.post('/api/auth/password', payload);
      return {
        success: true,
        message: response.message || 'Kata sandi berhasil diperbarui.',
        isLiveApi: true,
      };
    } catch (error) {
      if (error.status === 422 || error.status === 400) {
        throw error;
      }
      // Offline fallback
      if (error.isNetworkError) {
        console.warn('Backend server offline. Simulasi pembaruan kata sandi berhasil.');
        return {
          success: true,
          message: 'Kata sandi akun Anda berhasil diperbarui (Mode Demo).',
          isLiveApi: false,
        };
      }
      throw error;
    }
  },

  /**
   * Ambil daftar alamat pengiriman user dari backend API.
   */
  async getAddresses() {
    try {
      const response = await apiClient.get('/api/addresses');
      return response.data || [];
    } catch (error) {
      console.warn('Gagal memuat alamat dari server:', error);
      return [];
    }
  },

  /**
   * Simpan alamat pengiriman baru ke backend API.
   */
  async createAddress(addressData) {
    const payload = {
      label: addressData.label || 'Rumah',
      recipient_name: addressData.recipient_name || addressData.recipientName,
      phone: addressData.phone,
      full_address: addressData.full_address || addressData.fullAddress,
      city: addressData.city,
      province: addressData.province,
      postal_code: addressData.postal_code || addressData.postalCode,
      lat: addressData.lat,
      lng: addressData.lng,
      is_default: Boolean(addressData.is_default || addressData.isDefault),
    };

    const response = await apiClient.post('/api/addresses', payload);
    return response.data || response;
  },

  /**
   * Perbarui alamat pengiriman yang ada di backend API.
   */
  async updateAddress(id, addressData) {
    const payload = {
      label: addressData.label,
      recipient_name: addressData.recipient_name || addressData.recipientName,
      phone: addressData.phone,
      full_address: addressData.full_address || addressData.fullAddress,
      city: addressData.city,
      province: addressData.province,
      postal_code: addressData.postal_code || addressData.postalCode,
      lat: addressData.lat,
      lng: addressData.lng,
      is_default: Boolean(addressData.is_default || addressData.isDefault),
    };

    const response = await apiClient.put(`/api/addresses/${id}`, payload);
    return response.data || response;
  },

  /**
   * Hapus alamat pengiriman dari backend API.
   */
  async deleteAddress(id) {
    const response = await apiClient.delete(`/api/addresses/${id}`);
    return response;
  },

  /**
   * Jadikan alamat sebagai alamat utama default di backend API.
   */
  async setDefaultAddress(id) {
    const response = await apiClient.post(`/api/addresses/${id}/set-default`);
    return response.data || response;
  },

  /**
   * Ambil daftar kupon diskon dan voucher aktif dari backend API.
   */
  async getVouchers() {
    try {
      const response = await apiClient.get('/api/vouchers');
      return response.data || [];
    } catch (error) {
      console.warn('Gagal memuat voucher dari server:', error);
      return [];
    }
  },

  /**
   * Ambil daftar sesi login aktif akun pengguna dari backend API.
   */
  async getActiveSessions() {
    try {
      const response = await apiClient.get('/api/auth/sessions');
      return response.data || [];
    } catch (error) {
      console.warn('Gagal memuat sesi dari server:', error);
      return [];
    }
  },

  /**
   * Cabut semua sesi perangkat lain kecuali sesi saat ini.
   */
  async revokeOtherSessions() {
    const response = await apiClient.delete('/api/auth/sessions/other');
    return response;
  },

  /**
   * Cabut sesi perangkat tertentu berdasarkan ID.
   */
  async revokeSession(id) {
    const response = await apiClient.delete(`/api/auth/sessions/${id}`);
    return response;
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
