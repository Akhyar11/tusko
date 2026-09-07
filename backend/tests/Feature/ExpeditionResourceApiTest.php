<?php

namespace Tests\Feature;

use App\Models\Expedition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpeditionResourceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_expeditions(): void
    {
        Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'Reguler',
            'etd' => '2-3 hari',
            'base_cost' => 15000,
            'cost' => 15000,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/expeditions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'code', 'service', 'cost', 'is_active'],
                ],
            ]);
    }

    public function test_can_create_expedition_via_post_route(): void
    {
        $payload = [
            'name' => 'Lion Parcel',
            'code' => 'lion',
            'service' => 'REGPACK',
            'category' => 'Reguler',
            'etd' => '2-3 hari',
            'cost' => 16000,
            'rate_type' => 'per_kg',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/expeditions', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Lion Parcel')
            ->assertJsonPath('data.code', 'lion');

        $this->assertDatabaseHas('expeditions', [
            'name' => 'Lion Parcel',
            'code' => 'lion',
        ]);
    }

    public function test_can_show_expedition(): void
    {
        $expedition = Expedition::create([
            'name' => 'Ninja Xpress',
            'code' => 'ninja',
            'service' => 'Standard',
            'etd' => '1-2 hari',
            'base_cost' => 14000,
            'cost' => 14000,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/expeditions/{$expedition->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $expedition->id)
            ->assertJsonPath('data.name', 'Ninja Xpress');
    }

    public function test_can_update_expedition_via_put_and_patch_route(): void
    {
        $expedition = Expedition::create([
            'name' => 'POS Indonesia',
            'code' => 'pos',
            'service' => 'Kilat Khusus',
            'etd' => '2-4 hari',
            'base_cost' => 12000,
            'cost' => 12000,
            'is_active' => true,
        ]);

        $response = $this->putJson("/api/expeditions/{$expedition->id}", [
            'cost' => 13500,
            'etd' => '1-3 hari',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.cost', 13500)
            ->assertJsonPath('data.etd', '1-3 hari');

        $expedition->refresh();
        $this->assertEquals(13500, $expedition->cost);
    }

    public function test_can_destroy_expedition_via_delete_route(): void
    {
        $expedition = Expedition::create([
            'name' => 'Wahana Express',
            'code' => 'wahana',
            'service' => 'Ekonomis',
            'etd' => '3-5 hari',
            'base_cost' => 8000,
            'cost' => 8000,
            'is_default' => false,
            'is_active' => true,
        ]);

        $response = $this->deleteJson("/api/expeditions/{$expedition->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', "Ekspedisi 'Wahana Express' berhasil dihapus.");

        $this->assertDatabaseMissing('expeditions', [
            'id' => $expedition->id,
        ]);
    }
}
