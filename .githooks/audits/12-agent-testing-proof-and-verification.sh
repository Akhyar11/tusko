#!/bin/bash

echo "🤖 [Audit 12/12: Agent Testing Proof & Feature Verification (Pure OpenCode AI)] Menganalisis bukti pengetesan Backend & Frontend dengan AI..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT" || exit 1

PROOF_DIR="$REPO_ROOT/.agent-test-proofs"
mkdir -p "$PROOF_DIR"

# CAKUPAN TRIPLE: staged + unstaged + untracked
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E '^(backend|frontend)/')
UNSTAGED_FILES=$(git diff --name-only 2>/dev/null | grep -E '^(backend|frontend)/')
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '^(backend|frontend)/')

ALL_CHANGED=$(printf "%s\n%s\n%s" "$STAGED_FILES" "$UNSTAGED_FILES" "$UNTRACKED_FILES" | grep -v '^$' | sort -u)

if [ -z "$ALL_CHANGED" ]; then
    echo "ℹ️ [Audit Testing Proof] Tidak ada perubahan berkas backend maupun frontend. Skip."
    exit 0
fi

CHANGED_COUNT=$(printf "%s\n" "$ALL_CHANGED" | wc -l)
echo "ℹ️ [Audit Testing Proof] Menganalisis $CHANGED_COUNT berkas perubahan dengan Pure OpenCode AI..."

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Pure AI Quality Assurance & Testing Proof Auditor untuk proyek Tusko Performance Storefront & ERP.
Tugasmu adalah menganalisis dan memvalidasi apakah Agent AI telah melakukan pengetesan yang kredibel, mendalam, dan nyata terhadap seluruh perubahan kode yang dilakukan.

=====================================================================
ATURAN AUDIT PENGETESAN (AGENTS.md ATURAN 12):
=====================================================================
1. KEWAJIBAN ADANYA DOKUMENTASI BUKTI PENGUJIAN:
   - Sebelum perubahan kode diizinkan untuk di-commit, Agent AI WAJIB membuat file dokumentasi bukti pengetesan di folder .agent-test-proofs/.
   - Jika ada perubahan backend atau frontend namun TIDAK ADA file bukti di .agent-test-proofs/ (folder kosong), kamu WAJIB MENOLAK (REJECTED).

2. PENGETESAN BACKEND (Jika ada berkas di backend/ yang diubah):
   - Wajib ada bukti eksekusi test suite backend (misal: backend-suite-test.md) yang memuat eksekusi riil 'php artisan test'.
   - Wajib memuat statistik konkret: jumlah tests, jumlah assertions, status passed, 0 failures, dan relevansi terhadap fitur yang diubah.
   - Dilarang keras berupa mock dummy/placeholder "TODO" tanpa eksekusi nyata.

3. PENGETESAN FRONTEND (Jika ada berkas di frontend/ yang diubah):
   - Wajib ada bukti pengujian browser riil (misal: frontend-browser-test.md).
   - ATURAN MUTLAK: PENGUJIAN WAJIB SAMPAI MENGUJI PENGGUNAAN FITUR (FEATURE-DRIVEN ACTIVE INTERACTION TESTING):
     Jika dalam kode yang berubah ada FITUR (Form Create/Edit, Filter Drawer, Aksi Tabel, Modal Status/Konfirmasi, Mutasi Stok, Custom Inputs, dsb.), pengujian DILARANG HANYA pasif memuat halaman (smoke test/URL load).
     Pengujian WAJIB secara aktif menguji penggunaan fitur tersebut di peramban:
     * Fitur Form: Menguji pengetikan input (TextInput/TextArea), pemilihan dropdown (ServerSideSelect), klik tombol Simpan/Batal, validasi, dan submit data.
     * Fitur Filter Drawer: Menguji pembukaan drawer, input pencarian (SearchBar), pemilihan dropdown kustom, dan verifikasi pembaruan data pada tabel (terfilter & reset).
     * Fitur Aksi Tabel & Modal: Menguji pemicuan menu titik tiga MoreVertical, interaksi dialog/modal status/konfirmasi kustom, dan respons UI.
     * Jika perubahan menyangkut fitur namun laporannya hanya navigasi pasif atau sekadar halaman terbuka tanpa bukti interaksi penggunaan fitur, kamu WAJIB MENOLAK (REJECTED).
   - Wajib memverifikasi kebersihan konsol browser (0 console errors, 0 runtime exceptions).
   - Wajib memverifikasi kepatuhan visual/desain: sudut siku rounded-none, palet warna, form custom, dan hasil 'npm run build'.
4. TOOLING BROWSER WAJIB (PLAYWRIGHT DARI PYTHON):
   - Seluruh pengujian browser WAJIB dijalankan menggunakan Playwright dari Python (`python3` + paket `playwright`, browser Chromium).
   - Bukti laporan WAJIB menunjukkan penggunaan Playwright Python (mis. skrip Python dengan `from playwright.sync_api import sync_playwright`, perintah `python3 ...`, dan/atau bukti eksekusi browser Chromium).
   - DILARANG KERAS memakai curl/HTTP-only, tool manual, framework non-Playwright, atau hanya memuat URL (smoke test) sebagai bukti pengujian fitur frontend.
   - Jika laporan TIDAK membuktikan penggunaan Playwright dari Python, kamu WAJIB MENOLAK (REJECTED) dan instruksikan Agent mengulang pengujian memakai Playwright dari Python.

=====================================================================
DAFTAR BERKAS KODE YANG DIUBAH:
=====================================================================
EOF

while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [ ! -f "$f" ]; then
        echo "- [DELETED / SUDAH DIHAPUS DARI CODEBASE] $f" >> "$PROMPT_FILE"
    else
        echo "- [ACTIVE] $f" >> "$PROMPT_FILE"
    fi
done <<< "$ALL_CHANGED"

cat << 'EOF' >> "$PROMPT_FILE"
Catatan Status Berkas:
- Berkas [DELETED] adalah modal/file lama yang telah dihapus permanen dari codebase (sesuai Aturan 23 migrasi ke dedicated page). Berkas [DELETED] tidak ada di filesystem dan TIDAK DAPAT/TIDAK PERLU diuji.
- Evaluasi pembuktian pengetesan HANYA berlaku untuk berkas yang berstatus [ACTIVE].
EOF

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
BERKAS BUKTI PENGETESAN YANG TERSEDIA DI .agent-test-proofs/:
=====================================================================
EOF

shopt -s nullglob
proof_files=("$PROOF_DIR"/*)
shopt -u nullglob

if [ ${#proof_files[@]} -eq 0 ]; then
    echo "[TIDAK ADA BERKAS BUKTI DI .agent-test-proofs/ - FOLDER KOSONG]" >> "$PROMPT_FILE"
else
    for pf in "${proof_files[@]}"; do
        if [ -f "$pf" ]; then
            echo "--- Berkas: $(basename "$pf") ---" >> "$PROMPT_FILE"
            cat "$pf" >> "$PROMPT_FILE"
            echo "" >> "$PROMPT_FILE"
        fi
    done
fi

cat << 'EOF' >> "$PROMPT_FILE"
=====================================================================
PANDUAN EVALUASI AI:
- Evaluasi HANYA berdasarkan teks laporan bukti yang disertakan di atas.
- Dilarang memanggil alat eksternal atau membaca filesystem.
=====================================================================
FORMAT JAWABAN:
- Jika seluruh pengetesan LENGKAP, VALID, NYATA, DAN MEMENUHI STANDAR (termasuk menguji penggunaan fitur aktif untuk frontend):
  PASSED
  [Berikan penjelasan singkat 2-3 kalimat mengenai aspek fitur apa saja yang berhasil diverifikasi]
- Jika TIDAK LENGKAP / TIDAK ADA BUKTI / MOCK DUMMY / HANYA SMOKE TEST PASIF TANPA MENGUJI FITUR:
  REJECTED
  - Lokasi Berkas: [Sebutkan berkas bukti atau path kode yang belum memiliki bukti uji fitur memadai]
  - Pelanggaran: [Jelaskan pelanggaran secara spesifik, misal: folder bukti kosong, atau ada fitur form/filter yang diubah namun laporannya hanya memuat URL tanpa interaksi fitur aktif]
  - Solusi: [Tindakan pengujian fitur yang wajib dilakukan oleh Agent di browser / suite test]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 90s opencode run --pure -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 60s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

echo ""
echo "🤖 =========================================================================="
echo "🤖 [Pure OpenCode AI Auditor Evaluation]:"
echo "🤖 =========================================================================="
echo "$AUDITOR_RESULT"
echo "🤖 =========================================================================="
echo ""

if [ -z "$AUDITOR_RESULT" ]; then
    echo "❌ [Audit Testing Proof] GAGAL: OpenCode AI tidak memberikan respon!"
    exit 1
fi

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Testing Proof] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "💡 Berkas bukti di .agent-test-proofs/ tetap dipertahankan agar dapat diperbaiki/dilengkapi."
    exit 1
fi

if ! grep -E -q "(^|[[:space:]]|\*\*)PASSED([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Testing Proof] DITOLAK: OpenCode AI tidak menyatakan status PASSED!"
    exit 1
fi

# Validasi bukti pengujian berhasil dilewati (PASSED)
echo "✅ [Audit Testing Proof] OpenCode AI menyatakan PASSED!"
echo "ℹ️ [Audit Testing Proof] Berkas bukti di .agent-test-proofs/ dipertahankan selama validasi dan akan dibersihkan secara otomatis oleh hook post-commit setelah commit sukses."
echo "✅ [Audit Testing Proof] PASSED (Pengetesan fitur terbukti 100% diverifikasi oleh OpenCode AI)."
exit 0
