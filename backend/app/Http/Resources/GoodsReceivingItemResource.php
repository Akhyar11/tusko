<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceivingItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $productName = $this->product?->name;
        $variantName = $this->variant?->variant_name;

        if ($productName && $variantName) {
            $productName = trim($productName . ' (' . $variantName . ')');
        }

        return [
            'id' => $this->id,
            'grn_id' => $this->grn_id,
            'product_id' => $this->product_id,
            'product_name' => $productName,
            'product_variant_id' => $this->product_variant_id,
            'variant_name' => $variantName,
            'sku' => $this->variant?->sku ?: $this->product?->sku,
            'accepted_quantity' => (int) $this->accepted_quantity,
            'rejected_quantity' => (int) $this->rejected_quantity,
            'rejection_reason' => $this->rejection_reason,
            'unit_cost' => (float) $this->unit_cost,
            'notes' => $this->notes,
        ];
    }
}
