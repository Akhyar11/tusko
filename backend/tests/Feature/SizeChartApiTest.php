<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\SizeChart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SizeChartApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function chart(string $name, ?int $categoryId, bool $isDefault, array $rows = []): SizeChart
    {
        $chart = SizeChart::create([
            'name' => $name,
            'category_id' => $categoryId,
            'is_default' => $isDefault,
            'is_active' => true,
        ]);
        foreach ($rows as $i => $row) {
            $chart->rows()->create($row + ['sort_order' => $i]);
        }

        return $chart;
    }

    public function test_public_resolves_category_chart_over_default(): void
    {
        $category = Category::create(['name' => 'Sepatu Lari', 'slug' => 'sepatu-lari-'.uniqid()]);
        $this->chart('Default', null, true, [['uk' => 'D', 'eur' => 'D']]);
        $this->chart('Sepatu', $category->id, false, [['uk' => 'S', 'eur' => 'S']]);

        $this->getJson('/api/store/size-chart?category_id='.$category->id)
            ->assertOk()
            ->assertJsonPath('data.name', 'Sepatu')
            ->assertJsonPath('data.rows.0.uk', 'S');
    }

    public function test_public_falls_back_to_default(): void
    {
        $category = Category::create(['name' => 'Jersey', 'slug' => 'jersey-'.uniqid()]);
        $this->chart('Default', null, true, [['uk' => 'D', 'eur' => 'D']]);

        $this->getJson('/api/store/size-chart?category_id='.$category->id)
            ->assertOk()
            ->assertJsonPath('data.name', 'Default');
    }

    public function test_public_returns_empty_when_no_chart(): void
    {
        $this->getJson('/api/store/size-chart')
            ->assertOk()
            ->assertJsonPath('data.rows', []);
    }

    public function test_admin_can_crud_chart_with_rows(): void
    {
        $admin = $this->admin();
        $category = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu-'.uniqid()]);

        $created = $this->actingAs($admin)->postJson('/api/admin/size-charts', [
            'name' => 'Ukuran Sepatu',
            'category_id' => $category->id,
            'is_default' => true,
            'is_active' => true,
            'rows' => [
                ['uk' => '8', 'eur' => '42', 'us' => '8.5', 'cm' => '26.5 cm', 'raw_size' => '42'],
                ['uk' => '9', 'eur' => '43', 'us' => '9.5', 'cm' => '27.5 cm', 'raw_size' => '43'],
            ],
        ])->assertCreated()->assertJsonPath('data.name', 'Ukuran Sepatu');

        $id = $created->json('data.id');
        $this->assertDatabaseCount('size_chart_rows', 2);

        $this->actingAs($admin)->putJson("/api/admin/size-charts/{$id}", [
            'name' => 'Ukuran Sepatu (Revisi)',
            'category_id' => $category->id,
            'is_default' => true,
            'is_active' => true,
            'rows' => [
                ['uk' => '8', 'eur' => '42', 'us' => '8.5', 'cm' => '26.5 cm', 'raw_size' => '42'],
            ],
        ])->assertOk()->assertJsonPath('data.name', 'Ukuran Sepatu (Revisi)');

        $this->assertDatabaseCount('size_chart_rows', 1);

        $this->actingAs($admin)->deleteJson("/api/admin/size-charts/{$id}")->assertOk();
        $this->assertDatabaseMissing('size_charts', ['id' => $id]);
    }

    public function test_saving_default_unsets_other_defaults(): void
    {
        $admin = $this->admin();
        $first = $this->chart('Default Lama', null, true);
        $category = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu-'.uniqid()]);

        $this->actingAs($admin)->postJson('/api/admin/size-charts', [
            'name' => 'Default Baru',
            'category_id' => $category->id,
            'is_default' => true,
            'is_active' => true,
            'rows' => [],
        ])->assertCreated();

        $this->assertFalse((bool) $first->fresh()->is_default);
    }
}
