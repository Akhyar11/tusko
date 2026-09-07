/**
 * Mock data for Expedition Settings (Pengaturan Jasa Ekspedisi & Kurir Pengiriman)
 */

export const initialExpeditions = [
  {
    id: 1,
    name: 'JNE Express',
    code: 'jne',
    service: 'Reguler (REG)',
    category: 'Reguler',
    etd: '2 - 3 hari',
    rateType: 'per_kg', // 'per_kg' | 'flat'
    baseRate: 18000,
    isActive: true,
    isDefault: true,
    trackingSupport: true,
    codSupport: false,
    description: 'Jaringan kurir terluas di seluruh nusantara dengan tracking real-time',
    badge: 'Ekspedisi Utama'
  },
  {
    id: 2,
    name: 'SiCepat Ekspres',
    code: 'sicepat',
    service: 'SIUNTUNG Reguler',
    category: 'Reguler',
    etd: '2 - 3 hari',
    rateType: 'per_kg',
    baseRate: 17000,
    isActive: true,
    isDefault: false,
    trackingSupport: true,
    codSupport: true,
    description: 'Layanan kiriman cepat dengan notifikasi WhatsApp & SMS resi otomatis',
    badge: 'Garansi Tepat Waktu'
  },
  {
    id: 3,
    name: 'J&T Express',
    code: 'jnt',
    service: 'Standard EZ',
    category: 'Reguler',
    etd: '2 - 3 hari',
    rateType: 'per_kg',
    baseRate: 19000,
    isActive: true,
    isDefault: false,
    trackingSupport: true,
    codSupport: true,
    description: 'Operasional 365 hari tanpa libur termasuk hari minggu dan hari raya',
    badge: 'Operasional Non-Stop'
  },
  {
    id: 4,
    name: 'Anteraja',
    code: 'anteraja',
    service: 'Reguler',
    category: 'Reguler',
    etd: '2 - 3 hari',
    rateType: 'per_kg',
    baseRate: 16000,
    isActive: true,
    isDefault: false,
    trackingSupport: true,
    codSupport: false,
    description: 'Tarif bersahabat didukung penjemputan oleh satria Anteraja',
    badge: 'Tarif Hemat'
  },
  {
    id: 5,
    name: 'GoSend',
    code: 'gosend',
    service: 'Instant (3 Jam)',
    category: 'Instan & Same Day',
    etd: '3 jam tiba',
    rateType: 'flat',
    baseRate: 35000,
    isActive: true,
    isDefault: false,
    trackingSupport: true,
    codSupport: false,
    description: 'Pengantaran instan menggunakan kurir motor khusus area Jabodetabek',
    badge: 'Super Cepat'
  },
  {
    id: 6,
    name: 'GrabExpress',
    code: 'grab',
    service: 'Same Day',
    category: 'Instan & Same Day',
    etd: '6 - 8 jam tiba',
    rateType: 'flat',
    baseRate: 25000,
    isActive: true,
    isDefault: false,
    trackingSupport: true,
    codSupport: false,
    description: 'Paket diantar pada hari yang sama dengan garansi perlindungan barang',
    badge: 'Same Day Aman'
  },
  {
    id: 7,
    name: 'JNE Express',
    code: 'jne',
    service: 'YES (Yakin Esok Sampai)',
    category: 'Next Day',
    etd: '1 hari (besok tiba)',
    rateType: 'per_kg',
    baseRate: 32000,
    isActive: true,
    isDefault: false,
    trackingSupport: true,
    codSupport: false,
    description: 'Pengiriman kilat premium dengan jaminan uang kembali jika terlambat',
    badge: 'Next Day Garansi'
  },
  {
    id: 8,
    name: 'JTR (JNE Trucking)',
    code: 'jne',
    service: 'Kargo Darat / Laut',
    category: 'Kargo',
    etd: '4 - 7 hari',
    rateType: 'per_kg',
    baseRate: 8000,
    isActive: false,
    isDefault: false,
    trackingSupport: true,
    codSupport: false,
    description: 'Layanan kargo hemat untuk pengiriman alat olahraga bervolume & beban besar (>10kg)',
    badge: 'Minimal 10 Kg'
  }
];

export const expeditionCategoriesList = [
  'Semua Kategori',
  'Reguler',
  'Instan & Same Day',
  'Next Day',
  'Kargo'
];
