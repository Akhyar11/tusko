<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderItemResource extends JsonResource
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
            'purchase_order_id' => $this->purchase_order_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_variant_id' => $this->product_variant_id,
            'variant_name' => $this->variant?->variant_name,
            'sku' => $this->variant?->sku ?: $this->product?->sku,
            'ordered_quantity' => (int) $this->ordered_quantity,
            'received_quantity' => (int) $this->received_quantity,
            'unit_price' => (float) $this->unit_price,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
