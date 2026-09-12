# TUSKO AI CODE AUDITOR RULES & STANDARDS

Repository ini diawasi oleh auditor otomatis bertenaga OpenCode AI (`.githooks/audits/` dan GitHub Actions) untuk menjamin kualitas arsitektur, keamanan, dan konsistensi desain secara ketat.

---

## 1. Arsitektur Frontend & Atomic Design
- **Hierarki Atomic Design**:
  - **Atoms (`frontend/src/components/atoms/`)**: Komponen atomik independen terkecil (contoh: `IconButton` dengan tooltip bawaan).
  - **Molecules (`frontend/src/components/molecules/`)**: Kombinasi atom (contoh: `ViewModeToggle`, `SearchBar`).
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
  - Pengalih tampilan: Wajib menggunakan `molecules/ViewModeToggle`.
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

