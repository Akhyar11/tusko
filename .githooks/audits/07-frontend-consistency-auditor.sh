#!/bin/bash

echo "🤖 [Audit 7/9: Frontend Full-Stack Consistency (OpenCode AI)] Memeriksa konsistensi arsitektur, icon & helper..."

# CAKUPAN TRIPLE: staged + unstaged + untracked.
STAGED_FE=$(git diff --cached --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNSTAGED_FE=$(git diff --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNTRACKED_FE=$(git ls-files --others --exclude-standard -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')

if [ -z "$STAGED_FE" ] && [ -z "$UNSTAGED_FE" ] && [ -z "$UNTRACKED_FE" ]; then
    echo "ℹ️ [Audit Frontend Consistency] Tidak ada perubahan frontend (staged/unstaged/untracked). Skip."
    exit 0
fi

STAGED_COUNT=$(printf "%s" "$STAGED_FE" | grep -c .)
UNSTAGED_COUNT=$(printf "%s" "$UNSTAGED_FE" | grep -c .)
UNTRACKED_COUNT=$(printf "%s" "$UNTRACKED_FE" | grep -c .)
echo "ℹ️ [Audit Frontend Consistency] Cakupan: ${STAGED_COUNT} staged, ${UNSTAGED_COUNT} unstaged, ${UNTRACKED_COUNT} untracked."

ALL_CHANGED=$(printf "%s\n%s\n%s" "$STAGED_FE" "$UNSTAGED_FE" "$UNTRACKED_FE" | grep -v '^$' | sort -u)
PAGE_FILES=$(printf "%s" "$ALL_CHANGED" | grep -E '(Page|MutationPage)\.jsx$')
LIST_FILES=$(printf "%s" "$ALL_CHANGED" | grep -E '(ListPage|ManagementPage|SettingsPage|TransactionsPage)\.jsx$')

# =====================================================================
# CEK DETERMINISTIK (tanpa AI, langsung REJECT dengan lokasi presisi)
# Spesimen kanonis: AGENTS.md aturan 25 (form) & 26 (list utama).
# =====================================================================
VIOLATIONS_FILE=$(mktemp)
# Append ke file (loop pipe berjalan di subshell — variabel tidak propagate).
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

    # A. DILARANG palet gray-* di halaman (WAJIB neutral-*).
    grep -n -E 'gray-[0-9]' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Palet gray-* (aturan 25/26: hanya neutral-*/amber-*/rose-*, emerald-* untuk status sukses)." \
            "Ganti gray-* menjadi padanan neutral-*."
    done

    # B. DILARANG sudut melengkung (WAJIB rounded-none).
    grep -n -E 'rounded-(xl|2xl|3xl|lg)' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Sudut melengkung (aturan desain: seluruh komponen WAJIB rounded-none)." \
            "Ganti dengan rounded-none."
    done
done <<< "$PAGE_FILES"

while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue

    # C. Kartu header list WAJIB breakpoint xl (bukan sm).
    if ! grep -q 'xl:flex-row xl:items-center justify-between gap-4 bg-white p-5' "$f"; then
        hln=$(grep -n -m1 'justify-between gap-4 bg-white p-5' "$f" | cut -d: -f1)
        [ -z "$hln" ] && hln=1
        deterministic_reject "$f:$hln" \
            "Kartu header list tidak memakai breakpoint kanonis (aturan 26: WAJIB flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs)." \
            "Samakan kartu header persis dengan spesimen aturan 26 (termasuk min-w-0, icon-box w-10 h-10, h1 + leading-tight, deskripsi, aksi icon-only)."
    fi

    # D. Grid KPI WAJIB sm:grid-cols-4 (bukan lg:grid-cols-4).
    grep -n 'lg:grid-cols-4' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Grid KPI memakai lg:grid-cols-4 (aturan 26: WAJIB grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4)." \
            "Ganti menjadi grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4."
    done

    # E. Kartu KPI WAJIB p-4 tanpa sm:p-5 / space-y-1.
    grep -n -E 'bg-white p-4[^"]*(sm:p-5|space-y-1)' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Kartu KPI menyimpang (aturan 26: WAJIB bg-white p-4 rounded-none border border-neutral-300 shadow-2xs, tanpa sm:p-5/space-y-1)." \
            "Samakan kartu KPI persis dengan spesimen aturan 26."
    done

    # F. h1 list WAJIB memuat leading-tight.
    if ! grep -q 'uppercase leading-tight' "$f"; then
        hln=$(grep -n -m1 '<h1' "$f" | cut -d: -f1)
        [ -z "$hln" ] && hln=1
        deterministic_reject "$f:$hln" \
            "h1 list tanpa leading-tight (aturan 26: WAJIB text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight)." \
            "Samakan h1 persis dengan spesimen aturan 26."
    fi

    # G. limitOptions WAJIB [10, 25, 50, 100].
    grep -n 'limitOptions' "$f" | grep -v '100' | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "limitOptions tidak kanonis (aturan 26: WAJIB limitOptions={[10, 25, 50, 100]})." \
            "Ganti menjadi limitOptions={[10, 25, 50, 100]}."
    done

    # H. Aksi destruktif WAJIB rose (DILARANG bg-red-*, aturan 17).
    grep -n -E 'bg-red-700|hover:bg-red-600' "$f" | while IFS= read -r hit; do
        ln=$(printf "%s" "$hit" | cut -d: -f1)
        deterministic_reject "$f:$ln" \
            "Tombol destruktif memakai red (aturan 17/26: HANYA aksi destruktif berwarna, WAJIB rose: bg-rose-700 hover:bg-rose-600)." \
            "Ganti bg-red-700→bg-rose-700 dan hover:bg-red-600→hover:bg-rose-600."
    done
done <<< "$LIST_FILES"

if [ -s "$VIOLATIONS_FILE" ]; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Frontend Consistency] DITOLAK (Deterministic Check)!"
    echo "❌ =========================================================================="
    cat "$VIOLATIONS_FILE"
    rm -f "$VIOLATIONS_FILE"
    echo ""
    exit 1
fi
rm -f "$VIOLATIONS_FILE"

# =====================================================================
# AUDIT CERDAS dengan OpenCode AI (aturan 1-28 + verdict per file)
# =====================================================================
COMBINED_DIFF=$(git diff HEAD -- "frontend/src/**/*.jsx" "frontend/src/**/*.js" 2>/dev/null)

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Frontend Architecture Consistency Auditor untuk proyek Tusko Performance Storefront.
Tugasmu: untuk SETIAP file frontend yang berubah di bawah, verifikasi kepatuhan terhadap
seluruh standar berikut + SPESIMEN KANONIS LIST (aturan 28). Yang boleh berbeda antar halaman
HANYA: teks konten, ikon konteks, angka metrik, kolom data, opsi filter. Token class &
struktur WAJIB identik.

STANDAR KONSISTENSI FRONTEND TUSKO (ringkas — detail penuh di AGENTS.md):
1. Ikon 100% `lucide-react` (larang react-icons/heroicons/font-awesome).
2. localStorage WAJIB prefix `tusko_`.
3. Rupiah WAJIB `formatRupiah` (larang Intl inline / formatter lokal).
4. WAJIB `rounded-none` (larang rounded-xl/2xl/3xl/lg).
5. Atomic Design (atoms/molecules/organisms/pages).
6. Header tabel/form: icon-only `IconButton` + tooltip (larang tombol teks).
7. Filter & pencarian terpusat di Sidebar Filter kanan (larang toolbar/search di kanvas utama).
8. WAJIB komponen reusable (IconButton/SearchBar/ServerSideSelect/ServerSideTable/FilterDrawer/dll.).
9. Filter rules: SearchBar Nama & SKU terpisah; larang counter redundant; dropdown filter WAJIB ServerSideSelect; placeholder ajakan deskriptif `text-neutral-400 font-normal`.
10. Header modul bersih tanpa breadcrumb redundant.
11. Larang toolbar/container ekstra sebelum tabel.
12. Tabel admin WAJIB checkbox (selectable) + bulk bar.
13. Tombol filter selalu di kanan tombol tambah.
14. Daftar admin HANYA tabel tunggal (larang ViewModeToggle/grid).
15. Kolom Aksi WAJIB menu MoreVertical dropdown (larang tombol aksi telanjang sejajar).
16. 1 halaman 1 entitas (larang tab multi-modul).
17. Toast via onShowToast/showToast (larang alertbox inline; larang tombol keranjang di toast admin).
18. Larang badge/pill header redundant.
19. Dropdown aksi: destruktif rose, lainnya netral.
20. Anti infinite-loop (bailout referensi stabil, EMPTY_ARRAY, mount []).
21. State tabel Zustand + server-side (larang slice/filter/sort in-memory).
22. Larang window.confirm/alert/prompt (WAJIB ConfirmationModal); larang dialog konfirmasi mentah.
23. Larang tombol refresh manual.
24. Header modul admin WAJIB icon-box modul (KECUALI halaman form ikut spesimen form).
25. Form Create/Edit WAJIB halaman terpisah (larang *CreateModal/*EditModal/*Add*Modal/*FormModal/modal inline berisi form).
26. Form WAJIB grid lg:grid-cols-4 (form lg:col-span-3 + FormTipsPanel lg:col-span-1 sticky).
27. Spesimen form 100% identik: label `block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5` + `*` rose; input `w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none`; dropdown WAJIB ServerSideSelect (LARANG native select); checkbox amber; h2 `text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3` + ikon amber 16; error `border-l-4 border-rose-600` + dismiss; submit amber full-width `w-full py-2.5 bg-amber-400 ... shadow-xs` + Save 15; sekunder full-width neutral; h1 `tracking-tight`; header form kanonis (back IconButton + h1, TANPA icon-box/deskripsi/tombol teks, shadow-2xs); root `animate-in fade-in`; palet form tanpa gray-*/focus:ring non-amber.
28. SPESIMEN LIST UTAMA 100% identik (aturan 26): root `space-y-6 pb-12 animate-in fade-in duration-200`; kartu header `flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs`; kiri `min-w-0` > `flex items-start sm:items-center gap-3` > icon-box `w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0` (ikon 22) + h1 `text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight` + p `text-xs text-neutral-600 mt-0.5`; kanan HANYA IconButton `[Tambah primary][Filter secondary+badge]`; KPI grid `grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4`; kartu KPI `bg-white p-4 rounded-none border border-neutral-300 shadow-2xs` (judul uppercase + ikon 16; nilai `text-2xl font-black font-sport`; footer `border-t border-neutral-100 pt-1.5`); tabel ServerSideTable langsung + `selectable` + `limitOptions={[10, 25, 50, 100]}` + MoreVertical + bulk rose `bg-rose-700 hover:bg-rose-600`; FilterDrawer kanan; ConfirmationModal; Toast; palet tanpa gray-*.

PENGECUALIAN: tab filter STATUS dalam satu entitas (mis. status pesanan) bukan pelanggaran aturan 16.

Berkas yang berubah (staged + unstaged + untracked):
EOF

printf "%s" "$ALL_CHANGED" | grep -v '^$' >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"
echo "Kerangka gaya per file halaman (nomor_baris: isi — bandingkan ke spesimen):" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"
SKELETON_BUDGET=600
while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue
    case "$f" in
      *Page.jsx|*MutationPage.jsx) ;;
      *) continue ;;
    esac
    [ "$SKELETON_BUDGET" -le 0 ] && break
    echo "--- FILE: $f ---" >> "$PROMPT_FILE"
    TAKEN=$(grep -n -E 'className|<select|<input|<textarea|<button|<h1|<h2|<label|ServerSideSelect|FormTipsPanel|lg:col-span|limitOptions|selectable|MoreVertical|bulkActions' "$f" | head -n 120 | wc -l)
    grep -n -E 'className|<select|<input|<textarea|<button|<h1|<h2|<label|ServerSideSelect|FormTipsPanel|lg:col-span|limitOptions|selectable|MoreVertical|bulkActions' "$f" | head -n 120 >> "$PROMPT_FILE"
    SKELETON_BUDGET=$((SKELETON_BUDGET - TAKEN))
done <<< "$ALL_CHANGED"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

FORMAT JAWABAN (WAJIB verdict per file — DILARANG PASSED global tanpa memeriksa tiap file):
- Untuk SETIAP file halaman di atas tulis: `[path] : PASSED` atau `[path] : REJECTED (baris X — penyimpangan vs aturan N — seharusnya: ...)`.
- Jika SEMUA PASSED: jawab HANYA kata "PASSED".
- Jika ada penyimpangan:
  REJECTED
  - Lokasi Berkas: [path lengkap + nomor baris]
  - Pelanggaran: [aturan + token menyimpang]
  - Solusi: [samakan dengan spesimen]
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
    echo "❌ [Audit Frontend Consistency] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "❌ =========================================================================="
    echo "$AUDITOR_RESULT" | sed -n -E '/(REJECTED|DITOLAK)/,$p'
    echo ""
    exit 1
fi

echo "✅ [Audit Frontend Consistency] PASSED (Konsistensi arsitektur frontend terverifikasi oleh OpenCode AI)."
exit 0
