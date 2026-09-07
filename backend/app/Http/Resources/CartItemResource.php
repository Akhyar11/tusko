<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
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
            'cart_id' => $this->cart_id,
            'product_id' => $this->product_id,
            'product' => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'slug' => $this->product?->slug,
                'price' => (float) ($this->product?->price ?? 0),
                'stock' => (int) ($this->product?->stock ?? 0),
                'image_url' => $this->product?->image_url,
                'active' => (bool) ($this->product?->active ?? true),
            ],
            'quantity' => (int) $this->quantity,
            'notes' => $this->notes,
            'subtotal' => (float) $this->subtotal,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
