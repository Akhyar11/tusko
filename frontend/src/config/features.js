/**
 * Konfigurasi visibilitas modul rilis Tusko Storefront & ERP
 * 
 * Aturan Branching:
 * - Branch master (Production): Modul operasional disembunyikan terlebih dahulu (SHOW_OPERATIONAL_MODULES = false).
 * - Branch main (Development): Seluruh menu dan modul operasional dibuka untuk pengembangan (SHOW_OPERATIONAL_MODULES = true).
 */
export const SHOW_OPERATIONAL_MODULES = false;
