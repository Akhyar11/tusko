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
   - Tombol kontrol/aksi pada header tabel produk menggunakan simbol/ikon saja (icon-only) bersudut siku tajam (`rounded-none`) dan WAJIB dilengkapi tooltip yang memunculkan keterangan fungsi saat di-highlight/hover/fokus.
7. Standardisasi Sentralisasi Filter:
   - Seluruh kontrol filter katalog produk WAJIB terpusat pada Sidebar Filter kanan-ke-kiri, dilarang meletakkan/menduplikasi komponen filter pada halaman utama jika filter sidebar sudah diterapkan.

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
