# PRD & DESAIN SISTEM — E-COMMERCE OLAHRAGA + FULL ERP TUSKO

**Versi Dokumen:** 1.0.0-PROD  
**Status:** Canonical Master Specification  
**Platform:** Tusko Performance Athletic Storefront & Back-Office ERP  

---

## 1. Overview & Latar Belakang

### 5 Tujuan Utama Sistem:
1. **Penjualan Apparel Berjenjang**: Mengakomodasi produk olahraga dengan varian bertingkat (misal: Lengan > Warna > Ukuran) secara sistematis dengan SKU unik per kombinasi.
2. **Otomatisasi Back-Office ERP**: Digitalisasi proses dari hulu ke hilir (pengadaan/procurement, multi-gudang, manajemen stok, order fulfillment, hingga akuntansi kas) untuk meminimalkan kesalahan manusia.
3. **Checkout Terintegrasi**: Implementasi API KiriminAja untuk kalkulasi logistik multi-kurir dinamis dan Midtrans Snap untuk verifikasi pembayaran online otomatis.
4. **Kontrol Stok Presisi**: Sistem reservasi stok otomatis saat checkout untuk mencegah *overselling* (stok tertahan saat checkout dan terpotong permanen saat pembayaran lunas).
5. **Transparansi Finansial**: Perhitungan HPP (Harga Pokok Penjualan) atau COGS yang akurat berbasis data penerimaan barang (GRN/PO) untuk mengetahui laba kotor secara real-time.

### Referensi Pengalaman Pengguna:
Desain antarmuka mengacu pada standar industri olahraga global seperti **adidas.co.id** untuk alur pemilihan varian bertingkat yang intuitif dan **Manta Liberta** untuk kenyamanan belanja online lokal. Sistem mengusung pendekatan *mobile-first*, bertema sporty, bersih, profesional, serta mematuhi standar desain tegas sudut siku (**100% `rounded-none`**).

---

## 2. Batasan Ruang Lingkup Sistem (In-Scope vs Out-of-Scope)

Tabel berikut mendefinisikan batasan fitur untuk memastikan fokus pengembangan dan mencegah penambahan ruang lingkup yang tidak direncanakan:

| Kategori | In-Scope (Dikembangkan) | Out-of-Scope (TIDAK Dikembangkan) |
| :--- | :--- | :--- |
| **Platform** | Web application responsif (Front-store & Back-office ERP). | Aplikasi mobile native (Android APK / iOS App Store). |
| **Integrasi** | KiriminAja API & Midtrans Snap Webhook. | Sinkronisasi marketplace eksternal (Shopee/Tokopedia/TikTok Shop). |
| **Logistik** | Multi-kurir via satu pintu KiriminAja. | Integrasi kurir mandiri di luar ekosistem KiriminAja. |
| **Produk** | Inventori multi-SKU dengan varian bertingkat (Matrix). | Manajemen aset non-inventori (aktiva tetap kantor). |
| **Hardware** | Kompatibilitas browser standar untuk cetak label termal (100x150 mm) & Invoice. | Pengadaan/setup fisik hardware barcode scanner/printer pabrikan. |
| **Keuangan** | Laporan laba kotor, HPP/COGS produk, mutasi kas, saldo rekening & COA. | Akuntansi perpajakan korporasi kompleks (SPT/e-Faktur PPh badan). |

---

## 3. Spesifikasi Rinci Fitur & Roadmap 5 Fase

### ⚡ Fase 1 — Etalase & Varian
Fase ini fokus pada pengalaman eksplorasi produk oleh pelanggan.
- **Katalog & Detail**: Pelanggan dapat menjelajahi produk olahraga, menggunakan multi-filter (kategori, harga, rating), pencarian teks instan, dan melihat detail spesifikasi teknis produk.
- **Varian Bertingkat**: Pemilihan kombinasi atribut dinamis (Contoh: Lengan Panjang -> Hitam -> XL) di mana setiap kombinasi menghasilkan SKU unik tersendiri.
- **Harga Dinamis**: Sistem mendukung diferensiasi harga antar varian (misal: ukuran XL memiliki harga lebih tinggi dibandingkan ukuran M).

### 💳 Fase 2 — Checkout & Bayar
Fase ini mengatur alur transaksi hingga pembayaran tervalidasi.
- **Manajemen Keranjang**: Pengaturan jumlah item, validasi stok live, dan kalkulasi subtotal.
- **Promo & Loyalitas**: Validasi voucher promo berdasarkan parameter (kategori, min belanja, kuota) dan penukaran poin loyalitas pelanggan (*lifetime loyalty points*).
- **Pengiriman Real-time**: Integrasi KiriminAja untuk pilihan layanan kurir berdasarkan bobot gramatur dan dimensi paket.
- **Midtrans Snap**: Pembayaran via Virtual Account (BCA, Mandiri, BNI, BRI), e-Wallet (GoPay, ShopeePay), QRIS, serta opsi Transfer Bank Manual dengan verifikasi tanda tangan aman (*signature_key* pada webhook).

### 📦 Fase 3 — Pesanan & Kirim + Akun
Fase ini mencakup manajemen purnajual dan data pengguna.
- **Fulfillment**: Monitoring antrean pesanan terbayar, alur kerja pemrosesan pesanan, booking pickup kurir otomatis via KiriminAja, dan pencetakan label resi termal standar (100x150 mm) lengkap dengan barcode.
- **Tracking**: Pelacakan status paket secara langsung (*live package tracking*) di halaman akun pelanggan dan admin.
- **Manajemen Akun**: Wajib login untuk transaksi, multi-buku alamat lengkap dengan pemilih koordinat peta GPS Leaflet, serta riwayat mutasi poin reward.

### 🏬 Fase 4 — Produk, Stok, Pengadaan (Procurement), & Promosi
Fase ini adalah inti dari ERP untuk sisi admin toko.
- **Inventori**: Manajemen master data produk, galeri foto, struktur SKU matriks varian, kartu mutasi stok real-time, serta modul sesi stok opname fisik untuk rekonsiliasi selisih data.
- **Smart Inventory**: Multi-gudang (Warehouse Central & Regional), reservasi stok otomatis saat checkout untuk mencegah *overselling*, dan widget peringatan stok menipis (*low-stock threshold alerts*).
- **Purchasing (Procurement)**: Modul manajemen data pemasok (vendor/supplier), penerbitan dokumen Purchase Order (PO), pencatatan tagihan vendor (Vendor Bills), dan penerimaan barang (Goods Receipt Note / GRN) yang otomatis menambah kuantitas on-hand stok serta memperbarui HPP/COGS.
- **Marketing Tools**: Pembuatan voucher promo dengan parameter syarat minimal belanja, tanggal kedaluwarsa, kuota penggunaan, dan cakupan kategori/produk spesifik.

### 📊 Fase 5 — Keuangan & Analitik (BI)
Fase akhir untuk transparansi finansial dan pengambilan keputusan bisnis strategis.
- **E-Invoice**: Pembuatan faktur digital otomatis (PDF/Printable) untuk setiap pesanan yang telah sukses diselesaikan.
- **Analisis Profit & HPP**: Laporan laba kotor per varian dan kategori produk berbasis HPP/COGS yang terekam pada saat pengadaan barang.
- **Business Intelligence (BI)**: Dasbor visual analitik performa revenue (kotor vs bersih), grafik tren penjualan, analisis produk *fast-moving* vs *slow-moving*, serta pemantauan liabilitas poin reward pelanggan.

---

## 4. Alur Pengguna (User Flow)

### 🛒 A. Alur Pelanggan Toko Online Tusko
1. Membuka website storefront Tusko Sport.
2. Melakukan registrasi atau login akun (Wajib untuk checkout).
3. Memilih produk dan menentukan kombinasi varian bertingkat (Atribut -> Varian SKU).
4. Memasukkan produk yang dipilih ke keranjang belanja.
5. Melakukan checkout dan memilih alamat pengiriman dari buku alamat (atau pin GPS via peta Leaflet).
6. Sistem melakukan kalkulasi ongkos kirim via API KiriminAja secara otomatis.
7. Memilih metode pembayaran (Midtrans Snap Online atau Transfer Bank Manual).
8. Sistem menerima konfirmasi bayar, status pesanan berubah menjadi `PAID`, dan stok di-reservasi secara presisi.
9. Pelanggan menerima notifikasi bahwa pesanan sedang diproses gudang.
10. Mendapatkan nomor resi dan memantau live tracking pengiriman.
11. Pesanan tiba, status berubah menjadi selesai, dan poin reward loyalitas bertambah.

### 🛡️ B. Alur Admin Back-Office Tusko
1. Login ke Dashboard Admin (`/admin/dashboard`).
2. Memantau KPI harian/bulanan (Revenue kotor, revenue bersih, saldo rekening, stok kritis, dan BI fast/slow moving).
3. Memantau daftar antrean pesanan masuk yang sudah terbayar (`/admin/orders`).
4. Menyiapkan barang gudang sesuai SKU varian yang tertera pada pesanan.
5. Melakukan booking pickup ke kurir melalui integrasi KiriminAja.
6. Mencetak label resi pengiriman format termal (100x150 mm) dengan barcode resi.
7. Memperbarui status pesanan menjadi "Dikirim" (*Shipped*) dengan nomor resi otomatis.
8. Sistem menerbitkan faktur digital (E-Invoice) secara otomatis.
9. Memantau level stok multi-gudang dan membuat PO ke suplier jika barang menipis (`/admin/procurement`).
10. Memeriksa laporan laba kotor harian/bulanan berdasarkan rekonsiliasi HPP/COGS dan transaksi kas (`/admin/finance`).

---

## 5. Arsitektur Teknis & Integrasi

Sistem dibangun dengan arsitektur modern decoupled untuk menjamin performa tinggi, skalabilitas, dan stabilitas:

- **Frontend**: React 19 SPA dengan Vite, Tailwind CSS (Utility Class **100% `rounded-none`**), TanStack Query / Axios Interceptors untuk sinkronisasi state server, serta Lucide React Icons.
- **Backend**: Laravel 11 Framework dengan RESTful API Architecture, Laravel Sanctum untuk keamanan token & session guard, serta sistem antrean background jobs untuk pengiriman email dan webhook.
- **Database**: Relational Database Engine (MySQL / SQLite untuk dev & test) dengan integritas foreign key dan indeks relasional.
- **Deployment**: Virtual Private Server (VPS) berbasis Linux dengan Nginx sebagai reverse proxy web server.
- **Ekosistem Pihak Ketiga**:
  - **KiriminAja**: Menangani seluruh kalkulasi tarif logistik dinamis dan booking pickup kurir otomatis.
  - **Midtrans**: Menangani gerbang pembayaran (Payment Gateway Snap API) dengan verifikasi webhook aman berbasis SHA-512 `signature_key`.

---

## 6. Arsitektur Skema Database (Prinsip Database Kritis)

> [!CRITICAL]
> **PRINSIP ZERO STATIC ENUM**:  
> Sistem ini menerapkan prinsip **TIDAK ADA ENUM STATIS** di level basis data. Seluruh status pesanan, metode pengiriman, tipe mutasi, tipe diskon, dan kategori pembukuan wajib menggunakan **tabel lookup dinamis** agar dapat diekspansi oleh Admin tanpa migrasi schema DDL.

### Kelompok Tabel Utama:
1. **Identitas & Akses**: `users`, `roles`, `permissions`, `shipping_addresses`.
2. **Katalog Produk & Varian**: `categories`, `products`, `product_images`, `attribute_types` (ukuran, warna, lengan), `attribute_values`, `product_attribute_levels`, `product_variants` (SKU unik, harga varian, HPP varian), `product_variant_options`.
3. **Transaksi & Loyalitas**: `carts`, `cart_items`, `discount_types`, `vouchers`, `voucher_scope_types`, `voucher_targets`, `voucher_usages`, `loyalty_settings`, `loyalty_point_transactions`.
4. **Order Management & Shipping**: `order_statuses`, `payment_statuses`, `orders`, `order_items`, `order_status_histories`, `payments`, `midtrans_transactions`, `invoices`, `shipping_methods`, `shipments`.
5. **Inventori & Multi-Gudang**: `warehouses`, `stock_movement_types`, `stock_movements`, `movement_reference_types`, `stock_reservations`, `stock_opnames`, `stock_opname_items`.
6. **Supply Chain & Procurement**: `vendors`, `purchase_order_statuses`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `vendor_bills`.
7. **Keuangan & Kas**: `financial_accounts`, `chart_of_accounts`, `transactions`, `cost_of_goods_sold_records`.
8. **Analitik**: Kueri agregasi terindeks untuk laporan BI laba kotor, performa SKU fast/slow moving, dan valuasi aset persediaan.

---

## 7. Engineering Workflow & Quality Gate

Untuk menjaga integritas dan stabilitas kode sebelum masuk ke tahap produksi, seluruh developer terikat pada protokol otomatis:

1. **Manajemen Kode & Proteksi Branch**:
   - Dilarang melakukan commit langsung pada branch `master` atau `main`. Seluruh pengerjaan wajib menggunakan branch fitur (`feat/*`, `fix/*`, `refactor/*`).
   - Larangan `git push` otomatis tanpa persetujuan eksplisit.
2. **Pre-Commit Hooks (9 OpenCode AI Verification Engines)**:
   - `01-branch-and-master-protection.sh`: Proteksi branch master.
   - `02-feature-team-ownership.sh`: Integritas batas kepemilikan file Developer 1 vs Developer 2.
   - `03-design-system-rounded-none.sh`: Penegakan wajib sudut siku tajam `rounded-none` dan penolakan label fiktif "VIP".
   - `04-zero-secret-and-hardcode.sh`: **Penolakan mutlak terhadap segala bentuk hardcode** (koordinat GPS toko statis, tarif ongkir flat rahasia, secret credentials).
   - `05-backend-laravel-test-integrity.sh`: Validasi sintaks PHP dan pengujian unit test backend (wajib 100% passed).
   - `06-frontend-build-integrity.sh`: Validasi kompilasi bundling JSX (`npm run build`).
   - `07-frontend-consistency-auditor.sh`: Standarisasi ikon `lucide-react`, prefix `tusko_*` pada LocalStorage, dan formatter terpusat `formatRupiah`.
   - `08-backend-consistency-auditor.sh`: Standarisasi arsitektur Laravel (namespace API, Controller inheritance, integritas up/down migrasi, larangan sisa `dd()`).
   - `09-zero-duplication-scanner.sh`: Audit 0 duplikasi rute API, 0 duplikasi tabel migrasi, dan 0 duplikasi helper komponen.

---

## 8. Kriteria Penerimaan & Penutup

Dokumen ini merupakan acuan kanonis final (*single source of truth*) dalam pengembangan proyek **Tusko Sport E-Commerce & Full ERP**. Kriteria penerimaan sistem didasarkan pada:
1. **Terselesaikannya seluruh fitur dalam Roadmap 5 Fase** sesuai spesifikasi fungsional.
2. **Lolosnya pengujian integrasi** API KiriminAja dan Midtrans Snap secara end-to-end.
3. **Kesesuaian alur stok multi-gudang dan perhitungan laba kotor/HPP** terhadap data transaksi nyata.
4. **Kepatuhan 100% terhadap standar desain visual** sudut siku tajam `rounded-none` dan 9 quality gate auditor.

Setiap permintaan perubahan atau penambahan fitur di luar cakupan dokumen ini (*Out-of-Scope*) wajib melalui prosedur *Change Request* resmi yang akan berdampak pada lini masa dan alokasi sumber daya.

---

### Lembar Pengesahan:

| Peran / Jabatan | Nama Penanggung Jawab | Tanggal Verifikasi | Status |
| :--- | :--- | :--- | :--- |
| **Lead Product Architect** | Akhyar / Tim Tusko Core | 11 September 2026 | **DISETUJUI (APPROVED)** |
| **Lead Systems Engineer** | Antigravity AI Engine | 11 September 2026 | **DISETUJUI (APPROVED)** |
