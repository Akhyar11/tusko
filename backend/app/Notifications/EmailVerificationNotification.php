<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class EmailVerificationNotification extends BaseVerifyEmail implements ShouldQueue
{
    use Queueable;

    /**
     * Build the email verification mail message.
     *
     * @param  mixed  $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $expireMinutes = (int) config('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject('Verifikasi Alamat Email Akun Tusko Anda')
            ->greeting('Halo ' . ($notifiable->name ?? 'Pelanggan') . '!')
            ->line('Terima kasih telah mendaftar di Tusko. Silakan verifikasi alamat email Anda dengan menekan tombol di bawah ini.')
            ->action('Verifikasi Email', $this->verificationUrl($notifiable))
            ->line('Tautan verifikasi ini akan kedaluwarsa dalam ' . $expireMinutes . ' menit.')
            ->line('Jika Anda tidak membuat akun di Tusko, abaikan saja email ini.');
    }
}
