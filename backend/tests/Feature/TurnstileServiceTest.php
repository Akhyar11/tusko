<?php

namespace Tests\Feature;

use App\Services\TurnstileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurnstileServiceTest extends TestCase
{
    use RefreshDatabase;

    private function enable(array $overrides = []): void
    {
        config()->set('services.turnstile.enabled', true);
        config()->set('services.turnstile.secret', 'test-secret');
        config()->set('services.turnstile.verify_url', 'https://turnstile.test/siteverify');
        config()->set('services.turnstile.hostnames', ['toko.test']);

        foreach ($overrides as $key => $value) {
            config()->set("services.turnstile.{$key}", $value);
        }
    }

    public function test_disabled_bypasses_verification(): void
    {
        config()->set('services.turnstile.enabled', false);

        $this->assertTrue(app(TurnstileService::class)->verify(null, 'login'));
    }

    public function test_valid_token_with_matching_action_and_hostname_passes(): void
    {
        $this->enable();

        Http::fake([
            'turnstile.test/*' => Http::response([
                'success' => true,
                'action' => 'login',
                'hostname' => 'toko.test',
            ], 200),
        ]);

        $this->assertTrue(app(TurnstileService::class)->verify('valid-token', 'login', '127.0.0.1'));
    }

    public function test_wrong_action_is_rejected(): void
    {
        $this->enable();

        Http::fake([
            'turnstile.test/*' => Http::response([
                'success' => true,
                'action' => 'register',
                'hostname' => 'toko.test',
            ], 200),
        ]);

        $this->assertFalse(app(TurnstileService::class)->verify('valid-token', 'login'));
    }

    public function test_wrong_hostname_is_rejected(): void
    {
        $this->enable();

        Http::fake([
            'turnstile.test/*' => Http::response([
                'success' => true,
                'action' => 'login',
                'hostname' => 'evil.test',
            ], 200),
        ]);

        $this->assertFalse(app(TurnstileService::class)->verify('valid-token', 'login'));
    }

    public function test_failed_siteverify_is_rejected(): void
    {
        $this->enable();

        Http::fake([
            'turnstile.test/*' => Http::response([
                'success' => false,
                'error-codes' => ['invalid-input-response'],
            ], 200),
        ]);

        $this->assertFalse(app(TurnstileService::class)->verify('bad-token', 'login'));
    }

    public function test_network_error_fails_closed(): void
    {
        $this->enable();

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(null, 500),
        ]);

        $this->assertFalse(app(TurnstileService::class)->verify('any-token', 'login'));
    }

    public function test_missing_secret_or_hostnames_fails_closed(): void
    {
        $this->enable(['secret' => '']);
        $this->assertFalse(app(TurnstileService::class)->verify('any-token', 'login'));

        $this->enable(['secret' => 'test-secret', 'hostnames' => []]);
        $this->assertFalse(app(TurnstileService::class)->verify('any-token', 'login'));

        $this->enable();
        $this->assertFalse(app(TurnstileService::class)->verify('', 'login'));
        $this->assertFalse(app(TurnstileService::class)->verify(str_repeat('x', 2049), 'login'));
    }
}
