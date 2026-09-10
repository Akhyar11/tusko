#!/bin/bash

echo "🤖 [Audit 5/9: Backend Laravel Integrity] Memeriksa sintaks PHP & Automated Tests..."

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

# 2. Automated Tests (php artisan test)
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

echo "✅ [Audit Backend] PASSED (Seluruh backend tests lolos 100%)."
exit 0
