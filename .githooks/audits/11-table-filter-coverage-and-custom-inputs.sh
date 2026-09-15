#!/bin/bash

echo "🤖 [Audit 11/12: Table Filter Coverage & Custom Reusable Inputs (Pure OpenCode AI)] Menganalisis cakupan filter 100% & kepatuhan custom reusable inputs dengan AI..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT" || exit 1

# CAKUPAN TRIPLE: staged + unstaged + untracked (semua perubahan frontend)
STAGED_FE=$(git diff --cached --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNSTAGED_FE=$(git diff --name-only -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')
UNTRACKED_FE=$(git ls-files --others --exclude-standard -- "frontend/src" 2>/dev/null | grep -E '\.(jsx|js)$')

if [ -z "$STAGED_FE" ] && [ -z "$UNSTAGED_FE" ] && [ -z "$UNTRACKED_FE" ]; then
    echo "ℹ️ [Audit Filter & Custom Inputs] Tidak ada perubahan berkas frontend. Skip."
    exit 0
fi

STAGED_COUNT=$(printf "%s" "$STAGED_FE" | grep -c . || echo 0)
UNSTAGED_COUNT=$(printf "%s" "$UNSTAGED_FE" | grep -c . || echo 0)
UNTRACKED_COUNT=$(printf "%s" "$UNTRACKED_FE" | grep -c . || echo 0)
echo "ℹ️ [Audit Filter & Custom Inputs] Cakupan: ${STAGED_COUNT} staged, ${UNSTAGED_COUNT} unstaged, ${UNTRACKED_COUNT} untracked."

ALL_CHANGED=$(printf "%s\n%s\n%s" "$STAGED_FE" "$UNSTAGED_FE" "$UNTRACKED_FE" | grep -v '^$' | sort -u)

PROMPT_FILE=$(mktemp)
cat << 'INNER_EOF' > "$PROMPT_FILE"
Kamu adalah Pure AI Code Auditor khusus Frontend UI untuk proyek Tusko Performance Storefront & ERP.
Tugasmu adalah menganalisis kode antarmuka (UI) berikut secara mendalam berdasarkan DUA PILAR ATURAN:

=====================================================================
PILAR 1: CAKUPAN FILTER 100% KOLOM TABEL (AGENTS.md ATURAN 27)
=====================================================================
1. Setiap halaman daftar/tabel data admin (*ListPage.jsx, *ManagementPage.jsx, *SettingsPage.jsx, *TransactionsPage.jsx):
   - WAJIB memiliki komponen *FilterDrawer.jsx terpusat di sisi kanan layar.
   - Seluruh kolom data dan informasi tabel yang ditampilkan ke user WAJIB 100% memiliki kontrol filter yang relevan di FilterDrawer:
     * Kolom teks/kode (Nama, Kode/SKU, PIC, Telepon, Email, No. Invoice/Dokumen, Catatan, Deskripsi, dll.) -> SearchBar atau TextInput.
     * Kolom status/kategori/relasi/pilihan (Status, Kategori, Gudang, Vendor, Ekspedisi, Metode Bayar, dll.) -> ServerSideSelect.
     * Kolom angka/nominal/unit (Harga Jual, Total Tagihan, Qty Stok, Stok Siap Jual, Tarif Dasar, Nominal Kas, dll.) -> Rentang Min - Maks via TextInput type="number".
     * Kolom tanggal/waktu (Tanggal Transaksi, Waktu Invoice, Tanggal Dibuat, dll.) -> Rentang Tanggal (Dari - Sampai via TextInput type="date" atau preset periode).
   - DILARANG ada informasi/kolom tabel yang disajikan ke user namun tidak dapat difilter oleh user.

=====================================================================
PILAR 2: LARANGAN MUTLAK ELEMEN FORM BAWAAN HTML (AGENTS.md ATURAN 28)
=====================================================================
1. DILARANG KERAS menggunakan elemen form bawaan HTML (<input>, <select>, <textarea>) secara langsung di luar atoms/molecules (frontend/src/components/atoms/ dan frontend/src/components/molecules/).
2. Seluruh input pada halaman, form (Create/Edit), dan modal/drawer WAJIB menggunakan custom reusable components:
   - TextInput (untuk teks, angka, tanggal, URL, tel, password)
   - TextArea (untuk teks multibaris)
   - FileInput (untuk upload berkas/foto, single maupun multiple)
   - Checkbox (untuk pilihan checkbox)
   - ServerSideSelect (untuk seluruh dropdown pilihan & filter)
   - SearchBar (untuk input pencarian)

=====================================================================
DAFTAR BERKAS FRONTEND YANG DIUBAH:
=====================================================================
INNER_EOF

echo "$ALL_CHANGED" >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"

# Analisis Kolom Tabel & Filter Drawer
echo "=====================================================================" >> "$PROMPT_FILE"
echo "STRUKTUR KOLOM TABEL & FILTER CONTROLS PADA HALAMAN LIST:" >> "$PROMPT_FILE"
echo "=====================================================================" >> "$PROMPT_FILE"

python3 -c "
import sys, re, os

changed_files = sys.stdin.read().splitlines()
list_files = [f for f in changed_files if re.search(r'(ListPage|ManagementPage|SettingsPage|TransactionsPage)\.jsx$', f) and 'TemplateManagementPage' not in f]

for f in sorted(list_files):
    if not os.path.exists(f): continue
    print(f'--- Halaman List: {f} ---')
    with open(f) as fp:
        content = fp.read()
    m = re.search(r'(const\s+(?:tableColumns|columns)\s*=\s*(?:useMemo\(\s*\(\)\s*=>\s*)?\[[\s\S]*?\n\s*\]\s*(?:\)|;|,))', content)
    if m:
        col_text = m.group(1)
        print('Kolom Tabel Terdefinisi:')
        for line in col_text.splitlines():
            if any(k in line for k in ['key:', 'label:', 'sortable:']):
                print('  ' + line.strip())
    
    m_import = re.search(r'import\s+(\w+FilterDrawer)\s+from\s+[\'\"](.*?)[\'\"]', content)
    if m_import:
        drawer_name = m_import.group(1)
        import_path = m_import.group(2)
        if import_path.startswith('.'):
            drawer_file = os.path.normpath(os.path.join(os.path.dirname(f), import_path + '.jsx'))
        else:
            drawer_file = 'frontend/src/' + import_path.lstrip('/') + '.jsx'
        
        if os.path.exists(drawer_file):
            print(f'Filter Drawer Terhubung: {drawer_file}')
            with open(drawer_file) as dfp:
                d_content = dfp.read()
            controls = re.findall(r'<((?:SearchBar|ServerSideSelect|TextInput|TextArea|FileInput|Checkbox)[^>]*)', d_content)
            print('Kontrol Filter di Drawer:')
            for c in controls:
                clean_c = re.sub(r'\s+', ' ', c).strip()
                print('  - ' + clean_c[:140])
    print('')
" <<< "$ALL_CHANGED" >> "$PROMPT_FILE"

# Analisis Tag HTML Bawaan (<input>, <select>, <textarea>)
echo "=====================================================================" >> "$PROMPT_FILE"
echo "PEMERIKSAAN TAG FORM HTML BAWAAN (<input>, <select>, <textarea>):" >> "$PROMPT_FILE"
echo "=====================================================================" >> "$PROMPT_FILE"

HTML_VIOLATIONS=""
while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue
    if [[ ! "$f" =~ (atoms|molecules) ]]; then
        matches=$(grep -n -E "<(input|select|textarea)(\s|>)" "$f" 2>/dev/null)
        if [ -n "$matches" ]; then
            HTML_VIOLATIONS="${HTML_VIOLATIONS}Pelanggaran di ${f}:\n${matches}\n\n"
        fi
    fi
done <<< "$ALL_CHANGED"

if [ -n "$HTML_VIOLATIONS" ]; then
    printf "%b" "$HTML_VIOLATIONS" >> "$PROMPT_FILE"
else
    echo "Nihil. Seluruh berkas frontend yang diubah di luar atoms/molecules 100% bebas dari tag form bawaan HTML dan telah menggunakan custom reusable components." >> "$PROMPT_FILE"
fi

cat << 'INNER_EOF' >> "$PROMPT_FILE"

=====================================================================
PANDUAN EVALUASI AI:
- Evaluasi HANYA berdasarkan teks laporan struktur kolom tabel, kontrol filter drawer, dan kepatuhan custom reusable inputs di atas.
- Dilarang memanggil alat eksternal atau membaca filesystem.
=====================================================================
FORMAT JAWABAN:
- Jika SELURUH kode mematuhi Pilar 1 (100% kolom tabel terfilter oleh drawer) DAN Pilar 2 (100% bebas dari tag bawaan HTML <input>, <select>, <textarea>):
  PASSED
  [Berikan penjelasan singkat 2-3 kalimat mengenai kepatuhan filter kolom tabel dan penggunaan custom reusable components]
- Jika melanggar:
  REJECTED
  - Lokasi Berkas: [Sebutkan path berkas dan nomor baris pelanggaran, contoh: frontend/src/components/ProductForm.jsx:45]
  - Pelanggaran: [Jelaskan pelanggaran secara spesifik, misal: elemen form bawaan <input> digunakan, atau kolom 'contact' di tabel belum memiliki kontrol filter di FilterDrawer]
  - Solusi: [Tindakan perbaikan konkret dengan komponen kustom atau kontrol filter yang sesuai]
INNER_EOF

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
    echo "❌ [Audit Filter & Custom Inputs] GAGAL: OpenCode AI tidak memberikan respon!"
    exit 1
fi

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Filter & Custom Inputs] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    exit 1
fi

if ! grep -E -q "(^|[[:space:]]|\*\*)PASSED([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "❌ [Audit Filter & Custom Inputs] DITOLAK: OpenCode AI tidak menyatakan status PASSED!"
    exit 1
fi

echo "✅ [Audit Filter & Custom Inputs] PASSED (100% kolom tabel terfilter & seluruh input memakai custom reusable components, diverifikasi oleh Pure OpenCode AI)."
exit 0
