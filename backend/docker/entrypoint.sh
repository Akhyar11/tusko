#!/bin/sh
set -e

# Configure dynamic PORT for Render
PORT="${PORT:-80}"
sed -i -E "s/Listen [0-9]+/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i -E "s/<VirtualHost \*:[0-9]+>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Ensure storage directories exist with proper permissions
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Automatic database migration on startup.
# Default AKTIF; set RUN_MIGRATIONS=false untuk melewatinya.
if [ "${RUN_MIGRATIONS}" != "false" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || true
fi

# Automatic reference data seeding on startup (roles, menu admin, settings, template).
# Default AKTIF; set RUN_SEEDERS=false untuk melewatinya.
if [ "${RUN_SEEDERS}" != "false" ]; then
    echo "Seeding reference data (role, users, menu)..."
    php artisan db:seed --force --class='Database\Seeders\MasterReferenceSeeder' || true
    php artisan db:seed --force --class='Database\Seeders\UserSeeder' || true
    php artisan db:seed --force --class='Database\Seeders\MenuSeeder' || true
fi

# Discover packages and optimize Laravel in production
php artisan package:discover --ansi || true

if [ "${APP_ENV}" = "production" ] && [ -n "${APP_KEY}" ]; then
    echo "Optimizing Laravel for production..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# T39.2: Jalankan Laravel scheduler di background (task terjadwal seperti
# `orders:cancel-expired` tiap 10 menit). Render free tidak mendukung Cron/Worker
# berbayar, jadi scheduler berjalan di dalam web service. Log ke file + stdout
# (terlihat di log Render). Set RUN_SCHEDULER=false untuk menonaktifkan.
if [ "${RUN_SCHEDULER}" != "false" ]; then
    echo "Starting Laravel scheduler (schedule:work) in background..."
    php artisan schedule:work >> /var/www/html/storage/logs/scheduler.log 2>&1 &
fi

exec "$@"
