<?php

namespace Tests\Feature;

use App\Services\Settings\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T42.1 — Endpoint profil toko publik (dinamis dari Settings Hub).
 */
class StoreProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_endpoint_is_public_and_returns_store_identity(): void
    {
        app(SettingsService::class)->setGroup('store', [
            'store.legal_name' => 'PT Tusko Performance Indonesia',
            'store.cs_email' => 'cs@tusko.id',
            'store.whatsapp' => '628123456789',
            'store.return_window_days' => 14,
            'store.terms_text' => 'Syarat dan ketentuan berlaku.',
        ]);

        $response = $this->getJson('/api/store/profile');

        $response->assertStatus(200)
            ->assertJsonPath('data.legal_name', 'PT Tusko Performance Indonesia')
            ->assertJsonPath('data.cs_email', 'cs@tusko.id')
            ->assertJsonPath('data.whatsapp', '628123456789')
            ->assertJsonPath('data.return_window_days', 14)
            ->assertJsonPath('data.terms_text', 'Syarat dan ketentuan berlaku.');
    }

    public function test_profile_endpoint_never_returns_secrets(): void
    {
        $response = $this->getJson('/api/store/profile');

        $response->assertStatus(200);

        foreach (array_keys($response->json('data')) as $key) {
            $this->assertFalse(
                \App\Services\Settings\SettingsRegistry::isSecret('store.' . $key),
                "Key store.{$key} bertanda secret seharusnya tidak dikembalikan."
            );
        }
    }

    public function test_profile_endpoint_includes_default_store_name(): void
    {
        $this->getJson('/api/store/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Tusko Official Store');
    }
}
