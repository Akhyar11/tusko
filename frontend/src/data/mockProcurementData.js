/**
 * Mock Data untuk Modul Pengadaan & Vendor (Procurement ERP) Tusko
 */

export const initialVendors = [
  {
    id: 1,
    code: 'VND-ATLK-01',
    company_name: 'PT Tekstil Atletik Prima',
    contact_person: 'Budi Santoso',
    email: 'budi@atletikprima.co.id',
    phone: '021-78901234',
    address: 'Kawasan Industri Jababeka Blok C-12, Cikarang',
    payment_terms_days: 30,
    bank_account_info: 'BCA 7788990011 a.n PT Tekstil Atletik Prima',
    categories: ['Apparel', 'Jersey', 'Running Shorts'],
    is_active: true,
    rating: 4.8
  },
  {
    id: 2,
    code: 'VND-SEPATU-02',
    company_name: 'CV Langkah Juara Footwear',
    contact_person: 'Siti Rahmawati',
    email: 'sales@langkahjuara.com',
    phone: '022-66554433',
    address: 'Jl. Raya Cibaduyut No. 108, Bandung',
    payment_terms_days: 45,
    bank_account_info: 'Mandiri 1310099887766 a.n CV Langkah Juara',
    categories: ['Footwear', 'Insole', 'Running Shoes'],
    is_active: true,
    rating: 4.9
  },
  {
    id: 3,
    code: 'VND-GEAR-03',
    company_name: 'PT Gear Pro Indonesia',
    contact_person: 'Hendra Wijaya',
    email: 'hendra@gearpro.id',
    phone: '031-88776655',
    address: 'Kawasan Industri Rungkut Megah No. 54, Surabaya',
    payment_terms_days: 14,
    bank_account_info: 'BNI 0233445566 a.n PT Gear Pro Indonesia',
    categories: ['Accessories', 'Gym Bag', 'Wristband'],
    is_active: true,
    rating: 4.7
  }
];

export const initialPurchaseOrders = [
  {
    id: 1,
    po_number: 'PO-202609-001',
    vendor_id: 1,
    vendor_name: 'PT Tekstil Atletik Prima',
    warehouse_id: 1,
    warehouse_name: 'Gudang Pusat Tusko Jakarta (GDG-JKT-PST)',
    status: 'received', // 'draft', 'approved', 'sent', 'partially_received', 'received', 'cancelled'
    order_date: '2026-09-01',
    expected_delivery_date: '2026-09-07',
    total_amount: 14850000,
    notes: 'Restock jersey atletik edisi performa tinggi Q3.',
    items: [
      {
        id: 101,
        product_name: 'Tusko SpeedTech Running Jersey',
        variant_name: 'Lengan Pendek / Hitam / L',
        sku: 'TSK-JRS-BLK-L',
        ordered_quantity: 60,
        received_quantity: 60,
        unit_price: 110000,
        subtotal: 6600000
      },
      {
        id: 102,
        product_name: 'Tusko SpeedTech Running Jersey',
        variant_name: 'Lengan Pendek / Merah / XL',
        sku: 'TSK-JRS-RED-XL',
        ordered_quantity: 75,
        received_quantity: 75,
        unit_price: 110000,
        subtotal: 8250000
      }
    ]
  },
  {
    id: 2,
    po_number: 'PO-202609-002',
    vendor_id: 2,
    vendor_name: 'CV Langkah Juara Footwear',
    warehouse_id: 1,
    warehouse_name: 'Gudang Pusat Tusko Jakarta (GDG-JKT-PST)',
    status: 'approved',
    order_date: '2026-09-06',
    expected_delivery_date: '2026-09-14',
    total_amount: 23600000,
    notes: 'Pengadaan batch baru sepatu maraton ProStride Carbon.',
    items: [
      {
        id: 201,
        product_name: 'Tusko ProStride Carbon Racer',
        variant_name: 'Volt Neon / Size 42',
        sku: 'TSK-SHOE-VOLT-42',
        ordered_quantity: 20,
        received_quantity: 0,
        unit_price: 590000,
        subtotal: 11800000
      },
      {
        id: 202,
        product_name: 'Tusko ProStride Carbon Racer',
        variant_name: 'Volt Neon / Size 43',
        sku: 'TSK-SHOE-VOLT-43',
        ordered_quantity: 20,
        received_quantity: 0,
        unit_price: 590000,
        subtotal: 11800000
      }
    ]
  },
  {
    id: 3,
    po_number: 'PO-202609-003',
    vendor_id: 3,
    vendor_name: 'PT Gear Pro Indonesia',
    warehouse_id: 1,
    warehouse_name: 'Gudang Pusat Tusko Jakarta (GDG-JKT-PST)',
    status: 'draft',
    order_date: '2026-09-10',
    expected_delivery_date: '2026-09-20',
    total_amount: 4500000,
    notes: 'Draft pesanan tas duffle gym dan botol minum hidrasi.',
    items: [
      {
        id: 301,
        product_name: 'Tusko UltraVent Sport Bottle 750ml',
        variant_name: 'Matte Black',
        sku: 'TSK-ACC-BOT-BLK',
        ordered_quantity: 50,
        received_quantity: 0,
        unit_price: 90000,
        subtotal: 4500000
      }
    ]
  }
];

export const initialGoodsReceivingNotes = [
  {
    id: 1,
    grn_number: 'GRN-202609-001',
    po_number: 'PO-202609-001',
    vendor_name: 'PT Tekstil Atletik Prima',
    warehouse_name: 'Gudang Pusat Tusko Jakarta (GDG-JKT-PST)',
    received_date: '2026-09-07',
    delivery_order_number: 'SJ-TAP-88992',
    received_by: 'Bambang (Admin Gudang)',
    status: 'verified', // 'verified', 'discrepancy'
    items: [
      {
        id: 1,
        sku: 'TSK-JRS-BLK-L',
        product_name: 'Tusko SpeedTech Running Jersey (Hitam / L)',
        accepted_quantity: 60,
        rejected_quantity: 0,
        unit_cost: 110000,
        notes: 'Kondisi jahitan dan sablon rapi lolos QC.'
      },
      {
        id: 2,
        sku: 'TSK-JRS-RED-XL',
        product_name: 'Tusko SpeedTech Running Jersey (Merah / XL)',
        accepted_quantity: 75,
        rejected_quantity: 0,
        unit_cost: 110000,
        notes: 'Lolos uji bahan breathable.'
      }
    ]
  }
];

export const initialVendorBills = [
  {
    id: 1,
    bill_number: 'BILL-202609-001',
    po_number: 'PO-202609-001',
    grn_number: 'GRN-202609-001',
    vendor_name: 'PT Tekstil Atletik Prima',
    amount: 14850000,
    paid_amount: 14850000,
    status: 'paid', // 'unpaid', 'partially_paid', 'paid'
    bill_date: '2026-09-07',
    due_date: '2026-10-07'
  },
  {
    id: 2,
    bill_number: 'BILL-202609-002',
    po_number: 'PO-202609-002',
    grn_number: null,
    vendor_name: 'CV Langkah Juara Footwear',
    amount: 23600000,
    paid_amount: 0,
    status: 'unpaid',
    bill_date: '2026-09-06',
    due_date: '2026-10-21'
  }
];
