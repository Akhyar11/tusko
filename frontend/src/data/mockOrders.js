export const orderStatuses = [
  { id: 'all', label: 'Semua Transaksi' },
  { id: 'pending', label: 'Menunggu Pembayaran' },
  { id: 'processing', label: 'Sedang Diproses' },
  { id: 'shipped', label: 'Sedang Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

// Data pesanan bersumber 100% dinamis dari database Laravel via /api/orders
export const mockOrders = [];
