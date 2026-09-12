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
7. Standardisasi Sentralisasi Filter:
   - Seluruh kontrol filter katalog produk WAJIB terpusat pada Sidebar Filter kanan-ke-kiri, dilarang meletakkan/menduplikasi komponen filter pada halaman utama jika filter sidebar sudah diterapkan.
8. Standardisasi Wajib Komponen Reusable (Mandatory Reusable Component Reuse):
   - Pengembang WAJIB memanfaatkan dan mengimpor komponen reusable yang sudah ada di codebase (misalnya `IconButton` pada atoms/, `SearchBar` dan `ViewModeToggle` pada molecules/, `ServerSideTable`, `ProductFilterDrawer`, `ProductHeaderActions` pada organisms/).
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
11. Standardisasi Larangan Container Tambahan Sebelum/Pembungkus Tabel:
    - Pada halaman daftar data admin (admin list/table views), DILARANG membungkus elemen tabel di dalam container card ekstra (seperti membuat `<div className="bg-white p-5 ..."><table...></div>` yang membungkus search bar dan tabel sekaligus).
    - Toolbar pencarian/aksi dan komponen tabel WAJIB diletakkan langsung pada layout halaman secara mandiri dan bersih tanpa pembungkus card ganda yang redundan.
12. Standardisasi Wajib Checkbox List (Multi-Select) pada Seluruh Tabel Admin:
    - Seluruh tabel daftar data admin WAJIB memiliki kolom checkbox list untuk seleksi massal (bulk selection):
      - Header kolom pertama (`<th>`) WAJIB memuat checkbox "Select All" (`<input type="checkbox"...>`).
      - Setiap baris data (`<td>`) WAJIB memuat checkbox individual baris (`<input type="checkbox"...>`).
      - Wajib menyediakan bar aksi massal (bulk actions bar) saat ada baris yang dipilih.
    - Manfaatkan komponen reusable `ServerSideTable` dengan prop `selectable={true}` untuk memenuhi standar ini secara otomatis.
13. Standardisasi Posisi Tombol Filter Selalu di Samping Kanan Tombol Tambah:
    - Tombol kontrol filter (Filter Drawer/Sidebar Toggle) WAJIB selalu diletakkan di samping kanan tombol tambah (urutan aksi: `[Tombol Tambah] -> [Tombol Filter]`), BUKAN di sebelah kiri tombol tambah atau di posisi lain.
    - Berlaku konsisten baik pada kelompok tombol kontrol header (IconButton group) maupun toolbar di atas tabel.

Git Diff (Staged Frontend Changes):
```diff
EOF

echo "$STAGED_FE_DIFF" | head -n 120 >> "$PROMPT_FILE"

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

if echo "$AUDITOR_RESULT" | grep -qi "REJECTED"; then
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
