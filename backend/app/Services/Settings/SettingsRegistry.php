<?php

namespace App\Services\Settings;

/**
 * SettingsRegistry — single source of truth konfigurasi sistem (T36.1).
 *
 * Seluruh konfigurasi (tanpa hardcode, G6) didefinisikan di sini: grup, key,
 * tipe, default, aturan validasi, penanda secret, serta label/deskripsi (id).
 * Tidak ada akses DB di kelas ini (murni definisi + helper).
 */
class SettingsRegistry
{
    /**
     * Definisi grup -> key.
     *
     * @var array<string, array{label: string, description: string, keys: array<string, array{type: string, default: mixed, rule: string, is_secret: bool, label: string, description: string, options?: array<int, string>}>}>
     */
    private const GROUPS = [
        'store' => [
            'label' => 'Profil Toko',
            'description' => 'Identitas toko yang tampil di storefront dan dokumen.',
            'keys' => [
                'store.name' => ['type' => 'string', 'default' => 'Tusko Official Store', 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'Nama Toko', 'description' => 'Nama toko pada storefront, invoice, dan resi.'],
                'store.email' => ['type' => 'email', 'default' => null, 'rule' => 'nullable|email|max:150', 'is_secret' => false, 'label' => 'Email Toko', 'description' => 'Email resmi toko untuk kontak pelanggan.'],
                'store.phone' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:30', 'is_secret' => false, 'label' => 'Telepon Toko', 'description' => 'Nomor telepon resmi toko.'],
                'store.address' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => false, 'label' => 'Alamat Toko', 'description' => 'Alamat lengkap gudang/toko pengirim.'],
                'store.origin_city' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Kota Asal', 'description' => 'Kota asal pengiriman untuk kalkulasi ongkir.'],
                'store.origin_postal_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:10', 'is_secret' => false, 'label' => 'Kode Pos Asal', 'description' => 'Kode pos asal pengiriman.'],
                'store.origin_district_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Kode Kecamatan Asal', 'description' => 'Kode wilayah kecamatan asal (KiriminAja).'],
                'store.origin_subdistrict_code' => ['type' => 'integer', 'default' => null, 'rule' => 'nullable|integer|min:0', 'is_secret' => false, 'label' => 'Kode Kelurahan Asal', 'description' => 'Kode wilayah kelurahan asal (KiriminAja).'],
            ],
        ],
        'shipping' => [
            'label' => 'Pengiriman',
            'description' => 'Konfigurasi agregator logistik (KiriminAja/api.co.id).',
            'keys' => [
                'shipping.provider' => ['type' => 'string', 'default' => 'kiriminaja', 'rule' => 'nullable|string|in:kiriminaja,apicoid', 'is_secret' => false, 'label' => 'Provider Logistik', 'description' => 'Agregator logistik yang digunakan.', 'options' => ['kiriminaja', 'apicoid']],
                'shipping.base_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Base URL API', 'description' => 'Endpoint dasar API agregator logistik.'],
                'shipping.api_key' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'API Key', 'description' => 'Kunci API agregator logistik (disimpan terenkripsi).'],
                'shipping.origin' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Kota Asal Pengiriman', 'description' => 'Kota asal default kalkulasi tarif.'],
                'shipping.origin_district_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Kode Kecamatan Asal', 'description' => 'Kode wilayah kecamatan asal (KiriminAja).'],
                'shipping.rate_cache_ttl' => ['type' => 'integer', 'default' => 3600, 'rule' => 'nullable|integer|min:60|max:86400', 'is_secret' => false, 'label' => 'TTL Cache Tarif (detik)', 'description' => 'Durasi cache tarif pengiriman per kombinasi asal/tujuan/berat/kurir.'],
            ],
        ],
        'payment' => [
            'label' => 'Pembayaran',
            'description' => 'Konfigurasi gateway pembayaran (Midtrans) dan kebijakan refund.',
            'keys' => [
                'payment.midtrans_server_key' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'Midtrans Server Key', 'description' => 'Server key Midtrans (disimpan terenkripsi).'],
                'payment.midtrans_client_key' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'Midtrans Client Key', 'description' => 'Client key Midtrans (disimpan terenkripsi).'],
                'payment.is_production' => ['type' => 'boolean', 'default' => false, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Mode Produksi', 'description' => 'Aktifkan endpoint Midtrans produksi.'],
                'payment.snap_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Snap URL', 'description' => 'Endpoint Snap Midtrans.'],
                'payment.refund_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Refund URL', 'description' => 'Endpoint refund Midtrans.'],
                'payment.refund_policy' => ['type' => 'string', 'default' => 'auto_online_manual_offline', 'rule' => 'nullable|string|in:auto_online_manual_offline,manual_only,auto_online_only', 'is_secret' => false, 'label' => 'Kebijakan Refund', 'description' => 'Aturan refund: online otomatis via Midtrans, offline manual.', 'options' => ['auto_online_manual_offline', 'manual_only', 'auto_online_only']],
            ],
        ],
        'storage' => [
            'label' => 'Storage',
            'description' => 'Konfigurasi penyimpanan berkas (Cloudflare R2, D7).',
            'keys' => [
                'storage.disk' => ['type' => 'string', 'default' => 's3', 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Disk Default', 'description' => 'Disk default untuk aset publik.'],
                'storage.public_bucket' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Bucket Publik', 'description' => 'Bucket untuk aset publik (gambar produk/avatar).'],
                'storage.private_bucket' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Bucket Privat', 'description' => 'Bucket untuk dokumen sensitif (menggunakan temporaryUrl).'],
                'storage.base_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Base URL CDN', 'description' => 'URL publik aset (R2 dev domain).'],
            ],
        ],
        'loyalty' => [
            'label' => 'Loyalitas & Kebijakan',
            'description' => 'Kebijakan loyalitas dan refund (menutup keputusan menggantung).',
            'keys' => [
                'loyalty.points_expiry_months' => ['type' => 'integer', 'default' => 12, 'rule' => 'nullable|integer|min:1|max:120', 'is_secret' => false, 'label' => 'Masa Berlaku Poin (bulan)', 'description' => 'Durasi kedaluwarsa poin loyalitas sejak diperoleh.'],
                'loyalty.points_earn_rate' => ['type' => 'integer', 'default' => 0, 'rule' => 'nullable|integer|min:0', 'is_secret' => false, 'label' => 'Rate Perolehan Poin', 'description' => 'Nilai poin default jika produk tidak menentukan manual.'],
            ],
        ],
        'notification' => [
            'label' => 'Notifikasi & Email',
            'description' => 'Identitas pengirim dan kredensial mailer.',
            'keys' => [
                'notification.from_name' => ['type' => 'string', 'default' => 'Tusko Official Store', 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'Nama Pengirim', 'description' => 'Nama pengirim pada email notifikasi.'],
                'notification.reply_to' => ['type' => 'email', 'default' => null, 'rule' => 'nullable|email|max:150', 'is_secret' => false, 'label' => 'Reply-To', 'description' => 'Alamat balasan email notifikasi.'],
                'notification.mailer' => ['type' => 'string', 'default' => 'smtp', 'rule' => 'nullable|string|in:smtp,log,array,ses,mailgun,postmark', 'is_secret' => false, 'label' => 'Mailer', 'description' => 'Driver pengiriman email.', 'options' => ['smtp', 'log', 'array', 'ses', 'mailgun', 'postmark']],
                'notification.mail_host' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'SMTP Host', 'description' => 'Host server SMTP.'],
                'notification.mail_port' => ['type' => 'integer', 'default' => null, 'rule' => 'nullable|integer|min:1|max:65535', 'is_secret' => false, 'label' => 'SMTP Port', 'description' => 'Port server SMTP.'],
                'notification.mail_username' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'SMTP Username', 'description' => 'Username SMTP.'],
                'notification.mail_password' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'SMTP Password', 'description' => 'Password SMTP (disimpan terenkripsi).'],
            ],
        ],
        'feature_flags' => [
            'label' => 'Feature Flag',
            'description' => 'Aktif/nonaktif menu operasional lanjutan per environment (T23.2).',
            'keys' => [
                'feature_flags.orders_menu' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Antrean Pesanan', 'description' => 'Tampilkan menu Pesanan di sidebar admin.'],
                'feature_flags.stock_menu' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Stok', 'description' => 'Tampilkan menu Manajemen Stok di sidebar admin.'],
                'feature_flags.finance_menu' => ['type' => 'boolean', 'default' => false, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Buku Kas', 'description' => 'Tampilkan menu Buku Kas di sidebar admin.'],
                'feature_flags.procurement_menu' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Pengadaan', 'description' => 'Tampilkan menu Procurement di sidebar admin.'],
                'feature_flags.templates_menu' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Template', 'description' => 'Tampilkan menu Template di sidebar admin.'],
                'feature_flags.expeditions_menu' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Ekspedisi', 'description' => 'Tampilkan menu Ekspedisi di sidebar admin.'],
                'feature_flags.settings_menu' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Menu Pengaturan Sistem', 'description' => 'Tampilkan menu Pengaturan Sistem di sidebar admin.'],
            ],
        ],
        'security' => [
            'label' => 'Keamanan',
            'description' => 'Kebijakan sesi, token, dan rate limit admin.',
            'keys' => [
                'security.sanctum_token_expiry_days' => ['type' => 'integer', 'default' => 30, 'rule' => 'nullable|integer|min:1|max:365', 'is_secret' => false, 'label' => 'Masa Berlaku Token (hari)', 'description' => 'Durasi kedaluwarsa token Sanctum.'],
                'security.session_lifetime_minutes' => ['type' => 'integer', 'default' => 120, 'rule' => 'nullable|integer|min:5|max:43200', 'is_secret' => false, 'label' => 'Masa Berlaku Sesi (menit)', 'description' => 'Durasi sesi sebelum logout otomatis.'],
                'security.rate_limit_enabled' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Aktifkan Rate Limit', 'description' => 'Batasi laju request endpoint sensitif.'],
            ],
        ],
    ];

    /**
     * @return array<string, array{label: string, description: string, keys: array<string, array<string, mixed>>}>
     */
    public static function groups(): array
    {
        return self::GROUPS;
    }

    /**
     * @return array<int, string>
     */
    public static function groupNames(): array
    {
        return array_keys(self::GROUPS);
    }

    public static function groupLabel(string $group): ?string
    {
        return self::GROUPS[$group]['label'] ?? null;
    }

    public static function groupDescription(string $group): ?string
    {
        return self::GROUPS[$group]['description'] ?? null;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function keys(?string $group = null): array
    {
        if ($group !== null) {
            return self::GROUPS[$group]['keys'] ?? [];
        }

        $all = [];
        foreach (self::GROUPS as $definition) {
            $all = array_merge($all, $definition['keys']);
        }

        return $all;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function get(string $key): ?array
    {
        return self::keys()[$key] ?? null;
    }

    public static function has(string $key): bool
    {
        return isset(self::keys()[$key]);
    }

    public static function groupOf(string $key): ?string
    {
        return self::has($key) ? explode('.', $key, 2)[0] : null;
    }

    public static function isSecret(string $key): bool
    {
        return (bool) (self::get($key)['is_secret'] ?? false);
    }

    public static function default(string $key): mixed
    {
        return self::get($key)['default'] ?? null;
    }

    /**
     * Aturan validasi (key => rule) untuk sebuah grup.
     *
     * @return array<string, string>
     */
    public static function rulesForGroup(string $group): array
    {
        $rules = [];
        foreach (self::keys($group) as $key => $config) {
            $rules[$key] = $config['rule'];
        }

        return $rules;
    }
}
