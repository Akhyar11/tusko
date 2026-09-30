/**
 * Konstanta referensi UI (bukan data mock). Nilai ini adalah label/opsi tetap
 * yang dipakai untuk filter & konfigurasi; data bisnis tetap berasal dari API.
 */

export const orderStatuses = [
  { id: 'all', label: 'Semua Transaksi' },
  { id: 'pending', label: 'Menunggu Pembayaran' },
  { id: 'processing', label: 'Sedang Diproses' },
  { id: 'shipped', label: 'Sedang Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

export const transactionCategories = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'order_payment', label: 'Pembayaran Pesanan', type: 'income' },
  { id: 'capital_deposit', label: 'Modal / Setoran Kas', type: 'income' },
  { id: 'shipping_fee', label: 'Ongkos Kirim Kurir', type: 'expense' },
  { id: 'gateway_fee', label: 'Biaya Payment Gateway', type: 'expense' },
  { id: 'restock', label: 'Pengadaan Stok Produk', type: 'expense' },
  { id: 'operational', label: 'Operasional & Kemasan', type: 'expense' },
  { id: 'refund', label: 'Pengembalian Dana', type: 'expense' },
];

export const expeditionCategoriesList = [
  'Semua Kategori',
  'Reguler',
  'Instan & Same Day',
  'Next Day',
  'Kargo',
];

export const expeditionCategoryTabs = [
  'Semua',
  'Reguler',
  'Instan & Same Day',
  'Next Day',
  'Kargo',
];

export const stockStatusOptions = [
  { id: 'all', label: 'Semua Status Stok' },
  { id: 'safe', label: 'Stok Aman' },
  { id: 'low', label: 'Stok Menipis (< Min)' },
  { id: 'out_of_stock', label: 'Stok Habis (0)' },
];

export const availablePlaceholders = [
  { key: '{customer_name}', label: 'Nama Pembeli', example: 'Budi Santoso' },
  { key: '{order_number}', label: 'Nomor Pesanan / Invoice', example: 'INV/20260907/TK/001' },
  { key: '{total_amount}', label: 'Total Pembayaran', example: 'Rp 484.000' },
  { key: '{courier_name}', label: 'Nama Ekspedisi', example: 'J&T Express' },
  { key: '{courier_service}', label: 'Layanan Ekspedisi', example: 'EZ (Reguler)' },
  { key: '{tracking_number}', label: 'Nomor Resi', example: 'TRK-98827391823' },
  { key: '{items_list}', label: 'Rincian Barang', example: '1x Tusko Pro Jersey, 1x Kaos Kaki' },
  { key: '{payment_method}', label: 'Metode Pembayaran', example: 'BCA Virtual Account' },
  { key: '{store_name}', label: 'Nama Toko', example: 'Tusko Official Store' },
];
