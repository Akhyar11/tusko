import { create } from 'zustand';
import { menuService } from '../services/menuService';

/**
 * Zustand store menu navigasi (T37.7).
 *
 * Memuat menu efektif user dari `GET /api/auth/menus` saat login:
 * - `adminMenus`     : menu area admin sesuai role user (sumber render AdminSidebar).
 * - `storefrontMenus`: menu storefront publik (dipakai Navbar/UserMenuDropdown, T37.8).
 *
 * DILARANG menambah menu dengan mengedit daftar statis; seluruh navigasi bersumber
 * dari DB (master `menus` + pivot `role_menus`).
 */
export const useMenuStore = create((set, get) => ({
  adminMenus: [],
  storefrontMenus: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchMenus: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const { admin, storefront } = await menuService.fetchUserMenus();
      set({
        adminMenus: admin,
        storefrontMenus: storefront,
        isLoading: false,
        isLoaded: true
      });
      return { admin, storefront };
    } catch (err) {
      set({
        isLoading: false,
        isLoaded: true,
        error: err?.message || 'Gagal memuat menu navigasi'
      });
      return { admin: [], storefront: [] };
    }
  },

  resetMenus: () => set({
    adminMenus: [],
    storefrontMenus: [],
    isLoading: false,
    isLoaded: false,
    error: null
  })
}));
