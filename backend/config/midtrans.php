<?php

return [
    'server_key' => env('MIDTRANS_SERVER_KEY', 'SB-Mid-server-sandbox-test-key-12345'),
    'client_key' => env('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-sandbox-test-key-12345'),
    'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
    'is_sanitized' => (bool) env('MIDTRANS_IS_SANITIZED', true),
    'is_3ds' => (bool) env('MIDTRANS_IS_3DS', true),
    'snap_url' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    'snap_js_url' => env('MIDTRANS_SNAP_JS_URL')
        ?: (env('MIDTRANS_IS_PRODUCTION', false)
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'),
    'refund_url' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2',
    'api_url' => env('MIDTRANS_API_URL')
        ?: (env('MIDTRANS_IS_PRODUCTION', false)
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com'),
    'notification_url' => env('MIDTRANS_NOTIFICATION_URL'),
    'merchant_id' => env('MIDTRANS_MERCHANT_ID', 'G123456789'),
    'va_prefix' => env('MIDTRANS_VA_PREFIX', '8808'),
];
