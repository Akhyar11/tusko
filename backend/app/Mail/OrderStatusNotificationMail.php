<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $status;
    public ?string $previousStatus;
    public string $statusTitle;
    public string $statusDescription;
    public string $badgeColor;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, ?string $previousStatus = null)
    {
        $this->order = $order->loadMissing(['items', 'user', 'shippingAddress', 'expedition']);
        $this->status = $order->status;
        $this->previousStatus = $previousStatus;

        $this->configureStatusDetails();
    }

    /**
     * Set up human-readable title, description, and accent colors.
     */
    protected function configureStatusDetails(): void
    {
        switch ($this->status) {
            case 'processing':
                $this->statusTitle = 'Pesanan Sedang Diproses';
                $this->statusDescription = 'Pembayaran Anda telah diverifikasi. Penjual sedang menyiapkan barang pesanan Anda untuk dikemas.';
                $this->badgeColor = '#d97706'; // Amber / Orange
                break;

            case 'shipped':
                $this->statusTitle = 'Pesanan Sedang Dikirim';
                $this->statusDescription = 'Paket pesanan Anda telah diserahkan ke kurir ekspedisi dan dalam perjalanan menuju alamat Anda.';
                $this->badgeColor = '#2563eb'; // Blue
                break;

            case 'completed':
                $this->statusTitle = 'Pesanan Selesai';
                $this->statusDescription = 'Pesanan Anda telah berhasil diterima. Terima kasih telah berbelanja di Tusko Official Store!';
                $this->badgeColor = '#16a34a'; // Green
                break;

            case 'cancelled':
                $this->statusTitle = 'Pesanan Dibatalkan';
                $this->statusDescription = 'Pesanan ini telah dibatalkan. ' . ($this->order->notes ? "Alasan: {$this->order->notes}" : 'Silakan hubungi customer service kami jika ada pertanyaan.');
                $this->badgeColor = '#dc2626'; // Red
                break;

            case 'pending':
            default:
                $this->statusTitle = 'Menunggu Pembayaran';
                $this->statusDescription = 'Pesanan Anda telah dibuat dan sedang menunggu penyelesaian pembayaran.';
                $this->badgeColor = '#4b5563'; // Gray
                break;
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Update Pesanan [{$this->order->order_number}]: {$this->statusTitle} - Tusko",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.order_status_notification',
            with: [
                'order' => $this->order,
                'status' => $this->status,
                'statusTitle' => $this->statusTitle,
                'statusDescription' => $this->statusDescription,
                'badgeColor' => $this->badgeColor,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
