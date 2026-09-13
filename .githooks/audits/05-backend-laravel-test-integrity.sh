#!/bin/bash

echo "🤖 [Audit 5/9: Backend Laravel Test Integrity (OpenCode AI)] Memeriksa sintaks PHP & Automated Tests..."

STAGED_PHP=$(git diff --cached --name-only -- "backend/**/*.php")

if [ -z "$STAGED_PHP" ]; then
    echo "ℹ️ [Audit Backend] Tidak ada file backend PHP yang di-stage. Skip."
    exit 0
fi

# 1. PHP Syntax Check (Lint)
echo "🔍 Menjalankan PHP Syntax Lint..."
for file in $STAGED_PHP; do
    if [ -f "$file" ]; then
        LINT_OUTPUT=$(php -l "$file" 2>&1)
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ [Audit Backend] Syntax error pada file: $file"
            echo "$LINT_OUTPUT"
            echo ""
            exit 1
        fi
    fi
done

# 2. OpenCode AI Backend Test & Code Integrity Auditor
STAGED_PHP_DIFF=$(git diff --cached -- "backend/**/*.php")
if [ -n "$STAGED_PHP_DIFF" ]; then
    echo "🔍 Menganalisis integritas test & backend logic dengan OpenCode AI..."
    PROMPT_FILE=$(mktemp)
    cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Backend Test & Code Integrity Auditor untuk aplikasi Laravel 11.
Tugasmu adalah menganalisis Git Diff berkas PHP yang di-stage berikut:

ATURAN INTEGRITAS BACKEND & TEST:
1. Integritas Test: Jika ada file pengujian (tests/Feature/ atau tests/Unit/), pastikan test memiliki assertion konkret (seperti assertStatus, assertJson, assertEquals). Dilarang membuat test kosong tanpa assertion atau sengaja melewati test (markTestSkipped).
2. Integritas Kode: Pastikan struktur method, controller, dan model memiliki penanganan error yang baik dan tidak ada logika fatal yang merusak integritas aplikasi.

Git Diff:
```diff
EOF
    sed -n '1,120p' <<< "$STAGED_PHP_DIFF" >> "$PROMPT_FILE"
    cat << 'EOF' >> "$PROMPT_FILE"
```

FORMAT JAWABAN:
- Jika kode backend dan test memenuhi standar: Jawab HANYA kata "PASSED".
- Jika melanggar:
  REJECTED
  - Lokasi Berkas: [WAJIB sebutkan path berkas lengkap dan nomor baris yang harus diperbaiki, contoh: backend/tests/Feature/VendorApiTest.php:45]
  - Pelanggaran: [Detail kegagalan integritas backend/test, misal: method test tanpa assertion konkret atau penanganan error fatal]
  - Solusi: [Tindakan perbaikan yang harus dilakukan pengembang]
EOF

    AI_RESULT=""
    if command -v opencode &> /dev/null; then
        AI_RESULT=$(timeout 25s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
    elif command -v agy &> /dev/null; then
        AI_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
    fi
    rm -f "$PROMPT_FILE"

    if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AI_RESULT"; then
        echo "❌ [Audit Backend Test Integrity] DITOLAK OLEH OPENCODE AI:"
        echo "$AI_RESULT" | sed -n -E '/(REJECTED|DITOLAK)/,$p'
        exit 1
    fi
fi

# 3. Automated Tests Execution (php artisan test)
echo "🔍 Menjalankan Automated Feature & Unit Tests (php artisan test)..."
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
cd "$REPO_ROOT/backend" || exit 1

TEST_OUTPUT=$(php artisan test 2>&1)
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
    echo ""
    echo "❌ [Audit Backend] PHP ARTISAN TEST GAGAL!"
    echo "-----------------------------------------------------"
    echo "$TEST_OUTPUT" | tail -n 25
    echo "-----------------------------------------------------"
    echo "💡 Harap perbaiki test yang gagal sebelum melakukan commit."
    echo ""
    exit 1
fi

echo "✅ [Audit Backend] PASSED (Seluruh backend tests lolos 100% & diverifikasi OpenCode AI)."
exit 0
