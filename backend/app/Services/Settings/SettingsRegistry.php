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
                'store.legal_name' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'Nama Legal Bisnis', 'description' => 'Nama badan usaha/pemilik sesuai dokumen legal (untuk footer & invoice).'],
                'store.business_type' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|in:individu,pt,cv,yayasan,other', 'is_secret' => false, 'label' => 'Tipe Entitas Bisnis', 'description' => 'Bentuk badan usaha (mempengaruhi dokumen onboarding Midtrans).', 'options' => ['individu', 'pt', 'cv', 'yayasan', 'other']],
                'store.npwp' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:40', 'is_secret' => false, 'label' => 'NPWP', 'description' => 'Nomor NPWP bisnis (opsional, tampil bila diisi).'],
                'store.nib' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:40', 'is_secret' => false, 'label' => 'NIB / SIUP', 'description' => 'Nomor Induk Berusaha (opsional, tampil di footer/invoice bila diisi).'],
                'store.city' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Kota Bisnis', 'description' => 'Kota domisili bisnis.'],
                'store.province' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Provinsi Bisnis', 'description' => 'Provinsi domisili bisnis.'],
                'store.cs_email' => ['type' => 'email', 'default' => null, 'rule' => 'nullable|email|max:150', 'is_secret' => false, 'label' => 'Email Customer Service', 'description' => 'Email dukungan pelanggan (disarankan berdomain).'],
                'store.cs_phone' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:30', 'is_secret' => false, 'label' => 'Telepon Customer Service', 'description' => 'Nomor telepon layanan pelanggan.'],
                'store.whatsapp' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:30', 'is_secret' => false, 'label' => 'WhatsApp Bisnis', 'description' => 'Nomor WhatsApp (format internasional, mis. 628123456789).'],
                'store.operating_hours' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Jam Operasional', 'description' => 'Jam layanan pelanggan, mis. Senin-Jumat 09.00-17.00 WIB.'],
                'store.social_instagram' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'Instagram', 'description' => 'URL/akun Instagram bisnis.'],
                'store.social_tiktok' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'TikTok', 'description' => 'URL/akun TikTok bisnis.'],
                'store.social_facebook' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:150', 'is_secret' => false, 'label' => 'Facebook', 'description' => 'URL/halaman Facebook bisnis.'],
                'store.return_window_days' => ['type' => 'integer', 'default' => 14, 'rule' => 'nullable|integer|min:0|max:365', 'is_secret' => false, 'label' => 'Jendela Retur (hari)', 'description' => 'Batas hari pengajuan pengembalian barang.'],
                'store.about_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:20000', 'is_secret' => false, 'label' => 'Teks Tentang Kami', 'description' => 'Isi halaman Tentang Kami (dinamis).'],
                'store.terms_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:40000', 'is_secret' => false, 'label' => 'Teks Syarat & Ketentuan', 'description' => 'Isi halaman Syarat & Ketentuan (dinamis).'],
                'store.privacy_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:40000', 'is_secret' => false, 'label' => 'Teks Kebijakan Privasi', 'description' => 'Isi halaman Kebijakan Privasi (dinamis).'],
                'store.refund_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:40000', 'is_secret' => false, 'label' => 'Teks Kebijakan Pengembalian', 'description' => 'Isi halaman Kebijakan Pengembalian/Refund (dinamis).'],
                'store.shipping_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:40000', 'is_secret' => false, 'label' => 'Teks Kebijakan Pengiriman', 'description' => 'Isi halaman Kebijakan Pengiriman (dinamis).'],
                'store.faq_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:40000', 'is_secret' => false, 'label' => 'Teks FAQ', 'description' => 'Isi halaman FAQ (dinamis).'],
                'store.contact_text' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:20000', 'is_secret' => false, 'label' => 'Teks Halaman Kontak', 'description' => 'Catatan tambahan pada halaman Kontak (dinamis).'],
                'store.origin_city' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Kota Asal', 'description' => 'Kota asal pengiriman untuk kalkulasi ongkir.'],
                'store.origin_postal_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:10', 'is_secret' => false, 'label' => 'Kode Pos Asal', 'description' => 'Kode pos asal pengiriman.'],
                'store.origin_district_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Kode Kecamatan Asal', 'description' => 'Kode wilayah kecamatan asal (KiriminAja).'],
                'store.origin_subdistrict_code' => ['type' => 'integer', 'default' => null, 'rule' => 'nullable|integer|min:0', 'is_secret' => false, 'label' => 'Kode Kelurahan Asal', 'description' => 'Kode wilayah kelurahan asal (KiriminAja).'],
            ],
        ],
        'shipping' => [
            'label' => 'Pengiriman',
            'description' => 'Konfigurasi agregator logistik (KiriminAja/api.co.id/Biteship).',
            'keys' => [
                'shipping.provider' => ['type' => 'string', 'default' => 'kiriminaja', 'rule' => 'nullable|string|in:kiriminaja,apicoid,biteship', 'is_secret' => false, 'label' => 'Provider Logistik', 'description' => 'Agregator logistik yang digunakan.', 'options' => ['kiriminaja', 'apicoid', 'biteship']],
                'shipping.base_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Base URL API', 'description' => 'Endpoint dasar API agregator logistik.'],
                'shipping.api_key' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'API Key', 'description' => 'Kunci API agregator logistik (disimpan terenkripsi).'],
                'shipping.origin' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Kota Asal Pengiriman', 'description' => 'Kota asal default kalkulasi tarif.'],
                'shipping.origin_district_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Kode Kecamatan Asal', 'description' => 'Kode wilayah kecamatan asal (KiriminAja).'],
                'shipping.rate_cache_ttl' => ['type' => 'integer', 'default' => 3600, 'rule' => 'nullable|integer|min:60|max:86400', 'is_secret' => false, 'label' => 'TTL Cache Tarif (detik)', 'description' => 'Durasi cache tarif pengiriman per kombinasi asal/tujuan/berat/kurir.'],
                'shipping.free_shipping_min_purchase' => ['type' => 'integer', 'default' => 0, 'rule' => 'nullable|integer|min:0', 'is_secret' => false, 'label' => 'Ambang Gratis Ongkir (Rp)', 'description' => 'Subtotal minimum agar ongkir otomatis gratis (T06.10). 0 = nonaktif.'],
                'shipping.biteship_base_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Biteship Base URL', 'description' => 'Endpoint dasar API Biteship (mis. https://api.biteship.com untuk test & live).'],
                'shipping.biteship_api_key' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:500', 'is_secret' => true, 'label' => 'Biteship API Key', 'description' => 'Kunci API Biteship (disimpan terenkripsi). Dikirim sebagai header Authorization.'],
                'shipping.biteship_webhook_signature_key' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:100', 'is_secret' => false, 'label' => 'Webhook Signature Header', 'description' => 'Nama header signature yang diisi di dashboard Biteship (mis. X-Biteship-Signature).'],
                'shipping.biteship_webhook_signature_secret' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'Webhook Signature Secret', 'description' => 'Nilai rahasia header signature webhook Biteship (disimpan terenkripsi).'],
                'shipping.biteship_origin_area_id' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Biteship Origin Area ID', 'description' => 'Area ID asal pengiriman Biteship (lebih akurat dari kode pos).'],
                'shipping.biteship_origin_postal_code' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:10', 'is_secret' => false, 'label' => 'Biteship Kode Pos Asal', 'description' => 'Kode pos asal Biteship (fallback bila Origin Area ID kosong).'],
                'shipping.biteship_default_delivery_type' => ['type' => 'string', 'default' => 'now', 'rule' => 'nullable|string|in:now,scheduled', 'is_secret' => false, 'label' => 'Biteship Tipe Pengiriman', 'description' => 'Tipe pengiriman default saat membuat order Biteship.', 'options' => ['now', 'scheduled']],
                'shipping.biteship_couriers' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:500', 'is_secret' => false, 'label' => 'Biteship Kurir Aktif', 'description' => 'Daftar kode kurir Biteship dipisah koma (kosong = semua kurir).'],
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
                'payment.midtrans_api_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Core API Base URL', 'description' => 'Base URL Midtrans Core API (mis. https://api.sandbox.midtrans.com) untuk charge VA/QRIS.'],
                'payment.notification_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Notification URL (Webhook)', 'description' => 'URL publik webhook Midtrans. Dikirim sebagai header X-Override-Notification saat charge (tanpa perlu setting dashboard).'],
                'payment.snap_js_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Snap.js URL', 'description' => 'URL Snap.js untuk popup pembayaran (mis. https://app.sandbox.midtrans.com/snap/snap.js).'],
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
                'notification.mail_from_address' => ['type' => 'email', 'default' => null, 'rule' => 'nullable|email|max:150', 'is_secret' => false, 'label' => 'Alamat Pengirim (From)', 'description' => 'Alamat email pengirim notifikasi (mis. no-reply@kagakspace.com).'],
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
        'auth' => [
            'label' => 'Autentikasi',
            'description' => 'Login sosial (Google OAuth) dan kebijakan autentikasi pelanggan.',
            'keys' => [
                'auth.google_enabled' => ['type' => 'boolean', 'default' => false, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Aktifkan Login Google', 'description' => 'Tampilkan tombol "Masuk dengan Google" dan aktifkan endpoint OAuth Google.'],
                'auth.google_client_id' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => false, 'label' => 'Google Client ID', 'description' => 'OAuth 2.0 Client ID dari Google Cloud Console.'],
                'auth.google_client_secret' => ['type' => 'secret', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => true, 'label' => 'Google Client Secret', 'description' => 'OAuth 2.0 Client Secret Google (disimpan terenkripsi).'],
                'auth.google_redirect_url' => ['type' => 'url', 'default' => null, 'rule' => 'nullable|url|max:255', 'is_secret' => false, 'label' => 'Google Redirect URL', 'description' => 'URL callback backend, mis. https://domain.com/api/auth/google/callback. Wajib sama dengan Authorized redirect URI di Google Cloud Console.'],
                'auth.allowed_redirect_origins' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:1000', 'is_secret' => false, 'label' => 'Origin FE Diizinkan', 'description' => 'Daftar origin frontend dipisah koma yang boleh menjadi tujuan balik setelah login (mis. https://toko.com). Kosong = hanya origin yang sama dengan APP_URL.'],
            ],
        ],
        'storefront' => [
            'label' => 'Storefront (Halaman Depan)',
            'description' => 'Konten dinamis halaman depan: announcement, hero, section, promo, club. Gambar di-upload ke Storage.',
            'keys' => [
                'storefront.announcement_enabled' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Tampilkan Announcement Bar', 'description' => 'Tampilkan bar pengumuman di atas navbar.'],
                'storefront.announcement_text' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:255', 'is_secret' => false, 'label' => 'Teks Announcement', 'description' => 'Teks pengumuman (mis. promo gratis ongkir).'],
                'storefront.search_placeholder' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:120', 'is_secret' => false, 'label' => 'Placeholder Pencarian', 'description' => 'Teks placeholder pada kotak pencarian navbar.'],
                'storefront.hero_enabled' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Tampilkan Hero', 'description' => 'Tampilkan banner hero di halaman depan.'],
                'storefront.hero_badge' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:120', 'is_secret' => false, 'label' => 'Hero Badge', 'description' => 'Label kecil di atas judul hero.'],
                'storefront.hero_title' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:200', 'is_secret' => false, 'label' => 'Hero Judul', 'description' => 'Judul besar hero.'],
                'storefront.hero_subtitle' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:600', 'is_secret' => false, 'label' => 'Hero Subjudul', 'description' => 'Deskripsi singkat hero.'],
                'storefront.hero_cta_primary' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:60', 'is_secret' => false, 'label' => 'Hero Tombol Utama', 'description' => 'Teks tombol utama hero.'],
                'storefront.hero_cta_secondary' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:60', 'is_secret' => false, 'label' => 'Hero Tombol Sekunder', 'description' => 'Teks tombol sekunder hero.'],
                'storefront.hero_image_url' => ['type' => 'image', 'default' => null, 'rule' => 'nullable|string|max:500', 'is_secret' => false, 'label' => 'Hero Gambar', 'description' => 'Unggah gambar hero (disimpan ke Storage/R2).'],
                'storefront.hero_price_badge' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:80', 'is_secret' => false, 'label' => 'Hero Badge Harga', 'description' => 'Teks badge harga di sudut gambar (mis. Mulai Rp 389.000).'],
                'storefront.popular_enabled' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Tampilkan Populer', 'description' => 'Tampilkan bar chip pencarian populer.'],
                'storefront.popular_heading' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:80', 'is_secret' => false, 'label' => 'Populer Judul', 'description' => 'Label di depan chip populer.'],
                'storefront.popular_chips' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:4000', 'is_secret' => false, 'label' => 'Populer Chips (JSON)', 'description' => 'Daftar chip JSON: [{"label":"...","query":"..."}].'],
                'storefront.sports_enabled' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Tampilkan Section Olahraga', 'description' => 'Tampilkan kartu pilih olahraga.'],
                'storefront.sports_heading' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:120', 'is_secret' => false, 'label' => 'Olahraga Judul', 'description' => 'Judul section olahraga.'],
                'storefront.sports_subheading' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:200', 'is_secret' => false, 'label' => 'Olahraga Subjudul', 'description' => 'Subjudul section olahraga.'],
                'storefront.sports_cards' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:8000', 'is_secret' => false, 'label' => 'Olahraga Kartu (JSON)', 'description' => 'Daftar kartu JSON: [{"tag":"...","title":"...","action":"...","image_url":"...","category_id":1,"query":"..."}].'],
                'storefront.club_enabled' => ['type' => 'boolean', 'default' => true, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Tampilkan Club Banner', 'description' => 'Tampilkan banner loyalitas Tusko Club.'],
                'storefront.club_badge' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:120', 'is_secret' => false, 'label' => 'Club Badge', 'description' => 'Label kecil pada club banner.'],
                'storefront.club_title' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:200', 'is_secret' => false, 'label' => 'Club Judul', 'description' => 'Judul club banner.'],
                'storefront.club_subtitle' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:300', 'is_secret' => false, 'label' => 'Club Subjudul', 'description' => 'Deskripsi club banner.'],
                'storefront.club_cta' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:60', 'is_secret' => false, 'label' => 'Club Tombol', 'description' => 'Teks tombol club banner.'],
                'storefront.catalog_heading' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:120', 'is_secret' => false, 'label' => 'Judul Katalog', 'description' => 'Judul default section katalog produk.'],
                'storefront.footer_categories' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:1000', 'is_secret' => false, 'label' => 'Kategori Footer (slug)', 'description' => 'Daftar slug kategori dipisah koma untuk kolom footer. Kosong = otomatis.'],
                'storefront.promo_enabled' => ['type' => 'boolean', 'default' => false, 'rule' => 'nullable|boolean', 'is_secret' => false, 'label' => 'Tampilkan Promo Carousel', 'description' => 'Tampilkan carousel promo di halaman depan.'],
                'storefront.promo_banners' => ['type' => 'text', 'default' => null, 'rule' => 'nullable|string|max:8000', 'is_secret' => false, 'label' => 'Promo Banner (JSON)', 'description' => 'Daftar banner JSON: [{"tag":"...","title":"...","subtitle":"...","action":"...","image_url":"..."}].'],
                'storefront.brand_name' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:60', 'is_secret' => false, 'label' => 'Brand Navbar', 'description' => 'Nama brand di logo navbar (kosong = pakai nama toko).'],
                'storefront.brand_tagline' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:60', 'is_secret' => false, 'label' => 'Tagline Navbar', 'description' => 'Teks kecil di bawah brand (mis. Performance).'],
                'storefront.search_suggest_heading' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:80', 'is_secret' => false, 'label' => 'Judul Saran Pencarian', 'description' => 'Judul dropdown saran pencarian.'],
                'storefront.utility_track_label' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:40', 'is_secret' => false, 'label' => 'Label Lacak Pesanan', 'description' => 'Teks tautan lacak pesanan di bar atas.'],
                'storefront.utility_help_label' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:40', 'is_secret' => false, 'label' => 'Label Bantuan', 'description' => 'Teks tautan bantuan/FAQ di bar atas.'],
                'storefront.locale_label' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:20', 'is_secret' => false, 'label' => 'Label Bahasa/Mata Uang', 'description' => 'Teks locale di bar atas (mis. ID | IDR).'],
                'storefront.member_cta_label' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:50', 'is_secret' => false, 'label' => 'Label CTA Member', 'description' => 'Teks ajakan gabung member saat belum login.'],
                'storefront.member_badge_label' => ['type' => 'string', 'default' => null, 'rule' => 'nullable|string|max:40', 'is_secret' => false, 'label' => 'Badge Member', 'description' => 'Badge di menu akun (mis. TUSKO CLUB MEMBER).'],
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
