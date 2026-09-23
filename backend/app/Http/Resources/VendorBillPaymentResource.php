<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorBillPaymentResource extends JsonResource
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
            'vendor_bill_id' => $this->vendor_bill_id,
            'amount' => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'reference_number' => $this->reference_number,
            'paid_at' => $this->paid_at?->toDateString(),
            'notes' => $this->notes,
            'proof_file_url' => $this->proof_file_path
                ? \Illuminate\Support\Facades\Storage::disk(config('filesystems.default', 'public'))->url($this->proof_file_path)
                : null,
            'proof_file_name' => $this->proof_file_name,
            'proof_file_mime' => $this->proof_file_mime,
            'created_by' => $this->creator?->name,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
