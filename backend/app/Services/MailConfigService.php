<?php

namespace App\Services;

/**
 * MailConfigService — menerapkan konfigurasi SMTP dari Settings Hub (T36).
 *
 * Sumber kredensial: key `notification.*` pada tabel `integrations` (nilai
 * sensitif terenkripsi). Runtime `mail.*` hanya ditimpa bila admin sudah mengisi
 * SMTP Host; jika belum, default env (mis. `log`) tetap dipakai.
 *
 * Catatan: port 465 otomatis memakai skema `smtps` (lihat MailManager Laravel),
 * sehingga tidak diperlukan field encryption terpisah.
 */
class MailConfigService
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    public function apply(): void
    {
        $host = trim((string) ($this->integrations->get('notification.mail_host') ?? ''));

        if ($host !== '') {
            $mailer = trim((string) ($this->integrations->get('notification.mailer') ?? ''));

            config(['mail.default' => $mailer !== '' ? $mailer : 'smtp']);
            config(['mail.mailers.smtp.host' => $host]);

            $port = $this->integrations->get('notification.mail_port');
            if ($port !== null && $port !== '') {
                config(['mail.mailers.smtp.port' => (int) $port]);
            }

            $username = trim((string) ($this->integrations->get('notification.mail_username') ?? ''));
            if ($username !== '') {
                config(['mail.mailers.smtp.username' => $username]);
            }

            $password = (string) ($this->integrations->get('notification.mail_password') ?? '');
            if ($password !== '') {
                config(['mail.mailers.smtp.password' => $password]);
            }
        }

        $fromAddress = trim((string) ($this->integrations->get('notification.mail_from_address') ?? ''));
        if ($fromAddress !== '') {
            config(['mail.from.address' => $fromAddress]);
        }

        $fromName = trim((string) ($this->integrations->get('notification.from_name') ?? ''));
        if ($fromName !== '') {
            config(['mail.from.name' => $fromName]);
        }
    }
}
