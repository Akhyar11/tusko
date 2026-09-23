#!/bin/bash

echo "🤖 [Audit 8/9: Backend Full-Stack Consistency (OpenCode AI)] Memeriksa namespace controller, migrasi & kebersihan debug..."

STAGED_BE=$(git diff --cached --name-only -- "backend/**")

if [ -z "$STAGED_BE" ]; then
    echo "ℹ️ [Audit Backend Consistency] Tidak ada berkas backend yang di-stage. Skip."
    exit 0
fi

STAGED_BE_DIFF=$(git diff --cached -- "backend/app/**" "backend/database/migrations/**" "backend/routes/**")

if [ -z "$STAGED_BE_DIFF" ]; then
    echo "ℹ️ [Audit Backend Consistency] Tidak ada perubahan berkas aplikasi/migrasi backend yang di-stage. Skip."
    exit 0
fi

# =====================================================================
# CEK DETERMINISTIK: Format kode identitas model (Aturan 6)
# Model identitas (Vendor, Warehouse) WAJIB memakai format baku
# PREFIK/ddmmyyyy/increment via App\Services\IdentityCodeService.
# Daftar pengecualian (kode semantik/referensi): Voucher, Expedition,
# Attribute, OrderStatus, PaymentStatus, Permission.
# =====================================================================
LEGACY_CODE_HITS=$(git diff --cached -- "backend/app/**" 2>/dev/null | grep -nE "^\+.*['\"](VND|WH|DO)-" || true)
if [ -n "$LEGACY_CODE_HITS" ]; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Backend Consistency] DITOLAK (Deterministic Check)!"
    echo "❌ =========================================================================="
    echo "REJECTED"
    echo "  - Lokasi Berkas: (baris diff berikut pada backend/app)"
    echo "$LEGACY_CODE_HITS"
    echo "  - Pelanggaran: Format kode identitas lama 'VND-'/'WH-'/'DO-' terdeteksi. Aturan 6 mewajibkan format baku 'PREFIK/ddmmyyyy/increment'."
    echo "  - Solusi: Gunakan App\\Services\\IdentityCodeService::generate(\$modelClass, 'VND'|'WH'|'DO', \$column) alih-alih str_pad/time manual."
    echo "❌ =========================================================================="
    exit 1
fi

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Backend Architecture Consistency Auditor untuk aplikasi Laravel 11.
Tugasmu adalah menganalisis Git Diff berkas backend berikut:

STANDAR KONSISTENSI BACKEND TUSKO:
1. Standardisasi API Controller:
   - Controller API di `backend/app/Http/Controllers/Api/` WAJIB menggunakan namespace `App\Http\Controllers\Api;` dan mewarisi `Controller` (`extends Controller`).
2. Standardisasi Database Migrations:
   - Setiap file migrasi baru atau yang diubah di `backend/database/migrations/` WAJIB memiliki kedua method: `public function up()` dan `public function down()` untuk menjamin rollback integrity.
3. Larangan Sisa Debugging Output:
   - DILARANG KERAS meninggalkan fungsi debug seperti `dd(...)`, `dump(...)`, `var_dump(...)`, atau `print_r(...)` pada kode production `backend/app/`.
4. Standardisasi Server-Side Query (Filter, Pagination, Limit, dan Sorting):
   - Controller data listing (seperti `ProductController@index`, `OrderController@index`, dll.) WAJIB menangani filtering, limit/per_page, pagination, dan sorting secara dinamis langsung pada Eloquent Query Builder (`$query->where(...)`, `$query->orderBy(...)`, `$query->paginate(...)`).
   - DILARANG membebankan pemotongan data (pagination) atau penyaringan ke client-side dengan mengembalikan seluruh dataset tanpa pagination.
5. Standardisasi Penyimpanan File & Media ke Storage:
   - Seluruh operasi penyimpanan atau pengunggahan berkas/media (bukti transfer, foto/gambar produk, avatar pengguna, dokumen, dsb.) WAJIB disimpan ke disk storage melalui Laravel Storage facade atau FileStorageService (`Storage::disk(config('filesystems.default', 'public'))`).
   - DILARANG KERAS menyimpan file secara manual ke folder lokal statis atau menggunakan hardcoded disk `'local'`/`'public'` tanpa melalui dynamic storage disk configuration, dan DILARANG menyimpan string data base64 gambar langsung ke kolom database text/varchar tanpa dipindahkan ke Storage.
6. Standardisasi Kode Identitas Model (Kolom `code`):
   - Model yang kolom `code`-nya merepresentasikan IDENTITAS dan di-generate otomatis WAJIB memakai format baku `PREFIK/ddmmyyyy/increment` (contoh: `VND/23092026/001`, `WH/23092026/001`), increment direset per tanggal.
   - Nomor Surat Jalan / Delivery Order (`delivery_order_number`) pada GRN WAJIB memakai format baku yang sama: `DO/ddmmyyyy/increment`.
   - Generator WAJIB memakai service reusable `App\Services\IdentityCodeService` (DILARANG menulis ulang logika prefix/str_pad/time manual di controller).
   - DAFTAR PENGECUALIAN (kode semantik/referensi, BUKAN identitas sequence — JANGAN ditolak dan JANGAN di-loop): Voucher, Expedition, Attribute, OrderStatus, PaymentStatus, Permission.
   - JIKA ada model/migrasi BARU yang memperkenalkan kolom `code` di luar daftar pengecualian di atas dan tidak mengikuti format baku: REJECT, dan instruksikan agar agen MENANYAKAN format kode ke user/prompter terlebih dahulu sebelum melanjutkan.

Git Diff (Staged Backend Changes):
```diff
EOF

echo "${STAGED_BE_DIFF:0:80000}" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
```

FORMAT JAWABAN:
- Jika seluruh standar konsistensi backend terpenuhi: Jawab HANYA kata "PASSED".
- Jika melanggar:
  REJECTED
  - Lokasi Berkas: [WAJIB sebutkan path berkas lengkap dan nomor baris yang harus diperbaiki, contoh: backend/app/Http/Controllers/Api/OrderController.php:32]
  - Pelanggaran: [Detail aturan konsistensi backend yang dilanggar, misal: controller tanpa inheritance Controller, migrasi tanpa down(), atau sisa debugging dd()]
  - Solusi: [Tindakan perbaikan konkret yang harus dilakukan pengembang]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 30s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo ""
    echo "❌ =========================================================================="
    echo "❌ [Audit Backend Consistency] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "❌ =========================================================================="
    echo "$AUDITOR_RESULT" | sed -n -E '/(REJECTED|DITOLAK)/,$p'
    echo ""
    exit 1
fi

echo "✅ [Audit Backend Consistency] PASSED (Konsistensi arsitektur backend terverifikasi oleh OpenCode AI)."
exit 0
