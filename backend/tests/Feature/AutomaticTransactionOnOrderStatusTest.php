<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutomaticTransactionOnOrderStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_income_transaction_when_order_marked_as_paid(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/AUTO001',
            'recipient_name' => 'Budi Santoso',
            'full_address' => 'Jakarta Barat',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 200000,
            'shipping_cost' => 15000,
            'grand_total' => 215000,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'midtrans',
            'payment_channel' => 'BCA Virtual Account',
        ]);

        $this->assertEquals(0, Transaction::where('order_id', $order->id)->count());

        // Update status ke processing via API
        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('transactions', [
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'order_payment',
            'amount' => 215000,
            'status' => 'settled',
        ]);

        $this->assertEquals(1, Transaction::where('order_id', $order->id)->count());
    }

    public function test_creates_shipping_expense_transaction_when_order_status_changes_to_shipped(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/AUTO002',
            'recipient_name' => 'Citra Lestari',
            'full_address' => 'Surabaya',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'subtotal' => 300000,
            'shipping_cost' => 22000,
            'grand_total' => 322000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        // Karena dibuat dengan status processing & paid, transaksi income sudah otomatis dicatat 1
        $this->assertEquals(1, Transaction::where('order_id', $order->id)->count());

        // Update status ke shipped dengan tracking_number
        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'shipped',
            'tracking_number' => 'SICPAT99887766',
        ]);

        $response->assertStatus(200);

        // Sekarang harus ada 2 transaksi: 1 income (order_payment) dan 1 expense (shipping_fee)
        $this->assertDatabaseHas('transactions', [
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'shipping_fee',
            'amount' => 22000,
            'status' => 'settled',
        ]);

        $this->assertEquals(2, Transaction::where('order_id', $order->id)->count());
    }

    public function test_does_not_create_duplicate_transactions_on_subsequent_updates(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/AUTO003',
            'recipient_name' => 'Dewi Sartika',
            'full_address' => 'Bandung',
            'expedition_name' => 'J&T',
            'expedition_service' => 'EZ',
            'subtotal' => 150000,
            'shipping_cost' => 10000,
            'grand_total' => 160000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $this->assertEquals(1, Transaction::where('order_id', $order->id)->count());

        // Update berkali-kali status notes atau status yang sama
        $order->update(['notes' => 'Catatan tambahan pengiriman']);
        $order->update(['payment_status' => 'paid']);

        // Tetap hanya ada 1 income transaction
        $this->assertEquals(1, Transaction::where('order_id', $order->id)->count());
    }

    public function test_creates_refund_transaction_when_paid_order_is_cancelled(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/AUTO004',
            'recipient_name' => 'Eko Prasetyo',
            'full_address' => 'Semarang',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 500000,
            'shipping_cost' => 15000,
            'grand_total' => 515000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        // Karena status awal processing, income transaction sudah dibuat
        $this->assertDatabaseHas('transactions', [
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'order_payment',
        ]);

        // Cancel order via API
        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'cancelled',
            'cancellation_reason' => 'Stok habis mendadak',
        ]);

        $response->assertStatus(200);

        // Harus ada expense refund sebesar grand_total
        $this->assertDatabaseHas('transactions', [
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'refund',
            'amount' => 515000,
            'status' => 'settled',
        ]);
    }

    public function test_does_not_create_refund_when_unpaid_order_is_cancelled(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/AUTO005',
            'recipient_name' => 'Fani Rahma',
            'full_address' => 'Medan',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'REG',
            'subtotal' => 120000,
            'shipping_cost' => 18000,
            'grand_total' => 138000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $this->assertEquals(0, Transaction::where('order_id', $order->id)->count());

        // Cancel order yang masih pending (belum bayar)
        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'cancelled',
            'cancellation_reason' => 'Pembeli berubah pikiran',
        ]);

        $response->assertStatus(200);

        // Tidak boleh ada transaksi refund karena belum pernah ada pembayaran masuk
        $this->assertEquals(0, Transaction::where('order_id', $order->id)->count());
    }

    public function test_manual_payment_approval_automatically_records_income_transaction(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/AUTO006',
            'recipient_name' => 'Gilang Pratama',
            'full_address' => 'Palembang',
            'expedition_name' => 'JNE',
            'expedition_service' => 'YES',
            'subtotal' => 400000,
            'shipping_cost' => 30000,
            'grand_total' => 430000,
            'status' => 'pending',
            'payment_status' => 'verifying',
            'payment_method' => 'manual_transfer',
            'bank_name' => 'BCA',
            'bank_account_name' => 'Gilang',
        ]);

        $response = $this->postJson("/api/orders/{$order->id}/approve-payment");

        $response->assertStatus(200);

        $this->assertDatabaseHas('transactions', [
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'order_payment',
            'amount' => 430000,
            'payment_method' => 'manual_transfer',
            'status' => 'settled',
        ]);
    }
}
