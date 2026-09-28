<?php

namespace Tests\Feature;

use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChartOfAccountApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_chart_of_accounts_index_returns_seeded_accounts(): void
    {
        $this->seed(MasterReferenceSeeder::class);

        $response = $this->getJson('/api/chart-of-accounts');

        $response->assertOk();

        $codes = collect($response->json('data'))->pluck('account_code')->all();
        $this->assertContains('1100', $codes);
        $this->assertContains('2200', $codes);
        $this->assertContains('6400', $codes);
    }
}
