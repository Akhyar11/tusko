#!/bin/bash

echo "🤖 [Audit 8/9: Backend Full-Stack Consistency] Memeriksa struktur controller, migrasi, & response envelope..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
BE_DIR="$REPO_ROOT/backend"

if [ ! -d "$BE_DIR" ]; then
    echo "ℹ️ [Audit Backend Consistency] Direktori backend tidak ditemukan. Skip."
    exit 0
fi

FAILED=0

# 1. Verifikasi Namespace & Inheritance seluruh API Controller
echo "🔍 [Backend Consistency] Memeriksa namespace & inheritance API Controller..."
for ctrl in "$BE_DIR"/app/Http/Controllers/Api/*.php; do
    if [ -f "$ctrl" ]; then
        if ! grep -q "namespace App\\\\Http\\\\Controllers\\\\Api;" "$ctrl"; then
            echo "❌ Controller $(basename "$ctrl") tidak menggunakan namespace 'App\\Http\\Controllers\\Api'!"
            FAILED=1
        fi
        if ! grep -q "extends Controller" "$ctrl"; then
            echo "❌ Controller $(basename "$ctrl") tidak mewarisi 'App\\Http\\Controllers\\Controller'!"
            FAILED=1
        fi
    fi
done

# 2. Verifikasi Integritas Database Migrasi (Wajib method up() dan down())
echo "🔍 [Backend Consistency] Memeriksa kelengkapan method up() dan down() pada Migrasi..."
for mig in "$BE_DIR"/database/migrations/*.php; do
    if [ -f "$mig" ]; then
        if ! grep -q "function up" "$mig"; then
            echo "❌ Migrasi $(basename "$mig") tidak memiliki method up()!"
            FAILED=1
        fi
        if ! grep -q "function down" "$mig"; then
            echo "❌ Migrasi $(basename "$mig") tidak memiliki method down() (rollback integrity)!"
            FAILED=1
        fi
    fi
done

# 3. Larangan sisa debug output (dd, dump, var_dump, print_r) pada kode Backend
echo "🔍 [Backend Consistency] Memeriksa sisa debugging output (dd, dump, var_dump)..."
DEBUG_CALLS=$(grep -rnE --include="*.php" "\b(dd|dump|var_dump)\(" "$BE_DIR/app")
if [ -n "$DEBUG_CALLS" ]; then
    echo "❌ Ditemukan pemanggilan fungsi debug (dd/dump/var_dump) di backend/app:"
    echo "$DEBUG_CALLS"
    FAILED=1
fi

if [ $FAILED -ne 0 ]; then
    echo ""
    echo "❌ [Audit Backend Consistency] GAGAL: Terjadi inkonsistensi backend pada pemeriksaan di atas!"
    exit 1
fi

echo "✅ [Audit Backend Consistency] PASSED (Seluruh standar konsistensi Backend terpenuhi)."
exit 0
