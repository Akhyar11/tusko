#!/bin/bash

echo "🤖 [Audit 13/13: Uniform Margin & Padding Consistency (OpenCode AI)] Memeriksa keseragaman margin & padding antarmuka..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT" || exit 1

# CAKUPAN TRIPLE: staged + unstaged + untracked
STAGED_FE=$(git diff --cached --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNSTAGED_FE=$(git diff --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNTRACKED_FE=$(git ls-files --others --exclude-standard -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')

if [ -z "$STAGED_FE" ] && [ -z "$UNSTAGED_FE" ] && [ -z "$UNTRACKED_FE" ]; then
    echo "ℹ️ [Audit Uniform Margin & Padding] Tidak ada perubahan berkas frontend. Skip."
    exit 0
fi

ALL_CHANGED=$(printf "%s\n%s\n%s" "$STAGED_FE" "$UNSTAGED_FE" "$UNTRACKED_FE" | grep -v '^$' | sort -u)
PAGE_FILES=$(printf "%s" "$ALL_CHANGED" | grep -E '(Page|Form|Drawer)\.jsx$')

# =====================================================================
# CEK DETERMINISTIK KESERAGAMAN MARGIN & PADDING (Aturan 29)
# =====================================================================
VIOLATIONS_FILE=$(mktemp)

deterministic_reject() {
    {
        echo "REJECTED"
        echo "  - Lokasi Berkas: $1"
        echo "  - Pelanggaran: $2"
        echo "  - Solusi: $3"
    } >> "$VIOLATIONS_FILE"
}

while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue

    basename_file=$(basename "$f")

    # 1. Halaman Admin List & Form: Root Container WAJIB pb-12
    if [[ "$basename_file" =~ (ListPage|ManagementPage|SettingsPage|TransactionsPage|CreatePage|EditPage|ProductCreateForm|ProductEditForm|StockMutationPage|AdminDashboardPage)\.jsx$ ]]; then
        # Cek apakah ada tag root div yang menggunakan space-y-6 tanpa pb-12
        if grep -q -E 'className=["'\'']space-y-6(["'\'']|[[:space:]]+(animate-in|bg-))' "$f" && ! grep -q 'pb-12' "$f"; then
            ln=$(grep -n -E 'className=["'\'']space-y-6' "$f" | head -n1 | cut -d: -f1)
            [ -z "$ln" ] && ln=1
            deterministic_reject "$f:$ln" \
                "Root container halaman admin tidak memakai padding bottom kanonis (Aturan 29: WAJIB 'space-y-6 pb-12 animate-in fade-in duration-200')." \
                "Tambahkan 'pb-12' pada class root container halaman."
        fi
    fi

    # 2. Halaman List Utama: Kartu Header WAJIB p-5 sm:p-6
    if [[ "$basename_file" =~ (ListPage|ManagementPage|SettingsPage|TransactionsPage)\.jsx$ ]]; then
        if grep -q 'bg-white' "$f" && grep -q 'xl:items-center' "$f"; then
            if ! grep -q 'bg-white p-5 sm:p-6' "$f"; then
                hln=$(grep -n -m1 'bg-white' "$f" | cut -d: -f1)
                [ -z "$hln" ] && hln=1
                deterministic_reject "$f:$hln" \
                    "Kartu header modul tidak memakai padding kanonis p-5 sm:p-6 (Aturan 26/29: WAJIB 'p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs')." \
                    "Ganti padding kartu header menjadi 'p-5 sm:p-6'."
            fi
        fi
    fi

    # 3. Filter Drawer: Header & Body WAJIB p-5 sm:p-6
    if [[ "$basename_file" =~ Drawer\.jsx$ ]]; then
        if ! grep -q 'p-5 sm:p-6 space-y-6' "$f"; then
            dln=$(grep -n -m1 'overflow-y-auto' "$f" | cut -d: -f1)
            [ -z "$dln" ] && dln=1
            deterministic_reject "$f:$dln" \
                "Body Filter Drawer tidak memakai padding kanonis p-5 sm:p-6 space-y-6 (Aturan 27/29)." \
                "Ganti padding body drawer menjadi 'flex-1 overflow-y-auto p-5 sm:p-6 space-y-6'."
        fi
    fi

    # 4. Single Line Custom Inputs di molecules/ WAJIB h-[42px]
    if [[ "$f" =~ frontend/src/components/molecules/(TextInput|SearchBar)\.jsx$ ]]; then
        if ! grep -q 'h-\[42px\]' "$f"; then
            iln=$(grep -n -m1 'rounded-none' "$f" | cut -d: -f1)
            [ -z "$iln" ] && iln=1
            deterministic_reject "$f:$iln" \
                "Komponen input kustom satu baris tidak memiliki tinggi identik 42px (Aturan 25/29: WAJIB h-[42px])." \
                "Tambahkan class 'h-[42px]' pada elemen input komponen ini."
        fi
    fi

done <<< "$ALL_CHANGED"

if [ -s "$VIOLATIONS_FILE" ]; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Uniform Margin & Padding] DITOLAK (Deterministic Check)!"
    echo "❌ =========================================================================="
    cat "$VIOLATIONS_FILE"
    echo "❌ =========================================================================="
    echo "💡 Perbaiki masalah ketidakseragaman margin/padding di atas sebelum commit."
    rm -f "$VIOLATIONS_FILE"
    exit 1
fi
rm -f "$VIOLATIONS_FILE"

# =====================================================================
# ANALISIS KONSISTENSI MARGIN & PADDING DENGAN OPENCODE AI
# =====================================================================
PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Senior Frontend UI & Design System Auditor untuk proyek Tusko Athletic Performance Storefront & ERP.
Tugasmu adalah menganalisis apakah seluruh perubahan kode frontend mematuhi standar keseragaman margin & padding (Aturan 29):

STANDAR KESERAGAMAN MARGIN & PADDING (ATURAN 29):
1. Root Container Halaman Admin: WAJIB 'space-y-6 pb-12 animate-in fade-in duration-200'.
2. Kartu Header: WAJIB padding 'p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs'.
3. Grid KPI & Kartu KPI:
   - Grid KPI: 'grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4'.
   - Kartu KPI: WAJIB padding 'p-4 rounded-none border border-neutral-300 shadow-2xs'.
4. Form Section Cards: WAJIB padding 'p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs'.
5. Filter Drawer: WAJIB header 'p-5 sm:p-6', body 'p-5 sm:p-6 space-y-6'.
6. Input satu baris (TextInput, SearchBar, ServerSideSelect trigger): Tinggi identik 'h-[42px]' dan padding 'py-2.5 px-3.5' (atau 'pl-10 pr-12' untuk SearchBar).
7. Layout Utama Admin (<main>): 'px-4 sm:px-8 lg:px-10 py-6'.

DAFTAR BERKAS FRONTEND YANG DIUBAH:
EOF

echo "$PAGE_FILES" >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"

# Ekstraksi Token Margin & Padding Berkas
echo "=====================================================================" >> "$PROMPT_FILE"
echo "EKSTRAKSI TOKEN MARGIN & PADDING PADA BERKAS TERKAIT:" >> "$PROMPT_FILE"
echo "=====================================================================" >> "$PROMPT_FILE"

python3 -c "
import sys, re, os

files = sys.stdin.read().splitlines()
for f in sorted(files):
    if not os.path.exists(f): continue
    print(f'--- Berkas: {f} ---')
    with open(f) as fp:
        lines = fp.readlines()
    for idx, l in enumerate(lines):
        if any(token in l for token in ['space-y-6', 'pb-12', 'p-5 sm:p-6', 'p-4', 'h-[42px]', 'gap-3.5 sm:gap-4', 'gap-6 items-start']):
            print(f'  L{idx+1}: {l.strip()[:140]}')
    print('')
" <<< "$PAGE_FILES" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

=====================================================================
PANDUAN EVALUASI AI:
- Evaluasi HANYA berdasarkan teks ketentuan dan potongan baris di atas.
- DILARANG memanggil tool/alat eksternal atau membaca filesystem.
- Jawab HANYA dalam teks polos tanpa markdown berlebihan.
=====================================================================
FORMAT JAWABAN:
- Jika seluruh token margin & padding telah seragam dan mematuhi Aturan 29:
  PASSED
  [Penjelasan ringkas 2-3 kalimat mengenai aspek kepatuhan margin & padding yang telah seragam]
- Jika ditemukan inkonsistensi yang melanggar:
  REJECTED
  - Lokasi Berkas: [path/ke/file:baris]
  - Pelanggaran: [deskripsi pelanggaran margin/padding]
  - Solusi: [cara memperbaikinya]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 45s opencode run --pure -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 35s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

echo ""
echo "🤖 =========================================================================="
echo "🤖 [OpenCode AI Margin & Padding Consistency Evaluation]:"
echo "🤖 =========================================================================="
echo "$AUDITOR_RESULT"
echo "🤖 =========================================================================="
echo ""

if [ -z "$AUDITOR_RESULT" ]; then
    echo "❌ [Audit Uniform Margin & Padding] GAGAL: OpenCode AI tidak memberikan respon!"
    exit 1
fi

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Uniform Margin & Padding] DITOLAK OLEH OPENCODE AI!"
    exit 1
fi

if ! grep -E -q "(^|[[:space:]]|\*\*)PASSED([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Uniform Margin & Padding] DITOLAK: OpenCode AI tidak menyatakan status PASSED!"
    exit 1
fi

echo "✅ [Audit Uniform Margin & Padding] PASSED (Keseragaman margin & padding antarmuka terverifikasi 100%)."
exit 0
