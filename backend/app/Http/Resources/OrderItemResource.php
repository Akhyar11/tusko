<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_slug' => $this->product_slug,
            'product_image' => $this->product_image,
            'product_price' => (float) $this->product_price,
            'product_weight' => (float) $this->product_weight,
            'quantity' => (int) $this->quantity,
            'subtotal' => (float) $this->subtotal,
            'notes' => $this->notes,
        ];
    }
}
