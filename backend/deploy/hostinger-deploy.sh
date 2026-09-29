#!/usr/bin/env bash
# =============================================================================
# Tusko Backend — Deploy Hostinger (dijalankan DI SERVER via SSH)
# =============================================================================
# Dipanggil otomatis oleh `.github/workflows/deploy-hostinger.yml` pada setiap
# push ke branch `master`. Idempotent: aman dijalankan berulang.
#
# Prasyarat di server: berkas `.env` produksi sudah ada (tidak ikut ter-upload),
# dan koneksi database sudah dikonfigurasi di dalamnya.
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"
echo "==> Deploy Tusko backend di $APP_DIR"

# --- Deteksi PHP CLI ---
PHP_BIN="${PHP_BIN:-php}"
if ! command -v "$PHP_BIN" >/dev/null 2>&1; then
    for candidate in php8.4 php8.3 php8.2 php8.1; do
        if command -v "$candidate" >/dev/null 2>&1; then PHP_BIN="$candidate"; break; fi
    done
fi
command -v "$PHP_BIN" >/dev/null 2>&1 || { echo "ERROR: PHP CLI tidak ditemukan." >&2; exit 1; }
echo "==> PHP $("$PHP_BIN" -r 'echo PHP_VERSION;')"

# --- Prasyarat .env ---
[ -f .env ] || { echo "ERROR: berkas .env tidak ditemukan di $APP_DIR. Buat .env produksi terlebih dahulu." >&2; exit 1; }

# --- Composer ---
if command -v composer >/dev/null 2>&1; then
    COMPOSER="composer"
elif [ -f "$APP_DIR/composer.phar" ]; then
    COMPOSER="$PHP_BIN $APP_DIR/composer.phar"
else
    echo "ERROR: Composer tidak ditemukan (command 'composer' / composer.phar)." >&2
    exit 1
fi

echo "==> composer install --no-dev"
# `--no-scripts`: Hostinger menonaktifkan `proc_open`, sehingga script Composer
# (mis. `@php artisan package:discover`) gagal karena Symfony Process. Script
# dijalankan manual setelah ini.
# shellcheck disable=SC2086
$COMPOSER install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-progress --no-scripts

# --- Post-install Laravel (pengganti script composer) ---
echo "==> php artisan package:discover"
"$PHP_BIN" artisan package:discover --ansi || true

# --- APP_KEY (generate sekali bila masih kosong) ---
if ! grep -qE '^APP_KEY=base64:' .env; then
    echo "==> APP_KEY kosong, menjalankan key:generate"
    "$PHP_BIN" artisan key:generate --force
fi

# --- Direktori storage & symlink publik ---
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
"$PHP_BIN" artisan storage:link || true

# --- Migrasi database ---
echo "==> php artisan migrate --force"
"$PHP_BIN" artisan migrate --force

# --- Seeder referensi idempotent: role, users, menu ---
echo "==> php artisan db:seed (role, users, menu)"
"$PHP_BIN" artisan db:seed --force --class='Database\Seeders\MasterReferenceSeeder'
"$PHP_BIN" artisan db:seed --force --class='Database\Seeders\UserSeeder'
"$PHP_BIN" artisan db:seed --force --class='Database\Seeders\MenuSeeder'

# --- Optimasi cache produksi ---
echo "==> optimize cache"
"$PHP_BIN" artisan optimize:clear || true
"$PHP_BIN" artisan config:cache || true
"$PHP_BIN" artisan view:cache || true
# route:cache dilewati: routes/web.php memakai closure (tidak bisa diserialisasi).

# --- Permission ---
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo "==> Deploy selesai."
