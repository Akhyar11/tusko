<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ManualPaymentConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_bank_accounts_are_empty_when_not_configured(): void
    {
        $this->getJson('/api/payment-methods/manual-banks')
            ->assertOk()
            ->assertJson(['data' => [], 'configured' => false]);
    }

    public function test_manual_bank_accounts_are_loaded_from_configuration(): void
    {
        app(\App\Services\IntegrationService::class)->set('payment.manual_banks', json_encode([
            ['bank' => 'BCA', 'bank_code' => '014', 'account_number' => '1234567890', 'account_name' => 'PT Tusko'],
            ['bank' => 'Mandiri', 'bank_code' => '008', 'account_number' => '9876543210123', 'account_name' => 'PT Tusko'],
        ]), 'payment');

        $this->getJson('/api/payment-methods/manual-banks')
            ->assertOk()
            ->assertJsonPath('configured', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['bank' => 'BCA']);
    }

    public function test_can_confirm_payment_with_proof_upload(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'INV/20260907/TK/778899',
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $file = UploadedFile::fake()->image('bukti_transfer.jpg', 600, 800);

        $response = $this->actingAs($user)->postJson("/api/orders/{$order->order_number}/confirm-payment", [
            'payment_proof' => $file,
            'bank_name' => 'BCA',
            'bank_account_name' => 'Budi Santoso',
            'transfer_amount' => 162000,
            'notes' => 'Sudah ditransfer dari rekening BCA atas nama Budi Santoso',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.payment_status', 'verifying')
            ->assertJsonPath('data.payment_method', 'manual_transfer');

        $order->refresh();
        $this->assertEquals('verifying', $order->payment_status);
        $this->assertEquals('BCA', $order->bank_name);
        $this->assertEquals('Budi Santoso', $order->bank_account_name);
        $this->assertNotNull($order->payment_proof);
        Storage::disk('public')->assertExists($order->payment_proof);
    }

    public function test_can_approve_manual_payment(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/778898',
            'status' => 'pending',
            'payment_status' => 'verifying',
        ]);

        $response = $this->postJson("/api/orders/{$order->order_number}/approve-payment");

        $response->assertOk()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'paid');

        $order->refresh();
        $this->assertEquals('processing', $order->status);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertNotNull($order->paid_at);
    }

    public function test_approve_manual_payment_is_idempotent_and_records_payment(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/778899',
            'grand_total' => 175000,
            'status' => 'pending',
            'payment_status' => 'verifying',
        ]);

        $this->postJson("/api/orders/{$order->order_number}/approve-payment")
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $this->postJson("/api/orders/{$order->order_number}/approve-payment")
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'paid',
            'method' => 'manual_transfer',
        ]);
    }

    public function test_can_reject_manual_payment(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/778897',
            'status' => 'pending',
            'payment_status' => 'verifying',
        ]);

        $response = $this->postJson("/api/orders/{$order->order_number}/reject-payment", [
            'reason' => 'Nominal transfer tidak sesuai dengan invoice.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.payment_status', 'rejected');

        $order->refresh();
        $this->assertEquals('rejected', $order->payment_status);
        $this->assertStringContainsString('Nominal transfer tidak sesuai', $order->notes);
    }

    public function test_confirm_payment_validation_fails_for_invalid_file(): void
    {
        $order = Order::factory()->create();

        $invalidFile = UploadedFile::fake()->create('document.exe', 100);

        $response = $this->postJson("/api/orders/{$order->order_number}/confirm-payment", [
            'payment_proof' => $invalidFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_proof']);
    }
}
