#!/bin/bash

echo "🤖 [Audit 10/10: Dedicated Create/Edit Page + Form Style (OpenCode AI)] Memeriksa halaman & gaya form..."

# CAKUPAN TRIPLE: staged + unstaged + untracked (file baru wajib ikut diaudit).
STAGED_FE=$(git diff --cached --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNSTAGED_FE=$(git diff --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNTRACKED_FE=$(git ls-files --others --exclude-standard -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')

if [ -z "$STAGED_FE" ] && [ -z "$UNSTAGED_FE" ] && [ -z "$UNTRACKED_FE" ]; then
    echo "ℹ️ [Audit Dedicated Page] Tidak ada perubahan frontend (staged/unstaged/untracked). Skip."
    exit 0
fi

STAGED_COUNT=$(printf "%s" "$STAGED_FE" | grep -c .)
UNSTAGED_COUNT=$(printf "%s" "$UNSTAGED_FE" | grep -c .)
UNTRACKED_COUNT=$(printf "%s" "$UNTRACKED_FE" | grep -c .)
echo "ℹ️ [Audit Dedicated Page] Cakupan: ${STAGED_COUNT} staged, ${UNSTAGED_COUNT} unstaged, ${UNTRACKED_COUNT} untracked."

ALL_CHANGED=$(printf "%s\n%s\n%s" "$STAGED_FE" "$UNSTAGED_FE" "$UNTRACKED_FE" | grep -v '^$' | sort -u)

# File halaman form dalam cakupan (aturan 23/24/25 berlaku penuh atas ISI file,
# bukan hanya baris diff — kemiripan gaya 100% tidak mengenal "baris lama").
FORM_FILES=$(printf "%s" "$ALL_CHANGED" | grep -E '(CreatePage|EditPage|CreateForm|EditForm|MutationPage|FormPage)\.jsx$')

# =====================================================================
# CEK DETERMINISTIK (tanpa AI, langsung REJECT dengan lokasi presisi)
# Spesimen kanonis: AGENTS.md aturan 25.
# =====================================================================
VIOLATIONS_FILE=$(mktemp)
# Catatan: append ke file (bukan variabel) karena loop pipe berjalan di subshell.
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

    # 1. DILARANG native <select> di halaman form (WAJIB molecules/ServerSideSelect).
    grep -n -E '<select([\s>]|$)' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Native <select> di halaman form (aturan 6 & 25: seluruh dropdown form WAJIB memakai komponen reusable molecules/ServerSideSelect yang searchable)." \
            "Ganti native <select> dengan <ServerSideSelect> (import dari molecules/ServerSideSelect) dengan trigger bergaya kanonis + pencarian."
    done

    # 2. DILARANG palet gray-* (WAJIB neutral-*).
    grep -n -E 'gray-[0-9]' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Palet gray-* terdeteksi (aturan 25: palet form hanya neutral-*/amber-*/rose-*/white/black)." \
            "Ganti gray-* menjadi padanan neutral-* (mis. text-gray-700→text-neutral-700, border-gray-200→border-neutral-200, bg-gray-50→bg-neutral-50)."
    done

    # 3. DILARANG focus:ring-* selain focus:ring-amber-500 (checkbox).
    grep -n 'focus:ring-' "$f" | grep -v 'focus:ring-amber-500' | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "focus:ring-* non-amber terdeteksi (aturan 25: fokus input WAJIB focus:border-amber-500 + focus:outline-none; ring hanya focus:ring-amber-500 pada checkbox)." \
            "Hapus focus:ring-* tersebut; untuk input gunakan focus:outline-none focus:border-amber-500."
    done

    # 4. DILARANG sudut melengkung (WAJIB rounded-none).
    grep -n -E 'rounded-(xl|2xl|3xl|lg)' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Sudut melengkung terdeteksi (aturan desain: seluruh komponen WAJIB rounded-none)." \
            "Ganti dengan rounded-none."
    done
done <<< "$FORM_FILES"

# 5. DILARANG nama berkas modal create/edit baru (staged-added ATAU untracked).
STAGED_ADDED=$(git diff --cached --name-only --diff-filter=A -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
NEW_MODALS=$(printf "%s" "$NEW_FILES" | grep -E '(CreateModal|EditModal|Add.+Modal|FormModal|DetailModal).*\.jsx$')
if [ -n "$NEW_MODALS" ]; then
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        deterministic_reject "$f:1" \
            "Berkas modal create/edit/detail baru (aturan 23 & 30: form Create/Edit dan tampilan Detail WAJIB halaman terpisah *CreatePage.jsx/*EditPage.jsx/*DetailPage.jsx)." \
            "Pindahkan konten ke halaman terpisah mandiri dengan rute/view mandiri, kartu header modul, tombol kembali, dan feedback via Toast."
    done <<< "$NEW_MODALS"
fi

if [ -s "$VIOLATIONS_FILE" ]; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Dedicated Page] DITOLAK (Deterministic Check)!"
    echo "❌ =========================================================================="
    cat "$VIOLATIONS_FILE"
    rm -f "$VIOLATIONS_FILE"
    echo ""
    exit 1
fi
rm -f "$VIOLATIONS_FILE"

# =====================================================================
# AUDIT CERDAS dengan OpenCode AI (spesimen kanonis + verdict per file)
# =====================================================================
COMBINED_DIFF=$(git diff HEAD -- "frontend/src/**/*.jsx" "frontend/src/**/*.js" 2>/dev/null)

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Form Page & Style Auditor untuk proyek Tusko Performance Storefront.
Tugasmu: untuk SETIAP file halaman form yang berubah di bawah, verifikasi (a) aturan 23/24
(halaman terpisah + grid 3/4 + FormTipsPanel) dan (b) KEIDENTIKAN 100% terhadap SPESIMEN
KANONIS berikut. Yang boleh berbeda antar halaman HANYA: teks konten, ikon konteks,
dan opsi data. Selain itu token class & struktur WAJIB identik.

SPESIMEN KANONIS GAYA FORM TUSKO (aturan 25):
- Label field: `block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5`; tanda wajib `<span className="text-rose-500">*</span>`.
- Input teks/angka/tanggal, textarea, trigger dropdown: `w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none` (bobot: `font-medium` teks biasa, `font-mono` kode/angka/SKU, `font-bold` trigger dropdown).
- Dropdown: WAJIB komponen reusable `molecules/ServerSideSelect` (searchable). DILARANG KERAS native `<select>` di halaman form.
- Checkbox: `rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer`.
- Judul section `h2`: `text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3` dengan ikon Lucide `size={16} className="text-amber-500"`.
- Kotak error: `p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150`, teks `text-xs font-sport font-bold uppercase`, ikon `AlertCircle size={16} className="text-rose-600"`, plus tombol dismiss.
- Tombol submit utama: `w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none` dengan ikon `Save size={15}`.
- Tombol sekunder: `w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none`.
- Judul halaman `h1`: `text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950` disertai wadah ikon modul.
- Kartu header form kanonis (struktur 100% identik, hanya judul/tooltip/handler yang boleh beda):
  `flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs`;
  kiri `flex items-center gap-3` berisi `IconButton` kembali (`ArrowLeft`, `outline`, tooltip "Kembali ke ...") + `div > h1` TANPA badge/icon-box/deskripsi;
  kanan `flex items-center gap-2` berisi HANYA tombol icon-only (`IconButton` aksi konteks + `X` batal `secondary` + `Save` simpan `primary` dengan tooltip).
  DILARANG icon-box `w-12 h-12`, deskripsi `<p>` di header, tombol teks "Kembali", dan `shadow-xs` pada kartu header form.
- Root halaman form: `space-y-6 pb-12 animate-in fade-in duration-200`.
- Grid: `grid grid-cols-1 lg:grid-cols-4 gap-6 items-start`, form `lg:col-span-3`, tips `lg:col-span-1` via `organisms/FormTipsPanel`.
- Palet form: hanya `neutral-*`, `amber-*`, `rose-*` (error), `white/black`. DILARANG `gray-*` dalam bentuk apa pun; `focus:ring-*` selain `focus:ring-amber-500` pada checkbox DILARANG.

PENGECUALIAN (bukan pelanggaran): `ConfirmationModal`, `*FilterDrawer`, picker data existing
(`MapPickerModal`, pemilih alamat/ekspedisi), pratinjau read-only (`Print*Modal`), dialog
aksi satu-langkah (`OrderStatusModal`), dropdown menu aksi & `UserMenuDropdown`. File modal
create/edit yang DIHAPUS dalam diff = perbaikan yang benar, bukan pelanggaran.

Berkas halaman form yang berubah:
EOF

printf "%s" "$FORM_FILES" | grep -v '^$' >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"

# Kerangka gaya tiap file form (semua baris pembawa style + nomor baris): AI bisa
# membandingkan langsung ke spesimen TANPA perlu menebak isi file yang tak terlihat.
echo "Kerangka gaya per file (nomor_baris: isi — bandingkan token class ke spesimen):" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"
SKELETON_BUDGET=600
while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue
    [ "$SKELETON_BUDGET" -le 0 ] && break
    echo "--- FILE: $f ---" >> "$PROMPT_FILE"
    TAKEN=$(grep -n -E 'className|<select|<input|<textarea|<button|<h2|<label|ServerSideSelect|FormTipsPanel|lg:col-span' "$f" | head -n 120 | wc -l)
    grep -n -E 'className|<select|<input|<textarea|<button|<h2|<label|ServerSideSelect|FormTipsPanel|lg:col-span' "$f" | head -n 120 >> "$PROMPT_FILE"
    SKELETON_BUDGET=$((SKELETON_BUDGET - TAKEN))
done <<< "$FORM_FILES"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

FORMAT JAWABAN (WAJIB verdict per file — DILARANG menjawab PASSED global tanpa memeriksa tiap file):
- Untuk SETIAP file di atas tulis satu baris: `[path] : PASSED` atau `[path] : REJECTED (baris X — token menyimpang vs spesimen — seharusnya: ...)`.
- Jika SEMUA file PASSED (atau hanya pengecualian/diff penghapusan modal): jawab HANYA kata "PASSED".
- Jika ada yang menyimpang dari spesimen (label/input/h2/error/button/grid/palet/ServerSideSelect):
  REJECTED
  - Lokasi Berkas: [path lengkap + nomor baris]
  - Pelanggaran: [token apa yang menyimpang dari spesimen]
  - Solusi: [samakan persis dengan token spesimen di atas]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 90s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 60s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Dedicated Page] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "❌ =========================================================================="
    echo "$AUDITOR_RESULT" | sed -n -E '/(REJECTED|DITOLAK)/,$p'
    echo ""
    exit 1
fi

echo "✅ [Audit Dedicated Page] PASSED (Halaman & gaya form identik spesimen, diverifikasi oleh OpenCode AI)."
exit 0
