#!/bin/bash

echo "🤖 [Audit 7/9: Frontend Full-Stack Consistency (OpenCode AI)] Memeriksa konsistensi arsitektur, icon & helper..."

STAGED_FE=$(git diff --cached --name-only -- "frontend/src/**")

if [ -z "$STAGED_FE" ]; then
    echo "ℹ️ [Audit Frontend Consistency] Tidak ada perubahan frontend yang di-stage. Skip."
    exit 0
fi

STAGED_FE_DIFF=$(git diff --cached -- "frontend/src/**/*.jsx" "frontend/src/**/*.js")

if [ -z "$STAGED_FE_DIFF" ]; then
    echo "ℹ️ [Audit Frontend Consistency] Tidak ada perubahan berkas JS/JSX yang di-stage. Skip."
    exit 0
fi

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Frontend Architecture Consistency Auditor untuk proyek Tusko Performance Storefront.
Tugasmu adalah menganalisis Git Diff berkas frontend React berikut:

STANDAR KONSISTENSI FRONTEND TUSKO:
1. Standardisasi Icon Library:
   - Proyek Tusko 100% menggunakan `lucide-react`.
   - DILARANG KERAS mengimpor ikon dari pustaka lain (seperti `react-icons`, `@heroicons`, `font-awesome`, `@fortawesome`, `feather-icons`).
2. Standardisasi LocalStorage Key:
   - Seluruh penyimpanan `localStorage` (getItem, setItem, removeItem) WAJIB menggunakan prefix `tusko_` (contoh: `tusko_token`, `tusko_user`, `tusko_cart`). Dilarang key tanpa prefix `tusko_`.
3. Standardisasi Formatter Mata Uang:
   - Seluruh pemformatan harga/rupiah WAJIB menggunakan fungsi `formatRupiah` dari `@/utils/formatters` (atau `../utils/formatters.js`).
   - DILARANG membuat implementasi inline `new Intl.NumberFormat('id-ID', ...)` atau membuat fungsi formatter rupiah lokal baru.
4. Standardisasi Desain Tajam:
   - Komponen UI wajib menggunakan `rounded-none`. Dilarang menyisipkan `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-lg`.
5. Standardisasi Arsitektur Atomic Design:
   - Komponen antarmuka baru dan modularisasi frontend WAJIB menerapkan arsitektur Atomic Design (pemisahan Atoms, Molecules, Organisms, Pages).
6. Standardisasi Tombol Header Simbol/Icon-Only dengan Tooltip:
   - Tombol kontrol/aksi pada header tabel dan form modul produk (Daftar Produk, Tambah Produk, Edit Produk) WAJIB menggunakan format simbol/ikon saja (icon-only) bersudut siku tajam (`rounded-none`), memanfaatkan komponen reusable `IconButton`, dan WAJIB dilengkapi tooltip yang memunculkan keterangan fungsi saat di-highlight/hover/fokus. Dilarang menggunakan tombol teks biasa pada header jika dapat diwadahi oleh IconButton.
7. Standardisasi Sentralisasi Filter & Pencarian:
   - Seluruh kontrol filter dan pencarian data katalog/master produk WAJIB terpusat pada Sidebar Filter kanan-ke-kiri.
   - DILARANG KERAS meletakkan/menduplikasi komponen filter, baris toolbar pencarian (SearchBar), atau tombol aksi teks (Tambah/Filter) pada kanvas halaman utama di antara kartu metrik dan tabel jika filter sidebar dan tombol aksi header sudah diterapkan. Halaman utama WAJIB bersih dan langsung menampilkan tabel data (ServerSideTable) setelah kartu metrik/header.
8. Standardisasi Wajib Komponen Reusable (Mandatory Reusable Component Reuse):
   - Pengembang WAJIB memanfaatkan dan mengimpor komponen reusable yang sudah ada di codebase (misalnya `IconButton` pada atoms/, `SearchBar` dan `ServerSideSelect` pada molecules/, `ServerSideTable`, `ProductFilterDrawer`, `ProductHeaderActions` pada organisms/).
   - DILARANG KERAS membuat ulang kode mentah (inline reinventing) seperti tombol kontrol, input pencarian, tabel server-side, atau tooltip manual jika sudah ada komponen reusable yang menyediakannya.
9. Standardisasi Kontrol Filter & Pencarian (Filter & Search Rules):
   - Pemisahan Pencarian Nama & SKU: Pencarian nama produk dan pencarian kode SKU WAJIB dipisah menjadi input mandiri masing-masing (dua komponen SearchBar terpisah). Dilarang menyatukan pencarian nama dan SKU ke dalam satu input gabungan.
   - Larangan Counter Redundant di Kolom Cari: Dilarang menampilkan teks counter redundant seperti "Ditemukan X dari Y produk" di bawah kotak input pencarian filter.
   - Wajib ServerSideSelect pada Dropdown Filter: Seluruh dropdown/pilihan dalam panel filter (Kategori, Status Publikasi, Kondisi Stok, Urutan Katalog) WAJIB menggunakan komponen reusable ServerSideSelect dengan pencarian dan scroll padding.
   - Standardisasi Format Placeholder Filter: Placeholder filter wajib berbentuk kalimat ajakan deskriptif dan jelas (contoh: "Pilih status publikasi...", "Pilih kategori olahraga...", "Pilih kondisi stok...", "Pilih urutan katalog..."), BUKAN langsung menampilkan nilai opsi seperti "Semua ..." saat filter belum dipilih.
   - Kontras Warna Placeholder vs Label: Warna teks placeholder pada select WAJIB dibedakan jelas dari label tebal di atasnya (menggunakan warna abu-abu lembut `text-neutral-400 font-normal`, bukan hitam tebal seperti label).
10. Standardisasi Header Modul Bersih (Clean Header & No Redundant Breadcrumbs):
    - DILARANG menyisipkan baris navigasi teks/breadcrumb redundant di atas kartu header modul (seperti "← Etalase Storefront • ADMIN ERP • KATALOG PRODUK") jika navigasi dan aksi sudah diwadahi oleh komponen tombol aksi header (ProductHeaderActions).
    - Header modul WAJIB bersih dan langsung berfokus pada identitas modul (ikon besar, judul halaman, deskripsi fungsi) dan kelompok tombol kontrol/aksi.
11. Standardisasi Larangan Baris Toolbar/Container Redundant Sebelum Tabel:
    - Pada halaman daftar data admin (admin list/table views), DILARANG menambahkan baris toolbar ekstra (seperti input pencarian SearchBar atau tombol aksi filter/tambah duplikat) ataupun container card pembungkus sebelum tabel data.
    - Seluruh aksi navigasi/tambah/filter diwadahi oleh tombol icon-only di kartu header, seluruh pencarian/filter diwadahi oleh Sidebar Filter kanan, dan tabel data (ServerSideTable) langsung dirender bersih pada layout utama.
12. Standardisasi Wajib Checkbox List (Multi-Select) pada Seluruh Tabel Admin:
    - Seluruh tabel daftar data admin WAJIB memiliki kolom checkbox list untuk seleksi massal (bulk selection):
      - Header kolom pertama (`<th>`) WAJIB memuat checkbox "Select All" (`<input type="checkbox"...>`).
      - Setiap baris data (`<td>`) WAJIB memuat checkbox individual baris (`<input type="checkbox"...>`).
      - Wajib menyediakan bar aksi massal (bulk actions bar) saat ada baris yang dipilih.
    - Manfaatkan komponen reusable `ServerSideTable` dengan prop `selectable={true}` untuk memenuhi standar ini secara otomatis.
13. Standardisasi Posisi Tombol Filter Selalu di Samping Kanan Tombol Tambah:
    - Tombol kontrol filter (Filter Drawer/Sidebar Toggle) WAJIB selalu diletakkan di samping kanan tombol tambah (urutan aksi: `[Tombol Tambah] -> [Tombol Filter]`), BUKAN di sebelah kiri tombol tambah atau di posisi lain.
    - Berlaku konsisten baik pada kelompok tombol kontrol header (IconButton group) maupun toolbar.
14. Standardisasi Tampilan Tunggal Tabel Admin (Single Table View Only):
    - Seluruh tampilan daftar data admin (seperti Daftar Produk dan Master Kategori) WAJIB hanya menggunakan tampilan tabel tunggal (`ServerSideTable`).
    - DILARANG menampilkan tombol pengalih tampilan (`ViewModeToggle` / list vs grid switch) pada header modul admin karena daftar data admin hanya disajikan dalam format tabel.
15. Standardisasi Kolom Aksi Tabel Admin (MoreVertical Dropdown Action Menu):
    - Seluruh tabel daftar data admin (`ServerSideTable`) WAJIB menggunakan tombol menu titik tiga (`MoreVertical`) untuk kolom 'Aksi' yang memicu floating dropdown popup menu bersudut siku (`rounded-none`).
    - DILARANG KERAS menampilkan tombol aksi mentah secara telanjang/sejajar (seperti icon pensil edit dan tempat sampah delete berdampingan langsung di dalam baris sel tabel). Seluruh tindakan baris (ubah, hapus, detail, dll.) WAJIB terbungkus rapi di dalam dropdown menu `MoreVertical`.
16. Standardisasi 1 Halaman 1 Entitas Mandiri (Single-Purpose Dedicated Page - No Multi-Module Tabs):
    - Seluruh halaman admin WAJIB berdiri sendiri untuk satu entitas/modul bisnis spesifik (1 halaman untuk 1 entitas mandiri).
    - DILARANG KERAS menggabungkan beberapa entitas bisnis yang berbeda ke dalam sistem navigasi tab horizontal dalam satu halaman (seperti Purchase Order, Supplier, Penerimaan Barang GRN, dan Tagihan Vendor digabung dalam 1 halaman dengan tombol-tombol tab switcher).
    - Setiap entitas bisnis wajib memiliki file komponen halaman tersendiri (`src/components/*Page.jsx`), rute URL mandiri, kartu header modul terfokus, metrik KPI yang relevan, dan tabel data tunggal yang langsung disajikan tanpa tab switcher pengalih modul.
17. Standardisasi Sistem Notifikasi Toast (Unified Toast Notification Consistency):
    - Seluruh halaman dan form modul admin WAJIB menggunakan sistem Toast yang sudah ada secara konsisten melalui prop/fungsi `onShowToast` atau `showToast` untuk memberikan feedback operasional (tambah data, perbarui perubahan, hapus, toggle status, dan pesan error).
    - DILARANG KERAS membuat alert box sukses lokal atau banner notifikasi hijau/merah inline di atas kanvas halaman admin (seperti banner `successMessage` di antara header dan kartu metrik). Kanvas halaman utama harus selalu bersih dan seluruh feedback aksi pengguna wajib disalurkan melalui Toast.
    - DILARANG menampilkan tombol aksi belanja ('Lihat Keranjang' / Cart Shortcut) secara serampangan pada toast modul admin. Tombol keranjang hanya boleh muncul secara selektif saat pembeli menambahkan produk ke keranjang di storefront (`showCart: true`).
18. Standardisasi Larangan Mutlak Label/Badge/Pill Header pada Halaman Manapun (Strict Prohibition of Header Category Badges/Labels):
    - DILARANG KERAS menyertakan label badge, pill, tag, atau chip kategori/modul (seperti label hitam bersudut siku dengan teks kuning/amber seperti "KATALOG ADMIN ERP", "PENGADAAN & RANTAI PASOK ERP", "LOGISTIK GUDANG", "KEUANGAN & HUTANG", "ERP Accounting & Cashflow", "ERP Inventory & Multi-Warehouse", "ERP ORDER FULFILLMENT", "OPERATIONAL ERP CONTROL", atau label modul sejenis) di atas, di bawah, atau di samping judul utama halaman (`<h1>`) pada halaman mana pun (baik storefront maupun admin ERP).
    - Header halaman WAJIB bersih dan langsung berfokus pada judul modul (`<h1>`) dan deskripsi fungsinya tanpa label/tag/badge pengenal modul semacam itu.
    - Setiap penambahan atau keberadaan badge/label kategori di atas judul halaman WAJIB DITOLAK (REJECTED).
19. Standardisasi Pewarnaan Semantik Konsisten pada Isi Menu Aksi Tabel Admin (Consistent Semantic Action Menu Colors):
    - Seluruh item tindakan/aksi pada menu aksi baris tabel (`MoreVertical` dropdown menu atau tombol aksi sejenis) WAJIB diberikan warna semantik yang konsisten dan ekspresif pada ikon dan teks:
      - Lihat / Detail (View / Detail): Biru konsisten (`text-blue-600` / `text-blue-700`, `hover:bg-blue-50`).
      - Ubah / Edit Data: Biru Langit / Sky konsisten (`text-sky-600` / `text-sky-700`, `hover:bg-sky-50`).
      - Aksi Positif / Aktifkan / Selesai / Terima (GRN) / Pembayaran: Hijau Emerald konsisten (`text-emerald-600` / `text-emerald-700`, `hover:bg-emerald-50`).
      - Aksi Transisi Dokumen / Terbitkan PO: Indigo konsisten (`text-indigo-600` / `text-indigo-700`, `hover:bg-indigo-50`).
      - Aksi Peringatan / Nonaktifkan / Jadikan Draft / Batalkan: Kuning Amber / Oranye konsisten (`text-amber-600` / `text-amber-700`, `hover:bg-amber-50`).
      - Aksi Destruktif / Hapus: Merah Rose konsisten (`text-rose-600` / `text-rose-700`, `hover:bg-rose-50`).
    - DILARANG KERAS membiarkan item aksi tanpa warna (seperti teks monokrom hitam/abu-abu netral polos `text-neutral-800`, `text-neutral-700`, atau ikon abu-abu tanpa warna `text-neutral-500`, `text-neutral-400`, atau tanpa class warna sama sekali). Seluruh opsi aksi dalam dropdown wajib memiliki perlakuan warna semantik yang seragam dan seimbang.

Git Diff (Staged Frontend Changes):
```
EOF

sed -n '1,120p' <<< "$STAGED_FE_DIFF" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
```

FORMAT JAWABAN:
- Jika seluruh standar konsistensi frontend terpenuhi: Jawab HANYA kata "PASSED".
- Jika melanggar:
  REJECTED
  - Pelanggaran: [Sebutkan file, baris, dan standar konsistensi apa yang dilanggar]
  - Solusi: [Tindakan perbaikan yang harus dilakukan pengembang]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 30s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Frontend Consistency] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "❌ =========================================================================="
    echo "$AUDITOR_RESULT" | sed -n '/REJECTED/,$p'
    echo ""
    exit 1
fi

echo "✅ [Audit Frontend Consistency] PASSED (Konsistensi arsitektur frontend terverifikasi oleh OpenCode AI)."
exit 0
