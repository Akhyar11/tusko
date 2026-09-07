<?php

namespace Tests\Feature;

use App\Models\Expedition;
use Database\Seeders\ExpeditionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExpeditionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_expeditions_table_has_expected_schema(): void
    {
        $this->assertTrue(Schema::hasTable('expeditions'));
        $this->assertTrue(Schema::hasColumns('expeditions', [
            'id',
            'name',
            'code',
            'service',
            'category',
            'etd',
            'base_cost',
            'cost',
            'is_free',
            'is_active',
            'badge',
            'description',
            'tracking_support',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_expedition_seeder_populates_expected_couriers(): void
    {
        $this->seed(ExpeditionSeeder::class);

        $this->assertDatabaseCount('expeditions', 11);

        // Verify JNE Reguler
        $this->assertDatabaseHas('expeditions', [
            'code' => 'jne',
            'service' => 'Reguler (REG)',
            'category' => 'Reguler',
            'is_free' => true,
            'is_active' => true,
        ]);

        // Verify Instant couriers
        $this->assertDatabaseHas('expeditions', [
            'code' => 'gosend',
            'service' => 'Instant (3 Jam)',
            'category' => 'Instan & Same Day',
            'cost' => 35000,
        ]);

        // Verify Next Day couriers
        $this->assertDatabaseHas('expeditions', [
            'code' => 'sicepat',
            'service' => 'BEST (Next Day)',
            'category' => 'Next Day',
            'cost' => 26000,
        ]);

        // Verify Kargo couriers
        $this->assertDatabaseHas('expeditions', [
            'code' => 'jne',
            'service' => 'JTR (JNE Trucking)',
            'category' => 'Kargo',
            'cost' => 45000,
        ]);
    }

    public function test_model_scopes_and_casts_work_properly(): void
    {
        $this->seed(ExpeditionSeeder::class);

        $activeExpeditions = Expedition::active()->get();
        $this->assertCount(11, $activeExpeditions);

        $reguler = Expedition::byCategory('Reguler')->get();
        $this->assertCount(4, $reguler);

        $first = $reguler->first();
        $this->assertIsFloat($first->cost);
        $this->assertIsFloat($first->base_cost);
        $this->assertIsBool($first->is_free);
        $this->assertIsBool($first->is_active);
        $this->assertIsBool($first->tracking_support);
    }
}
