<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'category_id' => $this->category_id,
            'category' => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ],
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku ?: ('TSK-SKU-' . str_pad((string) $this->id, 5, '0', STR_PAD_LEFT)),
            'description' => $this->description,
            'price' => (float) $this->price,
            'original_price' => $this->original_price ? (float) $this->original_price : null,
            'discount_percentage' => (int) $this->discount_percentage,
            'cost_price' => (float) ($this->cost_price ?: round((float) $this->price * 0.65)),
            'profit_margin' => (float) $this->profit_margin,
            'stock' => (int) $this->stock,
            'stock_minimum' => (int) $this->effective_stock_minimum,
            'min_stock' => (int) $this->effective_stock_minimum,
            'weight' => (int) ($this->weight ?: 500),
            'warehouse_bin' => $this->warehouse_bin ?: 'Gudang Utama',
            'image_url' => $this->image_url,
            'active' => (bool) $this->active,
            'status' => $this->status ?: ($this->active ? 'active' : 'inactive'),
            'stock_status' => $this->isOutOfStock() ? 'out_of_stock' : ($this->isLowStock() ? 'low' : 'safe'),
            'is_low_stock' => $this->isLowStock(),
            'is_out_of_stock' => $this->isOutOfStock(),
            'specifications' => $this->specifications ?: [],
            'variants' => $this->variants ?: [],
            'rating' => (float) ($this->rating ?: 5.0),
            'sold_count' => (int) ($this->sold_count ?: 0),
            'images' => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'image_url' => $img->image_url,
                'sort_order' => $img->sort_order,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
