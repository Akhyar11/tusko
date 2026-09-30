<?php

namespace Tests\Feature;

use App\Models\EmailLog;
use App\Models\FinancialAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * T45.3 — Endpoint wiring: rekening keuangan + log email notifikasi.
 */
class BacklogWiringApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
    }

    public function test_admin_lists_financial_accounts(): void
    {
        $this->actingAdmin();

        FinancialAccount::create([
            'account_name' => 'BCA Bisnis',
            'account_number' => '1234567890',
            'bank_name' => 'BCA',
            'current_balance' => 1500000,
            'is_active' => true,
        ]);

        $this->getJson('/api/financial-accounts')
            ->assertStatus(200)
            ->assertJsonPath('data.0.account_name', 'BCA Bisnis')
            ->assertJsonPath('data.0.account_number', '1234567890');
    }

    public function test_admin_lists_email_logs(): void
    {
        $this->actingAdmin();

        EmailLog::create([
            'order_id' => null,
            'email_type' => 'order_placed',
            'recipient_email' => 'budi@gmail.com',
            'subject' => 'Pesanan Dibuat',
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        $this->getJson('/api/admin/email-logs')
            ->assertStatus(200)
            ->assertJsonPath('data.0.recipient_email', 'budi@gmail.com')
            ->assertJsonPath('data.0.subject', 'Pesanan Dibuat');
    }

    public function test_financial_accounts_requires_admin(): void
    {
        $this->getJson('/api/financial-accounts')->assertStatus(401);
    }

    public function test_email_logs_requires_admin(): void
    {
        $this->getJson('/api/admin/email-logs')->assertStatus(401);
    }

    public function test_email_and_receipt_template_endpoints_available(): void
    {
        $this->actingAdmin();

        $this->getJson('/api/templates/emails')->assertStatus(200)->assertJsonStructure(['data']);
        $this->getJson('/api/templates/receipt')->assertStatus(200)->assertJsonStructure(['data']);
    }
}
