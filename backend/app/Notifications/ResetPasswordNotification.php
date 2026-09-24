<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword implements ShouldQueue
{
    use Queueable;

    /**
     * Build the reset password mail message.
     *
     * @param  mixed  $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $expireMinutes = (int) config(
            'auth.passwords.' . config('auth.defaults.passwords') . '.expire',
            60
        );

        return (new MailMessage)
            ->subject('Reset Kata Sandi Akun Tusko Anda')
            ->greeting('Halo ' . ($notifiable->name ?? 'Pelanggan') . '!')
            ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di Tusko.')
            ->action('Reset Kata Sandi', $this->resetUrl($notifiable))
            ->line('Tautan ini akan kedaluwarsa dalam ' . $expireMinutes . ' menit.')
            ->line('Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan saja email ini.');
    }

    /**
     * Build the reset URL pointing to the storefront frontend.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function resetUrl($notifiable): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        $query = http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return $frontendUrl . '/reset-password?' . $query;
    }
}
