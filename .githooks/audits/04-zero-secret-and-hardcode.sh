#!/bin/bash

echo "🤖 [Audit 4/9: Zero Hardcode, Zero Secret & Dynamic Config] Memeriksa staged diff dengan AI Auditor (OpenCode)..."

STAGED_DIFF=$(git diff --cached)

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Hardcode & Security] Tidak ada file yang di-stage. Skip."
    exit 0
fi

# Cek Cepat 1: Dilarang meng-commit file .env
STAGED_ENV=$(git diff --cached --name-only | grep -E "^\.env" || true)
if [ -n "$STAGED_ENV" ]; then
    echo ""
    echo "❌ [Audit Security] DILARANG MENYERTAKAN FILE .env DALAM COMMIT!"
    echo "   File terdeteksi: $STAGED_ENV"
    echo "💡 Harap unstage file .env: git restore --staged $STAGED_ENV"
    echo ""
    exit 1
fi

# Cek Cepat 2: Dilarang menyisipkan private key mentah
if grep -E -q "^\+[^\+]*(-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----|sk_live_[0-9a-zA-Z]{24})" <<< "$STAGED_DIFF"; then
    echo ""
    echo "❌ [Audit Security] TERDETEKSI PRIVATE KEY ATAU LIVE SECRET TOKEN DALAM DIFF!"
    echo "💡 Dilarang meng-commit private key atau credential rahasia ke repository."
    echo ""
    exit 1
fi

# Cek Cerdas 3: Audit Anti-Hardcode menggunakan OpenCode LLM
STAGED_FILES=$(git diff --cached --name-only)

# Filter hanya jika menyentuh backend/app atau frontend/src
APP_CHANGES=$(echo "$STAGED_FILES" | grep -E "(backend/app/|frontend/src/)" || true)

if [ -z "$APP_CHANGES" ]; then
    echo "✅ [Audit Hardcode & Security] Tidak ada perubahan pada backend/app atau frontend/src. PASSED."
    exit 0
fi

STAGED_APP_DIFF=$(git diff --cached -- "backend/app" "frontend/src")

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Strict Code Auditor Anti-Hardcode & Keamanan untuk proyek Tusko Performance Storefront.
Tugasmu adalah menganalisis Git Diff dari perubahan yang di-stage dan memastikan TIDAK ADA NILAI HARDCODE dan TIDAK ADA DATA STATIS yang seharusnya dinamis dari database/Admin Panel.

ATURAN AUDIT ANTI-HARDCODE:
1. DILARANG HARDCODE LOKASI GUDANG / TOKO & KOORDINAT FISIK:
   - Nama kota, kabupaten, atau kecamatan asal toko (seperti 'Jakarta Pusat', 'Gambir', dll.) dilarang di-hardcode sebagai nilai default/fallback di dalam controller atau service.
   - Koordinat GPS latitude/longitude toko dilarang di-hardcode numerik statis (seperti -6.2088, 106.8456).
   - Seluruh data asal gudang toko WAJIB dinamis diambil dari database pengaturan toko (Store Setting) yang dapat diubah oleh Admin dari Panel Admin.

2. DILARANG HARDCODE BIAYA PENANGANAN / HANDLING FEE / TARIF:
   - Biaya penanganan aplikasi (handling fee, service fee) dilarang di-hardcode numerik statis (misalnya 1000, 2000) baik di config fallback maupun di variabel service.
   - Biaya penanganan wajib berasal dari pengaturan toko dinamis oleh Admin di database.

3. DILARANG HARDCODE URL GATEWAY PIHAK KETIGA:
   - URL gateway API kurir/pihak ketiga (seperti https://api.co.id, https://api.rajaongkir.com, dll.) dilarang ditanam sebagai string fallback di kode.
   - URL wajib murni dibaca dari konfigurasi environment / database.

4. DILARANG HARDCODE KREDENSIAL / SECRET TOKEN / PRIVATE KEY:
   - Dilarang keras menanamkan API token, private key, atau client secret secara statis di file kode.

Catatan Khusus:
- File pengujian (tests/), database seeders (DatabaseSeeder), dan file mock demo (mockProducts.js) diperbolehkan memiliki data tiruan contoh.
- Aturan ini SANGAT KETAT untuk file di backend/app/Services/, backend/app/Http/Controllers/, backend/app/Models/, dan frontend/src/services/.

Daftar Berkas Ter-stage:
EOF

echo "$APP_CHANGES" >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"
echo "Git Diff (Staged Changes):" >> "$PROMPT_FILE"
echo '```diff' >> "$PROMPT_FILE"
sed -n '1,120p' <<< "$STAGED_APP_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

PENTING: Evaluasi secara langsung teks Git Diff di atas tanpa menjalankan perintah shell atau tool eksternal.

FORMAT JAWABAN (PILIH SALAH SATU):
Jika kode bersih dari segala bentuk hardcode dan rahasia:
PASSED

Jika ditemukan nilai hardcode (lokasi toko, koordinat, handling fee, gateway URL, atau kredensial):
REJECTED
- Pelanggaran: [Sebutkan file, baris, dan apa saja yang di-hardcode]
- Solusi untuk Developer: [Jelaskan perbaikan agar nilai tersebut diambil secara dinamis dari database Admin]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 60s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 40s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi

rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo ""
    echo "❌ =============================================================================="
    echo "❌ [Audit Hardcode & Security] DITOLAK OLEH AI CODE AUDITOR (OPENCODE)!"
    echo "❌ =============================================================================="
    echo "$AUDITOR_RESULT"
    echo ""
    echo "💡 Petunjuk: Semua parameter toko (lokasi gudang, koordinat, handling fee) wajib diambil"
    echo "   secara dinamis dari tabel database (StoreSetting) yang diatur oleh Admin."
    echo ""
    exit 1
fi

echo "✅ [Audit Hardcode & Security] PASSED (0 Hardcode & 0 Secret terdeteksi oleh AI Auditor)."
exit 0
