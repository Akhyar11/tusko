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

Git Diff (Staged Backend Changes):
```diff
EOF

sed -n '1,120p' <<< "$STAGED_BE_DIFF" >> "$PROMPT_FILE"

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
