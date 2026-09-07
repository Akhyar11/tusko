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

export const mockExpeditionCategories = [
  'Semua',
  'Reguler',
  'Instan & Same Day',
  'Next Day',
  'Kargo'
];

export const mockExpeditions = [
  // Reguler
  {
    id: 1,
    name: 'JNE',
    code: 'jne',
    service: 'Reguler (REG)',
    category: 'Reguler',
    etd: '2 - 3 hari',
    baseCost: 18000,
    cost: 0,
    is_free: true,
    badge: 'Bebas Ongkir',
    description: 'Pengiriman reguler terpercaya menjangkau seluruh nusantara',
    trackingSupport: true
  },
  {
    id: 2,
    name: 'SiCepat',
    code: 'sicepat',
    service: 'SIUNTUNG Reguler',
    category: 'Reguler',
    etd: '2 - 3 hari',
    baseCost: 17000,
    cost: 17000,
    is_free: false,
    badge: 'Garansi Tepat Waktu',
    description: 'Layanan cepat dan efisien dengan notifikasi SMS resi otomatis',
    trackingSupport: true
  },
  {
    id: 3,
    name: 'J&T Express',
    code: 'jnt',
    service: 'Standard EZ',
    category: 'Reguler',
    etd: '2 - 3 hari',
    baseCost: 19000,
    cost: 19000,
    is_free: false,
    badge: 'Operasional 365 Hari',
    description: 'Pengiriman tanpa libur termasuk hari minggu dan hari besar',
    trackingSupport: true
  },
  {
    id: 4,
    name: 'Anteraja',
    code: 'anteraja',
    service: 'Reguler',
    category: 'Reguler',
    etd: '2 - 3 hari',
    baseCost: 16000,
    cost: 16000,
    is_free: false,
    badge: 'Paling Hemat',
    description: 'Tarif ongkir bersahabat dengan penjemputan satria anteraja',
    trackingSupport: true
  },

  // Instan & Same Day
  {
    id: 5,
    name: 'GoSend',
    code: 'gosend',
    service: 'Instant (3 Jam)',
    category: 'Instan & Same Day',
    etd: '3 jam tiba',
    baseCost: 35000,
    cost: 35000,
    is_free: false,
    badge: 'Tercepat',
    description: 'Kurir langsung mengantarkan pesanan langsung dari toko',
    trackingSupport: true
  },
  {
    id: 6,
    name: 'GrabExpress',
    code: 'grab',
    service: 'Instant (3 Jam)',
    category: 'Instan & Same Day',
    etd: '2 - 3 jam tiba',
    baseCost: 35000,
    cost: 35000,
    is_free: false,
    badge: 'Live GPS Tracking',
    description: 'Lacak posisi pengantaran driver langsung di peta real-time',
    trackingSupport: true
  },
  {
    id: 7,
    name: 'Anteraja',
    code: 'anteraja',
    service: 'Same Day (6-8 Jam)',
    category: 'Instan & Same Day',
    etd: 'Tiba hari ini',
    baseCost: 22000,
    cost: 22000,
    is_free: false,
    badge: 'Ekonomis Cepat',
    description: 'Kirim pagi tiba sore untuk area Jadetabek',
    trackingSupport: true
  },

  // Next Day
  {
    id: 8,
    name: 'SiCepat',
    code: 'sicepat',
    service: 'BEST (Next Day)',
    category: 'Next Day',
    etd: '1 hari tiba besok',
    baseCost: 26000,
    cost: 26000,
    is_free: false,
    badge: 'Pasti Besok Sampai',
    description: 'Garansi tiba di hari kerja berikutnya atau ongkir kembali',
    trackingSupport: true
  },
  {
    id: 9,
    name: 'JNE',
    code: 'jne',
    service: 'YES (Yakin Esok Sampai)',
    category: 'Next Day',
    etd: '1 hari garansi tiba',
    baseCost: 28000,
    cost: 28000,
    is_free: false,
    badge: 'Garansi Uang Kembali',
    description: 'Paket tiba keesokan harinya di alamat tujuan',
    trackingSupport: true
  },

  // Kargo
  {
    id: 10,
    name: 'JNE',
    code: 'jne',
    service: 'JTR (JNE Trucking)',
    category: 'Kargo',
    etd: '3 - 5 hari',
    baseCost: 45000,
    cost: 45000,
    is_free: false,
    badge: 'Kargo Hemat (min 10kg)',
    description: 'Pengiriman armada truk untuk barang bervolume atau berbobot besar',
    trackingSupport: true
  },
  {
    id: 11,
    name: 'SiCepat',
    code: 'sicepat',
    service: 'GOKIL (Cargo Kilat)',
    category: 'Kargo',
    etd: '3 - 5 hari',
    baseCost: 42000,
    cost: 42000,
    is_free: false,
    badge: 'Ongkir Flat Kargo',
    description: 'Kargo kilat dengan harga terjangkau ke seluruh kota besar',
    trackingSupport: true
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
