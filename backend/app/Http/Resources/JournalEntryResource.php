<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalEntryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_id' => $this->transaction_id,
            'transaction_number' => $this->transaction?->transaction_number,
            'chart_of_account_id' => $this->chart_of_account_id,
            'account_code' => $this->account?->account_code,
            'account_name' => $this->account?->account_name,
            'account_type' => $this->account?->account_type,
            'debit' => (float) $this->debit,
            'credit' => (float) $this->credit,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
