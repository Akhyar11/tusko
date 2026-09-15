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
# Kebijakan Git Branching & Commit (Produksi & Pengembangan)

1. **Struktur Branch Utama**:
   - `master`: Branch **Production** (Live Deployment). Menu modul operasional fase lanjutan (Manajemen Stok, Daftar Pesanan, Buku Kas, Pengaturan Ekspedisi, Template Email & Resi) di-hide terlebih dahulu untuk kestabilan rilis saat ini.
   - `main`: Branch **Development** (Pusat Pengembangan). Seluruh menu dan fitur operasional dibuka untuk iterasi dan pengetesan fitur lanjutan.
2. **Alur Kerja Branching (Feature Workflow)**:
   - Alur wajib: `branch fitur/fix` -> Pull Request / Merge ke `main` (Development) -> Validasi & Merge ke `master` (Production).
   - DILARANG melakukan `git commit` langsung di branch `master` atau `main`.
   - Seluruh pekerjaan fitur WAJIB dibuatkan branch baru dari `main`:
     - Developer 1: `feat/auth-profile-address`, `feat/cart-checkout-payment`
     - Developer 2: `feat/catalog-product-admin`, `feat/orders-stock-operations`
     - Perbaikan bug: `fix/nama-masalah`
3. **Git Push Policy**:
   - Agent DILARANG melakukan `git push` otomatis tanpa persetujuan eksplisit dari User.
4. **Format Pesan Commit**:
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
   - Pengembang dan Agen WAJIB mengimpor dan memanfaatkan komponen reusable yang telah dibuat sebelumnya (`atoms/IconButton`, `molecules/SearchBar`, `molecules/ServerSideSelect`, `ServerSideTable`, `organisms/ProductFilterDrawer`, dll.).
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
12. **Standar Tampilan Tunggal Tabel Admin (Single Table View Only)**:
    - Seluruh daftar data pada modul admin (seperti Produk dan Master Kategori) WAJIB disajikan secara eksklusif menggunakan tampilan tabel tunggal (`ServerSideTable`). Dilarang menampilkan tombol pengalih tampilan (`ViewModeToggle` / list vs grid) atau menyediakan variasi layout grid pada halaman data admin.
13. **Standar Kolom Aksi Tabel Admin (MoreVertical Dropdown Action Menu)**:
    - Seluruh kolom "Aksi" pada tabel data admin (`ServerSideTable`) WAJIB menggunakan tombol menu titik tiga (`MoreVertical`) bersudut siku (`rounded-none`) yang memicu floating dropdown popup menu aksi. DILARANG KERAS menampilkan tombol aksi mentah secara telanjang/sejajar (seperti icon pensil edit dan tempat sampah delete berdampingan langsung di dalam baris sel tabel).
14. **Standar 1 Halaman 1 Entitas Mandiri (Single-Purpose Dedicated Page - No Multi-Module Tabs)**:
    - Seluruh halaman admin WAJIB berdiri sendiri untuk satu entitas/modul bisnis spesifik (1 halaman untuk 1 entitas mandiri).
    - DILARANG KERAS menggabungkan modul/entitas yang berbeda ke dalam sistem navigasi tab horizontal dalam 1 halaman (seperti PO, Supplier, GRN, dan Bills dijadikan tab-taban dalam 1 layar).
    - Setiap entitas bisnis wajib memiliki file halaman tersendiri (`src/components/*Page.jsx`), URL rute mandiri, kartu header modul terfokus, metrik KPI yang relevan, dan tabel data tunggal yang langsung disajikan tanpa tab switcher.
15. **Standar Sistem Notifikasi Toast (Unified Toast Notification Consistency)**:
    - Seluruh modul dan tabel admin WAJIB menggunakan sistem Toast yang sudah ada secara konsisten melalui prop/fungsi `onShowToast` atau `showToast` untuk memberikan feedback operasional (tambah data, perbarui perubahan, hapus, toggle status, dan error).
    - DILARANG KERAS merender alertbox sukses lokal atau banner notifikasi hijau/merah inline di atas kanvas halaman utama (seperti banner `successMessage` di antara header dan kartu metrik) agar kanvas utama tetap bersih.
    - DILARANG menampilkan tombol shortcut belanja ('Lihat Keranjang' / Cart Shortcut) pada toast modul admin. Tombol keranjang hanya boleh ditampilkan secara selektif pada aksi penambahan produk ke keranjang belanja storefront (`showCart: true`).
16. **Larangan Mutlak Label/Badge Header Redundant (No Header Badges / Category Pills on Any Page)**:
    - DILARANG KERAS menyertakan label badge, tag, chip, atau pill kategori/modul (seperti badge hitam/amber "KATALOG ADMIN ERP", "PENGADAAN & RANTAI PASOK ERP", "LOGISTIK GUDANG", "KEUANGAN & HUTANG", "ERP Accounting & Cashflow", "ERP ORDER FULFILLMENT", atau label sejenis) di atas, di bawah, atau di samping judul utama halaman (`<h1>`) pada halaman mana pun (baik storefront maupun admin ERP).
    - Header kartu modul WAJIB bersih dan langsung berfokus pada judul halaman (`<h1>`) serta deskripsi fungsi tanpa label penanda modul redundant di atasnya.
17. **Standar Pewarnaan Aksi Menu Dropdown Tabel Admin (Clean Neutral Action Menu with Red Destructive Only)**:
    - Pada menu aksi baris tabel (`MoreVertical` dropdown popup):
      - HANYA aksi destruktif (seperti "Hapus", "Batalkan Pesanan/PO") yang WAJIB menggunakan warna merah tegas (`text-rose-600` / `text-rose-700`, `hover:bg-rose-50`).
      - SELURUH aksi lainnya (seperti "Lihat Detail", "Ubah / Edit", "Terima Barang / GRN", "Bayar Tagihan", "Aktifkan", "Nonaktifkan", "Cetak", dll.) WAJIB menggunakan warna netral (`text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900`, dengan ikon netral `text-neutral-500` / `text-neutral-600`).
      - Dilarang mewarnai aksi non-destruktif dengan warna-warni berlebihan di dalam dropdown menu agar antarmuka admin tetap bersih, profesional, dan fokus. Aksen warna hanya diperuntukkan bagi aksi destruktif (merah) sebagai penanda risiko.
18. **Proteksi Mutlak dari Potensi Infinite Re-render Loop di React (Anti-Infinite Loop Guard)**:
    - DILARANG KERAS memanggil setter state yang menghasilkan referensi objek/array/Set/Map baru (seperti `setRemovedRowNames(new Set())`, `setMatrix([])`) di dalam `useEffect` jika state tersebut menjadi dependency dari `useEffect` yang sama TANPA bailout referensi stabil (`prev => prev.size === 0 ? prev : new Set()`).
    - DILARANG menggunakan default parameter inline (seperti `vendors = []`) pada props komponen jika menjadi dependency `useEffect` yang memicu re-fetch/update saat kosong. WAJIB menggunakan referensi stabil (seperti `const EMPTY_ARRAY = [];`) atau menjalankan fetch hanya sekali saat mount (`[]`).
19. **Standarisasi Manajemen State Tabel dengan Zustand & Server-Side Execution**:
    - Seluruh pengelolaan state tabel data admin (filter, pagination, limit/per_page, dan sorting) WAJIB menggunakan state management store terpusat berbasis Zustand (`src/stores/*`).
    - DILARANG KERAS melakukan pemotongan data (client-side pagination via `.slice()`), penyaringan array in-memory (`.filter()`), atau pengurutan in-memory (`.sort()`) pada komponen tabel admin.
    - Seluruh operasi pagination, limit, filter pencarian, dan sorting WAJIB dieksekusi secara Server-Side melalui query API ke backend Laravel Eloquent (`$query->paginate()`). Komponen antarmuka tabel WAJIB langsung mengonsumsi data dari server.
20. **Standardisasi Modal Konfirmasi Kustom (ConfirmationModal & Larangan Browser Dialogs)**:
    - DILARANG KERAS menggunakan dialog bawaan browser (`window.confirm`, `confirm`, `window.alert`, `alert`, `window.prompt`, `prompt`) pada seluruh komponen antarmuka, halaman, dan form admin maupun storefront Tusko.
    - Seluruh dialog konfirmasi (seperti konfirmasi hapus data tunggal, hapus massal, pembatalan pesanan/PO, konfirmasi navigasi saat form belum disimpan, dll.) WAJIB menggunakan modal kustom terstandarisasi `ConfirmationModal` (`frontend/src/components/ConfirmationModal.jsx` atau `frontend/src/components/organisms/ConfirmationModal.jsx`) bersudut siku tajam `rounded-none`, header gelap atletis, varian yang relevan (`danger`, `warning`, `info`), dan tombol aksi terstandarisasi.
    - DILARANG membuat elemen dialog konfirmasi kustom mentah inline tanpa memanfaatkan komponen reusable `ConfirmationModal`.
21. **Larangan Mutlak Tombol Refresh di Halaman / Header / Toolbar (Strict Prohibition of Page Refresh/Reload Buttons)**:
    - DILARANG KERAS menambahkan tombol manual untuk refresh/reload/segarkan data (menggunakan icon `RefreshCw`, `RotateCcw`, atau tombol dengan label/title/tooltip "Segarkan", "Muat Ulang", "Refresh", "Reload") pada header modul, toolbar, maupun kanvas halaman mana pun.
    - Seluruh tabel data dan komponen admin bersifat reaktif (terintegrasi langsung dengan Zustand store atau otomatis re-fetch saat filter/parameter berubah).
    - Tombol refresh manual di dalam halaman adalah redundant, mencemari keseragaman desain, dan dilarang.
22. **Wajib Ikon Modul pada Seluruh Header Halaman Admin (Mandatory Module Header Icon)**:
    - Seluruh kartu header halaman modul admin (termasuk Dashboard Utama Toko, Master Supplier & Vendor, Daftar Produk & Katalog, Master Kategori, Manajemen Stok, Antrean Pesanan, Buku Kas, Pengaturan Ekspedisi, PO, GRN, Bills, Template) WAJIB menyertakan wadah ikon modul (module icon box) di sisi kiri judul halaman (`<h1>`).
    - Format wadah ikon WAJIB bersudut siku tegas (`rounded-none`, latar gelap `bg-neutral-950 text-amber-400` atau `text-white`, ukuran `w-10 h-10` atau `w-12 h-12`) memuat ikon Lucide modul terkait (seperti LayoutDashboard, Building2, Package, Boxes, dll.).
    - Header modul admin DILARANG hanya menampilkan teks judul polos tanpa wadah ikon modul di sebelah kirinya.
    - PENGECUALIAN: halaman form Create/Edit mengikuti kartu header form kanonis aturan 25 (tombol kembali `IconButton` + `h1`, tanpa icon-box/deskripsi).
23. **Wajib Halaman Terpisah untuk Seluruh Form Create & Edit (Mandatory Dedicated Create/Edit Page — No Create/Edit Modals)**:
    - Seluruh form **Create** (tambah record baru) dan **Edit** (ubah field record) data entitas — Produk, Kategori, Supplier/Vendor, Ekspedisi, Mutasi Stok (restock/kurangi/penyesuaian), Transaksi Keuangan, PO/GRN/Bill, Alamat, Voucher — WAJIB hidup di **halaman terpisah mandiri** (`*CreatePage.jsx` / `*EditPage.jsx`) dengan URL rute/view mandiri, kartu header modul (ikon + judul + deskripsi), tombol kembali, dan feedback via Toast.
    - DILARANG KERAS membungkus form create/edit dalam modal overlay (`fixed inset-0` + `isOpen`) seperti `*CreateModal`, `*EditModal`, `*Add*Modal`, `*FormModal`, atau modal inline berisi input + tombol Simpan/Perbarui.
    - Pengecualian yang DIIZINKAN tetap sebagai modal/drawer (bukan form create/edit record): `ConfirmationModal` (konfirmasi hapus/batal), `*FilterDrawer` (sidebar filter), picker penilih data existing (`MapPickerModal`, pemilih alamat/ekspedisi), pratinjau read-only (`Print*Modal`, detail viewer), dialog aksi satu-langkah (`OrderStatusModal`), dropdown menu aksi & `UserMenuDropdown`.
24. **Standar Layout Form 3/4 + 1/4 dengan Panel Tips (Form Grid with Guidance Sidebar)**:
    - Seluruh halaman form (Create/Edit dan form operasional lain) WAJIB memakai grid desktop `grid grid-cols-1 lg:grid-cols-4 gap-6`: kolom utama form `lg:col-span-3`, panel tips/dokumentasi cara mengisi `lg:col-span-1` (sticky di desktop via `lg:sticky lg:top-6`, menumpuk vertikal di mobile).
    - Panel tips WAJIB memakai komponen reusable `organisms/FormTipsPanel` berisi panduan singkat cara mengisi tiap field/section (ikon Lucide + heading + teks, bahasa Indonesia). DILARANG membuat panel tips mentah inline berulang di tiap halaman form.
    - Kartu header modul tetap full-width di atas grid; hanya area konten (form + tips) yang dibagi 3/4–1/4.
25. **Spesimen Kanonis Gaya Form Tusko (Canonical Form Style Specimen — 100% Identik)**:
    - Seluruh komponen form di halaman mana pun WAJIB 100% identik dengan spesimen token berikut (yang boleh berbeda hanya teks konten, ikon konteks, dan opsi data):
    - Label field: `block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5`; tanda wajib: `<span className="text-rose-500">*</span>`.
    - Input teks/angka/tanggal, textarea, dan trigger dropdown: `w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none` (bobot: `font-medium` teks biasa, `font-mono` kode/angka/SKU, `font-bold` trigger dropdown).
    - Dropdown: WAJIB memakai komponen reusable `molecules/ServerSideSelect` (searchable). DILARANG KERAS native `<select>` di halaman form.
    - Checkbox: `rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer`.
    - Judul section `h2`: `text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3` dengan ikon Lucide `size={16} className="text-amber-500"`.
    - Kotak error: `p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150`, teks `text-xs font-sport font-bold uppercase`, ikon `AlertCircle size={16} className="text-rose-600"`, plus tombol dismiss.
    - Tombol submit utama: `w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none` dengan ikon `Save size={15}`.
    - Tombol sekunder: `w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none`.
    - Judul halaman `h1`: `text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950` disertai wadah ikon modul.
    - Kartu header form kanonis (struktur 100% identik, hanya judul/tooltip/handler yang boleh beda):
      `flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs`;
      kiri `flex items-center gap-3` berisi `IconButton` kembali (`ArrowLeft`, `outline`, tooltip "Kembali ke ...") + `div > h1` TANPA badge/icon-box/deskripsi;
      kanan `flex items-center gap-2` berisi HANYA tombol icon-only (`IconButton` aksi konteks + `X` batal `secondary` + `Save` simpan `primary` dengan tooltip).
      DILARANG icon-box `w-12 h-12`, deskripsi `<p>` di header, tombol teks "Kembali", dan `shadow-xs` pada kartu header form.
    - Root halaman form: `space-y-6 pb-12 animate-in fade-in duration-200`.
    - Palet form: hanya `neutral-*`, `amber-*`, `rose-*` (error), `white/black`. DILARANG `gray-*` dalam bentuk apa pun; `focus:ring-*` selain `focus:ring-amber-500` pada checkbox DILARANG.
26. **Spesimen Kanonis Halaman List Utama (Canonical Main List Page — 100% Identik)**:
    - Seluruh halaman daftar utama (`*ListPage.jsx`, `*ManagementPage.jsx`, `*SettingsPage.jsx`) WAJIB 100% identik dengan spesimen berikut (yang boleh berbeda hanya teks konten, ikon konteks, angka metrik, kolom data, dan opsi filter):
    - Root: `space-y-6 pb-12 animate-in fade-in duration-200`.
    - Kartu header: `flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs`.
    - Kiri header: `min-w-0` > `flex items-start sm:items-center gap-3` > icon-box `w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0` (ikon Lucide `size={22}`) + `div` > `h1` (`text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight`) + `p` (`text-xs text-neutral-600 mt-0.5`).
    - Kanan header: HANYA `IconButton` icon-only `[Tambah primary] [Filter secondary + badge]` (filter selalu di kanan tambah). DILARANG tombol teks dan tab switcher multi-entitas di header.
    - Grid KPI: `grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4`.
    - Kartu KPI: `bg-white p-4 rounded-none border border-neutral-300 shadow-2xs`; baris judul `flex items-center justify-between text-neutral-500 mb-1.5` + label `text-xs font-sport font-black uppercase tracking-wider` + ikon `size={16}`; baris nilai `flex items-baseline gap-2` + angka `text-2xl font-black font-sport` (+ satuan `text-[11px] font-mono font-bold text-neutral-400`); footer `mt-2 text-[11px] border-t border-neutral-100 pt-1.5`.
    - Tabel: `ServerSideTable` langsung (tanpa toolbar/container sebelum tabel), `selectable={true}`, `limitOptions={[10, 25, 50, 100]}`, kolom Aksi menu `MoreVertical` (aturan 13, warna aturan 17), tombol bulk destruktif `px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-sport font-bold text-[11px] uppercase rounded-none` (DILARANG `bg-red-700`).
    - Filter terpusat `*FilterDrawer` kanan; konfirmasi hapus via `ConfirmationModal`; feedback via Toast. Palet: `neutral-*`/`amber-*`/`rose-*` (+ `emerald-*` untuk status sukses). DILARANG `gray-*` dalam bentuk apa pun.
27. **Wajib Cakupan Filter 100% Kolom Tabel (Filter Covers Every Column)**:
    - Setiap halaman list utama WAJIB memiliki `*FilterDrawer` (kecuali `TemplateManagementPage` yang merupakan workspace editor, bukan daftar data).
    - Seluruh informasi/kolom yang ditampilkan tabel ke user WAJIB 100% dapat difilter: kolom teks (nomor/nama/vendor/petugas) via `SearchBar`, kolom pilihan/status/vendor/kategori via `ServerSideSelect`, kolom tanggal via input tanggal Dari–Sampai, kolom nominal/unit via input angka Min–Maks.
    - DILARANG kolom tabel yang tidak memiliki padanan kontrol filter di drawer.
28. **Larangan Mutlak Elemen Form Bawaan HTML (No Native Form Elements)**:
    - DILARANG KERAS merender elemen form bawaan HTML (`<input>`, `<select>`, `<textarea>`) langsung di halaman/komponen mana pun. Seluruh input WAJIB memakai komponen custom reusable yang sudah ada:
      pencarian teks → `molecules/SearchBar`; dropdown → `molecules/ServerSideSelect` (searchable, server-side bila perlu); teks/angka/tanggal → `molecules/TextInput`; area teks → `molecules/TextArea`; checkbox → `molecules/Checkbox`; pilih berkas → `molecules/FileInput`; tombol icon-only → `atoms/IconButton`.
    - Elemen bawaan HANYA boleh hidup di dalam file implementasi komponen reusable itu sendiri (`atoms/*`, `molecules/*`).
29. **Standar Keseragaman Margin & Padding Antarmuka (Uniform & Identical Margin & Padding Across All Pages)**:
    - Seluruh halaman, form, kartu, dan komponen antarmuka WAJIB memiliki jarak, margin, dan padding yang seragam dan identik 100% tanpa deviasi:
    - **Root Container Halaman Admin**: WAJIB memakai `space-y-6 pb-12 animate-in fade-in duration-200` (DILARANG menghilangkan `pb-12` atau mengganti padding root secara acak).
    - **Kartu Header Modul**: WAJIB memakai padding `p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs` (DILARANG `p-4`, `p-8`, atau border-b polos tanpa kartu padat).
    - **Grid & Kartu KPI**:
      * Grid KPI WAJIB: `grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4`.
      * Kartu KPI WAJIB: `bg-white p-4 rounded-none border border-neutral-300 shadow-2xs` (DILARANG `p-5`, `p-6`, atau `space-y-1`).
    - **Grid Form & Kartu Seksi Form**:
      * Grid Form (aturan 24): `grid grid-cols-1 lg:grid-cols-4 gap-6 items-start`.
      * Kartu Seksi Form (aturan 25): `bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5` (padding WAJIB `p-5 sm:p-6`).
    - **Sidebar Filter Drawer**:
      * Header Drawer: `p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0`.
      * Body Drawer: `flex-1 overflow-y-auto p-5 sm:p-6 space-y-6`.
      * Footer Drawer: `p-5 sm:p-6 bg-white border-t border-neutral-200 flex items-center gap-3 shrink-0` (jika ada footer).
    - **Ukuran & Spasi Input Form**:
      * Seluruh kontrol input satu baris (`TextInput`, `SearchBar`, `ServerSideSelect` trigger) WAJIB berukuran tinggi `h-[42px]`, padding `py-2.5 px-3.5` (kecuali `SearchBar` `pl-10 pr-12` karena ruang ikon), font `text-xs sm:text-sm`.
      * Margin bawah label field: `mb-1.5`.
      * Judul section form `h2` padding bawah: `pb-3 border-b border-neutral-200`.
    - **Kanvas Layout Utama Admin (<main>)**:
      * Layout container admin pada `App.jsx` WAJIB: `px-4 sm:px-8 lg:px-10 py-6`.
      * Seluruh tampilan modul admin WAJIB terdaftar dalam `adminCoreViews` agar padding kanvas seragam.
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
8. `08-backend-consistency-auditor.sh`: OpenCode AI Auditor untuk konsistensi Backend (namespace `App\Http\Controllers\Api`, pewarisan `Controller`, integritas up()/down() pada seluruh file migrasi, larangan sisa fungsi debug `dd`/`dump`, serta kewajiban penyimpanan berkas/media upload ke Storage dinamis via FileStorageService/Storage facade).
9. `09-zero-duplication-scanner.sh`: OpenCode AI Duplication Auditor (bebas script JS eksternal) yang memindai git diff dan file perubahan untuk menjamin 0 duplikasi rute API, 0 duplikasi tabel migrasi, 0 duplikasi helper/formatter, 0 duplikasi komponen, dan penolakan duplikasi elemen UI mentah yang membypass komponen reusable yang sudah ada.
10. `10-dedicated-create-edit-page.sh`: OpenCode AI Auditor yang menegakkan aturan 23/24/25 — seluruh form Create/Edit entitas WAJIB halaman terpisah (`*CreatePage.jsx`/`*EditPage.jsx`) dengan layout grid 3/4 + `FormTipsPanel` dan token 100% identik spesimen kanonis. Dilengkapi **cek deterministik tanpa AI** yang langsung REJECT beserta `path:baris`: native `<select>` di halaman form (wajib `ServerSideSelect`), palet `gray-*` (wajib `neutral-*`), `focus:ring-*` selain `focus:ring-amber-500` checkbox, sudut melengkung non-`rounded-none`, dan nama berkas `*CreateModal`/`*EditModal`/`*Add*Modal`/`*FormModal` baru. Cakupan triple: staged + unstaged + untracked.
11. `11-table-filter-coverage-and-custom-inputs.sh`: OpenCode AI Auditor yang menegakkan aturan 27 & 28 — (a) Larangan mutlak elemen form bawaan HTML (`<input>`, `<select>`, `<textarea>`) di luar atoms/molecules; wajib memakai custom reusable component (`TextInput`, `TextArea`, `FileInput`, `Checkbox`, `ServerSideSelect`, `SearchBar`), dan (b) Seluruh kolom data dan informasi yang disajikan oleh tabel ke user (FE table columns) pada halaman admin WAJIB 100% memiliki kontrol filter yang relevan pada `*FilterDrawer` terkait. Cakupan triple: staged + unstaged + untracked.
12. `12-agent-testing-proof-and-verification.sh`: OpenCode AI Auditor yang memverifikasi bahwa Agent AI telah melakukan pengetesan nyata terhadap setiap perubahan kode (Backend dengan Automated Suite Test `php artisan test` & Frontend dengan Browser Test riil). **Kewajiban Pengujian Fitur Aktif**: Jika perubahan kode menyangkut suatu fitur (form, filter drawer, aksi tabel, modal status, mutasi stok, alur belanja/checkout, dll.), pengujian frontend DILARANG hanya bersifat pasif memuat halaman (smoke test), melainkan WAJIB sampai menguji penggunaan fitur tersebut secara langsung (pengetikan form kustom, pemilihan dropdown, klik tombol aksi, eksekusi filter, submit, dan verifikasi perubahan state/DOM). Bukti wajib didokumentasikan di folder `.agent-test-proofs/` sebelum commit dan diverifikasi keabsahannya oleh AI. Berkas bukti dipertahankan selama pre-commit dan **dibersihkan secara otomatis oleh hook Git post-commit** setelah proses commit berhasil dilakukan. Cakupan triple: staged + unstaged + untracked.
13. `13-uniform-margin-padding.sh`: OpenCode AI & Deterministic Auditor yang menegakkan aturan 29 — keseragaman margin & padding antarmuka pada seluruh halaman, form, kartu header, kartu KPI, filter drawer, dan input fields. Dilengkapi cek deterministik langsung REJECT bila ditemukan pelanggaran padding/margin kanonis (`space-y-6 pb-12`, `p-5 sm:p-6`, `p-4`, `h-[42px]`). Cakupan triple: staged + unstaged + untracked.
14. **Kewajiban Lokasi Berkas pada Rejection**: Setiap penolakan (`REJECTED`) dari seluruh modul auditor OpenCode AI WAJIB menyertakan lokasi berkas konkret dan nomor baris (`path/ke/file:baris`) yang harus diperbaiki oleh pengembang, bukan hanya alasan abstrak semata.

Jika salah satu audit gagal, commit akan **OTOMATIS DITOLAK** dan pengembang wajib memperbaiki masalah yang dilaporkan.
</RULE[pre_commit_auditor]>

