<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update Status Pesanan {{ $order->order_number }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f6f9f8;
            color: #333333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .header {
            background-color: {{ $badgeColor }};
            padding: 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0 0 8px;
            font-size: 22px;
            font-weight: 800;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 24px;
        }
        .status-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid {{ $badgeColor }};
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .status-title {
            font-weight: 700;
            font-size: 15px;
            color: #0f172a;
            margin-bottom: 4px;
        }
        .status-desc {
            font-size: 13px;
            color: #475569;
            line-height: 1.5;
            margin: 0;
        }
        .tracking-box {
            background-color: #eff6ff;
            border: 1px dashed #3b82f6;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 20px;
            text-align: center;
        }
        .tracking-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #1d4ed8;
            margin-bottom: 4px;
        }
        .tracking-number {
            font-family: monospace;
            font-size: 18px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: 0.1em;
        }
        .tracking-courier {
            font-size: 12px;
            color: #3b82f6;
            margin-top: 4px;
        }
        .order-info {
            background-color: #f9fafb;
            border: 1px solid #f3f4f6;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 6px;
        }
        .info-label {
            color: #6b7280;
        }
        .info-val {
            font-weight: 700;
            color: #111827;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .table th {
            text-align: left;
            padding: 10px;
            background-color: #f9fafb;
            font-size: 12px;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
        }
        .table td {
            padding: 12px 10px;
            font-size: 13px;
            border-bottom: 1px solid #f3f4f6;
        }
        .totals {
            margin-top: 16px;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 6px;
        }
        .grand-total {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            border-top: 1px dashed #d1d5db;
            padding-top: 10px;
            margin-top: 8px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tusko Official Store</h1>
            <p>{{ $statusTitle }}</p>
        </div>

        <div class="content">
            <div class="status-card">
                <div class="status-title">{{ $statusTitle }}</div>
                <p class="status-desc">{{ $statusDescription }}</p>
            </div>

            @if($order->status === 'shipped' && $order->tracking_number)
            <div class="tracking-box">
                <div class="tracking-label">Nomor Resi Pengiriman</div>
                <div class="tracking-number">{{ $order->tracking_number }}</div>
                <div class="tracking-courier">
                    Kurir: <strong>{{ $order->expedition_name ?: ($order->expedition?->name ?? 'Ekspedisi') }}</strong>
                    @if($order->expedition_service) ({{ $order->expedition_service }}) @endif
                </div>
            </div>
            @endif

            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">Nomor Pesanan:</span>
                    <span class="info-val">{{ $order->order_number }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tanggal Pemesanan:</span>
                    <span class="info-val">{{ $order->created_at ? $order->created_at->format('d M Y, H:i') : '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Penerima:</span>
                    <span class="info-val">{{ $order->recipient_name }} ({{ $order->phone ?: $order->phone_number }})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Alamat Pengiriman:</span>
                    <span class="info-val">{{ $order->full_address }}</span>
                </div>
            </div>

            <h3>Rincian Barang</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item->product_name }}</strong>
                        </td>
                        <td style="text-align: center;">{{ $item->quantity }}x</td>
                        <td style="text-align: right;">Rp {{ number_format($item->subtotal ?: ($item->quantity * ($item->product_price ?: $item->price)), 0, ',', '.') }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>Subtotal Produk:</span>
                    <span>Rp {{ number_format($order->subtotal, 0, ',', '.') }}</span>
                </div>
                <div class="total-row">
                    <span>Ongkos Kirim:</span>
                    <span>Rp {{ number_format($order->shipping_cost, 0, ',', '.') }}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Total Pembayaran:</span>
                    <span>Rp {{ number_format($order->grand_total, 0, ',', '.') }}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Terima kasih telah berbelanja di Tusko!</p>
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini secara langsung.</p>
        </div>
    </div>
</body>
</html>
