# 📋 Panduan & Pembagian Tugas Tim Berdasarkan Fitur (Feature-Based)
## Proyek: Tusko Performance Storefront (Laravel + React)

Dokumen ini adalah panduan pembagian tugas terstruktur untuk membagi pengerjaan proyek antar rekan tim secara mandiri per fitur (*vertical slice*: Database + Backend API + Frontend UI). Dengan model ini, setiap anggota tim memegang fitur secara utuh dari hulu ke hilir sehingga **meminimalisir risiko konflik kode (*merge conflict*) di Git**.

---

## 🎯 Pembagian Tugas: Skenario 2 Orang Pengembang (Default)

| Anggota Tim | Peran Utama | Modul / Fitur yang Dipegang |
| :--- | :--- | :--- |
| **Developer 1 (Anda)** | *Customer Journey & Checkout Flow* | **Fitur 1:** Autentikasi & Manajemen Akun Member<br>**Fitur 3:** Keranjang Belanja & Checkout Pengiriman |
| **Developer 2 (Teman Anda)** | *Catalog, Order Processing & Store Ops* | **Fitur 2:** Katalog Produk & Manajemen Produk Admin<br>**Fitur 4 & 5:** Pesanan, Transaksi, Stok & Ekspedisi |

---

## 📌 Rincian Tugas Developer 1 (Anda)

### 🔹 Fitur 1: Autentikasi, Profil & Buku Alamat
Branch Git yang disarankan: `feat/auth-profile-address`

- [ ] **Database & Backend**:
  - `backend/app/Models/User.php` & `backend/app/Models/ShippingAddress.php`
  - `backend/app/Models/Voucher.php`
  - `backend/app/Http/Controllers/Api/AuthController.php` (login, register, logout, profile, password, active sessions)
  - `backend/app/Http/Controllers/Api/ShippingAddressController.php` (CRUD alamat, GPS coordinates lat/lng, default address)
  - `backend/app/Http/Controllers/Api/VoucherController.php` (daftar voucher & claim)
- [ ] **Frontend UI & Integrasi**:
  - `frontend/src/components/LoginPage.jsx` & `RegisterPage.jsx`
  - `frontend/src/components/ProfilePage.jsx` (tab biodata, buku alamat, keamanan/password, voucher)
  - `frontend/src/components/AddressFormPage.jsx` & `MapPickerModal.jsx` (integrasi peta Leaflet)
  - `frontend/src/components/UserMenuDropdown.jsx`
  - `frontend/src/services/authService.js`
- [ ] **Testing**:
  - `backend/tests/Feature/ProfileFullIntegrationTest.php`
  - Pastikan login, simpan alamat GPS, dan ganti password berfungsi normal.

### 🔹 Fitur 3: Keranjang Belanja & Alur Checkout
Branch Git yang disarankan: `feat/cart-checkout-payment`

- [ ] **Database & Backend**:
  - `backend/app/Http/Controllers/Api/CartController.php` (simpan keranjang pengguna di database/sesi)
  - `backend/app/Http/Controllers/Api/CheckoutController.php` (kalkulasi subtotal, potongan kupon voucher, tarif kurir)
  - Integrasi callback / webhook pembayaran (`backend/app/Http/Controllers/Api/MidtransWebhookController.php` atau `ManualPaymentController.php`)
- [ ] **Frontend UI & Integrasi**:
  - `frontend/src/components/CartPage.jsx` (tambah/kurang kuantitas, catatan varian, hapus item, pilih kupon)
  - `frontend/src/components/CheckoutPage.jsx` (pilih alamat pengiriman tersimpan, pilih opsi ekspedisi, pilih metode pembayaran)
  - `frontend/src/components/OrderSuccessPage.jsx` (tampilan nomor invoice, batas waktu pembayaran, nomor VA / QRIS)
  - `frontend/src/services/cartService.js` & `checkoutService.js`
- [ ] **Testing**:
  - Uji alur dari memasukkan produk ke keranjang hingga checkout berhasil dan nomor order terbentuk.

---

## 📌 Rincian Tugas Developer 2 (Teman Anda)

### 🔹 Fitur 2: Katalog Produk & Manajemen Produk Admin
Branch Git yang disarankan: `feat/catalog-product-admin`

- [ ] **Database & Backend**:
  - `backend/app/Models/Product.php`, `Category.php`, `ProductVariant.php`, `ProductImage.php`
  - `backend/app/Http/Controllers/Api/ProductController.php`:
    - Endpoint publik: `GET /api/products` (pencarian, multi-filter kategori, harga, rating, sorting).
    - Endpoint detail: `GET /api/products/{id}` (detail varian, stok, spesifikasi).
    - Endpoint admin: `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` (upload gambar produk).
- [ ] **Frontend UI & Integrasi**:
  - `frontend/src/components/ProductGrid.jsx`, `ProductCard.jsx`, `ProductDetail.jsx`
  - `frontend/src/components/FilterSidebar.jsx`, `CategoryBar.jsx`, `PopularChipsBar.jsx`
  - Dropdown pencarian saran langsung di `frontend/src/components/Navbar.jsx`
  - Panel Admin Produk: `frontend/src/components/ProductListPage.jsx`, `ProductCreateForm.jsx`, `ProductEditForm.jsx`, `DeleteProductModal.jsx`
  - `frontend/src/services/productService.js`
- [ ] **Testing**:
  - Uji filter katalog, pencarian teks, dan proses CRUD produk admin.

### 🔹 Fitur 4 & 5: Manajemen Pesanan, Stok & Operasional Toko
Branch Git yang disarankan: `feat/orders-stock-operations`

- [ ] **Database & Backend**:
  - `backend/app/Models/Order.php`, `OrderItem.php`, `Transaction.php`
  - `backend/app/Models/Inventory.php`, `StockLog.php`, `ExpeditionSetting.php`, `MessageTemplate.php`
  - `backend/app/Http/Controllers/Api/OrderController.php` (daftar order user, detail order, update status kirim/resi/selesai)
  - `backend/app/Http/Controllers/Api/InventoryController.php` (mutasi stok masuk/keluar)
  - `backend/app/Http/Controllers/Api/ExpeditionController.php` (daftar kurir aktif, tarif default)
  - `backend/app/Http/Controllers/Api/ReceiptTemplateController.php` & `EmailTemplateController.php`
- [ ] **Frontend UI & Integrasi**:
  - `frontend/src/components/OrderListPage.jsx` (tab status pesanan: Semua, Menunggu Bayar, Diproses, Dikirim, Selesai, Batal)
  - `frontend/src/components/OrderDetailPage.jsx` & `OrderStatusModal.jsx`, `PrintReceiptModal.jsx`
  - `frontend/src/components/FinancialTransactionsPage.jsx` (buku kas & laporan keuangan transaksi)
  - `frontend/src/components/StockManagementPage.jsx`, `AddStockModal.jsx`, `ReduceStockModal.jsx`
  - `frontend/src/components/ExpeditionSettingsPage.jsx` & `TemplateManagementPage.jsx`
  - `frontend/src/services/orderService.js`, `stockService.js`, `expeditionService.js`
- [ ] **Testing**:
  - Uji perubahan status order dari "menunggu" hingga "selesai", pengurangan stok otomatis, dan cetak invoice.

---

## 🔀 Alternatif: Skenario 3 Orang Pengembang

Jika nantinya ada 3 orang yang bergabung, pembagiannya menjadi lebih terfokus:
- **Developer 1**: Fitur 1 (Autentikasi, Profil Member, Buku Alamat GPS, dan Kupon).
- **Developer 2**: Fitur 2 (Katalog Produk Publik, Detail Produk, Filter/Search, dan CRUD Produk Admin).
- **Developer 3**: Fitur 3, 4, & 5 (Keranjang, Checkout, Pesanan, Pembayaran, Stok Gudang, dan Ekspedisi).

---

## 🤝 Aturan Main & SOP Kolaborasi (Standard Operating Procedure)

1. **Aturan Pembuatan Branch Git**:
   - Jangan pernah melakukan `git push` langsung ke branch `master`.
   - Buat branch baru dari `master` setiap mulai mengerjakan fitur:
     ```bash
     git checkout master
     git pull origin master
     git checkout -b feat/nama-fitur-anda
     ```
   - Lakukan commit berkala dengan pesan yang jelas (misal: `git commit -m "feat(profile): integrasi simpan alamat dengan koordinat GPS"`).

2. **Kesepakatan Kontrak API (API Contract)**:
   - Jika Developer 1 membutuhkan data produk untuk checkout, sepakati format JSON response dari `ProductController` milik Developer 2 lebih dulu.
   - Jangan mengubah nama key JSON yang sudah disepakati tanpa memberi tahu rekan tim.

3. **Manajemen Migrasi Database (Laravel Migrations)**:
   - Sebelum membuat migrasi baru, pastikan format tanggal/jam pada nama file migrasi berurutan.
   - Selalu sertakan perintah `down()` pada file migrasi untuk memungkinkan *rollback* jika terjadi kesalahan.
   - Jalankan `php artisan migrate:status` untuk memastikan status migrasi sinkron.

4. **Sebelum Melakukan Merge / Pull Request**:
   - Jalankan pengujian backend:
     ```bash
     php artisan test
     ```
   - Jalankan build frontend:
     ```bash
     npm run build
     ```
   - Pastikan kedua perintah di atas menghasilkan **Exit Code 0 (Success)** sebelum digabungkan ke `master`.
