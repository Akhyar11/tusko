<?php

namespace Tests\Feature;

use App\Models\ChartOfAccount;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChartOfAccountManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_can_list_chart_of_accounts_with_kpi_summary(): void
    {
        $response = $this->getJson('/api/chart-of-accounts?page=1&per_page=10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'summary' => ['total_count', 'active_count', 'asset_count', 'liability_count', 'equity_count', 'revenue_count', 'expense_count'],
            ]);

        $this->assertGreaterThan(0, $response->json('meta.total'));
    }

    public function test_can_create_new_chart_of_account(): void
    {
        $response = $this->postJson('/api/chart-of-accounts', [
            'account_code' => '1150',
            'account_name' => 'Kas Kecil Cabang Surabaya',
            'account_type' => 'asset',
            'description' => 'Kas operasional toko cabang baru',
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.account_code', '1150')
            ->assertJsonPath('data.account_name', 'Kas Kecil Cabang Surabaya')
            ->assertJsonPath('data.account_type', 'asset');

        $this->assertDatabaseHas('chart_of_accounts', [
            'account_code' => '1150',
            'account_name' => 'Kas Kecil Cabang Surabaya',
        ]);
    }

    public function test_duplicate_account_code_is_rejected(): void
    {
        $response = $this->postJson('/api/chart-of-accounts', [
            'account_code' => '1100', // Sudah ada di seeder
            'account_name' => 'Kas Toko Duplikat',
            'account_type' => 'asset',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['account_code']);
    }

    public function test_can_update_chart_of_account(): void
    {
        $account = ChartOfAccount::create([
            'account_code' => '6500',
            'account_name' => 'Beban Promosi & Marketing',
            'account_type' => 'expense',
            'is_active' => true,
        ]);

        $response = $this->putJson("/api/chart-of-accounts/{$account->id}", [
            'account_code' => '6510',
            'account_name' => 'Beban Kampanye Digital Marketing',
            'account_type' => 'expense',
            'is_active' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.account_code', '6510')
            ->assertJsonPath('data.account_name', 'Beban Kampanye Digital Marketing');
    }

    public function test_system_core_accounts_cannot_be_deleted(): void
    {
        $bcaCoa = ChartOfAccount::where('account_code', '1200')->firstOrFail();

        $response = $this->deleteJson("/api/chart-of-accounts/{$bcaCoa->id}");

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Akun 1200 (Bank Operasional BCA) adalah akun inti sistem Tusko dan tidak dapat dihapus.',
            ]);

        $this->assertDatabaseHas('chart_of_accounts', ['account_code' => '1200']);
    }

    public function test_custom_account_can_be_deleted(): void
    {
        $custom = ChartOfAccount::create([
            'account_code' => '8999',
            'account_name' => 'Akun Sementara Test',
            'account_type' => 'expense',
            'is_active' => false,
        ]);

        $response = $this->deleteJson("/api/chart-of-accounts/{$custom->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('chart_of_accounts', ['account_code' => '8999']);
    }

    public function test_can_toggle_chart_of_account_status(): void
    {
        $account = ChartOfAccount::where('account_code', '1100')->firstOrFail();
        $this->assertTrue((bool) $account->is_active);

        $response = $this->postJson("/api/chart-of-accounts/{$account->id}/toggle-status");
        $response->assertStatus(200)->assertJsonPath('data.is_active', false);

        $this->assertFalse((bool) $account->fresh()->is_active);
    }
}
