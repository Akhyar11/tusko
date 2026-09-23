<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceivingNoteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $warehouse = $this->warehouse;

        return [
            'id' => $this->id,
            'grn_number' => $this->grn_number,
            'purchase_order_id' => $this->purchase_order_id,
            'po_number' => $this->purchaseOrder?->po_number,
            'vendor_id' => $this->purchaseOrder?->vendor_id,
            'vendor_name' => $this->purchaseOrder?->vendor?->company_name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $warehouse
                ? trim($warehouse->name . ' (' . $warehouse->code . ')')
                : null,
            'received_by' => $this->receiver?->name ?? $this->received_by,
            'received_date' => $this->received_date?->toDateString(),
            'delivery_order_number' => $this->delivery_order_number,
            'status' => $this->status,
            'notes' => $this->notes,
            'items' => GoodsReceivingItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
