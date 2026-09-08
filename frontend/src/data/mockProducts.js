export const categories = [
  { id: 1, name: 'Jersey & Apparel', slug: 'jersey-apparel', icon: 'Shirt', badge: 'POPULER', featured: true },
  { id: 2, name: 'Sepatu Olahraga', slug: 'sepatu-olahraga', icon: 'Footprints', badge: 'HOT', featured: true },
  { id: 3, name: 'Peralatan & Gym', slug: 'peralatan-gym', icon: 'Dumbbell', featured: true },
  { id: 4, name: 'Aksesoris & Deker', slug: 'aksesoris-deker', icon: 'Shield', featured: false },
  { id: 5, name: 'Running & Marathon', slug: 'running-marathon', icon: 'Zap', badge: 'PRO', featured: true },
  { id: 6, name: 'Futsal & Sepakbola', slug: 'futsal-sepakbola', icon: 'Trophy', featured: true },
  { id: 7, name: 'Training & Fitness', slug: 'training-fitness', icon: 'Activity', featured: false },
  { id: 8, name: 'Koleksi Pro Player', slug: 'koleksi-pro-player', icon: 'Sparkles', badge: 'NEW', featured: true },
];

export const mockProducts = [
  {
    id: 1,
    category_id: 1,
    sku: 'TSK-JRS-001',
    name: 'Jersey Matchday Tusko 2026 AeroTech',
    slug: 'jersey-matchday-tusko-2026-aerotech',
    badge: 'BARU',
    category_subtitle: 'Sepak Bola • Matchday',
    description: 'Jersey pertandingan pro grade dengan teknologi sirkulasi udara AeroTech™ yang cepat menyerap keringat dan menjaga tubuh tetap sejuk saat intensitas tinggi. Jahitan elastis 4-way stretch ergonomis dan panel ventilasi laser-cut di area punggung untuk mobilitas optimal atlet.',
    price: 389000,
    original_price: 499000,
    cost_price: 210000,
    discount_percentage: 22,
    weight: 180, // gram
    stock: 48,
    stock_minimum: 10,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Bahan': '100% Recycled AeroTech Jacquard Polyester',
      'Fitting': 'Athletic Slim Fit',
      'Teknologi': 'AeroTech Quick-Dry + Anti-Odor Silver Shield',
      'Bobot': '140 gram ultra-lightweight',
      'Perawatan': 'Cuci mesin air dingin, jangan gunakan pelembut pakaian',
      'Garansi': 'Garansi jahitan & sablon 30 hari Tusko'
    },
    variant_levels: [
      {
        name: 'Lengan',
        code: 'sleeve',
        options: ['Pendek', 'Panjang']
      },
      {
        name: 'Warna',
        code: 'color',
        options: ['Deep Navy', 'Crimson Red', 'Triple Black']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['S', 'M', 'L', 'XL']
      }
    ],
    variants: [
      { id: 'v101', sku: 'TSK-JRS-SHT-NVY-S', sleeve: 'Pendek', color: 'Deep Navy', size: 'S', price: 389000, stock: 8 },
      { id: 'v102', sku: 'TSK-JRS-SHT-NVY-M', sleeve: 'Pendek', color: 'Deep Navy', size: 'M', price: 389000, stock: 12 },
      { id: 'v103', sku: 'TSK-JRS-SHT-NVY-L', sleeve: 'Pendek', color: 'Deep Navy', size: 'L', price: 389000, stock: 10 },
      { id: 'v104', sku: 'TSK-JRS-SHT-NVY-XL', sleeve: 'Pendek', color: 'Deep Navy', size: 'XL', price: 409000, stock: 6 },
      { id: 'v106', sku: 'TSK-JRS-SHT-RED-S', sleeve: 'Pendek', color: 'Crimson Red', size: 'S', price: 389000, stock: 5 },
      { id: 'v107', sku: 'TSK-JRS-SHT-RED-M', sleeve: 'Pendek', color: 'Crimson Red', size: 'M', price: 389000, stock: 7 },
      { id: 'v108', sku: 'TSK-JRS-SHT-RED-L', sleeve: 'Pendek', color: 'Crimson Red', size: 'L', price: 389000, stock: 6 },
      { id: 'v109', sku: 'TSK-JRS-SHT-RED-XL', sleeve: 'Pendek', color: 'Crimson Red', size: 'XL', price: 409000, stock: 4 }
    ],
    active: true,
    rating: 4.9,
    rating_count: 512,
    sold_count: 1420,
    location: 'Bandung',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    category_id: 2,
    sku: 'TSK-SH-002',
    name: 'Sepatu Ultimashow FX3632 Core Black',
    slug: 'sepatu-ultimashow-fx3632-core-black',
    badge: 'BEST SELLER',
    category_subtitle: 'Running • Pria/Wanita',
    description: 'Sepatu lari harian dengan bantalan Cloudfoam yang empuk dan upper tekstil mesh berventilasi. Sol luar karet tahan gesekan memberikan cengkeraman mantap di aspal maupun treadmill.',
    price: 850000,
    original_price: 1100000,
    cost_price: 520000,
    discount_percentage: 23,
    weight: 420, // gram
    stock: 32,
    stock_minimum: 6,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Tipe Bantalan': 'Responsive Cloudfoam Cushioning',
      'Upper': 'Breathable Engineered Mesh',
      'Outsole': 'High-wear Rubber Outsole',
      'Bobot': '240 gram (Ukuran 42)',
      'Penggunaan': 'Daily Running, Gym, Casual Sport'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Core Black', 'Solar Red', 'Triple White']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['40', '41', '42', '43', '44']
      }
    ],
    variants: [
      { id: 'v201', sku: 'TSK-SH-BLK-40', color: 'Core Black', size: '40', price: 850000, stock: 6 },
      { id: 'v202', sku: 'TSK-SH-BLK-41', color: 'Core Black', size: '41', price: 850000, stock: 8 },
      { id: 'v203', sku: 'TSK-SH-BLK-42', color: 'Core Black', size: '42', price: 850000, stock: 10 },
      { id: 'v204', sku: 'TSK-SH-BLK-43', color: 'Core Black', size: '43', price: 850000, stock: 5 },
      { id: 'v205', sku: 'TSK-SH-BLK-44', color: 'Core Black', size: '44', price: 850000, stock: 3 }
    ],
    active: true,
    rating: 4.95,
    rating_count: 248,
    sold_count: 610,
    location: 'Jakarta Selatan',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 3,
    category_id: 2,
    sku: 'TSK-SH-003',
    name: 'Tusko Hyperpace Carbon Marathon',
    slug: 'tusko-hyperpace-carbon-marathon',
    badge: 'PELAT KARBON',
    category_subtitle: 'Marathon • Pro',
    description: 'Sepatu lari jarak jauh kelas kompetisi dengan pelat karbon lengkung penuh (Full-Length Curved Carbon Plate) dan busa PEBA superkritis NitroFoam™. Menghasilkan energy return hingga 88% untuk memangkas catatan waktu half dan full marathon Anda.',
    price: 1299000,
    original_price: 1699000,
    cost_price: 780000,
    discount_percentage: 24,
    weight: 390, // gram
    stock: 24,
    stock_minimum: 5,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Tipe Bantalan': 'Supercritical PEBA NitroFoam™',
      'Pelat': 'Full-length Carbon Fiber Plate',
      'Bobot': '198 gram (Ukuran 42)',
      'Jarak Ideal': '10K, Half Marathon, Full Marathon'
    },
    variant_levels: [
      {
        name: 'Ukuran',
        code: 'size',
        options: ['41', '42', '43', '44']
      }
    ],
    variants: [
      { id: 'v301', sku: 'TSK-SH-CAR-41', size: '41', price: 1299000, stock: 6 },
      { id: 'v302', sku: 'TSK-SH-CAR-42', size: '42', price: 1299000, stock: 8 },
      { id: 'v303', sku: 'TSK-SH-CAR-43', size: '43', price: 1299000, stock: 6 },
      { id: 'v304', sku: 'TSK-SH-CAR-44', size: '44', price: 1299000, stock: 4 }
    ],
    active: true,
    rating: 4.98,
    rating_count: 190,
    sold_count: 420,
    location: 'Jakarta Barat',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 4,
    category_id: 1,
    sku: 'TSK-PNT-004',
    name: 'Celana Lari Kompresi 2-in-1 Pro',
    slug: 'celana-lari-kompresi-2-in-1-pro',
    badge: 'POPULER',
    category_subtitle: 'Training • Celana',
    description: 'Celana lari 2-in-1 dengan lapisan kompresi internal pencegah gesekan paha dan celana luar ultra-ringan berventilasi. Dilengkapi saku ritsleting anti-keringat untuk ponsel dan gantungan handuk mini di pinggang.',
    price: 249000,
    original_price: 329000,
    cost_price: 135000,
    discount_percentage: 24,
    weight: 220, // gram
    stock: 45,
    stock_minimum: 8,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Bahan Luar': '100% Recycled Ripstop Polyester',
      'Bahan Dalam': 'Compression Spandex 4-Way Elastic',
      'Kantung': '1 saku zipper waterproof + 1 saku HP liner',
      'Fit': 'Athletic Liner Fit'
    },
    variant_levels: [
      {
        name: 'Ukuran',
        code: 'size',
        options: ['M', 'L', 'XL']
      }
    ],
    variants: [
      { id: 'v401', sku: 'TSK-PNT-M', size: 'M', price: 249000, stock: 15 },
      { id: 'v402', sku: 'TSK-PNT-L', size: 'L', price: 249000, stock: 18 },
      { id: 'v403', sku: 'TSK-PNT-XL', size: 'XL', price: 249000, stock: 12 }
    ],
    active: true,
    rating: 4.88,
    rating_count: 215,
    sold_count: 780,
    location: 'Bandung',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-12T08:00:00Z',
  },
  {
    id: 10,
    category_id: 3,
    sku: 'TSK-BAG-004',
    name: 'Tusko Apex Gym & Travel Duffle Bag 48L Compartment',
    slug: 'tusko-apex-gym-duffle-bag-48l',
    badge: 'BEST SELLER',
    category_subtitle: 'Equipment • Gym & Travel',
    description: 'Tas olahraga multifungsi dengan kompartemen sepatu terpisah berventilasi udara dan saku tahan basah untuk pakaian berkeringat. Dibuat dari kain Cordura 600D water-repellent tahan gesekan, tali bahu empuk berteknologi air-cushion.',
    price: 349000,
    original_price: 450000,
    cost_price: 195000,
    discount_percentage: 22,
    weight: 650, // gram
    stock: 40,
    stock_minimum: 8,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Kapasitas': '48 Liter (54 x 28 x 26 cm)',
      'Material': 'Cordura 600D Hydrophobic Fabric',
      'Kompartemen Sepatu': 'Ya, dengan lubang ventilasi mesh',
      'Saku Wet-Clothes': 'Ya, TPU lining waterproof',
      'Beban Maksimal': '25 kg'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Matte Black', 'Tactical Green', 'Storm Navy']
      }
    ],
    variants: [
      { id: 'v1001', sku: 'TSK-BAG-BLK', color: 'Matte Black', price: 349000, stock: 20 },
      { id: 'v1002', sku: 'TSK-BAG-GRN', color: 'Tactical Green', price: 349000, stock: 12 },
      { id: 'v1003', sku: 'TSK-BAG-NVY', color: 'Storm Navy', price: 349000, stock: 8 }
    ],
    active: true,
    rating: 4.9,
    rating_count: 185,
    sold_count: 470,
    location: 'Surabaya',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-14T09:00:00Z',
  },
  {
    id: 5,
    category_id: 2,
    sku: 'TSK-FTS-005',
    name: 'Tusko StrikePrecision Pro Futsal Shoes Indoor Non-Marking',
    slug: 'tusko-strikeprecision-futsal-shoes',
    description: 'Sepatu futsal profesional indoor court dengan sol karet alam anti-slip Non-Marking. Bagian upper terbuat dari kulit sintetis mikro-fiber bertekstur kontrol bola yang presisi dan bantalan EVA responsif di tumit untuk meredam benturan lantai semen/lapangan vinyl.',
    price: 479000,
    original_price: 599000,
    cost_price: 275000,
    discount_percentage: 20,
    weight: 520, // gram
    stock: 28,
    stock_minimum: 5,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Outsole': 'Natural Gum Rubber Non-Marking',
      'Upper': 'Microfiber Polyurethane GripTech',
      'Insole': 'Cushioned Anatomical EVA Foam',
      'Medan Lapangan': 'Indoor Vinyl, Parquet, Taraflex & Semen Halus',
      'Ukuran': 'Standard Asian Fit'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Solar Red / White', 'Hyper Cyan / Black']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['39', '40', '41', '42', '43', '44']
      }
    ],
    variants: [
      { id: 'v501', sku: 'TSK-FTS-RED-39', color: 'Solar Red / White', size: '39', price: 479000, stock: 4 },
      { id: 'v502', sku: 'TSK-FTS-RED-40', color: 'Solar Red / White', size: '40', price: 479000, stock: 6 },
      { id: 'v503', sku: 'TSK-FTS-RED-41', color: 'Solar Red / White', size: '41', price: 479000, stock: 7 },
      { id: 'v504', sku: 'TSK-FTS-RED-42', color: 'Solar Red / White', size: '42', price: 479000, stock: 5 },
      { id: 'v505', sku: 'TSK-FTS-CYN-41', color: 'Hyper Cyan / Black', size: '41', price: 479000, stock: 4 },
      { id: 'v506', sku: 'TSK-FTS-CYN-42', color: 'Hyper Cyan / Black', size: '42', price: 479000, stock: 6 }
    ],
    active: true,
    rating: 4.88,
    rating_count: 140,
    sold_count: 360,
    location: 'Tangerang',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 6,
    category_id: 4,
    sku: 'TSK-SCK-006',
    name: 'Tusko ProGrip Anti-Slip Performance Sports Socks',
    slug: 'tusko-progrip-anti-slip-socks',
    description: 'Kaos kaki olahraga dengan bantalan karet silikon anti-slip grade medis di telapak kaki. Mengunci kaki di dalam sepatu saat akselerasi dan manuver tajam, mencegah lecet dan cedera pergelangan pada olahraga futsal, sepakbola, basket, dan lari.',
    price: 49000,
    original_price: 75000,
    cost_price: 22000,
    discount_percentage: 35,
    weight: 90, // gram
    stock: 150,
    stock_minimum: 25,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Bahan': '75% Katun Combed, 20% Polyester, 5% Spandex',
      'Teknologi Grip': 'Hexagonal Cushion Grip Silicone Pad',
      'Dukungan Arch': 'Compression Elastic Arch Support Band',
      'Panjang': 'Crew (Setengah Betis) / Ankle (Mata Kaki)',
      'Ukuran': 'All Size Dewasa (38 - 45)'
    },
    variant_levels: [
      {
        name: 'Tipe',
        code: 'sleeve',
        options: ['Crew (Betis)', 'Ankle (Mata Kaki)']
      },
      {
        name: 'Warna',
        code: 'color',
        options: ['Pure White', 'Triple Black', 'Fire Red']
      }
    ],
    variants: [
      { id: 'v601', sku: 'TSK-SCK-CRW-WHT', sleeve: 'Crew (Betis)', color: 'Pure White', price: 49000, stock: 40 },
      { id: 'v602', sku: 'TSK-SCK-CRW-BLK', sleeve: 'Crew (Betis)', color: 'Triple Black', price: 49000, stock: 45 },
      { id: 'v603', sku: 'TSK-SCK-ANK-WHT', sleeve: 'Ankle (Mata Kaki)', color: 'Pure White', price: 45000, stock: 35 },
      { id: 'v604', sku: 'TSK-SCK-ANK-BLK', sleeve: 'Ankle (Mata Kaki)', color: 'Triple Black', price: 45000, stock: 30 }
    ],
    active: true,
    rating: 4.96,
    rating_count: 820,
    sold_count: 2450,
    location: 'Bandung',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: false,
    created_at: '2026-02-20T11:00:00Z',
  },
  {
    id: 7,
    category_id: 1,
    sku: 'TSK-JKT-007',
    name: 'Tusko StormShield Ultralight Windbreaker Running Jacket',
    slug: 'tusko-stormshield-windbreaker-jacket',
    description: 'Jaket lari tahan angin dan percikan gerimis (DWR water-resistant) dengan bobot super ringan hanya 115 gram. Dapat dilipat masuk ke dalam sakunya sendiri (packable pocket). Dilengkapi reflektor 360 derajat bercahaya terang saat tersorot lampu kendaraan malam hari.',
    price: 359000,
    original_price: 459000,
    cost_price: 190000,
    discount_percentage: 22,
    weight: 120, // gram
    stock: 35,
    stock_minimum: 7,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Material': 'Ripstop 20D DWR Coated Ultralight Nylon',
      'Fitur': 'Packable into chest pocket, hood dengan drawcord',
      'Ventilasi': 'Laser perforations di ketiak dan punggung atas',
      'Resleting': 'YKK Reverse Coil water-resistant',
      'Visibilitas': '3M Scotchlite Reflective Elements 360°'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Neon Lime', 'Ghost Grey', 'Obsidian Black']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['S', 'M', 'L', 'XL']
      }
    ],
    variants: [
      { id: 'v701', sku: 'TSK-JKT-LME-M', color: 'Neon Lime', size: 'M', price: 359000, stock: 8 },
      { id: 'v702', sku: 'TSK-JKT-LME-L', color: 'Neon Lime', size: 'L', price: 359000, stock: 7 },
      { id: 'v703', sku: 'TSK-JKT-GRY-M', color: 'Ghost Grey', size: 'M', price: 359000, stock: 10 },
      { id: 'v704', sku: 'TSK-JKT-GRY-L', color: 'Ghost Grey', size: 'L', price: 359000, stock: 8 },
      { id: 'v705', sku: 'TSK-JKT-BLK-XL', color: 'Obsidian Black', size: 'XL', price: 379000, stock: 6 }
    ],
    active: true,
    rating: 4.92,
    rating_count: 195,
    sold_count: 530,
    location: 'Jakarta Barat',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-22T14:00:00Z',
  },
  {
    id: 8,
    category_id: 3,
    sku: 'TSK-BTL-008',
    name: 'Tusko HydroLock Insulated Stainless Steel Sports Bottle 850ml',
    slug: 'tusko-hydrolock-insulated-bottle-850ml',
    description: 'Botol minum olahraga vakum berdinding ganda (Double-wall vacuum insulation) dari baja tahan karat 18/8 food-grade. Menjaga air es tetap dingin hingga 24 jam dan minuman hangat hingga 12 jam tanpa embun di bagian luar botol.',
    price: 189000,
    original_price: 249000,
    cost_price: 95000,
    discount_percentage: 24,
    weight: 380, // gram
    stock: 65,
    stock_minimum: 15,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Kapasitas': '850 ml / 29 oz',
      'Material': 'Pro-grade 18/8 Stainless Steel (BPA & Toxin Free)',
      'Tutup': 'Sport Chug Cap dengan handle silikon portabel',
      'Insulasi': 'TempLock Double-wall Vacuum',
      'Lapisan Luar': 'Powder Coat Anti-Slip & Anti-Gores'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Matte Black', 'Brushed Silver', 'Army Olive', 'Cobalt Blue']
      }
    ],
    variants: [
      { id: 'v801', sku: 'TSK-BTL-BLK', color: 'Matte Black', price: 189000, stock: 25 },
      { id: 'v802', sku: 'TSK-BTL-SLV', color: 'Brushed Silver', price: 189000, stock: 15 },
      { id: 'v803', sku: 'TSK-BTL-OLV', color: 'Army Olive', price: 189000, stock: 15 },
      { id: 'v804', sku: 'TSK-BTL-BLU', color: 'Cobalt Blue', price: 189000, stock: 10 }
    ],
    active: true,
    rating: 4.94,
    rating_count: 420,
    sold_count: 1180,
    location: 'Jakarta Barat',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-25T15:00:00Z',
  },
  {
    id: 9,
    category_id: 4,
    sku: 'TSK-SHN-009',
    name: 'Tusko CarbonSpeed Pro Shin Guard Deker Pelindung Tulang Kering',
    slug: 'tusko-carbonspeed-pro-shin-guard',
    description: 'Pelindung tulang kering anatomis dengan pelat serat karbon komposit ultra-ringan dan lapisan dalam busa EVA peredam benturan tinggi. Dilengkapi compression sleeve berpori agar tidak bergeser saat bertanding.',
    price: 139000,
    original_price: 179000,
    cost_price: 65000,
    discount_percentage: 22,
    weight: 150, // gram
    stock: 75,
    stock_minimum: 15,
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Material Pelat': '100% Carbon Fiber Composite Plate',
      'Busa Dalam': 'High-density Shock Absorbing EVA Foam',
      'Aksesoris': 'Sleeve Kompresi Elastis Anti-Slip',
      'Standar Keselamatan': 'CE Approved Protective Gear'
    },
    variant_levels: [
      {
        name: 'Ukuran',
        code: 'size',
        options: ['S (Anak / Remaja)', 'M (Dewasa Medium)', 'L (Dewasa Pro)']
      }
    ],
    variants: [
      { id: 'v901', sku: 'TSK-SHN-S', size: 'S (Anak / Remaja)', price: 139000, stock: 20 },
      { id: 'v902', sku: 'TSK-SHN-M', size: 'M (Dewasa Medium)', price: 139000, stock: 35 },
      { id: 'v903', sku: 'TSK-SHN-L', size: 'L (Dewasa Pro)', price: 149000, stock: 20 }
    ],
    active: true,
    rating: 4.88,
    rating_count: 85,
    sold_count: 210,
    location: 'Bandung',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 10,
    category_id: 1,
    sku: 'TSK-BSL-010',
    name: 'Tusko Elite Thermal Compression Long Sleeve Base Layer',
    slug: 'tusko-elite-thermal-base-layer',
    description: 'Pakaian dalam kompresi lengan panjang dengan isolasi termal mikro dan jahitan flatlock anti-gesekan. Menjaga suhu otot tetap hangat dan mempercepat pemulihan sirkulasi darah saat berolahraga di cuaca dingin atau malam hari.',
    price: 219000,
    original_price: 289000,
    cost_price: 110000,
    discount_percentage: 24,
    weight: 220, // gram
    stock: 0,
    stock_minimum: 10,
    status: 'inactive', // Produk Draft / Nonaktif untuk simulasi toggle status admin
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Bahan': '85% Micro Thermal Polyester, 15% Elastane',
      'Fungsi': 'Graduated Compression & Moisture Wicking',
      'Jahitan': 'Flatlock Seamless Anti-Chafing',
      'Musim': 'All Season / Cold Climate'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Jet Black', 'Steel Grey']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['M', 'L', 'XL']
      }
    ],
    variants: [
      { id: 'v1001', sku: 'TSK-BSL-BLK-M', color: 'Jet Black', size: 'M', price: 219000, stock: 0 },
      { id: 'v1002', sku: 'TSK-BSL-BLK-L', color: 'Jet Black', size: 'L', price: 219000, stock: 0 },
      { id: 'v1003', sku: 'TSK-BSL-GRY-L', color: 'Steel Grey', size: 'L', price: 219000, stock: 0 }
    ],
    active: false,
    rating: 0,
    rating_count: 0,
    sold_count: 0,
    location: 'Jakarta Pusat',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: false,
    created_at: '2026-03-05T08:00:00Z',
  }
];

/**
 * Helper: Generate unique product SKU
 */
export function generateProductSku(categorySlug = 'gen', name = '') {
  const catCode = categorySlug.slice(0, 3).toUpperCase();
  const nameCode = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'ITM';
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `TSK-${catCode}-${nameCode}-${randomNum}`;
}

/**
 * Helper: Add new mock product to state list
 */
export function createMockProduct(productData) {
  const newId = Date.now();
  const sku = productData.sku || generateProductSku(productData.slug || 'prd', productData.name);
  const slug = productData.slug || (productData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Calculate total stock from variants if provided
  let calculatedStock = productData.stock || 0;
  if (Array.isArray(productData.variants) && productData.variants.length > 0) {
    calculatedStock = productData.variants.reduce((total, v) => total + (Number(v.stock) || 0), 0);
  }

  return {
    id: newId,
    category_id: Number(productData.category_id) || 1,
    sku,
    name: productData.name || 'Produk Baru Tanpa Nama',
    slug,
    description: productData.description || 'Deskripsi produk belum diisi.',
    price: Number(productData.price) || 0,
    original_price: Number(productData.original_price) || Number(productData.price) || 0,
    cost_price: Number(productData.cost_price) || Math.round((Number(productData.price) || 0) * 0.6),
    discount_percentage: productData.original_price > productData.price
      ? Math.round(((productData.original_price - productData.price) / productData.original_price) * 100)
      : 0,
    weight: Number(productData.weight) || 250,
    stock: calculatedStock,
    stock_minimum: Number(productData.stock_minimum) || 5,
    status: productData.status || 'active',
    active: productData.status !== 'inactive',
    image_url: productData.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    gallery: productData.gallery?.length ? productData.gallery : [
      productData.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: productData.specifications || {},
    variant_levels: productData.variant_levels || [],
    variants: productData.variants || [],
    rating: 5.0,
    rating_count: 0,
    sold_count: 0,
    location: productData.location || 'Jakarta Barat',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: Boolean(productData.free_shipping),
    created_at: new Date().toISOString()
  };
}

/**
 * Helper: Update mock product
 */
export function updateMockProduct(productList, id, updatedData) {
  return productList.map((item) => {
    if (item.id === id) {
      const merged = { ...item, ...updatedData };
      if (updatedData.variants) {
        merged.stock = updatedData.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
      }
      if (updatedData.status) {
        merged.active = updatedData.status === 'active';
      }
      return merged;
    }
    return item;
  });
}

/**
 * Helper: Delete mock product
 */
export function deleteMockProduct(productList, id) {
  return productList.filter((item) => item.id !== id);
}

/**
 * Helper: Toggle mock product active status
 */
export function toggleMockProductStatus(productList, id) {
  return productList.map((item) => {
    if (item.id === id) {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      return {
        ...item,
        status: nextStatus,
        active: nextStatus === 'active'
      };
    }
    return item;
  });
}

/**
 * Helper: Filter mock products
 */
export function filterMockProducts(productList, {
  query = '',
  categoryId = null,
  status = 'all', // 'all' | 'active' | 'inactive'
  minPrice = null,
  maxPrice = null,
  sortBy = 'relevant'
} = {}) {
  return productList.filter((prod) => {
    // Search query
    if (query) {
      const q = query.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSku = prod.sku?.toLowerCase().includes(q);
      const matchDesc = prod.description?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchDesc) return false;
    }

    // Category
    if (categoryId && prod.category_id !== Number(categoryId)) {
      return false;
    }

    // Status
    if (status !== 'all') {
      if (status === 'active' && prod.status !== 'active') return false;
      if (status === 'inactive' && prod.status !== 'inactive') return false;
    }

    // Price range
    if (minPrice && prod.price < Number(minPrice)) return false;
    if (maxPrice && prod.price > Number(maxPrice)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'lowest_price') return a.price - b.price;
    if (sortBy === 'highest_price') return b.price - a.price;
    if (sortBy === 'highest_rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'most_sold') return (b.sold_count || 0) - (a.sold_count || 0);
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return 0; // relevant
  });
}

