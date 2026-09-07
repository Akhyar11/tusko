<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'event',
        'category',
        'from_name',
        'reply_to',
        'color_theme',
        'subject',
        'preheader',
        'headline',
        'body',
        'button_text',
        'button_link',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Default system templates.
     */
    public static function defaultTemplates(): array
    {
        return [
            [
                'key' => 'order_placed',
                'name' => 'Pesanan Dibuat (Menunggu Pembayaran)',
                'event' => 'order.created',
                'category' => 'Billing',
                'from_name' => 'Tusko Official Store',
                'reply_to' => 'billing@tusko.com',
                'color_theme' => 'emerald',
                'subject' => 'Menunggu Pembayaran Pesanan {order_number} - {store_name}',
                'preheader' => 'Selesaikan pembayaran sebelum batas waktu agar pesanan segera diproses.',
                'headline' => 'Terima kasih atas pesanan Anda!',
                'body' => "Halo {customer_name},\n\nPesanan Anda dengan nomor {order_number} telah kami terima dan menunggu pembayaran.\n\nTotal tagihan: {total_amount}\nMetode: {payment_method}\n\nSilakan selesaikan pembayaran Anda sebelum batas waktu yang ditentukan untuk menghindari pembatalan otomatis.\n\nSalam hangat,\n{store_name}",
                'button_text' => 'Bayar Sekarang',
                'button_link' => 'https://tusko.com/orders',
                'is_active' => true,
            ],
            [
                'key' => 'payment_success',
                'name' => 'Pembayaran Berhasil & Diproses',
                'event' => 'payment.success',
                'category' => 'Billing',
                'from_name' => 'Tusko Billing Team',
                'reply_to' => 'billing@tusko.com',
                'color_theme' => 'blue',
                'subject' => 'Pembayaran Diterima untuk Pesanan {order_number}',
                'preheader' => 'Pembayaran pesanan Anda telah kami konfirmasi dan segera dipacking.',
                'headline' => 'Pembayaran Anda Berhasil!',
                'body' => "Halo {customer_name},\n\nPembayaran sebesar {total_amount} untuk pesanan {order_number} telah berhasil kami terima.\n\nTim gudang {store_name} sedang menyiapkan dan mengemas barang belanjaan Anda dengan standar QC terbaik.\n\nBarang dalam pesanan:\n{items_list}\n\nKami akan menginfokan nomor resi pengiriman segera setelah paket diserahkan ke kurir.\n\nSalam hangat,\n{store_name}",
                'button_text' => 'Pantau Status Pesanan',
                'button_link' => 'https://tusko.com/orders',
                'is_active' => true,
            ],
            [
                'key' => 'order_shipped',
                'name' => 'Pesanan Dikirim (Nomor Resi Tersedia)',
                'event' => 'order.shipped',
                'category' => 'Shipping',
                'from_name' => 'Tusko Fulfillment & Logistics',
                'reply_to' => 'shipping@tusko.com',
                'color_theme' => 'purple',
                'subject' => 'Pesanan {order_number} Sedang Menuju ke Alamat Anda ({courier_name})',
                'preheader' => 'Paket telah diserahkan ke kurir dengan nomor resi {tracking_number}.',
                'headline' => 'Paket Anda Sedang Meluncur!',
                'body' => "Kabar gembira, {customer_name}!\n\nPesanan Anda nomor {order_number} telah diserahkan ke pihak ekspedisi dan dalam perjalanan menuju alamat pengiriman Anda.\n\nEkspedisi: {courier_name} - {courier_service}\nNomor Resi: {tracking_number}\n\nAnda dapat melacak posisi paket secara berkala melalui tombol di bawah atau langsung pada situs kurir terkait.\n\nTerima kasih telah berbelanja di {store_name}!",
                'button_text' => 'Lacak Pengiriman Paket',
                'button_link' => 'https://tusko.com/tracking',
                'is_active' => true,
            ],
            [
                'key' => 'order_completed',
                'name' => 'Pesanan Selesai / Terkirim',
                'event' => 'order.completed',
                'category' => 'Order',
                'from_name' => 'Tusko Customer Care',
                'reply_to' => 'support@tusko.com',
                'color_theme' => 'emerald',
                'subject' => 'Paket {order_number} Telah Diterima - Berikan Ulasan Anda',
                'preheader' => 'Semoga produk pesanan Anda memuaskan. Tinggalkan ulasan bintang 5!',
                'headline' => 'Paket Telah Tiba di Tempat Anda!',
                'body' => "Halo {customer_name},\n\nMenurut catatan sistem kurir {courier_name}, pesanan {order_number} telah berhasil diantar ke alamat Anda.\n\nApakah barang sesuai dengan ekspektasi Anda? Kami akan sangat menghargai ulasan dan masukan Anda untuk membantu meningkatkan layanan kami.\n\nSalam hangat,\n{store_name}",
                'button_text' => 'Beri Ulasan Produk',
                'button_link' => 'https://tusko.com/reviews',
                'is_active' => true,
            ],
            [
                'key' => 'order_cancelled',
                'name' => 'Pesanan Dibatalkan / Kedaluwarsa',
                'event' => 'order.cancelled',
                'category' => 'Order',
                'from_name' => 'Tusko System Notice',
                'reply_to' => 'support@tusko.com',
                'color_theme' => 'rose',
                'subject' => 'Pemberitahuan Pembatalan Pesanan {order_number}',
                'preheader' => 'Pesanan telah dibatalkan karena pembayaran melewati batas waktu.',
                'headline' => 'Pesanan Anda Dibatalkan',
                'body' => "Halo {customer_name},\n\nKami informasikan bahwa pesanan nomor {order_number} telah dibatalkan karena batas waktu pembayaran telah terlewati atau atas permintaan Anda.\n\nStok produk telah dikembalikan ke inventaris. Jika Anda masih menginginkan produk tersebut, silakan lakukan pemesanan ulang melalui aplikasi {store_name}.\n\nSalam hormat,\nTim Layanan Pelanggan {store_name}",
                'button_text' => 'Pesan Ulang Sekarang',
                'button_link' => 'https://tusko.com',
                'is_active' => true,
            ],
        ];
    }

    /**
     * Ensure default templates exist in the database.
     */
    public static function ensureDefaultTemplates(): void
    {
        foreach (self::defaultTemplates() as $templateData) {
            self::firstOrCreate(['key' => $templateData['key']], $templateData);
        }
    }
}
