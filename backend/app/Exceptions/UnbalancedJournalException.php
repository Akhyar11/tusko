<?php

namespace App\Exceptions;

use RuntimeException;

class UnbalancedJournalException extends RuntimeException
{
    public function __construct(
        private readonly float $totalDebit,
        private readonly float $totalCredit
    ) {
        parent::__construct(sprintf(
            'Jurnal tidak seimbang: total debit %.2f != total kredit %.2f.',
            $totalDebit,
            $totalCredit
        ));
    }

    public function totalDebit(): float
    {
        return $this->totalDebit;
    }

    public function totalCredit(): float
    {
        return $this->totalCredit;
    }
}
