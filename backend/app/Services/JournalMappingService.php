<?php

namespace App\Services;

use App\Models\GoodsReceivingNote;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockOpname;
use App\Models\Transaction;
use App\Models\VendorBillPayment;

/**
 * JournalMappingService — pemetaan event bisnis ke jurnal double-entry (T34.1)
 * memakai mesin `JournalPostingService` (T16.4).
 *
 * Setiap event membuat/menemukan satu transaksi kontainer (idempoten) lalu
 * memposting baris debit/kredit yang seimbang.
 */
class JournalMappingService
{
    /**
     * Kode Chart of Accounts standar (lihat MasterReferenceSeeder).
     */
    private const ACCOUNTS = [
        'cash' => '1100',
        'bank' => '1200',
        'inventory' => '1300',
        'payable' => '2100',
        'revenue' => '4100',
        'cogs' => '5100',
        'gateway_fee' => '6200',
    ];

    public function __construct(private readonly JournalPostingService $journal)
    {
    }

    /**
     * Event: pesanan lunas → Debit Kas/Bank, Kredit Pendapatan.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postOrderPaid(Order $order): ?array
    {
        $amount = $this->round((float) $order->grand_total);

        if ($amount <= 0) {
            return null;
        }

        $container = Transaction::where('order_id', $order->id)
            ->where('category', 'order_payment')
            ->first()
            ?? Transaction::create([
                'transaction_number' => Transaction::generateTransactionNumber('income'),
                'order_id' => $order->id,
                'reference_type' => 'order_payment',
                'reference_id' => $order->order_number,
                'type' => 'income',
                'category' => 'order_payment',
                'category_label' => 'Pembayaran Pesanan',
                'amount' => $amount,
                'description' => "Pembayaran pesanan {$order->order_number}",
                'status' => 'settled',
                'customer_name' => $order->recipient_name,
            ]);

        return $this->journal->post($container, [
            ['account_code' => $this->settlementCode($order->payment_method), 'debit' => $amount],
            ['account_code' => self::ACCOUNTS['revenue'], 'credit' => $amount],
        ], "Jurnal pesanan lunas {$order->order_number}");
    }

    /**
     * Event: biaya payment gateway → Debit Beban Gateway, Kredit Bank.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postPaymentGatewayFee(Order $order, float $fee): ?array
    {
        $fee = $this->round($fee);

        if ($fee <= 0) {
            return null;
        }

        $container = $this->container('order_gateway_fee', $order->order_number, [
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'gateway_fee',
            'category_label' => 'Biaya Payment Gateway',
            'amount' => $fee,
            'description' => "Biaya gateway pesanan {$order->order_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['gateway_fee'], 'debit' => $fee],
            ['account_code' => self::ACCOUNTS['bank'], 'credit' => $fee],
        ], "Jurnal biaya gateway {$order->order_number}");
    }

    /**
     * Event: penerimaan barang (GRN) → Debit Persediaan, Kredit Utang Usaha.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postGoodsReceiving(GoodsReceivingNote $grn): ?array
    {
        $total = 0.0;
        foreach ($grn->items as $item) {
            $total += (int) $item->accepted_quantity * (float) $item->unit_cost;
        }
        $total = $this->round($total);

        if ($total <= 0) {
            return null;
        }

        $container = $this->container('grn', $grn->grn_number, [
            'type' => 'expense',
            'category' => 'inventory_receipt',
            'category_label' => 'Penerimaan Persediaan',
            'amount' => $total,
            'description' => "Penerimaan barang {$grn->grn_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['inventory'], 'debit' => $total],
            ['account_code' => self::ACCOUNTS['payable'], 'credit' => $total],
        ], "Jurnal penerimaan barang {$grn->grn_number}");
    }

    /**
     * Event: pembayaran tagihan vendor → Debit Utang Usaha, Kredit Kas/Bank.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postVendorBillPayment(VendorBillPayment $payment): ?array
    {
        $amount = $this->round((float) $payment->amount);

        if ($amount <= 0) {
            return null;
        }

        $container = $this->container('vendor_bill_payment', (string) $payment->id, [
            'type' => 'expense',
            'category' => 'vendor_payment',
            'category_label' => 'Pembayaran Hutang Vendor',
            'amount' => $amount,
            'description' => "Pembayaran tagihan vendor #{$payment->vendor_bill_id}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['payable'], 'debit' => $amount],
            ['account_code' => $this->settlementCode($payment->payment_method), 'credit' => $amount],
        ], "Jurnal pembayaran vendor #{$payment->vendor_bill_id}");
    }

    /**
     * Event: refund pesanan → Debit Pendapatan, Kredit Kas/Bank.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postRefund(Order $order, float $amount): ?array
    {
        $amount = $this->round($amount);

        if ($amount <= 0) {
            return null;
        }

        $container = $this->container('refund', $order->order_number, [
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'refund',
            'category_label' => 'Pengembalian Dana',
            'amount' => $amount,
            'description' => "Refund pesanan {$order->order_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['revenue'], 'debit' => $amount],
            ['account_code' => $this->settlementCode($order->payment_method), 'credit' => $amount],
        ], "Jurnal refund {$order->order_number}");
    }

    /**
     * Event: penyesuaian stok opname → Debit/Kredit Persediaan vs HPP.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postStockOpname(StockOpname $opname): ?array
    {
        $value = 0.0;
        foreach ($opname->items as $item) {
            $unitCost = $this->unitCost(
                (int) $item->product_id,
                $item->product_variant_id ? (int) $item->product_variant_id : null
            );
            $value += (int) $item->difference * $unitCost;
        }
        $value = $this->round($value);

        if ($value === 0.0) {
            return null;
        }

        $absolute = abs($value);

        $container = $this->container('stock_opname', $opname->opname_number, [
            'type' => $value > 0 ? 'income' : 'expense',
            'category' => 'stock_adjustment',
            'category_label' => 'Penyesuaian Persediaan (Opname)',
            'amount' => $absolute,
            'description' => "Penyesuaian stok opname {$opname->opname_number}",
        ]);

        if ($value > 0) {
            return $this->journal->post($container, [
                ['account_code' => self::ACCOUNTS['inventory'], 'debit' => $absolute],
                ['account_code' => self::ACCOUNTS['cogs'], 'credit' => $absolute],
            ], "Jurnal selisih lebih opname {$opname->opname_number}");
        }

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['cogs'], 'debit' => $absolute],
            ['account_code' => self::ACCOUNTS['inventory'], 'credit' => $absolute],
        ], "Jurnal selisih kurang opname {$opname->opname_number}");
    }

    /**
     * Kode akun penyelesaian kas/bank berdasarkan metode pembayaran.
     */
    private function settlementCode(?string $method): string
    {
        $method = strtolower((string) $method);

        foreach (['midtrans', 'transfer', 'bank', 'va', 'bca', 'mandiri', 'bni', 'bri', 'qris', 'gopay', 'shopeepay'] as $needle) {
            if (str_contains($method, $needle)) {
                return self::ACCOUNTS['bank'];
            }
        }

        return self::ACCOUNTS['cash'];
    }

    /**
     * Temukan/buat transaksi kontainer jurnal (idempoten per reference).
     *
     * @param  array<string, mixed>  $overrides
     */
    private function container(string $referenceType, string $referenceId, array $overrides): Transaction
    {
        return Transaction::firstOrCreate(
            ['reference_type' => $referenceType, 'reference_id' => (string) $referenceId],
            array_merge([
                'transaction_number' => Transaction::generateTransactionNumber($overrides['type'] ?? 'expense'),
                'status' => 'settled',
                'customer_name' => 'Sistem',
            ], $overrides)
        );
    }

    private function unitCost(int $productId, ?int $variantId): float
    {
        if ($variantId) {
            $variant = ProductVariant::find($variantId);
            if ($variant && (float) $variant->current_cogs > 0) {
                return (float) $variant->current_cogs;
            }
        }

        $product = Product::find($productId);

        return $product ? (float) ($product->cost_price ?? 0) : 0.0;
    }

    private function round(float $value): float
    {
        return round($value, 2);
    }
}
