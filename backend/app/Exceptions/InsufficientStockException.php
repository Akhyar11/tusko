<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public function __construct(
        private readonly int $available,
        private readonly int $requested,
        string $message = ''
    ) {
        parent::__construct(
            $message !== ''
                ? $message
                : "Stok tersedia ({$available} unit) tidak mencukupi untuk pengurangan {$requested} unit."
        );
    }

    public function available(): int
    {
        return $this->available;
    }

    public function requested(): int
    {
        return $this->requested;
    }
}
