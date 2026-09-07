export const categories = [
  { id: 1, name: 'Jersey & Apparel', slug: 'jersey-apparel', icon: 'Shirt' },
  { id: 2, name: 'Sepatu Olahraga', slug: 'sepatu-olahraga', icon: 'Footprints' },
  { id: 3, name: 'Peralatan & Gym', slug: 'peralatan-gym', icon: 'Dumbbell' },
  { id: 4, name: 'Aksesoris & Deker', slug: 'aksesoris-deker', icon: 'Shield' },
  { id: 5, name: 'Running & Marathon', slug: 'running-marathon', icon: 'Zap' },
  { id: 6, name: 'Futsal & Sepakbola', slug: 'futsal-sepakbola', icon: 'Trophy' },
  { id: 7, name: 'Training & Fitness', slug: 'training-fitness', icon: 'Activity' },
  { id: 8, name: 'Koleksi Pro Player', slug: 'koleksi-pro-player', icon: 'Sparkles' },
];

export const mockProducts = [
  {
    id: 1,
    category_id: 1,
    name: 'Tusko Pro Matchday Football Jersey 2026 AeroTech',
    slug: 'tusko-pro-matchday-jersey-2026',
    description: 'Jersey pertandingan pro grade dengan teknologi sirkulasi udara AeroTech™ yang cepat menyerap keringat dan menjaga tubuh tetap sejuk saat intensitas tinggi. Jahitan elastis 4-way stretch ergonomis dan panel ventilasi laser-cut di area punggung untuk mobilitas optimal atlet.',
    price: 389000,
    original_price: 499000,
    discount_percentage: 22,
    stock: 48,
    stock_minimum: 10,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508215885820-4523e431397e?auto=format&fit=crop&w=800&q=80'
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
        options: ['S', 'M', 'L', 'XL', 'XXL']
      }
    ],
    variants: [
      { id: 'v101', sku: 'TSK-JRS-SHT-NVY-S', sleeve: 'Pendek', color: 'Deep Navy', size: 'S', price: 389000, stock: 8 },
      { id: 'v102', sku: 'TSK-JRS-SHT-NVY-M', sleeve: 'Pendek', color: 'Deep Navy', size: 'M', price: 389000, stock: 12 },
      { id: 'v103', sku: 'TSK-JRS-SHT-NVY-L', sleeve: 'Pendek', color: 'Deep Navy', size: 'L', price: 389000, stock: 10 },
      { id: 'v104', sku: 'TSK-JRS-SHT-NVY-XL', sleeve: 'Pendek', color: 'Deep Navy', size: 'XL', price: 409000, stock: 6 },
      { id: 'v105', sku: 'TSK-JRS-SHT-NVY-XXL', sleeve: 'Pendek', color: 'Deep Navy', size: 'XXL', price: 424000, stock: 4 },
      { id: 'v106', sku: 'TSK-JRS-SHT-RED-S', sleeve: 'Pendek', color: 'Crimson Red', size: 'S', price: 389000, stock: 5 },
      { id: 'v107', sku: 'TSK-JRS-SHT-RED-M', sleeve: 'Pendek', color: 'Crimson Red', size: 'M', price: 389000, stock: 7 },
      { id: 'v108', sku: 'TSK-JRS-SHT-RED-L', sleeve: 'Pendek', color: 'Crimson Red', size: 'L', price: 389000, stock: 6 },
      { id: 'v109', sku: 'TSK-JRS-SHT-RED-XL', sleeve: 'Pendek', color: 'Crimson Red', size: 'XL', price: 409000, stock: 4 },
      { id: 'v110', sku: 'TSK-JRS-SHT-RED-XXL', sleeve: 'Pendek', color: 'Crimson Red', size: 'XXL', price: 424000, stock: 2 },
      { id: 'v111', sku: 'TSK-JRS-LNG-NVY-M', sleeve: 'Panjang', color: 'Deep Navy', size: 'M', price: 419000, stock: 5 },
      { id: 'v112', sku: 'TSK-JRS-LNG-NVY-L', sleeve: 'Panjang', color: 'Deep Navy', size: 'L', price: 419000, stock: 6 },
      { id: 'v113', sku: 'TSK-JRS-LNG-NVY-XL', sleeve: 'Panjang', color: 'Deep Navy', size: 'XL', price: 439000, stock: 3 },
      { id: 'v114', sku: 'TSK-JRS-LNG-BLK-M', sleeve: 'Panjang', color: 'Triple Black', size: 'M', price: 419000, stock: 8 },
      { id: 'v115', sku: 'TSK-JRS-LNG-BLK-L', sleeve: 'Panjang', color: 'Triple Black', size: 'L', price: 419000, stock: 5 },
      { id: 'v116', sku: 'TSK-JRS-LNG-BLK-XL', sleeve: 'Panjang', color: 'Triple Black', size: 'XL', price: 439000, stock: 4 }
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
    name: 'Tusko HyperPace Carbon Carbon-Plate Running Shoes',
    slug: 'tusko-hyperpace-carbon-running-shoes',
    description: 'Sepatu lari jarak jauh kelas kompetisi dengan pelat karbon lengkung penuh (Full-Length Curved Carbon Plate) dan busa PEBA superkritis NitroFoam™. Menghasilkan energy return hingga 88% untuk memangkas catatan waktu half dan full marathon Anda.',
    price: 1299000,
    original_price: 1699000,
    discount_percentage: 23,
    stock: 32,
    stock_minimum: 6,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Tipe Bantalan': 'Supercritical PEBA NitroFoam™',
      'Pelat': 'Full-length Carbon Fiber Plate',
      'Drop': '8 mm (Heel: 38mm / Forefoot: 30mm)',
      'Bobot': '198 gram (Ukuran 42)',
      'Outsole': 'TuskoGrip High-traction Rubber',
      'Jarak Ideal': '10K, Half Marathon, Full Marathon'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Neon Volt', 'Eclipse Black', 'Arctic White']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['39', '40', '41', '42', '43', '44', '45']
      }
    ],
    variants: [
      { id: 'v201', sku: 'TSK-SH-VLT-39', color: 'Neon Volt', size: '39', price: 1299000, stock: 3 },
      { id: 'v202', sku: 'TSK-SH-VLT-40', color: 'Neon Volt', size: '40', price: 1299000, stock: 5 },
      { id: 'v203', sku: 'TSK-SH-VLT-41', color: 'Neon Volt', size: '41', price: 1299000, stock: 7 },
      { id: 'v204', sku: 'TSK-SH-VLT-42', color: 'Neon Volt', size: '42', price: 1299000, stock: 8 },
      { id: 'v205', sku: 'TSK-SH-VLT-43', color: 'Neon Volt', size: '43', price: 1299000, stock: 6 },
      { id: 'v206', sku: 'TSK-SH-VLT-44', color: 'Neon Volt', size: '44', price: 1349000, stock: 4 },
      { id: 'v207', sku: 'TSK-SH-BLK-40', color: 'Eclipse Black', size: '40', price: 1299000, stock: 4 },
      { id: 'v208', sku: 'TSK-SH-BLK-41', color: 'Eclipse Black', size: '41', price: 1299000, stock: 6 },
      { id: 'v209', sku: 'TSK-SH-BLK-42', color: 'Eclipse Black', size: '42', price: 1299000, stock: 8 },
      { id: 'v210', sku: 'TSK-SH-BLK-43', color: 'Eclipse Black', size: '43', price: 1299000, stock: 5 },
      { id: 'v211', sku: 'TSK-SH-WHT-41', color: 'Arctic White', size: '41', price: 1299000, stock: 4 },
      { id: 'v212', sku: 'TSK-SH-WHT-42', color: 'Arctic White', size: '42', price: 1299000, stock: 5 }
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
    category_id: 1,
    name: 'Tusko AeroDry Athletic Track Training Pants',
    slug: 'tusko-aerodry-training-pants',
    description: 'Celana training slim-fit tapered dengan bahan stretch elastis yang nyaman untuk pemanasan, lari, maupun latihan di gym. Dilengkapi saku ritsleting anti-air untuk ponsel dan kunci, serta ritsleting pergelangan kaki untuk kemudahan memakai sepatu.',
    price: 249000,
    original_price: 329000,
    discount_percentage: 24,
    stock: 55,
    stock_minimum: 12,
    image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Bahan': '88% Polyester, 12% Spandex 4-Way Stretch',
      'Kantung': '2 kantong samping resleting YKK auto-lock',
      'Pinggang': 'Elastic waistband dengan tali serut internal',
      'Fit': 'Tapered Sport Fit',
      'Fitur': 'Reflective strip di betis untuk keselamatan malam hari'
    },
    variant_levels: [
      {
        name: 'Warna',
        code: 'color',
        options: ['Stealth Black', 'Charcoal Grey', 'Dark Olive']
      },
      {
        name: 'Ukuran',
        code: 'size',
        options: ['S', 'M', 'L', 'XL']
      }
    ],
    variants: [
      { id: 'v301', sku: 'TSK-PNT-BLK-S', color: 'Stealth Black', size: 'S', price: 249000, stock: 10 },
      { id: 'v302', sku: 'TSK-PNT-BLK-M', color: 'Stealth Black', size: 'M', price: 249000, stock: 15 },
      { id: 'v303', sku: 'TSK-PNT-BLK-L', color: 'Stealth Black', size: 'L', price: 249000, stock: 12 },
      { id: 'v304', sku: 'TSK-PNT-BLK-XL', color: 'Stealth Black', size: 'XL', price: 269000, stock: 8 },
      { id: 'v305', sku: 'TSK-PNT-GRY-M', color: 'Charcoal Grey', size: 'M', price: 249000, stock: 9 },
      { id: 'v306', sku: 'TSK-PNT-GRY-L', color: 'Charcoal Grey', size: 'L', price: 249000, stock: 8 }
    ],
    active: true,
    rating: 4.85,
    rating_count: 310,
    sold_count: 890,
    location: 'Bandung',
    seller_name: 'Tusko Official Flagship',
    is_official: true,
    free_shipping: true,
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 4,
    category_id: 3,
    name: 'Tusko Apex Gym & Travel Duffle Bag 48L Compartment',
    slug: 'tusko-apex-gym-duffle-bag-48l',
    description: 'Tas olahraga multifungsi dengan kompartemen sepatu terpisah berventilasi udara dan saku tahan basah untuk pakaian berkeringat. Dibuat dari kain Cordura 600D water-repellent tahan gesekan, tali bahu empuk berteknologi air-cushion.',
    price: 349000,
    original_price: 450000,
    discount_percentage: 22,
    stock: 40,
    stock_minimum: 8,
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
      { id: 'v401', sku: 'TSK-BAG-BLK', color: 'Matte Black', price: 349000, stock: 20 },
      { id: 'v402', sku: 'TSK-BAG-GRN', color: 'Tactical Green', price: 349000, stock: 12 },
      { id: 'v403', sku: 'TSK-BAG-NVY', color: 'Storm Navy', price: 349000, stock: 8 }
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
    name: 'Tusko StrikePrecision Pro Futsal Shoes Indoor Non-Marking',
    slug: 'tusko-strikeprecision-futsal-shoes',
    description: 'Sepatu futsal profesional indoor court dengan sol karet alam anti-slip Non-Marking. Bagian upper terbuat dari kulit sintetis mikro-fiber bertekstur kontrol bola yang presisi dan bantalan EVA responsif di tumit untuk meredam benturan lantai semen/lapangan vinyl.',
    price: 479000,
    original_price: 599000,
    discount_percentage: 20,
    stock: 28,
    stock_minimum: 5,
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
    name: 'Tusko ProGrip Anti-Slip Performance Sports Socks',
    slug: 'tusko-progrip-anti-slip-socks',
    description: 'Kaos kaki olahraga dengan bantalan karet silikon anti-slip grade medis di telapak kaki. Mengunci kaki di dalam sepatu saat akselerasi dan manuver tajam, mencegah lecet dan cedera pergelangan pada olahraga futsal, sepakbola, basket, dan lari.',
    price: 49000,
    original_price: 75000,
    discount_percentage: 35,
    stock: 150,
    stock_minimum: 25,
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
    name: 'Tusko StormShield Ultralight Windbreaker Running Jacket',
    slug: 'tusko-stormshield-windbreaker-jacket',
    description: 'Jaket lari tahan angin dan percikan gerimis (DWR water-resistant) dengan bobot super ringan hanya 115 gram. Dapat dilipat masuk ke dalam sakunya sendiri (packable pocket). Dilengkapi reflektor 360 derajat bercahaya terang saat tersorot lampu kendaraan malam hari.',
    price: 359000,
    original_price: 459000,
    discount_percentage: 22,
    stock: 35,
    stock_minimum: 7,
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
    name: 'Tusko HydroLock Insulated Stainless Steel Sports Bottle 850ml',
    slug: 'tusko-hydrolock-insulated-bottle-850ml',
    description: 'Botol minum olahraga vakum berdinding ganda (Double-wall vacuum insulation) dari baja tahan karat 18/8 food-grade. Menjaga air es tetap dingin hingga 24 jam dan minuman hangat hingga 12 jam tanpa embun di bagian luar botol.',
    price: 189000,
    original_price: 249000,
    discount_percentage: 24,
    stock: 65,
    stock_minimum: 15,
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
  }
];
