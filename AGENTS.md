
<RULE[team_feature_division]>
# Kebijakan Pembagian Fitur Tim (Feature-Based Team Division)

Sesuai dokumen kanonis `PANDUAN_PEMBAGIAN_TUGAS_TIM.md`, pengerjaan proyek dibagi secara vertikal per fitur:

1. **Developer 1 (Alur Akun & Pembeli)**:
   - Fitur 1: Autentikasi Pengguna, Halaman Profil, Buku Alamat + GPS Map Leaflet, Voucher.
   - Fitur 3: Keranjang Belanja, Kupon Diskon, Alur Checkout & Pembayaran.
   - File Terkait: `ProfilePage.jsx`, `AddressFormPage.jsx`, `MapPickerModal.jsx`, `CartPage.jsx`, `CheckoutPage.jsx`, `OrderSuccessPage.jsx`, `AuthController.php`, `ShippingAddressController.php`, `VoucherController.php`, `CartController.php`, `CheckoutController.php`.

2. **Developer 2 (Katalog & Operasional Toko)**:
   - Fitur 2: Katalog Produk Publik, Multi-filter & Search, Detail Produk & Varian, Panel Admin Produk (CRUD & Upload).
   - Fitur 4 & 5: Manajemen Pesanan, Detail Invoice/Resi, Buku Kas & Transaksi, Manajemen Stok Gudang, Pengaturan Ekspedisi & Template.
   - File Terkait: `ProductGrid.jsx`, `ProductDetail.jsx`, `ProductListPage.jsx`, `ProductCreateForm.jsx`, `OrderListPage.jsx`, `OrderDetailPage.jsx`, `FinancialTransactionsPage.jsx`, `StockManagementPage.jsx`, `ExpeditionSettingsPage.jsx`, `ProductController.php`, `OrderController.php`, `TransactionController.php`, `InventoryController.php`, `ExpeditionController.php`.

3. **Integritas Boundary**:
   - Dilarang memodifikasi file milik fitur developer lain tanpa koordinasi terlebih dahulu untuk mencegah *merge conflict*.
</RULE[team_feature_division]>

<RULE[git_branch_commit_policy]>
# Kebijakan Git Branching & Commit

1. **Proteksi Branch Master**:
   - DILARANG melakukan `git commit` langsung di branch `master` atau `main`.
   - Seluruh pekerjaan WAJIB dibuatkan branch baru dari `master`:
     - Developer 1: `feat/auth-profile-address`, `feat/cart-checkout-payment`
     - Developer 2: `feat/catalog-product-admin`, `feat/orders-stock-operations`
     - Perbaikan bug: `fix/nama-masalah`
2. **Git Push Policy**:
   - Agent DILARANG melakukan `git push` otomatis tanpa persetujuan eksplisit dari User.
3. **Format Pesan Commit**:
   - Gunakan format konvensional: `feat(...)`, `fix(...)`, `refactor(...)`, `test(...)`, `style(...)`, `chore(...)`.
</RULE[git_branch_commit_policy]>

<RULE[tusko_design_system]>
# Standar Desain Tusko Storefront (Sharp & Athletic Performance)

1. **Wajib Sudut Siku (rounded-none)**:
   - Seluruh komponen antarmuka baru (tombol, kartu, input, modal, avatar, badge) WAJIB menggunakan sudut siku tegas `rounded-none`.
   - DILARANG KERAS menyisipkan class sudut melengkung `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-lg` pada komponen storefront Tusko.
2. **Branding & Label**:
   - DILARANG menggunakan teks/badge "GOLD MEMBER VIP". Label keanggotaan wajib disederhanakan menjadi "Member" atau "Admin".
</RULE[tusko_design_system]>

<RULE[pre_commit_auditor]>
# Agent Pre-Commit Auditor Policy (.githooks/)

Repository ini dilengkapi dengan sistem auditor otomatis yang berjalan setiap kali perintah `git commit` dijalankan:
1. `01-branch-and-master-protection.sh`: Mencegah commit langsung di branch `master`.
2. `02-feature-team-ownership.sh`: Memvalidasi boundary file sesuai pembagian tim.
3. `03-design-system-rounded-none.sh`: Memvalidasi kepatuhan `rounded-none` dan penolakan label "VIP".
4. `04-zero-secret-and-hardcode.sh`: Mencegah kebocoran file `.env`, token, atau private key.
5. `05-backend-laravel-test-integrity.sh`: Menjalankan PHP syntax check dan `php artisan test` (wajib lolos 100%).
6. `06-frontend-build-integrity.sh`: Menjalankan `npm run build` (wajib lolos tanpa error kompilasi).
7. `07-frontend-consistency-auditor.sh`: Memvalidasi konsistensi Frontend (arsitektur sharp, icon library lucide-react, prefix tusko_* pada localStorage, formatter formatRupiah).
8. `08-backend-consistency-auditor.sh`: Memvalidasi konsistensi Backend (namespace API controller, integritas up()/down() pada migrasi, dan kebersihan sisa fungsi debug).
9. `09-zero-duplication-scanner.sh`: Scanner mandiri (tanpa git diff) yang memindai langsung seluruh fisik codebase untuk menjamin 0 duplikasi rute API, 0 duplikasi tabel migrasi, 0 duplikasi helper/formatter, dan 0 duplikasi komponen.

Jika salah satu audit gagal, commit akan **OTOMATIS DITOLAK** dan pengembang wajib memperbaiki masalah yang dilaporkan.
</RULE[pre_commit_auditor]>

