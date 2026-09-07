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
    stock_minimum: 15,
    warehouse_bin: 'Gudang A - Rak B02',
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
    stock_minimum: 10,
    warehouse_bin: 'Gudang A - Rak S05',
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
    stock_minimum: 15,
    warehouse_bin: 'Gudang A - Rak C01',
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
    stock_minimum: 10,
    warehouse_bin: 'Gudang B - Rak D04',
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
    stock_minimum: 12,
    warehouse_bin: 'Gudang B - Rak R01',
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
    stock_minimum: 30,
    warehouse_bin: 'Gudang A - Rak K08',
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
    stock_minimum: 8,
    warehouse_bin: 'Gudang A - Rak J03',
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
    stock_minimum: 15,
    warehouse_bin: 'Gudang B - Rak B11',
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
    type: 'in', // 'in' | 'out' | 'adjustment'
    quantity: 50,
    previous_stock: 0,
    current_stock: 50,
    reference: 'PO-RESTOCK-20260902',
    notes: 'Penerimaan barang dari konveksi batch 3',
    created_at: '2026-09-02T10:00:00Z',
    operator: 'Gudang / Budi'
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
    operator: 'Sistem Otomatis'
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
    operator: 'Sistem Otomatis'
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
    operator: 'QC / Siska'
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
    operator: 'Sistem Otomatis'
  }
];
