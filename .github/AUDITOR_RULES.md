# TUSKO AI CODE AUDITOR RULES & STANDARDS

Repository ini diawasi oleh auditor otomatis bertenaga OpenCode AI (`.githooks/audits/` dan GitHub Actions) untuk menjamin kualitas arsitektur, keamanan, dan konsistensi desain secara ketat.

---

## 1. Arsitektur Frontend & Atomic Design
- **Hierarki Atomic Design**:
  - **Atoms (`frontend/src/components/atoms/`)**: Komponen atomik independen terkecil (contoh: `IconButton` dengan tooltip bawaan).
  - **Molecules (`frontend/src/components/molecules/`)**: Kombinasi atom (contoh: `SearchBar`, `ServerSideSelect`).
  - **Organisms (`frontend/src/components/organisms/`)**: Modul UI fungsional mandiri (contoh: `ProductHeaderActions`, `ProductFilterDrawer`, `ServerSideTable`).
  - **Templates/Pages (`frontend/src/components/`)**: Halaman yang mengorkestrasi komponen (contoh: `ProductListPage`).

## 2. Standar Tombol Kontrol Header (Icon-Only + Tooltip)
- Tombol aksi navigasi dan kontrol pada header tabel dan form modul produk (Daftar Produk, Tambah Produk, Edit Produk) WAJIB menggunakan **simbol/ikon saja (icon-only)**.
- Setiap tombol WAJIB menggunakan komponen reusable `atoms/IconButton`, memiliki ketinggian dan rasio seragam (`h-10 w-10`), sudut siku tajam `rounded-none`, dan **menampilkan tooltip interaktif** yang jelas saat tombol di-highlight/hover/fokus. Dilarang menggunakan tombol teks biasa pada header.

## 3. Sentralisasi Kontrol Filter & Pencarian pada Sidebar
- Seluruh kontrol penyaringan dan pencarian (kategori, status publikasi, kondisi stok, rentang harga, keyword pencarian, dan pengurutan/sorting) WAJIB terpusat pada **Sidebar Filter (Drawer Kanan-ke-Kiri)**.
- Halaman utama DILARANG memuat bilah toolbar pencarian (`SearchBar`), tombol tambah teks, atau tombol filter teks redundant di atas tabel. Halaman utama hanya memuat kartu header (dengan icon-only controls), kartu metrik, dan langsung tabel data (`ServerSideTable`).

## 4. Standar Desain Tusko Athletic Performance
- **Sudut Siku Tegas (`rounded-none`)**: 100% komponen antarmuka dilarang menggunakan sudut melengkung (`rounded-md`, `rounded-lg`, `rounded-xl`, dll.).
- **Pustaka Ikon**: 100% menggunakan `lucide-react`. Pustaka lain dilarang keras.
- **Formatter Mata Uang**: Wajib menggunakan `formatRupiah` dari `@/utils/formatters`.
- **LocalStorage Key**: Wajib berawalan prefix `tusko_` (contoh: `tusko_token`, `tusko_cart`).

## 5. Proteksi Keamanan & Hardcode
- Dilarang keras melakukan hardcode kredensial, konfigurasi dinamis toko, atau koordinat statis.
- Seluruh komit wajib melalui 9 modul pre-commit auditor OpenCode AI sebelum dapat digabungkan ke branch master.

## 6. Kewajiban Penggunaan Komponen Reusable yang Sudah Dibuat (Zero Reinventing)
- Pengembang dan Agen AI WAJIB mengimpor dan memanfaatkan komponen-komponen reusable yang sudah ada di proyek:
  - Tombol aksi/kontrol: Wajib menggunakan `atoms/IconButton`.
  - Bilah pencarian: Wajib menggunakan `molecules/SearchBar`.
  - Dropdown filter: Wajib menggunakan `molecules/ServerSideSelect`.
  - Tabel server-side (pagination, limit, sorting, row selection): Wajib menggunakan `ServerSideTable`.
  - Drawer filter katalog produk: Wajib menggunakan `organisms/ProductFilterDrawer`.
  - Tombol aksi header katalog: Wajib menggunakan `organisms/ProductHeaderActions`.
- DILARANG KERAS membuat markup mentah baru atau menduplikasi elemen UI yang sudah tersedia komponen reusable-nya. Auditor OpenCode AI akan OTOMATIS MENOLAK (REJECT) komit yang membypass atau menduplikasi komponen reusable.

## 7. Standar Desain & Kontrol Panel Filter (Filter & Search Rules)
- **Pemisahan Pencarian Nama & SKU**: Pencarian nama produk dan pencarian kode SKU WAJIB dipisah menjadi input mandiri masing-masing (`SearchBar` Nama Produk terpisah dari `SearchBar` Kode SKU). Dilarang menyatukan pencarian nama dan SKU ke dalam satu input gabungan.
- **Larangan Counter Redundant**: Dilarang menampilkan teks hitungan redundant seperti "Ditemukan X dari Y produk" di bawah kotak input pencarian filter.
- **Wajib ServerSideSelect pada Seluruh Dropdown Filter**: Seluruh dropdown filter (Kategori, Status Publikasi, Kondisi Stok, Urutan Katalog) WAJIB menggunakan komponen reusable `ServerSideSelect` dengan fitur pencarian dan scroll padding.
- **Standardisasi Teks Placeholder**: Placeholder filter wajib berupa kalimat ajakan deskriptif (contoh: "Pilih status publikasi...", "Pilih kategori olahraga...", "Pilih kondisi stok...", "Pilih urutan katalog..."), BUKAN langsung menampilkan nilai opsi seperti "Semua ..." saat filter belum dipilih.
- **Pembeda Kontras Warna Placeholder vs Label**: Warna teks placeholder pada select WAJIB dibedakan jelas dari label tebal di atasnya (menggunakan warna abu-abu lembut `text-neutral-400 font-normal`, bukan teks hitam tebal seperti judul/label).

## 8. Standar Header Modul Bersih (Clean Header & No Redundant Breadcrumbs)
- **Larangan Breadcrumb Manual Redundant**: DILARANG menampilkan baris navigasi teks/breadcrumb manual yang redundant di atas kartu header modul (seperti "← Etalase Storefront • ADMIN ERP • KATALOG PRODUK") karena perpindahan navigasi storefront dan tindakan halaman telah diwadahi secara elegan oleh komponen tombol aksi header (`ProductHeaderActions`).
- **Fokus Header**: Kartu header modul harus bersih dan langsung berfokus pada identitas modul (ikon besar, judul halaman, deskripsi fungsi) dan kelompok tombol kontrol/aksi.

## 9. Larangan Baris Toolbar/Container Tambahan Sebelum Tabel
- **Larangan Baris Toolbar & Container Card Ganda**: Pada halaman list/tabel admin, DILARANG membungkus elemen tabel di dalam kartu container ekstra ataupun meletakkan baris toolbar perantara (seperti `SearchBar`, tombol Tambah teks, atau tombol Filter teks) sebelum tabel data.
- **Struktur Layout Bersih**: Seluruh tindakan navigasi, penambahan data, dan pemicu drawer diwadahi oleh kelompok tombol icon-only di header, dan tabel data WAJIB langsung dirender bersih pada hierarki layout halaman langsung tanpa ada bilah perantara di atasnya.

## 10. Standardisasi Wajib Checkbox List pada Tabel Admin
- **Wajib Fitur Multi-Select / Bulk Selection**: Seluruh tabel daftar data admin WAJIB menyediakan kolom checkbox list:
  - Kolom pertama pada header (`<th>`) WAJIB memiliki checkbox "Select All" (`<input type="checkbox"...>`).
  - Setiap baris data (`<td>`) WAJIB memiliki checkbox individual untuk memilih baris data tersebut.
  - Dilengkapi indikator jumlah baris terpilih dan bar aksi massal (bulk action bar) saat satu atau lebih item dipilih.
  - Pengembang WAJIB memanfaatkan komponen reusable `ServerSideTable` dengan prop `selectable={true}`.

## 11. Standar Posisi Tombol Filter (Selalu di Samping Kanan Tombol Tambah)
- **Urutan Aksi Konsisten**: Tombol kontrol filter (baik berupa `IconButton` pada header maupun tombol toolbar di atas tabel) WAJIB selalu diposisikan di **samping kanan tombol tambah** (`[Tombol Tambah] [Tombol Filter]`).
- **Larangan Posisi Terbalik**: Dilarang meletakkan tombol filter di sebelah kiri tombol tambah atau memisahkan tombol tambah ke sisi lain yang membuat filter berada mendahului tindakan penambahan data.

## 12. Standar Tampilan Tunggal Tabel Admin (Single Table View Only)
- **Hanya Tampilan Tabel**: Seluruh daftar data pada modul admin (seperti Produk dan Kategori) WAJIB disajikan secara eksklusif menggunakan tampilan tabel tunggal (`ServerSideTable`).
- **Larangan Toggle Tampilan**: DILARANG menampilkan tombol pengalih tampilan (`ViewModeToggle` / list vs grid) atau menyediakan variasi layout grid pada halaman data admin.

## 13. Standar Kolom Aksi Tabel Admin (MoreVertical Dropdown Action Menu)
- **Wajib Menu Titik Tiga (`MoreVertical`)**: Seluruh kolom "Aksi" pada tabel data admin (`ServerSideTable`) WAJIB menggunakan tombol menu titik tiga (`MoreVertical`) bersudut siku (`rounded-none`) yang memicu floating dropdown popup menu aksi.
- **Larangan Tombol Aksi Telanjang/Sejajar**: DILARANG KERAS menampilkan tombol aksi mentah secara telanjang/sejajar (seperti icon pensil ubah dan tempat sampah hapus berdampingan langsung di baris sel tabel). Seluruh tindakan baris (ubah, hapus, detail, dll.) WAJIB terorganisir rapi di dalam dropdown menu `MoreVertical`.

## 14. Standar 1 Halaman 1 Entitas Mandiri (Single-Purpose Dedicated Page - No Multi-Module Tabs)
- **1 Halaman 1 Entitas Bisnis**: Seluruh halaman admin WAJIB berdiri sendiri untuk satu entitas/modul bisnis spesifik (1 halaman untuk 1 entitas mandiri).
- **Dilarang Navigasi Tab Multi-Entitas**: DILARANG KERAS menggabungkan modul/entitas yang berbeda ke dalam sistem navigasi tab horizontal dalam 1 halaman (contoh: Purchase Order, Supplier, Penerimaan Barang GRN, dan Tagihan Vendor digabung dalam 1 layar dengan tab switcher).
- **Dedicated Page**: Setiap entitas bisnis wajib memiliki file halaman tersendiri (`src/components/*Page.jsx`), URL rute mandiri di navigasi sidebar, kartu header modul terfokus, metrik KPI khusus untuk entitas tersebut, dan tabel data tunggal (`ServerSideTable`) tanpa tab-taban pengalih modul.

## 15. Standardisasi Sistem Notifikasi Toast (Unified Toast Notification Consistency)
- **Wajib Sistem Toast Terpusat**: Seluruh modul, form, dan tabel admin WAJIB menggunakan sistem Toast yang sudah ada secara konsisten melalui prop/fungsi `onShowToast` atau `showToast` untuk memberikan umpan balik operasional (tambah, edit, hapus, error).
- **Larangan Alert Banner Sukses Lokal**: DILARANG KERAS merender kotak notifikasi alertbox lokal atau banner hijau/merah inline di atas kanvas halaman utama (seperti banner `successMessage` di antara header dan metrik) karena kanvas utama harus tetap bersih.
- **Larangan Tombol Keranjang Belanja pada Admin Toast**: DILARANG menampilkan tombol aksi pembeli ("Lihat Keranjang") pada toast notifikasi admin. Tombol shortcut keranjang hanya boleh ditampilkan secara selektif saat aksi penambahan produk ke keranjang di storefront (`showCart: true`).

## 16. Standar Larangan Mutlak Label/Badge Header Redundant (No Header Badges / Category Pills on Any Page)
- **Larangan Keras**: DILARANG KERAS menyertakan label badge, tag, chip, atau pill kategori/modul (seperti badge hitam/amber "KATALOG ADMIN ERP", "PENGADAAN & RANTAI PASOK ERP", "LOGISTIK GUDANG", "KEUANGAN & HUTANG", "ERP Accounting & Cashflow", "ERP Inventory & Multi-Warehouse", "ERP ORDER FULFILLMENT", "OPERATIONAL ERP CONTROL", atau label sejenis) di atas, di bawah, atau di samping judul utama halaman (`<h1>`) pada halaman mana pun (baik storefront maupun admin ERP).
- **Rasional Desain & Ergonomi**: Identitas modul telah terwakili secara resmi dan elegan melalui menu sidebar navigasi yang aktif, ikon modul, serta judul halaman (`<h1>`) yang deskriptif. Penambahan badge/label mini di atas judul menciptakan redundansi visual dan mengotori hierarki tipografi.
- **Wajib Header Bersih**: Seluruh kartu header halaman WAJIB bersih, langsung menampilkan judul halaman (`<h1>`) dan deskripsi tanpa didahului badge/tag/pill modul di atasnya.

## 17. Standar Pewarnaan Aksi Menu Dropdown Tabel Admin (Clean Neutral Action Menu with Red Destructive Only)
- **Aksi Destruktif Wajib Merah**: Pada menu aksi baris tabel (`MoreVertical` dropdown popup), HANYA aksi destruktif (seperti "Hapus", "Batalkan Pesanan/PO") yang WAJIB menggunakan warna merah tegas (`text-rose-600` / `text-rose-700`, `hover:bg-rose-50`).
- **Aksi Non-Destruktif Wajib Netral**: SELURUH aksi lainnya (seperti "Lihat Detail", "Ubah / Edit", "Terima Barang / GRN", "Bayar Tagihan", "Aktifkan", "Nonaktifkan", "Cetak", dll.) WAJIB menggunakan warna netral (`text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900`, dengan ikon netral `text-neutral-500` / `text-neutral-600`).
- **Larangan Warna-Warni Berlebihan**: DILARANG mewarnai aksi non-destruktif dengan warna-warni mencolok (seperti teks/ikon biru, hijau, ungu, kuning) di dalam dropdown menu agar tampilan antarmuka tetap bersih, profesional, dan fokus. Aksen warna hanya diperuntukkan bagi aksi destruktif (merah) sebagai penanda risiko.

## 18. Kewajiban Menyertakan Lokasi Berkas Lengkap pada Laporan Rejection Auditor (Mandatory File Location & Line Number on Rejection)
- **Wajib Lokasi Berkas & Baris**: Setiap modul auditor pre-commit OpenCode AI (`01` s/d `09`) WAJIB menyertakan lokasi berkas lengkap beserta nomor baris spesifik (`path/ke/file:baris`) yang harus diperbaiki oleh pengembang saat mengeluarkan status penolakan (`REJECTED`).
- **Larangan Alasan Tanpa Lokasi**: DILARANG KERAS hanya memberikan alasan penolakan secara abstrak tanpa menyebutkan lokasi berkas dan nomor baris konkret tempat pelanggaran terjadi.
- **Format Baku Laporan Penolakan**:
  ```markdown
  REJECTED
  - Lokasi Berkas: [path/ke/file.ext:nomor_baris]
  - Pelanggaran: [Deskripsi detail aturan yang dilanggar]
  - Solusi: [Tindakan perbaikan konkret yang harus dilakukan]
  ```
