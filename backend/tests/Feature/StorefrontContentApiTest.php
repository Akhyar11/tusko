<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\FileStorageService;
use App\Services\Settings\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * T43.2 — API konten storefront + upload gambar.
 */
class StorefrontContentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_endpoint_returns_dynamic_values_and_parses_json(): void
    {
        app(SettingsService::class)->setGroup('storefront', [
            'storefront.hero_title' => 'JUDUL HERO DINAMIS',
            'storefront.hero_enabled' => true,
            'storefront.popular_chips' => json_encode([
                ['label' => 'Chip A', 'query' => 'a'],
                ['label' => 'Chio B', 'query' => 'b'],
            ]),
            'storefront.sports_cards' => json_encode([
                ['tag' => 'Road', 'title' => 'Lari', 'category_id' => 5, 'query' => 'Running'],
            ]),
        ]);

        $response = $this->getJson('/api/storefront/content');

        $response->assertStatus(200)
            ->assertJsonPath('data.hero_title', 'JUDUL HERO DINAMIS')
            ->assertJsonPath('data.hero_enabled', true)
            ->assertJsonCount(2, 'data.popular_chips')
            ->assertJsonPath('data.popular_chips.0.label', 'Chip A')
            ->assertJsonCount(1, 'data.sports_cards')
            ->assertJsonPath('data.sports_cards.0.category_id', 5);
    }

    public function test_content_endpoint_is_public_and_has_no_secrets(): void
    {
        $this->getJson('/api/storefront/content')->assertStatus(200);

        $keys = array_keys($this->getJson('/api/storefront/content')->json('data'));
        foreach ($keys as $key) {
            $this->assertFalse(
                \App\Services\Settings\SettingsRegistry::isSecret('storefront.' . $key),
                "Key storefront.{$key} tidak boleh secret."
            );
        }
    }

    public function test_admin_can_upload_storefront_image(): void
    {
        Storage::fake(FileStorageService::disk());

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        $response = $this->post('/api/admin/storefront/image', [
            'image' => UploadedFile::fake()->image('hero.jpg', 800, 600),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Gambar berhasil diunggah.');

        $this->assertNotEmpty($response->json('data.url'));
    }

    public function test_guest_cannot_upload_storefront_image(): void
    {
        $this->postJson('/api/admin/storefront/image', [])->assertStatus(401);
    }
}
