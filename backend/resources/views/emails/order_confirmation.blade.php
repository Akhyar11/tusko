<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Konfirmasi Pesanan {{ $order->order_number }}</title>
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
            background-color: #03ac0e;
            padding: 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0 0 8px;
            font-size: 22px;
            font-weight: 800;
        }
        .content {
            padding: 24px;
        }
        .order-info {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
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
            color: #4b5563;
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
            color: #03ac0e;
            border-top: 1px dashed #d1d5db;
            padding-top: 10px;
            margin-top: 8px;
        }
        .payment-box {
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 12px;
            padding: 16px;
            margin-top: 20px;
            font-size: 13px;
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
            <h1>Pesanan Anda Sedang Diproses!</h1>
            <p style="margin:0;font-size:13px;opacity:0.9;">Terima kasih telah berbelanja di Toko Online.</p>
        </div>

        <div class="content">
            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">No. Pesanan / Invoice:</span>
                    <span class="info-val">{{ $order->order_number }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Penerima:</span>
                    <span class="info-val">{{ $order->recipient_name }} ({{ $order->phone ?: $order->phone_number }})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Alamat Pengiriman:</span>
                    <span class="info-val">{{ $order->full_address }}, {{ $order->city }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Kurir Pengiriman:</span>
                    <span class="info-val">{{ $order->expedition_name }} - {{ $order->expedition_service }} ({{ $order->expedition_etd }})</span>
                </div>
            </div>

            <h3 style="font-size:14px;margin-bottom:12px;">Daftar Produk yang Dipesan</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Harga</th>
                        <th style="text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item->product_name }}</strong>
                            @if($item->notes)
                                <br><small style="color:#6b7280;">Catatan: {{ $item->notes }}</small>
                            @endif
                        </td>
                        <td style="text-align:center;">{{ $item->quantity }}</td>
                        <td style="text-align:right;">Rp {{ number_format($item->product_price, 0, ',', '.') }}</td>
                        <td style="text-align:right;">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>Subtotal Produk</span>
                    <span>Rp {{ number_format($order->subtotal, 0, ',', '.') }}</span>
                </div>
                <div class="total-row">
                    <span>Ongkos Kirim</span>
                    <span>Rp {{ number_format($order->shipping_cost, 0, ',', '.') }}</span>
                </div>
                @if($order->insurance_cost > 0)
                <div class="total-row">
                    <span>Asuransi Pengiriman</span>
                    <span>Rp {{ number_format($order->insurance_cost, 0, ',', '.') }}</span>
                </div>
                @endif
                @if($order->service_fee > 0)
                <div class="total-row">
                    <span>Biaya Layanan</span>
                    <span>Rp {{ number_format($order->service_fee, 0, ',', '.') }}</span>
                </div>
                @endif
                @if($order->discount_amount > 0)
                <div class="total-row" style="color:#03ac0e;">
                    <span>Diskon Promo</span>
                    <span>- Rp {{ number_format($order->discount_amount, 0, ',', '.') }}</span>
                </div>
                @endif
                <div class="total-row grand-total">
                    <span>Total Tagihan</span>
                    <span>Rp {{ number_format($order->grand_total, 0, ',', '.') }}</span>
                </div>
            </div>

            <div class="payment-box">
                <strong style="color:#b45309;">Metode Pembayaran: {{ strtoupper(str_replace('_', ' ', $order->payment_method)) }}</strong>
                @if($order->va_number)
                    <p style="margin:6px 0 0;">Nomor Virtual Account / Rekening: <strong style="font-size:15px;color:#111827;">{{ $order->va_number }}</strong></p>
                @endif
                <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Status Pembayaran Saat Ini: <strong>{{ strtoupper($order->payment_status) }}</strong></p>
            </div>
        </div>

        <div class="footer">
            <p style="margin:0 0 6px;">Email ini dikirim secara otomatis oleh sistem Toko Online.</p>
            <p style="margin:0;">Butuh bantuan? Hubungi Pusat Bantuan kami kapan saja.</p>
        </div>
    </div>
</body>
</html>
