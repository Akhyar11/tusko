/**
 * Mock data for Email & Shipping Label (Resi) templates and dispatch logs
 */

export const availablePlaceholders = [
  { key: '{customer_name}', label: 'Nama Pembeli', example: 'Budi Santoso' },
  { key: '{order_number}', label: 'Nomor Pesanan / Invoice', example: 'INV/20260907/TK/001' },
  { key: '{total_amount}', label: 'Total Pembayaran', example: 'Rp 484.000' },
  { key: '{courier_name}', label: 'Nama Ekspedisi', example: 'J&T Express' },
  { key: '{courier_service}', label: 'Layanan Ekspedisi', example: 'EZ (Reguler)' },
  { key: '{tracking_number}', label: 'Nomor Resi', example: 'TRK-98827391823' },
  { key: '{items_list}', label: 'Rincian Barang', example: '1x Tusko Pro Jersey, 1x Kaos Kaki' },
  { key: '{payment_method}', label: 'Metode Pembayaran', example: 'BCA Virtual Account' },
  { key: '{store_name}', label: 'Nama Toko', example: 'Tusko Official Store' }
];

export const initialEmailTemplates = [
  {
    id: 'order_placed',
    name: 'Pesanan Dibuat (Menunggu Pembayaran)',
    event: 'order.created',
    fromName: 'Tusko Official Store',
    replyTo: 'billing@tusko.com',
    colorTheme: 'emerald',
    subject: 'Menunggu Pembayaran Pesanan {order_number} - {store_name}',
    preheader: 'Selesaikan pembayaran sebelum batas waktu agar pesanan segera diproses.',
    headline: 'Terima kasih atas pesanan Anda!',
    body: `Halo {customer_name},\n\nPesanan Anda dengan nomor {order_number} telah kami terima dan menunggu pembayaran.\n\nTotal tagihan: {total_amount}\nMetode: {payment_method}\n\nSilakan selesaikan pembayaran Anda sebelum batas waktu yang ditentukan untuk menghindari pembatalan otomatis.\n\nSalam hangat,\n{store_name}`,
    buttonText: 'Bayar Sekarang',
    buttonLink: 'https://tusko.com/orders',
    isActive: true,
    category: 'Billing'
  },
  {
    id: 'payment_success',
    name: 'Pembayaran Berhasil & Diproses',
    event: 'payment.success',
    fromName: 'Tusko Billing Team',
    replyTo: 'billing@tusko.com',
    colorTheme: 'blue',
    subject: 'Pembayaran Diterima untuk Pesanan {order_number}',
    preheader: 'Pembayaran pesanan Anda telah kami konfirmasi dan segera dipacking.',
    headline: 'Pembayaran Anda Berhasil!',
    body: `Halo {customer_name},\n\nPembayaran sebesar {total_amount} untuk pesanan {order_number} telah berhasil kami terima.\n\nTim gudang {store_name} sedang menyiapkan dan mengemas barang belanjaan Anda dengan standar QC terbaik.\n\nBarang dalam pesanan:\n{items_list}\n\nKami akan menginfokan nomor resi pengiriman segera setelah paket diserahkan ke kurir.\n\nSalam olahraga,\n{store_name}`,
    buttonText: 'Pantau Status Pesanan',
    buttonLink: 'https://tusko.com/orders',
    isActive: true,
    category: 'Billing'
  },
  {
    id: 'order_shipped',
    name: 'Pesanan Dikirim (Nomor Resi Tersedia)',
    event: 'order.shipped',
    fromName: 'Tusko Fulfillment & Logistics',
    replyTo: 'shipping@tusko.com',
    colorTheme: 'purple',
    subject: 'Pesanan {order_number} Sedang Menuju ke Alamat Anda ({courier_name})',
    preheader: 'Paket telah diserahkan ke kurir dengan nomor resi {tracking_number}.',
    headline: 'Paket Anda Sedang Meluncur!',
    body: `Kabar gembira, {customer_name}!\n\nPesanan Anda nomor {order_number} telah diserahkan ke pihak ekspedisi dan dalam perjalanan menuju alamat pengiriman Anda.\n\nEkspedisi: {courier_name} - {courier_service}\nNomor Resi: {tracking_number}\n\nAnda dapat melacak posisi paket secara berkala melalui tombol di bawah atau langsung pada situs kurir terkait.\n\nTerima kasih telah berbelanja di {store_name}!`,
    buttonText: 'Lacak Pengiriman Paket',
    buttonLink: 'https://tusko.com/tracking',
    isActive: true,
    category: 'Shipping'
  },
  {
    id: 'order_completed',
    name: 'Pesanan Selesai / Terkirim',
    event: 'order.completed',
    fromName: 'Tusko Customer Care',
    replyTo: 'support@tusko.com',
    colorTheme: 'emerald',
    subject: 'Paket {order_number} Telah Diterima - Berikan Ulasan Anda',
    preheader: 'Semoga produk pesanan Anda memuaskan. Tinggalkan ulasan bintang 5!',
    headline: 'Paket Telah Tiba di Tempat Anda!',
    body: `Halo {customer_name},\n\nMenurut catatan sistem kurir {courier_name}, pesanan {order_number} telah berhasil diantar ke alamat Anda.\n\nApakah barang sesuai dengan ekspektasi Anda? Kami akan sangat menghargai ulasan dan masukan Anda untuk membantu meningkatkan layanan kami.\n\nNikmati perlengkapan olahraga baru Anda!\n\nSalam hangat,\n{store_name}`,
    buttonText: 'Beri Ulasan Produk',
    buttonLink: 'https://tusko.com/reviews',
    isActive: true,
    category: 'Order'
  },
  {
    id: 'order_cancelled',
    name: 'Pesanan Dibatalkan / Kedaluwarsa',
    event: 'order.cancelled',
    fromName: 'Tusko System Notice',
    replyTo: 'support@tusko.com',
    colorTheme: 'rose',
    subject: 'Pemberitahuan Pembatalan Pesanan {order_number}',
    preheader: 'Pesanan telah dibatalkan karena pembayaran melewati batas waktu.',
    headline: 'Pesanan Anda Dibatalkan',
    body: `Halo {customer_name},\n\nKami informasikan bahwa pesanan nomor {order_number} telah dibatalkan karena batas waktu pembayaran telah terlewati atau atas permintaan Anda.\n\nStok produk telah dikembalikan ke inventaris. Jika Anda masih menginginkan produk tersebut, silakan lakukan pemesanan ulang melalui aplikasi {store_name}.\n\nSalam hormat,\nTim Layanan Pelanggan {store_name}`,
    buttonText: 'Pesan Ulang Sekarang',
    buttonLink: 'https://tusko.com',
    isActive: true,
    category: 'Order'
  }
];

export const initialReceiptTemplate = {
  paperSize: '100x150', // '100x150' (A6), '100x100', 'a4'
  barcodeType: 'code128', // 'code128', 'qrcode', 'dual'
  barcodeHeight: 'medium', // 'small' (40px), 'medium' (55px), 'large' (70px)
  addressFontSize: 'normal', // 'normal', 'large'
  showItemsList: true,
  showBuyerNotes: true,
  showSortingCode: true,
  showUnboxingNotice: true,
  showCodBadge: true,
  senderName: 'Tusko Official Store (Fulfillment Hub)',
  senderPhone: '0811-9876-5432',
  senderAddress: 'Gudang Logistik Sentral Tusko, Jl. Industri Raya No. 88, Pergudangan Daan Mogot, Jakarta Barat, 11840',
  footerNote: 'Wajib rekam video unboxing saat membuka paket untuk klaim garansi & retur resmi.',
  courierBrandTag: 'Layanan Pengiriman Resmi E-Commerce Toko Online'
};

export const mockNotificationLogs = [
  {
    id: 'LOG-001',
    type: 'email',
    event: 'order.shipped',
    recipient: 'ahmad.fauzi@example.com',
    orderNumber: 'INV/20260907/TK/001',
    subject: 'Pesanan INV/20260907/TK/001 Sedang Menuju ke Alamat Anda (J&T Express)',
    status: 'sent',
    sentAt: '2026-09-07 14:30 WIB'
  },
  {
    id: 'LOG-002',
    type: 'email',
    event: 'payment.success',
    recipient: 'ahmad.fauzi@example.com',
    orderNumber: 'INV/20260907/TK/001',
    subject: 'Pembayaran Diterima untuk Pesanan INV/20260907/TK/001',
    status: 'sent',
    sentAt: '2026-09-07 10:15 WIB'
  },
  {
    id: 'LOG-003',
    type: 'email',
    event: 'order.created',
    recipient: 'citra.lestari@example.com',
    orderNumber: 'INV/20260907/TK/002',
    subject: 'Menunggu Pembayaran Pesanan INV/20260907/TK/002 - Tusko Official Store',
    status: 'sent',
    sentAt: '2026-09-07 11:45 WIB'
  },
  {
    id: 'LOG-004',
    type: 'email',
    event: 'order.cancelled',
    recipient: 'dian.saputra@example.com',
    orderNumber: 'INV/20260905/TK/005',
    subject: 'Pemberitahuan Pembatalan Pesanan INV/20260905/TK/005',
    status: 'sent',
    sentAt: '2026-09-06 00:01 WIB'
  },
  {
    id: 'LOG-005',
    type: 'email',
    event: 'order.completed',
    recipient: 'eko.prasetyo@example.com',
    orderNumber: 'INV/20260903/TK/004',
    subject: 'Paket INV/20260903/TK/004 Telah Diterima - Berikan Ulasan Anda',
    status: 'sent',
    sentAt: '2026-09-05 16:20 WIB'
  }
];
