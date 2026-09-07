export const mockAddresses = [
  {
    id: 1,
    label: 'Rumah (Utama)',
    recipient_name: 'Akhyar Ramadan',
    phone: '0812-3456-7890',
    full_address: 'Jl. Sudirman No. 45, RT 02 / RW 05, Kel. Senayan, Kec. Kebayoran Baru',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postal_code: '12190',
    is_default: true,
  },
  {
    id: 2,
    label: 'Kantor',
    recipient_name: 'Akhyar Ramadan (PT Tech Indonesia)',
    phone: '0812-9876-5432',
    full_address: 'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman Kav. 54-55',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postal_code: '10210',
    is_default: false,
  }
];

export const mockExpeditions = [
  {
    id: 1,
    name: 'JNE',
    service: 'Reguler (REG)',
    etd: '2 - 3 hari',
    cost: 18000,
    is_free: true, // Bebas ongkir
  },
  {
    id: 2,
    name: 'SiCepat',
    service: 'BEST (Next Day)',
    etd: '1 hari',
    cost: 26000,
    is_free: false,
  },
  {
    id: 3,
    name: 'J&T Express',
    service: 'Standard EZ',
    etd: '2 - 3 hari',
    cost: 19000,
    is_free: false,
  },
  {
    id: 4,
    name: 'GoSend Instant',
    service: 'Instant (3 Jam)',
    etd: '3 jam tiba',
    cost: 35000,
    is_free: false,
  }
];

export const mockPaymentMethods = [
  {
    category: 'Midtrans Payment Gateway',
    methods: [
      { id: 'bca_va', name: 'BCA Virtual Account', type: 'midtrans', icon: 'CreditCard', fee: 0 },
      { id: 'mandiri_va', name: 'Mandiri Virtual Account', type: 'midtrans', icon: 'CreditCard', fee: 0 },
      { id: 'bri_va', name: 'BRI Virtual Account', type: 'midtrans', icon: 'CreditCard', fee: 0 },
      { id: 'bni_va', name: 'BNI Virtual Account', type: 'midtrans', icon: 'CreditCard', fee: 0 },
      { id: 'qris', name: 'QRIS (GoPay, OVO, Dana, LinkAja, ShopeePay)', type: 'midtrans', icon: 'QrCode', fee: 0 },
      { id: 'credit_card', name: 'Kartu Kredit / Debit Online Visa/Mastercard', type: 'midtrans', icon: 'CreditCard', fee: 2500 },
    ]
  },
  {
    category: 'Transfer Bank Manual (Verifikasi Penjual)',
    methods: [
      { id: 'manual_bca', name: 'Transfer BCA Manual (873-019-2819 a.n TokoOnline)', type: 'manual', icon: 'Building2', fee: 0 },
      { id: 'manual_mandiri', name: 'Transfer Mandiri Manual (137-00-1928-391 a.n TokoOnline)', type: 'manual', icon: 'Building2', fee: 0 },
    ]
  }
];
