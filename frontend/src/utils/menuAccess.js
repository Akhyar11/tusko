/**
 * Helper akses halaman berbasis menu per-role (T37.9).
 *
 * Aturan: user boleh membuka view admin bila salah satu menu admin miliknya
 * memiliki `view_key` yang cocok (langsung atau via pemetaan view turunan
 * create/edit/detail ke view menu induknya).
 */
export const CHILD_VIEW_TO_MENU = {
  'product-create': 'products-admin',
  'product-edit': 'products-admin',
  'category-create': 'categories-admin',
  'category-edit': 'categories-admin',
  'warehouse-create': 'warehouses-admin',
  'warehouse-edit': 'warehouses-admin',
  'supplier-create': 'suppliers-admin',
  'supplier-edit': 'suppliers-admin',
  'expedition-create': 'expeditions',
  'expedition-edit': 'expeditions',
  'transaction-create': 'transactions',
  'procurement-po-create': 'procurement-pos',
  'procurement-po-detail': 'procurement-pos',
  'procurement-grn-detail': 'procurement-grn',
  'procurement-bill-detail': 'procurement-bills',
  'order-detail': 'orders',
  'menu-create': 'menus-admin',
  'menu-edit': 'menus-admin',
  'user-create': 'users-admin',
  'user-edit': 'users-admin',
  'user-roles': 'users-admin',
  'role-create': 'roles-admin',
  'role-edit': 'roles-admin',
  'voucher-create': 'vouchers-admin',
  'voucher-edit': 'vouchers-admin'
};

/**
 * Apakah `view` diizinkan oleh daftar menu admin user.
 * @param {string} view
 * @param {Array<{view_key?: string}>} adminMenus
 */
export function isViewAllowedByMenus(view, adminMenus = []) {
  if (!view) return false;
  const target = CHILD_VIEW_TO_MENU[view] || view;
  return adminMenus.some((menu) => menu.view_key === target);
}
