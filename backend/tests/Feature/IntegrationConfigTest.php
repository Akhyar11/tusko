<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Models\User;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IntegrationConfigTest extends TestCase
{
    use RefreshDatabase;

    private function service(): IntegrationService
    {
        return app(IntegrationService::class);
    }

    private function createUser(string $role): User
    {
        static $sequence = 0;
        $sequence++;

        return User::create([
            'name' => 'Pengguna Integrasi ' . $sequence,
            'email' => 'integrasi' . $sequence . '-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => $role,
            'is_active' => true,
        ]);
    }

    public function test_service_stores_and_reads_secret_value_encrypted(): void
    {
        $this->service()->set('midtrans.server_key', 'SECRET-123', 'midtrans', true);

        $raw = DB::table('integrations')->where('key', 'midtrans.server_key')->value('value');

        $this->assertNotSame('SECRET-123', $raw);
        $this->assertNotEmpty($raw);
        $this->assertSame('SECRET-123', $this->service()->get('midtrans.server_key'));
        $this->assertTrue($this->service()->isConfigured('midtrans.server_key'));
    }

    public function test_service_lists_group_configuration(): void
    {
        $this->service()->set('kiriminaja.api_key', 'KEY-1', 'kiriminaja', true);
        $this->service()->set('kiriminaja.base_url', 'https://api.kiriminaja.test', 'kiriminaja', false);
        $this->service()->set('midtrans.client_key', 'CLIENT-1', 'midtrans', false);

        $group = $this->service()->group('kiriminaja');

        $this->assertSame('KEY-1', $group['kiriminaja.api_key']);
        $this->assertSame('https://api.kiriminaja.test', $group['kiriminaja.base_url']);
        $this->assertArrayNotHasKey('midtrans.client_key', $group);
    }

    public function test_admin_can_update_and_list_integrations_with_secret_masked(): void
    {
        Sanctum::actingAs($this->createUser('admin'));

        $this->putJson('/api/integrations', [
            'integrations' => [
                ['key' => 'midtrans.server_key', 'value' => 'SECRET-999', 'group' => 'midtrans', 'is_secret' => true],
                ['key' => 'midtrans.client_key', 'value' => 'CLIENT-999', 'group' => 'midtrans', 'is_secret' => false],
            ],
        ])->assertStatus(200);

        $response = $this->getJson('/api/integrations?group=midtrans');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $data = collect($response->json('data'))->keyBy('key');

        $this->assertSame('********', $data['midtrans.server_key']['value']);
        $this->assertSame('CLIENT-999', $data['midtrans.client_key']['value']);
        $this->assertTrue($data['midtrans.server_key']['is_configured']);
    }

    public function test_non_admin_cannot_access_integration_endpoints(): void
    {
        Sanctum::actingAs($this->createUser('customer'));

        $this->getJson('/api/integrations')->assertStatus(403);
        $this->putJson('/api/integrations', [
            'integrations' => [
                ['key' => 'midtrans.server_key', 'value' => 'X'],
            ],
        ])->assertStatus(403);
    }
}
