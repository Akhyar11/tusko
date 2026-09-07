<?php

namespace App\Services;

use App\Mail\OrderConfirmationMail;
use App\Models\EmailLog;
use App\Models\Order;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OrderEmailService
{
    /**
     * Send order confirmation email and record to email_logs.
     *
     * @param Order $order
     * @param string|null $recipientEmail
     * @return bool
     */
    public function sendOrderConfirmation(Order $order, ?string $recipientEmail = null): bool
    {
        $targetEmail = $this->resolveRecipientEmail($order, $recipientEmail);

        if (! $targetEmail) {
            Log::warning("Gagal mengirim email konfirmasi pesanan: tidak ada alamat email yang valid untuk pesanan {$order->order_number}");
            return false;
        }

        $order->loadMissing(['items', 'user', 'shippingAddress', 'expedition']);
        $subject = "Konfirmasi Pesanan [{$order->order_number}] - Toko Online";

        try {
            Mail::to($targetEmail)->send(new OrderConfirmationMail($order));

            EmailLog::create([
                'order_id' => $order->id,
                'email_type' => 'confirmation',
                'recipient_email' => $targetEmail,
                'subject' => $subject,
                'status' => 'sent',
                'sent_at' => Carbon::now(),
            ]);

            return true;
        } catch (Exception $e) {
            Log::error("Error saat mengirim email konfirmasi pesanan {$order->order_number}: " . $e->getMessage());

            try {
                EmailLog::create([
                    'order_id' => $order->id,
                    'email_type' => 'confirmation',
                    'recipient_email' => $targetEmail,
                    'subject' => $subject,
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'sent_at' => null,
                ]);
            } catch (Exception $logException) {
                Log::error("Gagal mencatat email_log: " . $logException->getMessage());
            }

            return false;
        }
    }

    /**
     * Send order status change notification email and record to email_logs.
     *
     * @param Order $order
     * @param string|null $previousStatus
     * @param string|null $recipientEmail
     * @return bool
     */
    public function sendStatusNotification(Order $order, ?string $previousStatus = null, ?string $recipientEmail = null): bool
    {
        $targetEmail = $this->resolveRecipientEmail($order, $recipientEmail);

        if (! $targetEmail) {
            Log::warning("Gagal mengirim email notifikasi status: tidak ada email valid untuk pesanan {$order->order_number}");
            return false;
        }

        $order->loadMissing(['items', 'user', 'shippingAddress', 'expedition']);
        $mailable = new \App\Mail\OrderStatusNotificationMail($order, $previousStatus);
        $subject = "Update Pesanan [{$order->order_number}]: {$mailable->statusTitle} - Tusko";

        try {
            Mail::to($targetEmail)->send($mailable);

            EmailLog::create([
                'order_id' => $order->id,
                'email_type' => 'shipping_status',
                'recipient_email' => $targetEmail,
                'subject' => $subject,
                'status' => 'sent',
                'sent_at' => Carbon::now(),
            ]);

            return true;
        } catch (Exception $e) {
            Log::error("Error saat mengirim email update status {$order->order_number}: " . $e->getMessage());

            try {
                EmailLog::create([
                    'order_id' => $order->id,
                    'email_type' => 'shipping_status',
                    'recipient_email' => $targetEmail,
                    'subject' => $subject,
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'sent_at' => null,
                ]);
            } catch (Exception $logException) {
                Log::error("Gagal mencatat email_log: " . $logException->getMessage());
            }

            return false;
        }
    }

    /**
     * Resolve the recipient email address for an order.
     */
    public function resolveRecipientEmail(Order $order, ?string $overrideEmail = null): ?string
    {
        $email = $overrideEmail 
            ?: ($order->recipient_email ?? null) 
            ?: ($order->user?->email ?? null)
            ?: ($order->shippingAddress?->email ?? null);

        if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return trim($email);
        }

        return null;
    }
}

