<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorBillResource extends JsonResource
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
            'bill_number' => $this->bill_number,
            'vendor_id' => $this->vendor_id,
            'vendor_name' => $this->vendor?->company_name,
            'purchase_order_id' => $this->purchase_order_id,
            'po_number' => $this->purchaseOrder?->po_number,
            'grn_id' => $this->grn_id,
            'grn_number' => $this->receivingNote?->grn_number,
            'amount' => (float) $this->amount,
            'paid_amount' => (float) $this->paid_amount,
            'status' => $this->status,
            'bill_date' => $this->bill_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
