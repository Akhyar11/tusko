<?php

namespace Tests\Feature;

use App\Models\Expedition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetDefaultExpeditionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_set_expedition_as_default_and_unsets_previous_default(): void
    {
        $expedition1 = Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'REG',
            'etd' => '2-3 hari',
            'base_cost' => 18000,
            'cost' => 18000,
            'is_default' => true,
            'is_active' => true,
        ]);

        $expedition2 = Expedition::create([
            'name' => 'SiCepat Ekspres',
            'code' => 'sicepat',
            'service' => 'SIUNTUNG',
            'etd' => '1-2 hari',
            'base_cost' => 17000,
            'cost' => 17000,
            'is_default' => false,
            'is_active' => false, // Initially inactive
        ]);

        $response = $this->postJson("/api/expeditions/{$expedition2->id}/set-default");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $expedition2->id)
            ->assertJsonPath('data.is_default', true)
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('message', "Ekspedisi 'SiCepat Ekspres' berhasil dijadikan ekspedisi utama.");

        $expedition1->refresh();
        $expedition2->refresh();

        $this->assertFalse($expedition1->is_default);
        $this->assertTrue($expedition2->is_default);
        $this->assertTrue($expedition2->is_active);

        $defaultCount = Expedition::where('is_default', true)->count();
        $this->assertEquals(1, $defaultCount);
    }

    public function test_alias_default_route_works(): void
    {
        $expedition = Expedition::create([
            'name' => 'Anteraja',
            'code' => 'anteraja',
            'service' => 'Reguler',
            'etd' => '2 hari',
            'base_cost' => 15000,
            'cost' => 15000,
            'is_default' => false,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/expeditions/{$expedition->id}/default");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $expedition->id)
            ->assertJsonPath('data.is_default', true);

        $expedition->refresh();
        $this->assertTrue($expedition->is_default);
    }

    public function test_returns_404_when_setting_default_on_non_existent_expedition(): void
    {
        $response = $this->postJson('/api/expeditions/999999/set-default');

        $response->assertStatus(404);
    }
}
