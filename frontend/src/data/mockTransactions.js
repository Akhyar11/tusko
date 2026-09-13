/**
 * Mock Data Transaksi Keuangan (Cashflow In/Out)
 * Sesuai PRD Tabel `transactions`
 * Menangani pencatatan transaksi masuk (income) dan keluar (expense)
 */

export const transactionCategories = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'order_payment', label: 'Pembayaran Pesanan', type: 'income' },
  { id: 'capital_deposit', label: 'Modal / Setoran Kas', type: 'income' },
  { id: 'shipping_fee', label: 'Ongkos Kirim Kurir', type: 'expense' },
  { id: 'gateway_fee', label: 'Biaya Payment Gateway', type: 'expense' },
  { id: 'restock', label: 'Pengadaan Stok Produk', type: 'expense' },
  { id: 'operational', label: 'Operasional & Kemasan', type: 'expense' },
  { id: 'refund', label: 'Pengembalian Dana', type: 'expense' }
];

export const mockTransactions = [
  {
    id: 1,
    transaction_number: 'TRX/20260907/IN-0091',
    order_id: 1,
    order_number: 'INV/20260907/TK/884920',
    type: 'income',
    category: 'order_payment',
    category_label: 'Pembayaran Pesanan',
    amount: 491000,
    description: 'Pembayaran pesanan Keyboard Mechanical via BCA VA',
    payment_method: 'BCA Virtual Account (Midtrans)',
    status: 'pending',
    created_at: '2026-09-07T09:30:00Z',
    customer_name: 'Akhyar Ramadan'
  },
  {
    id: 2,
    transaction_number: 'TRX/20260906/IN-0088',
    order_id: 2,
    order_number: 'INV/20260906/TK/771923',
    type: 'income',
    category: 'order_payment',
    category_label: 'Pembayaran Pesanan',
    amount: 503000,
    description: 'Pembayaran pesanan TWS Earbuds & Kaos Polos via GoPay/QRIS',
    payment_method: 'GoPay / QRIS (Midtrans)',
    status: 'settled',
    created_at: '2026-09-06T14:20:00Z',
    customer_name: 'Akhyar Ramadan'
  },
  {
    id: 3,
    transaction_number: 'TRX/20260906/EX-0089',
    order_id: 2,
    order_number: 'INV/20260906/TK/771923',
    type: 'expense',
    category: 'gateway_fee',
    category_label: 'Biaya Payment Gateway',
    amount: 3500,
    description: 'MDR Transaksi QRIS Midtrans 0.7%',
    payment_method: 'Midtrans Settlement Fee',
    status: 'settled',
    created_at: '2026-09-06T14:21:00Z'
  },
  {
    id: 4,
    transaction_number: 'TRX/20260906/EX-0090',
    order_id: 2,
    order_number: 'INV/20260906/TK/771923',
    type: 'expense',
    category: 'shipping_fee',
    category_label: 'Ongkos Kirim Kurir',
    amount: 22000,
    description: 'Pelunasan ongkir SiCepat BEST (Next Day)',
    payment_method: 'Saldo Ekspedisi SiCepat',
    status: 'settled',
    created_at: '2026-09-06T15:00:00Z'
  },
  {
    id: 5,
    transaction_number: 'TRX/20260905/IN-0082',
    order_id: 3,
    order_number: 'INV/20260905/TK/554812',
    type: 'income',
    category: 'order_payment',
    category_label: 'Pembayaran Pesanan',
    amount: 867500,
    description: 'Pembayaran Smart Watch Ultra via Transfer Bank Mandiri',
    payment_method: 'Transfer Mandiri',
    status: 'settled',
    created_at: '2026-09-05T10:10:00Z',
    customer_name: 'Akhyar Ramadan'
  },
  {
    id: 6,
    transaction_number: 'TRX/20260905/EX-0083',
    order_id: 3,
    order_number: 'INV/20260905/TK/554812',
    type: 'expense',
    category: 'shipping_fee',
    category_label: 'Ongkos Kirim Kurir',
    amount: 16000,
    description: 'Drop paket kurir J&T Express resi JT9928172654',
    payment_method: 'Kas Toko / Tunai',
    status: 'settled',
    created_at: '2026-09-05T17:50:00Z'
  },
  {
    id: 7,
    transaction_number: 'TRX/20260904/EX-0079',
    order_id: null,
    order_number: null,
    type: 'expense',
    category: 'restock',
    category_label: 'Pengadaan Stok Produk',
    amount: 2450000,
    description: 'Pengadaan 10 unit Mechanical Keyboard RGB dari Distributor Utama',
    payment_method: 'BCA Bisnis Transfer',
    status: 'settled',
    created_at: '2026-09-04T11:00:00Z'
  },
  {
    id: 8,
    transaction_number: 'TRX/20260903/EX-0072',
    order_id: null,
    order_number: null,
    type: 'expense',
    category: 'operational',
    category_label: 'Operasional & Kemasan',
    amount: 185000,
    description: 'Pembelian 100 pcs corrugated mailer box + 2 roll bubble wrap hitam',
    payment_method: 'Kas Toko / QRIS',
    status: 'settled',
    created_at: '2026-09-03T16:20:00Z'
  },
  {
    id: 9,
    transaction_number: 'TRX/20260901/IN-0065',
    order_id: 4,
    order_number: 'INV/20260901/TK/119284',
    type: 'income',
    category: 'order_payment',
    category_label: 'Pembayaran Pesanan',
    amount: 301000,
    description: 'Pembayaran pesanan Backpack Laptop 15.6 Inch via BCA VA',
    payment_method: 'BCA Virtual Account (Midtrans)',
    status: 'settled',
    created_at: '2026-09-01T08:25:00Z',
    customer_name: 'Akhyar Ramadan'
  },
  {
    id: 10,
    transaction_number: 'TRX/20260901/EX-0066',
    order_id: 4,
    order_number: 'INV/20260901/TK/119284',
    type: 'expense',
    category: 'gateway_fee',
    category_label: 'Biaya Payment Gateway',
    amount: 4000,
    description: 'Fee Virtual Account Midtrans flat rate',
    payment_method: 'Midtrans Settlement Fee',
    status: 'settled',
    created_at: '2026-09-01T08:26:00Z'
  },
  {
    id: 11,
    transaction_number: 'TRX/20260901/EX-0067',
    order_id: 4,
    order_number: 'INV/20260901/TK/119284',
    type: 'expense',
    category: 'shipping_fee',
    category_label: 'Ongkos Kirim Kurir',
    amount: 14000,
    description: 'Pelunasan ongkir Anteraja resi 100029384756',
    payment_method: 'Saldo Ekspedisi Anteraja',
    status: 'settled',
    created_at: '2026-09-01T15:10:00Z'
  },
  {
    id: 12,
    transaction_number: 'TRX/20260830/IN-0050',
    order_id: null,
    order_number: null,
    type: 'income',
    category: 'capital_deposit',
    category_label: 'Modal / Setoran Kas',
    amount: 5000000,
    description: 'Setoran modal kas awal bulan toko operasional',
    payment_method: 'Setor Kas Bank Mandiri',
    status: 'settled',
    created_at: '2026-08-30T09:00:00Z',
    customer_name: 'Owner Toko'
  }
];

export const mockFinancialAccounts = [
  {
    id: 1,
    code: 'ACC-BCA-01',
    name: 'BCA Bisnis Giro Operasional',
    account_number: '820-192-8811',
    bank_name: 'Bank Central Asia (BCA)',
    account_holder: 'PT TUSKO PERFORMANCE INDONESIA',
    type: 'bank',
    balance: 84500000,
    currency: 'IDR',
    status: 'active',
    is_default_payout: true
  },
  {
    id: 2,
    code: 'ACC-MDR-02',
    name: 'Mandiri Utama Settlement Gateway',
    account_number: '142-00-992182-1',
    bank_name: 'Bank Mandiri',
    account_holder: 'PT TUSKO PERFORMANCE INDONESIA',
    type: 'bank',
    balance: 42150000,
    currency: 'IDR',
    status: 'active',
    is_default_payout: false
  },
  {
    id: 3,
    code: 'ACC-CASH-01',
    name: 'Kas Kecil Kasir Toko & Gudang',
    account_number: 'PETTY-CASH-01',
    bank_name: 'Tunai Fisik / Petty Cash',
    account_holder: 'Kasir & Admin Gudang',
    type: 'cash',
    balance: 6850000,
    currency: 'IDR',
    status: 'active',
    is_default_payout: false
  },
  {
    id: 4,
    code: 'ACC-MDT-GW',
    name: 'Midtrans Settlement Holding Escrow',
    account_number: 'MIDTRANS-MERCHANT-TUSKO',
    bank_name: 'Midtrans Payment Gateway',
    account_holder: 'Holding Escrow Account',
    type: 'gateway',
    balance: 12340000,
    currency: 'IDR',
    status: 'active',
    is_default_payout: false
  }
];

export const mockChartOfAccounts = [
  { code: '1-1010', name: 'Kas Tunai Toko / Brankas', group: 'Aset Lancar', type: 'debit', balance: 6850000 },
  { code: '1-1020', name: 'Bank BCA Bisnis Operasional', group: 'Aset Lancar', type: 'debit', balance: 84500000 },
  { code: '1-1030', name: 'Bank Mandiri Gateway Escrow', group: 'Aset Lancar', type: 'debit', balance: 42150000 },
  { code: '1-1040', name: 'Persediaan Produk Olahraga (Gudang)', group: 'Aset Lancar', type: 'debit', balance: 65420000 },
  { code: '2-2010', name: 'Utang Usaha / Vendor Supplier', group: 'Kewajiban', type: 'credit', balance: 28500000 },
  { code: '2-2020', name: 'Beban Operasional Harus Dibayar', group: 'Kewajiban', type: 'credit', balance: 4200000 },
  { code: '3-3010', name: 'Modal Disetor Pemilik Toko', group: 'Ekuitas', type: 'credit', balance: 150000000 },
  { code: '3-3020', name: 'Saldo Laba Ditahan', group: 'Ekuitas', type: 'credit', balance: 28560000 },
  { code: '4-4010', name: 'Pendapatan Penjualan Ritel & Web', group: 'Pendapatan', type: 'credit', balance: 48920000 },
  { code: '4-4020', name: 'Pendapatan Ongkos Kirim Pelanggan', group: 'Pendapatan', type: 'credit', balance: 1450000 },
  { code: '5-5010', name: 'Harga Pokok Penjualan (HPP) Produk', group: 'Beban Pokok', type: 'debit', balance: 26850000 },
  { code: '5-5020', name: 'Beban Selisih Stok Opname Defect', group: 'Beban Pokok', type: 'debit', balance: 390000 },
  { code: '6-6010', name: 'Beban Sewa Gudang & Operasional', group: 'Beban Operasional', type: 'debit', balance: 4500000 },
  { code: '6-6020', name: 'Beban Payment Gateway MDR', group: 'Beban Operasional', type: 'debit', balance: 345000 },
  { code: '6-6030', name: 'Beban Kemasan, Mailer Box & Bubble', group: 'Beban Operasional', type: 'debit', balance: 680000 }
];

export const mockCogsAnalytics = {
  grossRevenue: 48920000,
  totalCogs: 26850000,
  grossProfit: 22070000,
  grossMarginPct: 45.1,
  categoryBreakdown: [
    {
      category_name: 'Jersey & Apparel',
      revenue: 24500000,
      cogs: 12800000,
      gross_profit: 11700000,
      margin_pct: 47.8,
      units_sold: 72
    },
    {
      category_name: 'Sepatu Olahraga',
      revenue: 18200000,
      cogs: 10920000,
      gross_profit: 7280000,
      margin_pct: 40.0,
      units_sold: 14
    },
    {
      category_name: 'Peralatan & Gym',
      revenue: 6220000,
      cogs: 3130000,
      gross_profit: 3090000,
      margin_pct: 49.7,
      units_sold: 38
    }
  ]
};

