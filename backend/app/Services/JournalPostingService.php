<?php

namespace App\Services;

use App\Exceptions\UnbalancedJournalException;
use App\Models\ChartOfAccount;
use App\Models\FinancialAccount;
use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * JournalPostingService — mesin jurnal double-entry (T16.4).
 *
 * - Posting seimbang (total debit = total kredit).
 * - Idempoten: transaksi yang sudah punya jurnal tidak diposting ulang.
 * - Memperbarui saldo `financial_accounts` sesuai tipe transaksi.
 */
class JournalPostingService
{
    /**
     * Posting jurnal seimbang untuk sebuah transaksi.
     *
     * @param  array<int, array{account_code?: string, chart_of_account_id?: int, debit?: float|int, credit?: float|int, notes?: string}>  $lines
     * @return array<int, FinancialLedgerEntry>
     */
    public function post(Transaction $transaction, array $lines, ?string $notes = null): array
    {
        if ($lines === []) {
            throw new InvalidArgumentException('Jurnal tidak boleh kosong.');
        }

        return DB::transaction(function () use ($transaction, $lines, $notes) {
            $locked = Transaction::query()->whereKey($transaction->id)->lockForUpdate()->firstOrFail();

            $existing = FinancialLedgerEntry::where('transaction_id', $locked->id)->get();
            if ($existing->isNotEmpty()) {
                return $existing->all();
            }

            [$resolved, $totalDebit, $totalCredit] = $this->resolveLines($lines);

            if ($totalDebit !== $totalCredit) {
                throw new UnbalancedJournalException($totalDebit, $totalCredit);
            }

            $entries = [];
            foreach ($resolved as $line) {
                $entries[] = FinancialLedgerEntry::create([
                    'transaction_id' => $locked->id,
                    'chart_of_account_id' => $line['chart_of_account_id'],
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'notes' => $line['notes'] ?? $notes,
                ]);
            }

            $this->applyFinancialAccountMovement($locked);

            return $entries;
        });
    }

    /**
     * Apakah transaksi sudah memiliki jurnal.
     */
    public function isPosted(Transaction $transaction): bool
    {
        return FinancialLedgerEntry::where('transaction_id', $transaction->id)->exists();
    }

    /**
     * Resolusi & validasi baris jurnal menjadi pasangan akun + nilai.
     *
     * @param  array<int, array{account_code?: string, chart_of_account_id?: int, debit?: float|int, credit?: float|int, notes?: string}>  $lines
     * @return array{0: array<int, array{chart_of_account_id: int, debit: float, credit: float, notes: ?string}>, 1: float, 2: float}
     */
    private function resolveLines(array $lines): array
    {
        $resolved = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($lines as $line) {
            $debit = $this->round((float) ($line['debit'] ?? 0));
            $credit = $this->round((float) ($line['credit'] ?? 0));

            if ($debit < 0 || $credit < 0) {
                throw new InvalidArgumentException('Nilai debit/kredit tidak boleh negatif.');
            }

            if ($debit > 0 && $credit > 0) {
                throw new InvalidArgumentException('Satu baris jurnal hanya boleh berisi debit ATAU kredit.');
            }

            if ($debit === 0.0 && $credit === 0.0) {
                throw new InvalidArgumentException('Setiap baris jurnal harus memiliki nilai debit atau kredit.');
            }

            $account = $this->resolveAccount($line);

            $resolved[] = [
                'chart_of_account_id' => $account->id,
                'debit' => $debit,
                'credit' => $credit,
                'notes' => $line['notes'] ?? null,
            ];

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        return [$resolved, $this->round($totalDebit), $this->round($totalCredit)];
    }

    /**
     * @param  array{account_code?: string, chart_of_account_id?: int}  $line
     */
    private function resolveAccount(array $line): ChartOfAccount
    {
        if (!empty($line['chart_of_account_id'])) {
            $account = ChartOfAccount::find($line['chart_of_account_id']);
        } elseif (!empty($line['account_code'])) {
            $account = ChartOfAccount::where('account_code', $line['account_code'])->first();
        } else {
            throw new InvalidArgumentException('Baris jurnal harus menyertakan chart_of_account_id atau account_code.');
        }

        if (!$account) {
            throw new InvalidArgumentException('Akun jurnal (chart of account) tidak ditemukan.');
        }

        return $account;
    }

    /**
     * Sesuaikan saldo rekening kas/bank berdasarkan tipe transaksi.
     */
    private function applyFinancialAccountMovement(Transaction $transaction): void
    {
        if (!$transaction->financial_account_id) {
            return;
        }

        $account = FinancialAccount::query()
            ->whereKey($transaction->financial_account_id)
            ->lockForUpdate()
            ->first();

        if (!$account) {
            return;
        }

        $amount = (float) ($transaction->net_amount ?? $transaction->amount);
        $delta = $transaction->type === 'income' ? $amount : -$amount;

        $account->current_balance = $this->round((float) $account->current_balance + $delta);
        $account->save();
    }

    private function round(float $value): float
    {
        return round($value, 2);
    }
}
