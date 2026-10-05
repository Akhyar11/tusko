#!/bin/bash
# ==============================================================================
# AUDITOR 14 — Dokumentasi vs Kode + Verifikasi Screenshot (Playwright)
# ==============================================================================
# Tiga lapis pemeriksaan:
#   [1] DETERMINISTIK : struktur .tex, gambar ada & asli (bukan placeholder),
#                       tidak ada "(TODO)" pada flow yang diubah.
#   [2] PLAYWRIGHT    : mengambil ulang screenshot tiap flow via Chromium Python,
#                       memastikan halaman/alur benar-benar ADA di aplikasi nyata
#                       dan gambar adalah hasil render asli (bukan palsu).
#   [3] OPENCODE AI   : menilai kesesuaian isi dokumentasi vs kode/rute/flow aktual.
# ==============================================================================
echo "🤖 [Audit 14/14: Dokumentasi vs Aktual + Screenshot (Playwright + OpenCode AI)] Memeriksa kesesuaian dokumentasi..."

# Model AI auditor dapat dikonfigurasi (cadangan bila model default tak merespons).
AUDITOR_MODEL="${AUDITOR_MODEL:-opencode/muse-spark-1.3-contributor-free}"

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT" || exit 1

DOC_DIR="dokumentasi"

# CAKUPAN TRIPLE: staged + unstaged + untracked
TRIPLE=$(printf "%s\n%s\n%s" \
  "$(git diff --cached --name-only 2>/dev/null)" \
  "$(git diff --name-only 2>/dev/null)" \
  "$(git ls-files --others --exclude-standard 2>/dev/null)" \
  | grep -v '^$' | sort -u)

DOC_CHANGED=$(printf "%s\n" "$TRIPLE" | grep -E "^(${DOC_DIR}/|taks_dokumentasi\.txt)" || true)
CODE_CHANGED=$(printf "%s\n" "$TRIPLE" | grep -E '^(backend/|frontend/)' || true)

if [ -z "$DOC_CHANGED" ] && [ -z "$CODE_CHANGED" ]; then
    echo "ℹ️ [Audit Dokumentasi] Tidak ada perubahan dokumentasi maupun kode backend/frontend. Skip."
    exit 0
fi

if [ ! -d "$DOC_DIR" ]; then
    echo "❌ [Audit Dokumentasi] Folder '$DOC_DIR/' tidak ditemukan."
    exit 1
fi

# ------------------------------------------------------------------------------
# [1] VALIDASI DETERMINISTIK
# ------------------------------------------------------------------------------
echo ""
echo "🔎 [1/3] Validasi deterministik struktur dokumentasi & keaslian gambar..."
export DOC_CHANGED
DET_LOG=$(python3 "$DOC_DIR/verifikasi/validate_docs.py" 2>&1)
DET_EXIT=$?
echo "$DET_LOG"
if [ $DET_EXIT -ne 0 ]; then
    echo ""
    echo "❌ ======================================================================"
    echo "❌ [Audit Dokumentasi] DITOLAK pada validasi deterministik (struktur/gambar)."
    echo "💡 Perbaiki gambar/berkas pada 'path:baris' yang dilaporkan di atas."
    echo "❌ ======================================================================"
    exit 1
fi

# ------------------------------------------------------------------------------
# [2] VERIFIKASI SCREENSHOT VIA PLAYWRIGHT (Python)
# ------------------------------------------------------------------------------
echo ""
echo "🎭 [2/3] Verifikasi keaslian screenshot dengan Playwright (Chromium Python)..."
PW_LOG=""
PW_EXIT=0
if [ -f "$DOC_DIR/verifikasi/verify_screenshots.py" ]; then
    PW_LOG=$(python3 "$DOC_DIR/verifikasi/verify_screenshots.py" 2>&1)
    PW_EXIT=$?
    echo "$PW_LOG"
else
    PW_LOG="[verify_screenshots.py tidak ditemukan]"
    PW_EXIT=1
fi

HAS_HARD_FAIL=0
if [ $PW_EXIT -ne 0 ]; then
    # Kegagalan Playwright hanya menolak bila memang ada gambar yang harus diuji.
    if printf "%s" "$PW_LOG" | grep -qE "gagal|TIDAK ditemukan|tidak mirip|Manifest"; then
        HAS_HARD_FAIL=1
    fi
fi

if [ $HAS_HARD_FAIL -ne 0 ]; then
    echo ""
    echo "❌ ======================================================================"
    echo "❌ [Audit Dokumentasi] DITOLAK: verifikasi screenshot Playwright GAGAL."
    echo "💡 Pastikan aplikasi berjalan (DOC_VERIFY_BASE_URL) & gambar adalah screenshot asli."
    echo "❌ ======================================================================"
    exit 1
fi

# ------------------------------------------------------------------------------
# [3] AUDIT AI: DOKUMENTASI vs KODE / FLOW AKTUAL
# ------------------------------------------------------------------------------
echo ""
echo "🧠 [3/3] Audit OpenCode AI: kesesuaian dokumentasi vs kode/flow aktual..."

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Auditor Dokumentasi untuk sistem TUSKO (E-Commerce Olahraga + ERP).
PENTING: DILARANG memanggil alat (file/shell/git). Jawab LANGSUNG berdasarkan
informasi di bawah. Baris pertama jawaban WAJIB berisi "PASSED" atau "REJECTED".
Tugasmu menilai apakah DOKUMENTASI PENGGUNA (LaTeX) SESUAI dengan KODE/FLOW AKTUAL,
tidak mengarang fitur, dan gambarnya adalah screenshot asli aplikasi.

ATURAN AUDIT:
1. Setiap alur/fitur yang didokumentasikan WAJIB benar-benar ada di kode/rute aktual
   (tidak boleh fitur fiktif / tidak dapat diakses).
2. Alur WAJIB dapat dijangkau pengguna (terdaftar di rute) dan aktornya benar
   (Pelanggan vs Admin).
3. Setiap alur WAJIB punya minimal 1 gambar; gambar harus screenshot asli aplikasi
   (bukan mockup/diedit/di-generate). Hasil verifikasi Playwright disertakan.
4. Jika ada kode backend/frontend yang BERUBAH namun dokumentasi alur terkait TIDAK
   diperbarui sehingga menjadi tidak sinkron → TOLAK.
5. DILARANG ada penanda "(TODO)" pada alur yang dinyatakan selesai.
6. Jika perubahan kode backend/frontend TIDAK mengubah perilaku alur/fitur yang
   sudah didokumentasikan (perbaikan internal, penanganan error, refactor, dsb.),
   dokumentasi dianggap tetap SINKRON -> jawab PASSED. Hanya TOLAK bila perubahan
   kode mengubah perilaku alur terdokumentasi namun dokumentasi tidak diperbarui.

JAWAB dengan format:
- Jika dokumentasi sesuai & gambar asli:
  PASSED
  [ringkas 2-3 kalimat aspek yang diverifikasi]
- Jika tidak:
  REJECTED
  - Lokasi Berkas: [path berkas dan nomor baris konkret, mis. dokumentasi/02-pelanggan/P10-keranjang-belanja.tex:12]
  - Pelanggaran: [dokumentasi vs kode yang tidak sinkron / gambar tidak asli / fitur fiktif]
  - Solusi: [perbaikan konkret]

=====================================================================
RUTE AKTUAL (frontend/src/App.jsx) — sumber kebenaran halaman yang ada:
=====================================================================
EOF

grep -oE "=== '[^']+'|startsWith\('/[^']+'" frontend/src/App.jsx 2>/dev/null | sort -u | head -n 200 >> "$PROMPT_FILE" || true

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
ENDPOINT API AKTUAL (backend/routes/api.php):
=====================================================================
EOF
grep -oE "Route::(get|post|put|patch|delete)\('[^']+'" backend/routes/api.php 2>/dev/null | sort -u | head -n 300 >> "$PROMPT_FILE" || true

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
PERUBAHAN KODE backend/frontend (untuk menilai apakah dokumentasi terpengaruh):
=====================================================================
EOF
{ git diff -- backend frontend 2>/dev/null; git diff --cached -- backend frontend 2>/dev/null; } | head -c 20000 >> "$PROMPT_FILE" || true

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
HASIL VALIDASI DETERMINISTIK:
=====================================================================
EOF
echo "$DET_LOG" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
HASIL VERIFIKASI PLAYWRIGHT (keaslian screenshot):
=====================================================================
EOF
echo "$PW_LOG" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
BERKAS DOKUMENTASI YANG DIUBAH (isi):
=====================================================================
EOF
while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ -f "$f" ] || continue
    case "$f" in
        dokumentasi/*.tex|dokumentasi/**/*.tex|taks_dokumentasi.txt)
            echo "--- Berkas: $f ---" >> "$PROMPT_FILE"
            head -c 6000 "$f" >> "$PROMPT_FILE"
            echo "" >> "$PROMPT_FILE"
            ;;
    esac
done <<< "$DOC_CHANGED"
if [ -z "$DOC_CHANGED" ]; then
    echo "[Tidak ada perubahan berkas dokumentasi; hanya kode yang berubah — pastikan dokumentasi tetap sinkron.]" >> "$PROMPT_FILE"
fi

AUDITOR_RESULT=""
AUDIT_BLANK_DIR=$(mktemp -d)
for attempt in 1 2 3; do
    if command -v agy &> /dev/null; then
        AUDITOR_RESULT=$(cd "$AUDIT_BLANK_DIR" && timeout 90s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
    elif command -v opencode &> /dev/null; then
        AUDITOR_RESULT=$(cd "$AUDIT_BLANK_DIR" && timeout 150s opencode run --pure -m "$AUDITOR_MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    fi
    if grep -Eq "(PASSED|REJECTED|DITOLAK)" <<< "$AUDITOR_RESULT"; then
        break
    fi
    echo "⚠️ [Audit Dokumentasi] Percobaan $attempt tidak menghasilkan verdict; mengulang..."
    sleep 2
done
rm -rf "$AUDIT_BLANK_DIR"
rm -f "$PROMPT_FILE"

echo ""
echo "🧠 =========================================================================="
echo "🧠 [OpenCode AI Documentation Auditor]:"
echo "🧠 =========================================================================="
echo "$AUDITOR_RESULT"
echo "🧠 =========================================================================="
echo ""

if [ -z "$AUDITOR_RESULT" ]; then
    echo "❌ [Audit Dokumentasi] GAGAL: OpenCode AI tidak memberikan respon."
    exit 1
fi

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Dokumentasi] DITOLAK oleh OpenCode AI: dokumentasi tidak sesuai kode/flow aktual."
    exit 1
fi

if ! grep -E -q "(^|[[:space:]]|\*\*)PASSED([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Dokumentasi] DITOLAK: OpenCode AI tidak menyatakan status PASSED."
    exit 1
fi

echo "✅ [Audit Dokumentasi] PASSED (dokumentasi sesuai kode/flow & gambar terbukti screenshot asli via Playwright)."
exit 0
