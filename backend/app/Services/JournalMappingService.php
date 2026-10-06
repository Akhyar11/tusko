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
        'gateway_escrow' => '1210',
        'inventory' => '1300',
        'payable' => '2100',
        'points_liability' => '2200',
        'equity' => '3100',
        'revenue' => '4100',
        'cogs' => '5100',
        'shipping_expense' => '6100',
        'gateway_fee' => '6200',
        'operating_expense' => '6300',
        'points_expense' => '6400',
    ];

    public function __construct(private readonly JournalPostingService $journal)
    {
    }

    /**
     * Event: pesanan lunas → Debit Kliring Midtrans/Kas, Kredit Pendapatan.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postOrderPaid(Order $order): ?array
    {
        $amount = $this->round((float) $order->grand_total);

        if ($amount <= 0) {
            return null;
        }

        $settlementCode = $this->settlementCode($order->payment_method);
        $escrowAccount = null;
        if ($settlementCode === self::ACCOUNTS['gateway_escrow']) {
            $escrowAccount = \App\Models\FinancialAccount::where('account_number', 'MIDTRANS-ESCROW')->first()
                ?? \App\Models\FinancialAccount::where('type', 'bank')->where('is_active', true)->first();
        } elseif ($settlementCode === self::ACCOUNTS['cash']) {
            $escrowAccount = \App\Models\FinancialAccount::where('type', 'cash')->where('is_active', true)->first();
        }

        $container = Transaction::where('order_id', $order->id)
            ->where('category', 'order_payment')
            ->first();

        if (!$container) {
            $container = Transaction::create([
                'transaction_number' => Transaction::generateTransactionNumber('income'),
                'financial_account_id' => $escrowAccount?->id,
                'order_id' => $order->id,
                'reference_type' => 'order_payment',
                'reference_id' => null,
                'reference_code' => $order->order_number,
                'type' => 'income',
                'category' => 'order_payment',
                'category_label' => 'Pembayaran Pesanan',
                'amount' => $amount,
                'description' => "Pembayaran pesanan {$order->order_number}",
                'status' => 'settled',
                'customer_name' => $order->recipient_name,
            ]);
        } elseif (!$container->financial_account_id && $escrowAccount) {
            $container->update(['financial_account_id' => $escrowAccount->id]);
        }

        return $this->journal->post($container, [
            ['account_code' => $settlementCode, 'debit' => $amount],
            ['account_code' => self::ACCOUNTS['revenue'], 'credit' => $amount],
        ], "Jurnal pesanan lunas {$order->order_number}");
    }

    /**
     * Event: biaya payment gateway → Debit Beban Gateway, Kredit Kliring Midtrans.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postPaymentGatewayFee(Order $order, float $fee): ?array
    {
        $fee = $this->round($fee);

        if ($fee <= 0) {
            return null;
        }

        $escrowAccount = \App\Models\FinancialAccount::where('account_number', 'MIDTRANS-ESCROW')->first()
            ?? \App\Models\FinancialAccount::where('type', 'bank')->where('is_active', true)->first();

        $container = $this->container('order_gateway_fee', $order->order_number, [
            'financial_account_id' => $escrowAccount?->id,
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'gateway_fee',
            'category_label' => 'Biaya Payment Gateway',
            'amount' => $fee,
            'description' => "Biaya gateway pesanan {$order->order_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['gateway_fee'], 'debit' => $fee],
            ['account_code' => self::ACCOUNTS['gateway_escrow'], 'credit' => $fee],
        ], "Jurnal biaya gateway {$order->order_number}");
    }

    /**
     * Event: poin loyalitas diperoleh (saat order lunas) →
     * Debit Beban Program Poin, Kredit Liabilitas Poin (Deferred).
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postPointsEarned(Order $order, int $points, float $unitValue): ?array
    {
        $amount = $this->round($points * $unitValue);

        if ($points <= 0 || $amount <= 0) {
            return null;
        }

        $container = $this->container('order_points_earned', $order->order_number, [
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'loyalty_points_earned',
            'category_label' => 'Poin Loyalitas Diperoleh',
            'amount' => $amount,
            'description' => "Poin diperoleh pesanan {$order->order_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['points_expense'], 'debit' => $amount],
            ['account_code' => self::ACCOUNTS['points_liability'], 'credit' => $amount],
        ], "Jurnal poin diperoleh {$order->order_number}");
    }

    /**
     * Event: poin loyalitas ditukar (saat checkout) →
     * Debit Liabilitas Poin, Kredit Pendapatan.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postPointsRedeemed(Order $order, int $points, float $unitValue): ?array
    {
        $amount = $this->round($points * $unitValue);

        if ($points <= 0 || $amount <= 0) {
            return null;
        }

        $container = $this->container('order_points_redeemed', $order->order_number, [
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'loyalty_points_redeemed',
            'category_label' => 'Penukaran Poin Loyalitas',
            'amount' => $amount,
            'description' => "Poin ditukar pesanan {$order->order_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['points_liability'], 'debit' => $amount],
            ['account_code' => self::ACCOUNTS['revenue'], 'credit' => $amount],
        ], "Jurnal poin ditukar {$order->order_number}");
    }

    /**
     * Event: subsidi ongkir ditanggung merchant (saat order lunas, T06.10/T06.11) →
     * Debit Beban Pengiriman, Kredit Bank.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postShippingSubsidy(Order $order): ?array
    {
        $amount = $this->round((float) ($order->shipping_subsidy ?? 0));

        if ($amount <= 0) {
            return null;
        }

        $container = $this->container('order_shipping_subsidy', $order->order_number, [
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'shipping_subsidy',
            'category_label' => 'Subsidi Ongkir Ditanggung',
            'amount' => $amount,
            'description' => "Subsidi ongkir pesanan {$order->order_number}",
        ]);

        return $this->journal->post($container, [
            ['account_code' => self::ACCOUNTS['shipping_expense'], 'debit' => $amount],
            ['account_code' => self::ACCOUNTS['bank'], 'credit' => $amount],
        ], "Jurnal subsidi ongkir {$order->order_number}");
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
     * Event: transaksi keuangan manual (buku kas) → jurnal double-entry (T34.7).
     *
     * Pemetaan akun per kategori operasional:
     * - order_payment  : Debit Kas/Bank, Kredit Pendapatan
     * - capital_deposit: Debit Kas/Bank, Kredit Modal Pemilik
     * - restock        : Debit Persediaan, Kredit Kas/Bank
     * - shipping_fee   : Debit Beban Pengiriman, Kredit Kas/Bank
     * - gateway_fee    : Debit Beban Gateway, Kredit Kas/Bank
     * - operational    : Debit Beban Operasional, Kredit Kas/Bank
     * - vendor_payment : Debit Utang Usaha, Kredit Kas/Bank
     * - refund         : Debit Pendapatan, Kredit Kas/Bank
     *
     * Transaksi itu sendiri menjadi kontainer jurnal sehingga posting idempoten.
     *
     * @return array<int, \App\Models\FinancialLedgerEntry>|null
     */
    public function postManualTransaction(Transaction $transaction): ?array
    {
        $amount = $this->round((float) $transaction->amount);

        if ($amount <= 0) {
            return null;
        }

        $settlement = $this->settlementCode($transaction->payment_method);
        if ($transaction->financialAccount) {
            $accountCoa = $transaction->financialAccount->chartOfAccount?->account_code;
            $methodIsBank = $settlement === self::ACCOUNTS['bank'];
            $accountIsBank = $transaction->financialAccount->type === 'bank' || $accountCoa === self::ACCOUNTS['bank'];

            // Jika tipe akun dan metode pembayaran selaras, gunakan COA dari rekening spesifik
            if ($accountCoa && $methodIsBank === $accountIsBank) {
                $settlement = $accountCoa;
            }
        }

        $lines = match ($transaction->category) {
            'order_payment' => [
                ['account_code' => $settlement, 'debit' => $amount],
                ['account_code' => self::ACCOUNTS['revenue'], 'credit' => $amount],
            ],
            'capital_deposit' => [
                ['account_code' => $settlement, 'debit' => $amount],
                ['account_code' => self::ACCOUNTS['equity'], 'credit' => $amount],
            ],
            'restock' => [
                ['account_code' => self::ACCOUNTS['inventory'], 'debit' => $amount],
                ['account_code' => $settlement, 'credit' => $amount],
            ],
            'shipping_fee' => [
                ['account_code' => self::ACCOUNTS['shipping_expense'], 'debit' => $amount],
                ['account_code' => $settlement, 'credit' => $amount],
            ],
            'gateway_fee' => [
                ['account_code' => self::ACCOUNTS['gateway_fee'], 'debit' => $amount],
                ['account_code' => $settlement, 'credit' => $amount],
            ],
            'vendor_payment' => [
                ['account_code' => self::ACCOUNTS['payable'], 'debit' => $amount],
                ['account_code' => $settlement, 'credit' => $amount],
            ],
            'refund' => [
                ['account_code' => self::ACCOUNTS['revenue'], 'debit' => $amount],
                ['account_code' => $settlement, 'credit' => $amount],
            ],
            default => $transaction->type === 'income'
                ? [
                    ['account_code' => $settlement, 'debit' => $amount],
                    ['account_code' => self::ACCOUNTS['revenue'], 'credit' => $amount],
                ]
                : [
                    ['account_code' => self::ACCOUNTS['operating_expense'], 'debit' => $amount],
                    ['account_code' => $settlement, 'credit' => $amount],
                ],
        };

        return $this->journal->post($transaction, $lines, "Jurnal transaksi {$transaction->transaction_number}");
    }

    /**
     * Kode akun penyelesaian kas/bank berdasarkan metode pembayaran.
     * Transaksi digital customer (Midtrans, VA, QRIS, e-wallet, dsb.) dipetakan ke COA 1210 (Kliring Midtrans).
     * Transaksi internal/manual bank dipetakan ke COA 1200 (Bank Operasional).
     * Transaksi tunai kasir / COD dipetakan ke COA 1100 (Kas Toko).
     */
    private function settlementCode(?string $method): string
    {
        $method = strtolower((string) $method);

        // Metode pembayaran digital customer via Midtrans -> Kliring Midtrans (COA 1210)
        foreach (['midtrans', 'qris', 'gopay', 'shopeepay', 'va', 'credit_card', 'cc'] as $needle) {
            if (str_contains($method, $needle)) {
                return self::ACCOUNTS['gateway_escrow'];
            }
        }

        // Transfer bank langsung / rekening operasional internal -> Bank Operasional (COA 1200)
        foreach (['transfer', 'bank', 'bca', 'mandiri', 'bni', 'bri'] as $needle) {
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
        // Kolom `transactions.reference_id` bertipe bigint. Nomor dokumen berbasis
        // teks (mis. GRN-.../INV-...) disimpan pada `reference_code` agar tidak
        // melanggar integritas tipe di MySQL (strict) — sebelumnya gagal senyap.
        $isNumeric = is_numeric($referenceId);

        return Transaction::firstOrCreate(
            [
                'reference_type' => $referenceType,
                'reference_id' => $isNumeric ? (int) $referenceId : null,
                'reference_code' => $isNumeric ? null : (string) $referenceId,
            ],
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
