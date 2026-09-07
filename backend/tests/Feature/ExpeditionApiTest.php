<?php

namespace Tests\Feature;

use App\Models\Expedition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpeditionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_active_expeditions(): void
    {
        Expedition::factory()->create([
            'name' => 'J&T Express',
            'service' => 'EZ (Reguler)',
            'category' => 'Reguler',
            'cost' => 10000,
            'is_active' => true,
        ]);

        Expedition::factory()->create([
            'name' => 'SiCepat',
            'service' => 'GOKIL',
            'category' => 'Kargo',
            'cost' => 25000,
            'is_active' => true,
        ]);

        Expedition::factory()->create([
            'name' => 'Inactive Exp',
            'service' => 'Disabled',
            'category' => 'Reguler',
            'cost' => 10000,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/expeditions');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.name', 'J&T Express')
            ->assertJsonPath('data.1.name', 'SiCepat');
    }

    public function test_can_filter_expeditions_by_category(): void
    {
        Expedition::factory()->create([
            'name' => 'J&T Express',
            'category' => 'Reguler',
            'is_active' => true,
        ]);

        Expedition::factory()->create([
            'name' => 'GoSend Instant',
            'category' => 'Instan & Same Day',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/expeditions?category=Reguler');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'J&T Express');
    }

    public function test_can_search_expeditions_by_name(): void
    {
        Expedition::factory()->create([
            'name' => 'JNE Express',
            'service' => 'REG',
            'is_active' => true,
        ]);

        Expedition::factory()->create([
            'name' => 'Anteraja',
            'service' => 'Regular',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/expeditions?search=Anter');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Anteraja');
    }

    public function test_tariff_calculates_dynamically_based_on_weight(): void
    {
        $expedition = Expedition::factory()->create([
            'name' => 'JNE Express',
            'base_cost' => 12000,
            'cost' => 12000,
            'is_free' => false,
            'is_active' => true,
        ]);

        // Weight = 2.4 kg -> ceil is 3 kg -> 3 * 12000 = 36000
        $response = $this->getJson('/api/expeditions?weight=2.4');

        $response->assertOk()
            ->assertJsonPath('data.0.cost', 36000)
            ->assertJsonPath('data.0.weight_calculated_kg', 3);
    }

    public function test_free_shipping_remains_free_even_with_weight(): void
    {
        Expedition::factory()->create([
            'name' => 'Bebas Ongkir',
            'base_cost' => 10000,
            'cost' => 0,
            'is_free' => true,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/expeditions?weight=5');

        $response->assertOk()
            ->assertJsonPath('data.0.cost', 0)
            ->assertJsonPath('data.0.is_free', true);
    }

    public function test_can_get_expedition_categories_list(): void
    {
        $response = $this->getJson('/api/expeditions/categories');

        $response->assertOk()
            ->assertJsonStructure(['data'])
            ->assertJsonFragment(['data' => [
                'Semua',
                'Reguler',
                'Instan & Same Day',
                'Next Day',
                'Kargo',
            ]]);
    }

    public function test_can_get_single_expedition(): void
    {
        $expedition = Expedition::factory()->create([
            'name' => 'J&T Express',
            'service' => 'EZ (Reguler)',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/expeditions/{$expedition->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $expedition->id)
            ->assertJsonPath('data.name', 'J&T Express');
    }

    public function test_inactive_expedition_returns_not_found(): void
    {
        $expedition = Expedition::factory()->create([
            'name' => 'Hidden Expedition',
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/expeditions/{$expedition->id}");

        $response->assertNotFound();
    }
}
