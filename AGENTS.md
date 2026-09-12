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
3. **Arsitektur Atomic Design**:
   - Seluruh komponen antarmuka baru dan modularisasi frontend WAJIB menerapkan prinsip Atomic Design (`atoms/`, `molecules/`, `organisms/`, `templates/pages`).
4. **Icon-Only Header Controls dengan Tooltip**:
   - Tombol kontrol/aksi navigasi pada header tabel dan form modul produk (Daftar Produk, Tambah Produk, Edit Produk) WAJIB menggunakan format simbol/ikon saja (icon-only) bersudut siku (`rounded-none`), memanfaatkan komponen reusable `IconButton`, dan dilengkapi tooltip keterangan fungsi saat di-highlight/hover/fokus. Dilarang menggunakan tombol teks biasa pada header.
5. **Sentralisasi Kontrol Filter & Pencarian**:
   - Seluruh kontrol filter dan pencarian data katalog/master produk WAJIB terpusat pada Sidebar Filter kanan-ke-kiri.
   - DILARANG KERAS meletakkan/menduplikasi komponen filter, baris toolbar pencarian (SearchBar), atau tombol aksi teks pada kanvas halaman utama di antara kartu metrik dan tabel. Halaman utama WAJIB bersih dan langsung menampilkan tabel data (`ServerSideTable`) setelah kartu metrik/header.
6. **Wajib Penggunaan Komponen Reusable (Mandatory Reusable Component Reuse)**:
   - Pengembang dan Agen WAJIB mengimpor dan memanfaatkan komponen reusable yang telah dibuat sebelumnya (`atoms/IconButton`, `molecules/SearchBar`, `molecules/ViewModeToggle`, `ServerSideTable`, `organisms/ProductFilterDrawer`, dll.).
   - DILARANG KERAS membuat elemen UI mentah berulang atau mengabaikan komponen reusable yang sudah ada di codebase.
7. **Standar Kontrol Filter & Pencarian (Filter & Search Rules)**:
   - **Pemisahan Pencarian Nama & SKU**: Pencarian nama produk dan pencarian kode SKU WAJIB dipisah menjadi input mandiri masing-masing (`SearchBar` Nama Produk terpisah dari `SearchBar` Kode SKU). Dilarang menyatukan nama dan SKU ke dalam satu input gabungan.
   - **Larangan Counter Redundant**: Dilarang menampilkan teks hitungan redundant seperti "Ditemukan X dari Y produk" di bawah kotak input pencarian filter.
   - **Wajib Dropdown ServerSideSelect**: Seluruh dropdown filter (Kategori, Status Publikasi, Kondisi Stok, Urutan Katalog) WAJIB menggunakan `ServerSideSelect` dengan fitur pencarian dan scroll padding.
   - **Format Teks Placeholder**: Placeholder filter wajib berupa kalimat ajakan deskriptif (contoh: "Pilih status publikasi...", "Pilih kategori olahraga...", "Pilih kondisi stok...", "Pilih urutan katalog..."), BUKAN langsung menampilkan nilai opsi seperti "Semua ..." saat filter belum dipilih.
   - **Kontras Warna Placeholder**: Warna teks placeholder WAJIB dibedakan jelas dari label atasnya menggunakan warna abu-abu lembut `text-neutral-400 font-normal` (bukan teks hitam tebal seperti judul/label).
8. **Standar Header Modul Bersih (Clean Header & No Redundant Breadcrumbs)**:
   - DILARANG menampilkan baris navigasi teks/breadcrumb manual yang redundant di atas kartu header modul (seperti "← Etalase Storefront • ADMIN ERP • KATALOG PRODUK") jika navigasi dan aksi sudah disediakan oleh tombol kontrol header (`ProductHeaderActions`).
   - Kartu header halaman WAJIB bersih dan langsung berfokus pada identitas modul (ikon besar, judul, deskripsi) di sisi kiri serta kelompok tombol kontrol di sisi kanan.
9. **Larangan Baris Toolbar/Container Tambahan Sebelum Tabel (No Extra Toolbar/Container Before Table)**:
   - Pada halaman list/tabel admin, DILARANG menambahkan baris toolbar ekstra (seperti input pencarian SearchBar atau tombol aksi teks) ataupun container card pembungkus sebelum tabel data. Seluruh tindakan navigasi/tambah/filter diwadahi oleh tombol icon-only di kartu header, pencarian/filter diwadahi oleh Sidebar Filter kanan, dan tabel data (`ServerSideTable`) langsung dirender pada hierarki halaman utama.
10. **Wajib Checkbox List pada Tabel Admin (Mandatory Table Row Checkbox List)**:
    - Seluruh tabel daftar data admin WAJIB menyertakan kolom checkbox list (multi-selection) dengan checkbox Select All di kolom pertama `thead` dan checkbox baris di setiap baris `tbody` (memanfaatkan prop `selectable={true}` pada `ServerSideTable`).
11. **Posisi Tombol Filter Selalu di Samping Kanan Tombol Tambah (Filter Button Placed Right of Add Button)**:
    - Tombol kontrol filter (baik pada icon-only header controls maupun toolbar di atas tabel) WAJIB selalu diposisikan di **samping kanan tombol tambah** (`[Tombol Tambah] [Tombol Filter]`). Dilarang meletakkan tombol filter di sebelah kiri tombol tambah.
</RULE[tusko_design_system]>

<RULE[pre_commit_auditor]>
# Agent Pre-Commit Auditor Policy (.githooks/) — 100% OpenCode AI Powered

Repository ini dilengkapi dengan sistem auditor otomatis berbasis **OpenCode AI** (`opencode run -m opencode/muse-spark-1.3-contributor-free`) yang berjalan setiap kali perintah `git commit` dijalankan:
1. `01-branch-and-master-protection.sh`: Mencegah commit langsung di branch `master` dan memvalidasi konvensi branch dengan OpenCode AI.
2. `02-feature-team-ownership.sh`: OpenCode AI Auditor yang menganalisis boundary kepemilikan file Developer 1 vs Developer 2 sesuai panduan tim.
3. `03-design-system-rounded-none.sh`: OpenCode AI Auditor yang memvalidasi kepatuhan sudut siku tajam `rounded-none` dan penolakan label "VIP".
4. `04-zero-secret-and-hardcode.sh`: OpenCode AI Auditor yang menganalisis git diff secara cerdas untuk mencegah kebocoran kredensial rahasia (.env, token, private key) dan **MENOLAK segala bentuk hardcode** (seperti lokasi gudang toko, koordinat GPS statis, biaya penanganan/handling fee, atau URL gateway pihak ketiga yang seharusnya dapat diatur secara dinamis oleh Admin melalui database).
5. `05-backend-laravel-test-integrity.sh`: Menjalankan PHP syntax check, `php artisan test` (100% lolos), dan OpenCode AI Auditor untuk integritas test backend (larangan test dummy/tanpa assertion).
6. `06-frontend-build-integrity.sh`: Menjalankan `npm run build` dan OpenCode AI Auditor untuk kebersihan import/export JSX bundling.
7. `07-frontend-consistency-auditor.sh`: OpenCode AI Auditor untuk konsistensi Frontend (standardisasi pustaka icon `lucide-react`, prefix wajib `tusko_*` pada localStorage, wajib formatter `formatRupiah`, kepatuhan Atomic Design, icon-only header controls dengan tooltip, sentralisasi filter sidebar kanan, kewajiban penggunaan komponen reusable, dan arsitektur tajam).
8. `08-backend-consistency-auditor.sh`: OpenCode AI Auditor untuk konsistensi Backend (namespace `App\Http\Controllers\Api`, pewarisan `Controller`, integritas up()/down() pada seluruh file migrasi, dan larangan sisa fungsi debug `dd`/`dump`).
9. `09-zero-duplication-scanner.sh`: OpenCode AI Duplication Auditor (bebas script JS eksternal) yang memindai git diff dan file perubahan untuk menjamin 0 duplikasi rute API, 0 duplikasi tabel migrasi, 0 duplikasi helper/formatter, 0 duplikasi komponen, dan penolakan duplikasi elemen UI mentah yang membypass komponen reusable yang sudah ada.

Jika salah satu audit gagal, commit akan **OTOMATIS DITOLAK** dan pengembang wajib memperbaiki masalah yang dilaporkan.
</RULE[pre_commit_auditor]>

