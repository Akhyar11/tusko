<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\FinancialAccount;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_can_list_banks_with_pagination(): void
    {
        $response = $this->getJson('/api/banks?page=1&per_page=10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'summary' => ['total_count', 'active_count', 'inactive_count'],
            ]);

        $this->assertGreaterThan(0, $response->json('meta.total'));
    }

    public function test_can_list_all_banks_for_dropdown(): void
    {
        $response = $this->getJson('/api/banks?all=true');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'code', 'name', 'value', 'label']]]);
    }

    public function test_can_create_new_bank(): void
    {
        $response = $this->postJson('/api/banks', [
            'code' => 'BTPN',
            'name' => 'Bank BTPN (Jenius)',
            'notes' => 'Rekening operasional bank digital BTPN',
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'BTPN')
            ->assertJsonPath('data.name', 'Bank BTPN (Jenius)');

        $this->assertDatabaseHas('banks', ['code' => 'BTPN']);
    }

    public function test_duplicate_bank_code_is_rejected(): void
    {
        $response = $this->postJson('/api/banks', [
            'code' => 'BCA', // Sudah ada
            'name' => 'BCA Duplicate',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_can_update_bank(): void
    {
        $bank = Bank::where('code', 'BCA')->firstOrFail();

        $response = $this->putJson("/api/banks/{$bank->id}", [
            'code' => 'BCA',
            'name' => 'PT Bank Central Asia Tbk',
            'is_active' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'PT Bank Central Asia Tbk');

        $this->assertDatabaseHas('banks', ['name' => 'PT Bank Central Asia Tbk']);
    }

    public function test_bank_linked_to_financial_account_cannot_be_deleted(): void
    {
        $account = FinancialAccount::where('account_number', '8012345678')->firstOrFail();
        $bank = Bank::firstOrCreate(
            ['name' => $account->bank_name],
            ['code' => 'BCA_TEST', 'is_active' => true]
        );

        $response = $this->deleteJson("/api/banks/{$bank->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('banks', ['id' => $bank->id]);
    }

    public function test_can_toggle_bank_status(): void
    {
        $bank = Bank::where('code', 'BCA')->firstOrFail();
        $this->assertTrue((bool) $bank->is_active);

        $response = $this->postJson("/api/banks/{$bank->id}/toggle-status");
        $response->assertStatus(200)->assertJsonPath('data.is_active', false);

        $this->assertFalse((bool) $bank->fresh()->is_active);
    }
}
