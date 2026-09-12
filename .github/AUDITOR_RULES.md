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
- Tombol aksi navigasi dan kontrol pada header katalog (seperti toggle list/grid, lihat etalase, tambah produk, dan filter) WAJIB menggunakan **simbol/ikon saja (icon-only)**.
- Setiap tombol WAJIB memiliki ketinggian dan rasio seragam (`h-10 w-10`), sudut siku tajam `rounded-none`, dan **menampilkan tooltip interaktif** yang jelas saat tombol di-highlight/hover/fokus.

## 3. Sentralisasi Kontrol Filter pada Sidebar
- Seluruh kontrol penyaringan (kategori, status publikasi, kondisi stok, rentang harga, dan pengurutan/sorting) WAJIB terpusat pada **Sidebar Filter (Drawer Kanan-ke-Kiri)**.
- Halaman utama DILARANG memuat komponen filter ganda/terduplikasi. Halaman utama hanya memuat bilah pencarian (`SearchBar`) yang bersih, hasil jumlah produk, dan tabel data.

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

