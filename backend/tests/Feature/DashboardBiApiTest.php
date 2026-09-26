<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardBiApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
    }

    public function test_admin_gets_bi_summary(): void
    {
        Product::factory()->count(2)->create(['stock' => 1, 'stock_minimum' => 5]);
        Order::factory()->count(2)->create(['payment_status' => 'paid', 'status' => 'completed', 'grand_total' => 100000, 'total_cogs' => 40000]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        $response = $this->getJson('/api/dashboard/summary')->assertStatus(200);

        $response->assertJsonPath('status', 'success');
        $this->assertArrayHasKey('revenue', $response->json('data.kpi'));
        $this->assertArrayHasKey('gross_profit', $response->json('data.kpi'));
        $this->assertArrayHasKey('net_cashflow', $response->json('data.kpi'));
        $this->assertArrayHasKey('orders_total', $response->json('data.kpi'));
        $this->assertArrayHasKey('points_liability', $response->json('data.kpi'));
        $this->assertGreaterThanOrEqual(1, $response->json('data.kpi.low_stock'));
        $this->assertIsArray($response->json('data.trend'));
        $this->assertIsArray($response->json('data.fast_moving'));
        $this->assertIsArray($response->json('data.slow_moving'));
    }

    public function test_summary_is_cached(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        $this->getJson('/api/dashboard/summary')->assertStatus(200);
        $this->assertTrue(Cache::has('dashboard.summary'));
    }

    public function test_non_admin_forbidden_and_guest_unauthorized(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $this->getJson('/api/dashboard/summary')->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/dashboard/summary')->assertStatus(401);
    }
}
