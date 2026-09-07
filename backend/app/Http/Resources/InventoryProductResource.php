<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = 'safe';
        if ($this->stock <= 0) {
            $status = 'out_of_stock';
        } elseif ($this->isLowStock()) {
            $status = 'low';
        }

        return [
            'id' => $this->id,
            'sku' => $this->sku ?: ('TSK-SKU-' . str_pad((string) $this->id, 5, '0', STR_PAD_LEFT)),
            'name' => $this->name,
            'slug' => $this->slug,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->name,
            'category' => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ],
            'image_url' => $this->image_url ?: ($this->images->first()?->image_url),
            'cost_price' => (float) ($this->cost_price ?: round((float) $this->price * 0.65)),
            'selling_price' => (float) $this->price,
            'price' => (float) $this->price,
            'stock' => (int) $this->stock,
            'stock_minimum' => (int) $this->effective_stock_minimum,
            'min_stock' => (int) $this->effective_stock_minimum,
            'warehouse_bin' => $this->warehouse_bin ?: 'Gudang Utama',
            'last_restock_at' => $this->last_restock_at?->toIso8601String(),
            'status' => $status,
            'is_low_stock' => $this->isLowStock(),
            'is_out_of_stock' => $this->isOutOfStock(),
            'active' => (bool) $this->active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
