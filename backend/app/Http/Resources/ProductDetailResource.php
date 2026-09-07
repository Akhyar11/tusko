<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Fetch up to 4 related products in the same category
        $relatedProducts = Product::where('category_id', $this->category_id)
            ->where('id', '!=', $this->id)
            ->where('active', true)
            ->with(['images'])
            ->limit(4)
            ->get();

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
                'parent' => $this->category?->parent ? [
                    'id' => $this->category->parent->id,
                    'name' => $this->category->parent->name,
                    'slug' => $this->category->parent->slug,
                ] : null,
            ],
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'stock' => (int) $this->stock,
            'stock_minimum' => (int) $this->stock_minimum,
            'image_url' => $this->image_url,
            'active' => (bool) $this->active,
            'is_low_stock' => $this->isLowStock(),
            'is_out_of_stock' => $this->isOutOfStock(),
            'images' => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'image_url' => $img->image_url,
                'sort_order' => $img->sort_order,
            ]),
            'related_products' => ProductResource::collection($relatedProducts),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
