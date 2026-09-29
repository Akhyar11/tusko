<?php

namespace Tests\Feature;

use App\Services\IntegrationService;
use App\Services\MailConfigService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MailConfigServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_applies_smtp_settings_from_integrations(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('notification.mailer', 'smtp', 'notification');
        $integrations->set('notification.mail_host', 'smtp.hostinger.com', 'notification');
        $integrations->set('notification.mail_port', '465', 'notification');
        $integrations->set('notification.mail_username', 'no-reply@kagakspace.com', 'notification');
        $integrations->set('notification.mail_password', 'rahasia-smtp', 'notification', true);
        $integrations->set('notification.mail_from_address', 'no-reply@kagakspace.com', 'notification');
        $integrations->set('notification.from_name', 'Tusko Store', 'notification');

        app(MailConfigService::class)->apply();

        $this->assertSame('smtp', config('mail.default'));
        $this->assertSame('smtp.hostinger.com', config('mail.mailers.smtp.host'));
        $this->assertSame(465, config('mail.mailers.smtp.port'));
        $this->assertSame('no-reply@kagakspace.com', config('mail.mailers.smtp.username'));
        $this->assertSame('rahasia-smtp', config('mail.mailers.smtp.password'));
        $this->assertSame('no-reply@kagakspace.com', config('mail.from.address'));
        $this->assertSame('Tusko Store', config('mail.from.name'));
    }

    public function test_keeps_env_mailer_when_smtp_host_not_configured(): void
    {
        config(['mail.default' => 'log']);

        app(IntegrationService::class)->set('notification.mailer', 'smtp', 'notification');

        app(MailConfigService::class)->apply();

        $this->assertSame('log', config('mail.default'));
    }

    public function test_from_identity_applied_without_smtp_host(): void
    {
        app(IntegrationService::class)->set('notification.mail_from_address', 'halo@kagakspace.com', 'notification');
        app(IntegrationService::class)->set('notification.from_name', 'Tusko', 'notification');

        app(MailConfigService::class)->apply();

        $this->assertSame('halo@kagakspace.com', config('mail.from.address'));
        $this->assertSame('Tusko', config('mail.from.name'));
    }
}
