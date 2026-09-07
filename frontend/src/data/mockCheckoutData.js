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

export const mockPaymentCategories = [
  'Semua',
  'Virtual Account',
  'QRIS & E-Wallet',
  'Kartu Kredit / Debit',
  'Transfer Bank Manual'
];

export const mockPaymentMethods = [
  {
    category: 'Virtual Account (Verifikasi Otomatis Midtrans)',
    subCategory: 'Virtual Account',
    methods: [
      {
        id: 'bca_va',
        name: 'BCA Virtual Account',
        code: 'BCA',
        type: 'midtrans',
        icon: 'Building2',
        fee: 0,
        badge: 'Otomatis',
        description: 'Verifikasi instan 24 jam tanpa perlu unggah struk bukti transfer',
        instructions: {
          'm-BCA (BCA Mobile)': [
            'Buka aplikasi BCA mobile dan pilih menu m-Transfer.',
            'Pilih BCA Virtual Account.',
            'Masukkan nomor Virtual Account yang tertera.',
            'Periksa konfirmasi nama akun merchant dan nominal tagihan lalu tekan OK.',
            'Masukkan PIN m-BCA kamu untuk menyelesaikan transaksi.'
          ],
          'KlikBCA': [
            'Login ke KlikBCA Individual.',
            'Pilih Transfer Dana > Transfer ke BCA Virtual Account.',
            'Masukkan nomor Virtual Account.',
            'Validasi data yang tampil di layar dan masukkan respon KeyBCA Appli 1.',
            'Tekan Kirim untuk memproses pembayaran.'
          ],
          'ATM BCA': [
            'Masukkan kartu ATM dan 6 digit PIN BCA.',
            'Pilih menu Transaksi Lainnya > Transfer > Ke Rek BCA Virtual Account.',
            'Masukkan nomor Virtual Account lalu tekan Benar.',
            'Periksa kesesuaian rincian pembayaran di layar ATM dan konfirmasi.'
          ]
        }
      },
      {
        id: 'mandiri_va',
        name: 'Mandiri Virtual Account',
        code: 'MANDIRI',
        type: 'midtrans',
        icon: 'Building2',
        fee: 0,
        badge: 'Otomatis',
        description: 'Bayar mudah lewat aplikasi Livin by Mandiri atau ATM Mandiri',
        instructions: {
          "Livin' by Mandiri": [
            "Buka aplikasi Livin' by Mandiri dan login ke akunmu.",
            'Pilih menu Bayar > Buat Pembayaran Baru.',
            'Pilih Pembayaran Lainnya > Multi Payment atau cari merchant Midtrans.',
            'Masukkan nomor Virtual Account yang telah diberikan.',
            'Pastikan tagihan sudah sesuai dan masukkan PIN Livin untuk konfirmasi.'
          ],
          'ATM Mandiri': [
            'Masukkan kartu ATM dan PIN Mandiri kamu.',
            'Pilih menu Bayar/Beli > Lainnya > Multi Payment.',
            'Masukkan kode merchant 70012 (Midtrans) lalu tekan Benar.',
            'Masukkan nomor Virtual Account kamu dan selesaikan instruksi pembayaran.'
          ]
        }
      },
      {
        id: 'bri_va',
        name: 'BRI Virtual Account (BRIVA)',
        code: 'BRI',
        type: 'midtrans',
        icon: 'Building2',
        fee: 0,
        badge: 'Otomatis',
        description: 'Terima pembayaran real-time via aplikasi BRImo dan jaringan ATM BRI',
        instructions: {
          'BRImo': [
            'Buka aplikasi BRImo dan login dengan username & password atau sidik jari.',
            'Pilih menu Tagihan > BRIVA.',
            'Pilih Pembayaran Baru dan masukkan nomor Virtual Account (BRIVA).',
            'Periksa informasi detail tagihan di layar ponsel.',
            'Konfirmasi pembayaran dan masukkan PIN BRImo kamu.'
          ],
          'ATM BRI': [
            'Masukkan kartu ATM BRI dan PIN.',
            'Pilih Transaksi Lain > Pembayaran > Lainnya > BRIVA.',
            'Masukkan nomor BRIVA yang tertera.',
            'Konfirmasi pembayaran dan simpan struk sebagai tanda bukti.'
          ]
        }
      },
      {
        id: 'bni_va',
        name: 'BNI Virtual Account',
        code: 'BNI',
        type: 'midtrans',
        icon: 'Building2',
        fee: 0,
        badge: 'Otomatis',
        description: 'Kemudahan transfer langsung dari BNI Mobile Banking',
        instructions: {
          'BNI Mobile Banking': [
            'Login ke aplikasi BNI Mobile Banking.',
            'Pilih menu Pembayaran > Virtual Account Billing.',
            'Pilih tab Input Baru dan tempelkan nomor Virtual Account.',
            'Rincian tagihan akan tampil, masukkan Password Transaksi kamu.',
            'Simpan bukti transfer yang dihasilkan aplikasi.'
          ],
          'ATM BNI': [
            'Masukkan kartu ATM dan PIN BNI.',
            'Pilih Menu Lain > Pembayaran > Menu Berikutnya > Virtual Account Billing.',
            'Ketik nomor Virtual Account BNI lalu tekan Benar.',
            'Pilih Ya untuk mengonfirmasi transaksi.'
          ]
        }
      }
    ]
  },
  {
    category: 'QRIS & Dompet Digital (Midtrans)',
    subCategory: 'QRIS & E-Wallet',
    methods: [
      {
        id: 'qris',
        name: 'QRIS (GoPay, OVO, DANA, ShopeePay, LinkAja)',
        code: 'QRIS',
        type: 'midtrans',
        icon: 'QrCode',
        fee: 0,
        badge: 'Bebas Biaya',
        description: 'Scan satu QR code praktis dari semua aplikasi e-wallet dan m-banking',
        instructions: {
          'Aplikasi E-Wallet / Mobile Banking': [
            'Buka aplikasi e-wallet pilihanmu (GoPay, OVO, DANA, BCA mobile, dll).',
            'Pilih menu Scan / Bayar di bagian tengah atau atas layar.',
            'Arahkan kamera smartphone ke kode QRIS yang muncul di layar pembayaran.',
            'Periksa nama toko (TokoOnline) dan pastikan nominal tagihan sesuai.',
            'Konfirmasi transaksi dan masukkan PIN e-wallet kamu.'
          ]
        }
      }
    ]
  },
  {
    category: 'Kartu Kredit / Debit Online (Midtrans 3D Secure)',
    subCategory: 'Kartu Kredit / Debit',
    methods: [
      {
        id: 'credit_card',
        name: 'Kartu Kredit / Debit Visa & Mastercard',
        code: 'CC',
        type: 'midtrans',
        icon: 'CreditCard',
        fee: 2500,
        badge: '3D Secure',
        description: 'Transaksi aman terenkripsi 256-bit dengan verifikasi OTP resmi',
        instructions: {
          'Pembayaran Online': [
            'Pastikan kartu kredit/debit online kamu sudah diaktifkan untuk transaksi internet.',
            'Masukkan 16 angka nomor kartu, masa berlaku (bulan/tahun), dan 3 digit CVV di belakang kartu.',
            'Bank penerbit kartu akan mengirimkan kode otentikasi OTP melalui SMS ke nomor terdaftar.',
            'Masukkan kode OTP tersebut pada jendela pop-up 3D Secure untuk menyelesaikan otorisasi.'
          ]
        }
      }
    ]
  },
  {
    category: 'Transfer Bank Manual (Verifikasi Penjual)',
    subCategory: 'Transfer Bank Manual',
    methods: [
      {
        id: 'manual_bca',
        name: 'Transfer BCA Manual',
        code: 'BCA-MANUAL',
        type: 'manual',
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '873-019-2819',
        accountHolder: 'PT Toko Online Mandiri',
        icon: 'Building2',
        fee: 0,
        badge: 'Manual Verifikasi',
        description: 'Transfer ke rekening BCA resmi toko online, konfirmasi diproses 1x24 jam',
        instructions: {
          'Transfer Manual BCA': [
            'Transfer tepat sejumlah total pembayaran hingga digit rupiah terakhir.',
            'Tujuan Rekening: BCA 873-019-2819 a.n PT Toko Online Mandiri.',
            'Sertakan nomor invoice pada kolom berita transfer.',
            'Simpan struk / tangkapan layar bukti transfer kemudian unggah di form konfirmasi pembayaran.'
          ]
        }
      },
      {
        id: 'manual_mandiri',
        name: 'Transfer Mandiri Manual',
        code: 'MANDIRI-MANUAL',
        type: 'manual',
        bankName: 'Bank Mandiri',
        accountNumber: '137-00-1928-391',
        accountHolder: 'PT Toko Online Mandiri',
        icon: 'Building2',
        fee: 0,
        badge: 'Manual Verifikasi',
        description: 'Transfer ke rekening Mandiri resmi toko online dengan unggah bukti pembayaran',
        instructions: {
          'Transfer Manual Mandiri': [
            'Transfer tepat sejumlah total pembayaran ke Mandiri 137-00-1928-391.',
            'Nama Pemilik Rekening: PT Toko Online Mandiri.',
            'Simpan bukti transfer struk ATM atau screenshot Livin.',
            'Unggah bukti transfer pada form konfirmasi agar pesanan segera dikemas penjual.'
          ]
        }
      }
    ]
  }
];
