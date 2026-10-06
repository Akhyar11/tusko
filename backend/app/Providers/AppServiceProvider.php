<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // OrderObserver didaftarkan mandiri oleh Order::booted().
        \App\Models\OrderItem::observe(\App\Observers\OrderItemObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);
        \App\Models\User::observe(\App\Observers\UserObserver::class);

        $this->configureRateLimiting();
        $this->applyMailSettings();
        $this->applyStorageSettings();
    }

    /**
     * Terapkan konfigurasi penyimpanan (Cloudflare R2 / S3) dari Settings Hub (T36) pada request HTTP.
     */
    protected function applyStorageSettings(): void
    {
        if ($this->app->runningInConsole() && ! $this->app->environment('testing')) {
            return;
        }

        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('integrations')) {
                return;
            }
        } catch (\Throwable $e) {
            return;
        }

        app(\App\Services\StorageConfigService::class)->apply();
    }

    /**
     * Terapkan konfigurasi SMTP dari Settings Hub (T36) pada request HTTP.
     *
     * Hanya dijalankan di luar console agar tidak mengganggu `migrate`/`config:cache`
     * dan tidak membocorkan nilai ke cache config. Bila DB belum siap (instalasi
     * awal), dilewati tanpa error.
     */
    protected function applyMailSettings(): void
    {
        if ($this->app->runningInConsole()) {
            return;
        }

        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('integrations')) {
                return;
            }
        } catch (\Throwable $e) {
            return;
        }

        app(\App\Services\MailConfigService::class)->apply();
    }

    /**
     * T35.1: batasi laju endpoint sensitif (login, register, password, checkout,
     * voucher, webhook) untuk mencegah brute-force & penyalahgunaan.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')) . '|' . $request->ip()));

        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(5)
            ->by($request->ip()));

        RateLimiter::for('password', fn (Request $request) => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')) . '|' . $request->ip()));

        RateLimiter::for('checkout', fn (Request $request) => Limit::perMinute(20)
            ->by((string) ($request->user()?->id ?: $request->ip())));

        RateLimiter::for('voucher', fn (Request $request) => Limit::perMinute(30)
            ->by((string) ($request->user()?->id ?: $request->ip())));

        RateLimiter::for('webhook', fn (Request $request) => Limit::perMinute(120)
            ->by($request->ip()));
    }
}
