<?php

/**
 * Katalog metode pembayaran (T07.6) — sumber dinamis untuk FE checkout.
 *
 * G6: nama/kanal bukan hardcode di komponen FE; nilai dinamis (rekening bank manual)
 * diambil dari tabel `integrations`. Instruksi langkah pembayaran (opsional) dapat
 * ditambahkan per metode.
 */
return [
    'categories' => [
        [
            'key' => 'Virtual Account',
            'label' => 'Virtual Account (Verifikasi Otomatis Midtrans)',
            'methods' => [
                ['id' => 'bca_va', 'name' => 'BCA Virtual Account', 'code' => 'BCA', 'type' => 'midtrans', 'icon' => 'Building2', 'badge' => 'Otomatis', 'description' => 'Verifikasi instan 24 jam tanpa perlu unggah struk bukti transfer'],
                ['id' => 'mandiri_va', 'name' => 'Mandiri Virtual Account', 'code' => 'MANDIRI', 'type' => 'midtrans', 'icon' => 'Building2', 'badge' => 'Otomatis', 'description' => 'Pembayaran via Livin/Mandiri dengan verifikasi otomatis'],
                ['id' => 'bri_va', 'name' => 'BRI Virtual Account (BRIVA)', 'code' => 'BRI', 'type' => 'midtrans', 'icon' => 'Building2', 'badge' => 'Otomatis', 'description' => 'Pembayaran via BRImo/ATM BRI dengan verifikasi otomatis'],
                ['id' => 'bni_va', 'name' => 'BNI Virtual Account', 'code' => 'BNI', 'type' => 'midtrans', 'icon' => 'Building2', 'badge' => 'Otomatis', 'description' => 'Pembayaran via BNI Mobile/ATM dengan verifikasi otomatis'],
            ],
        ],
        [
            'key' => 'QRIS & E-Wallet',
            'label' => 'QRIS & E-Wallet (Verifikasi Otomatis Midtrans)',
            'methods' => [
                ['id' => 'qris', 'name' => 'QRIS (GoPay, OVO, DANA, ShopeePay, LinkAja)', 'code' => 'QRIS', 'type' => 'midtrans', 'icon' => 'QrCode', 'badge' => 'Bebas Biaya', 'description' => 'Scan sekali untuk semua aplikasi e-wallet berlogo QRIS'],
            ],
        ],
        [
            'key' => 'Kartu Kredit / Debit',
            'label' => 'Kartu Kredit / Debit (Verifikasi Otomatis Midtrans)',
            'methods' => [
                ['id' => 'credit_card', 'name' => 'Kartu Kredit / Debit Visa & Mastercard', 'code' => 'CARD', 'type' => 'midtrans', 'icon' => 'CreditCard', 'badge' => '3D Secure', 'description' => 'Pembayaran aman dengan proteksi 3D Secure'],
            ],
        ],
    ],
];
