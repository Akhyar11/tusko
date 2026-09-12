#!/bin/bash

echo "🤖 [Audit 9/9: Zero Duplication Scanner (OpenCode AI)] Memindai duplikasi rute, migrasi, helper & komponen..."

STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Zero Duplication] Tidak ada berkas yang di-stage. Skip."
    exit 0
fi

STAGED_DIFF=$(git diff --cached)

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Duplication Auditor untuk proyek Tusko Performance Storefront.
Tugasmu adalah menganalisis Git Diff dan daftar berkas yang di-stage berikut untuk mendeteksi DUPLIKASI KODE yang tidak diinginkan:

4 PILAR PEMERIKSAAN ZERO DUPLICATION:
1. Duplikasi Rute API (backend/routes/api.php):
   - Tidak boleh ada method + path rute yang didefinisikan lebih dari sekali.
   - Tidak boleh ada action controller yang dipetakan ke multiple endpoint redundan tanpa alasan arsitektural.
2. Duplikasi Skema Database (backend/database/migrations/):
   - Tidak boleh ada deklarasi `Schema::create('nama_tabel')` untuk nama tabel yang sama di dua file migrasi yang berbeda.
3. Duplikasi Helper & Formatter:
   - Dilarang mendefinisikan ulang fungsi formatting mata uang Rupiah lokal (seperti formatRupiah, formatIDR, toIDR) di dalam komponen. Wajib mengimpor dan menggunakan `formatRupiah` dari `@/utils/formatters.js`.
4. Duplikasi Komponen & Export (frontend/src/components/):
   - Dilarang membuat komponen dengan nama yang sama atau mengekspor ulang komponen yang sudah ada di direktori komponen.
5. Duplikasi Elemen UI & Kewajiban Menggunakan Komponen Reusable:
   - DILARANG menduplikasi atau membuat ulang elemen UI mentah secara inline jika sudah ada komponen reusable yang menyediakannya (contoh: wajib menggunakan `atoms/IconButton` untuk tombol aksi, `molecules/SearchBar` untuk input pencarian, `molecules/ServerSideSelect` untuk dropdown filter, `ServerSideTable` untuk tabel ber-pagination/limit, `organisms/ProductFilterDrawer` untuk filter katalog).
   - Pengembang WAJIB mengimpor dan memanfaatkan kembali (reuse) komponen-komponen yang telah dibuat sebelumnya.

Berkas Ter-stage:
EOF

echo "$STAGED_FILES" >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"
echo "Git Diff (Staged Changes):" >> "$PROMPT_FILE"
echo '```diff' >> "$PROMPT_FILE"
sed -n '1,140p' <<< "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

FORMAT JAWABAN:
- Jika tidak ditemukan duplikasi rute, tabel migrasi, helper, maupun komponen:
  Jawab HANYA kata "PASSED".
- Jika ditemukan duplikasi:
  REJECTED
  - Pelanggaran: [Sebutkan kategori duplikasi, file, dan baris yang menduplikasi kode]
  - Solusi: [Tindakan konsolidasi atau penghapusan duplikasi]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 35s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 25s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Zero Duplication] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "❌ =========================================================================="
    echo "$AUDITOR_RESULT" | sed -n '/REJECTED/,$p'
    echo ""
    echo "💡 Sesuai arsitektur Tusko: Rute API, migrasi tabel database, helper/formatter, dan komponen wajib tunggal & bebas duplikasi."
    echo ""
    exit 1
fi

echo "✅ [Audit Zero Duplication] PASSED (Codebase bebas duplikasi, diverifikasi oleh OpenCode AI)."
exit 0
