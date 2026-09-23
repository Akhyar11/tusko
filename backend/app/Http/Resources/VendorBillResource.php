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
            'outstanding_amount' => max(0, (float) $this->amount - (float) $this->paid_amount),
            'status' => $this->status,
            'bill_date' => $this->bill_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'invoice_file_url' => $this->invoice_file_path
                ? \Illuminate\Support\Facades\Storage::disk(config('filesystems.default', 'public'))->url($this->invoice_file_path)
                : null,
            'invoice_file_name' => $this->invoice_file_name,
            'invoice_file_mime' => $this->invoice_file_mime,
            'has_invoice' => (bool) $this->invoice_file_path,
            'items' => $this->whenLoaded('receivingNote', function () {
                return $this->receivingNote->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product?->name,
                        'variant_name' => $item->variant?->variant_name,
                        'sku' => $item->variant?->sku ?: $item->product?->sku,
                        'accepted_quantity' => (int) $item->accepted_quantity,
                        'rejected_quantity' => (int) $item->rejected_quantity,
                        'unit_cost' => (float) $item->unit_cost,
                        'subtotal' => (float) $item->accepted_quantity * (float) $item->unit_cost,
                    ];
                })->values();
            }),
            'payments' => VendorBillPaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
