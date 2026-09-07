<?php

namespace Tests\Feature;

use App\Models\Expedition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExpeditionMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_expeditions_table_has_all_required_columns(): void
    {
        $expectedColumns = [
            'id',
            'name',
            'code',
            'service',
            'service_grade',
            'category',
            'etd',
            'rate_type',
            'base_cost',
            'cost',
            'is_free',
            'is_active',
            'is_default',
            'badge',
            'description',
            'tracking_support',
            'cod_support',
            'created_at',
            'updated_at',
        ];

        foreach ($expectedColumns as $column) {
            $this->assertTrue(
                Schema::hasColumn('expeditions', $column),
                "Column '{$column}' is missing from expeditions table."
            );
        }
    }

    public function test_can_create_and_query_default_expedition(): void
    {
        $defaultExpedition = Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'Reguler (REG)',
            'category' => 'Reguler',
            'etd' => '2 - 3 hari',
            'rate_type' => 'per_kg',
            'base_cost' => 18000,
            'cost' => 18000,
            'is_active' => true,
            'is_default' => true,
            'tracking_support' => true,
            'cod_support' => false,
            'badge' => 'Ekspedisi Utama',
        ]);

        $otherExpedition = Expedition::create([
            'name' => 'SiCepat Ekspres',
            'code' => 'sicepat',
            'service' => 'SIUNTUNG',
            'category' => 'Reguler',
            'etd' => '2 - 3 hari',
            'rate_type' => 'per_kg',
            'base_cost' => 17000,
            'cost' => 17000,
            'is_active' => true,
            'is_default' => false,
        ]);

        $retrievedDefault = Expedition::default()->first();

        $this->assertNotNull($retrievedDefault);
        $this->assertEquals('JNE Express', $retrievedDefault->name);
        $this->assertTrue($retrievedDefault->is_default);
        $this->assertEquals('per_kg', $retrievedDefault->rate_type);
    }
}
