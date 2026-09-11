/**
 * Mock Data Manajemen Stok (Inventory & Stock Movements)
 * Sesuai PRD Tabel `products` & kebutuhan pencatatan stok
 */

export const stockStatusOptions = [
  { id: 'all', label: 'Semua Status Stok' },
  { id: 'safe', label: 'Stok Aman' },
  { id: 'low', label: 'Stok Menipis (< Min)' },
  { id: 'out_of_stock', label: 'Stok Habis (0)' }
];

export const initialWarehouses = [
  {
    id: 1,
    code: 'WH-CGK-01',
    name: 'Gudang Utama Cakung (Jakarta)',
    address: 'Kawasan Industri Pulogadung / Cakung, Jakarta Timur',
    manager: 'Budi Hartono',
    phone: '0812-3456-7890',
    capacity_sqm: 1200,
    is_primary: true
  },
  {
    id: 2,
    code: 'WH-SUB-01',
    name: 'Gudang Hub Rungkut (Surabaya)',
    address: 'Kawasan Industri SIER Rungkut, Surabaya, Jawa Timur',
    manager: 'Siti Rahma',
    phone: '0813-9876-5432',
    capacity_sqm: 650,
    is_primary: false
  },
  {
    id: 3,
    code: 'WH-MES-01',
    name: 'Gudang Hub Medan (Sumatera)',
    address: 'KIM 2 Mabar, Deli Serdang / Medan, Sumatera Utara',
    manager: 'Faisal Tanjung',
    phone: '0821-4567-8901',
    capacity_sqm: 400,
    is_primary: false
  }
];

export const initialInventory = [
  {
    id: 1,
    sku: 'TSK-JRS-2026-AERO',
    name: 'Tusko Pro Matchday Football Jersey 2026 AeroTech',
    category_id: 1,
    category_name: 'Jersey & Apparel',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    cost_price: 210000,
    selling_price: 389000,
    stock: 48,
    reserved_stock: 4,
    stock_minimum: 15,
    warehouse_id: 1,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    warehouse_bin: 'Rak B02-A',
    last_restock_at: '2026-09-02T10:00:00Z',
    active: true
  },
  {
    id: 2,
    sku: 'TSK-SH-HYP-CARB',
    name: 'Tusko HyperPace Carbon Carbon-Plate Running Shoes',
    category_id: 2,
    category_name: 'Sepatu Olahraga',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    cost_price: 780000,
    selling_price: 1299000,
    stock: 32,
    reserved_stock: 3,
    stock_minimum: 10,
    warehouse_id: 1,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    warehouse_bin: 'Rak S05-C',
    last_restock_at: '2026-08-28T14:30:00Z',
    active: true
  },
  {
    id: 3,
    sku: 'TSK-PNT-TPRD-TRN',
    name: 'Tusko Core Performance Tapered Training Pants',
    category_id: 1,
    category_name: 'Jersey & Apparel',
    image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
    cost_price: 135000,
    selling_price: 249000,
    stock: 8,
    reserved_stock: 2,
    stock_minimum: 15,
    warehouse_id: 1,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    warehouse_bin: 'Rak C01-B',
    last_restock_at: '2026-08-20T11:15:00Z',
    active: true
  },
  {
    id: 4,
    sku: 'TSK-BAG-APX-DFL',
    name: 'Tusko Apex Gym & Travel Duffle Bag 48L Compartment',
    category_id: 3,
    category_name: 'Peralatan & Gym',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    cost_price: 160000,
    selling_price: 299000,
    stock: 14,
    reserved_stock: 1,
    stock_minimum: 10,
    warehouse_id: 2,
    warehouse_code: 'WH-SUB-01',
    warehouse_name: 'Gudang Hub Rungkut (Surabaya)',
    warehouse_bin: 'Rak D04-A',
    last_restock_at: '2026-08-25T09:00:00Z',
    active: true
  },
  {
    id: 5,
    sku: 'TSK-GMB-LAT-BND',
    name: 'Tusko Pro Heavy Duty Resistance Band Set 5-Tubes',
    category_id: 3,
    category_name: 'Peralatan & Gym',
    image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    cost_price: 65000,
    selling_price: 139000,
    stock: 3,
    reserved_stock: 0,
    stock_minimum: 12,
    warehouse_id: 2,
    warehouse_code: 'WH-SUB-01',
    warehouse_name: 'Gudang Hub Rungkut (Surabaya)',
    warehouse_bin: 'Rak R01-C',
    last_restock_at: '2026-08-15T16:00:00Z',
    active: true
  },
  {
    id: 6,
    sku: 'TSK-SCK-HEX-GRP',
    name: 'Tusko Elite Anti-Slip Cushioned Grip Sports Socks',
    category_id: 1,
    category_name: 'Jersey & Apparel',
    image_url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80',
    cost_price: 22000,
    selling_price: 49000,
    stock: 150,
    reserved_stock: 12,
    stock_minimum: 30,
    warehouse_id: 1,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    warehouse_bin: 'Rak K08-D',
    last_restock_at: '2026-09-04T13:00:00Z',
    active: true
  },
  {
    id: 7,
    sku: 'TSK-JKT-STRM-WND',
    name: 'Tusko StormShield Ultralight Windbreaker Running Jacket',
    category_id: 1,
    category_name: 'Jersey & Apparel',
    image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    cost_price: 195000,
    selling_price: 359000,
    stock: 0,
    reserved_stock: 0,
    stock_minimum: 8,
    warehouse_id: 1,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    warehouse_bin: 'Rak J03-B',
    last_restock_at: '2026-08-01T10:00:00Z',
    active: false
  },
  {
    id: 8,
    sku: 'TSK-BTL-HDR-850',
    name: 'Tusko HydroLock Insulated Stainless Steel Sports Bottle 850ml',
    category_id: 3,
    category_name: 'Peralatan & Gym',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    cost_price: 95000,
    selling_price: 189000,
    stock: 65,
    reserved_stock: 5,
    stock_minimum: 15,
    warehouse_id: 3,
    warehouse_code: 'WH-MES-01',
    warehouse_name: 'Gudang Hub Medan (Sumatera)',
    warehouse_bin: 'Rak B11-E',
    last_restock_at: '2026-08-29T15:20:00Z',
    active: true
  }
];

export const initialStockLogs = [
  {
    id: 101,
    product_id: 1,
    sku: 'TSK-JRS-2026-AERO',
    product_name: 'Tusko Pro Matchday Football Jersey 2026 AeroTech',
    type: 'in', // 'in' | 'out' | 'adjustment' | 'opname'
    quantity: 50,
    previous_stock: 0,
    current_stock: 50,
    reference: 'PO-RESTOCK-20260902',
    notes: 'Penerimaan barang dari vendor batch 3',
    created_at: '2026-09-02T10:00:00Z',
    operator: 'Gudang / Budi',
    warehouse_code: 'WH-CGK-01'
  },
  {
    id: 102,
    product_id: 1,
    sku: 'TSK-JRS-2026-AERO',
    product_name: 'Tusko Pro Matchday Football Jersey 2026 AeroTech',
    type: 'out',
    quantity: 2,
    previous_stock: 50,
    current_stock: 48,
    reference: 'INV/20260906/TK/771923',
    notes: 'Terjual pada pesanan pelanggan',
    created_at: '2026-09-06T14:20:00Z',
    operator: 'Sistem Otomatis',
    warehouse_code: 'WH-CGK-01'
  },
  {
    id: 103,
    product_id: 3,
    sku: 'TSK-PNT-TPRD-TRN',
    product_name: 'Tusko Core Performance Tapered Training Pants',
    type: 'out',
    quantity: 5,
    previous_stock: 13,
    current_stock: 8,
    reference: 'INV/20260905/TK/554812',
    notes: 'Pesanan partai komunitas runners',
    created_at: '2026-09-05T10:15:00Z',
    operator: 'Sistem Otomatis',
    warehouse_code: 'WH-CGK-01'
  },
  {
    id: 104,
    product_id: 5,
    sku: 'TSK-GMB-LAT-BND',
    product_name: 'Tusko Pro Heavy Duty Resistance Band Set 5-Tubes',
    type: 'adjustment',
    quantity: -2,
    previous_stock: 5,
    current_stock: 3,
    reference: 'ADJ-DEFECT-0904',
    notes: 'Afkir barang sampel sobek saat uji tarik beban',
    created_at: '2026-09-04T16:30:00Z',
    operator: 'QC / Siska',
    warehouse_code: 'WH-SUB-01'
  },
  {
    id: 105,
    product_id: 7,
    sku: 'TSK-JKT-STRM-WND',
    product_name: 'Tusko StormShield Ultralight Windbreaker Running Jacket',
    type: 'out',
    quantity: 8,
    previous_stock: 8,
    current_stock: 0,
    reference: 'INV/20260901/TK/119284',
    notes: 'Habis terjual flash sale awal bulan',
    created_at: '2026-09-01T09:00:00Z',
    operator: 'Sistem Otomatis',
    warehouse_code: 'WH-CGK-01'
  }
];

export const initialStockReservations = [
  {
    id: 'RSV-20260911-001',
    order_number: 'ORD/20260911/TK/882103',
    customer_name: 'Budi Santoso (Member)',
    sku: 'TSK-JRS-2026-AERO',
    product_name: 'Tusko Pro Matchday Football Jersey 2026 AeroTech',
    variant: 'Size L / Home Red',
    quantity: 2,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    status: 'locked_checkout', // 'locked_checkout' | 'packing_ready' | 'expired'
    expires_at: '2026-09-11T18:45:00Z',
    created_at: '2026-09-11T16:45:00Z'
  },
  {
    id: 'RSV-20260911-002',
    order_number: 'ORD/20260911/TK/882104',
    customer_name: 'Dewi Lestari (Member)',
    sku: 'TSK-SH-HYP-CARB',
    product_name: 'Tusko HyperPace Carbon Carbon-Plate Running Shoes',
    variant: 'Size 42 / Volt White',
    quantity: 1,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    status: 'packing_ready',
    expires_at: '2026-09-12T10:00:00Z',
    created_at: '2026-09-11T15:20:00Z'
  },
  {
    id: 'RSV-20260911-003',
    order_number: 'ORD/20260911/TK/882105',
    customer_name: 'Andi Wijaya (Member)',
    sku: 'TSK-SCK-HEX-GRP',
    product_name: 'Tusko Elite Anti-Slip Cushioned Grip Sports Socks',
    variant: 'All Size / Black',
    quantity: 6,
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    status: 'locked_checkout',
    expires_at: '2026-09-11T18:30:00Z',
    created_at: '2026-09-11T16:30:00Z'
  },
  {
    id: 'RSV-20260911-004',
    order_number: 'ORD/20260911/TK/882106',
    customer_name: 'Rina Kusuma',
    sku: 'TSK-BTL-HDR-850',
    product_name: 'Tusko HydroLock Insulated Stainless Steel Sports Bottle 850ml',
    variant: '850ml / Matte Black',
    quantity: 2,
    warehouse_code: 'WH-MES-01',
    warehouse_name: 'Gudang Hub Medan (Sumatera)',
    status: 'locked_checkout',
    expires_at: '2026-09-11T18:50:00Z',
    created_at: '2026-09-11T16:50:00Z'
  }
];

export const initialStockOpnames = [
  {
    id: 'OPN-20260908-01',
    opname_number: 'OPN/20260908/CGK/001',
    title: 'Audit Fisik Triwulan 3 - Apparel & Jersey',
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    audited_by: 'QC Siska & Tim Gudang',
    status: 'completed', // 'in_progress' | 'completed' | 'cancelled'
    started_at: '2026-09-08T09:00:00Z',
    completed_at: '2026-09-08T16:30:00Z',
    total_items_audited: 8,
    discrepancy_count: 2,
    total_discrepancy_value: -195000,
    notes: 'Ditemukan 2 unit sampel rusak pada rak display apparel.',
    items: [
      {
        product_id: 1,
        sku: 'TSK-JRS-2026-AERO',
        name: 'Tusko Pro Matchday Football Jersey 2026 AeroTech',
        system_stock: 50,
        physical_stock: 50,
        difference: 0,
        notes: 'Cocok 100%'
      },
      {
        product_id: 3,
        sku: 'TSK-PNT-TPRD-TRN',
        name: 'Tusko Core Performance Tapered Training Pants',
        system_stock: 9,
        physical_stock: 8,
        difference: -1,
        notes: '1 unit jahitan lepas / cacat produksi'
      }
    ]
  },
  {
    id: 'OPN-20260911-02',
    opname_number: 'OPN/20260911/CGK/002',
    title: 'Audit Rutin Mingguan Sepatu & Aksesoris',
    warehouse_code: 'WH-CGK-01',
    warehouse_name: 'Gudang Utama Cakung (Jakarta)',
    audited_by: 'Budi Hartono (Kepala Gudang)',
    status: 'in_progress',
    started_at: '2026-09-11T13:00:00Z',
    completed_at: null,
    total_items_audited: 5,
    discrepancy_count: 0,
    total_discrepancy_value: 0,
    notes: 'Sedang berlangsung verifikasi rak sepatu S01 - S08',
    items: [
      {
        product_id: 2,
        sku: 'TSK-SH-HYP-CARB',
        name: 'Tusko HyperPace Carbon Carbon-Plate Running Shoes',
        system_stock: 32,
        physical_stock: 32,
        difference: 0,
        notes: 'Terverifikasi'
      }
    ]
  }
];
