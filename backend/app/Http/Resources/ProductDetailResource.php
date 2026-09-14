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

        $allCategories = $this->relationLoaded('categories') ? $this->categories : $this->categories()->get();
        $categoryIds = $allCategories->isNotEmpty()
            ? $allCategories->pluck('id')->values()->all()
            : ($this->category_id ? [$this->category_id] : []);

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category_ids' => $categoryIds,
            'vendor_id' => $this->vendor_id,
            'vendor' => $this->vendor ? [
                'id' => $this->vendor->id,
                'code' => $this->vendor->code,
                'company_name' => $this->vendor->company_name,
            ] : null,
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
            'categories' => $allCategories->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
            ]),
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'original_price' => $this->original_price ? (float) $this->original_price : null,
            'discount_percentage' => (int) $this->discount_percentage,
            'cost_price' => (float) ($this->cost_price ?: round((float) $this->price * 0.65)),
            'profit_margin' => (float) $this->profit_margin,
            'stock' => (int) $this->stock,
            'stock_minimum' => (int) $this->stock_minimum,
            'min_stock' => (int) $this->effective_stock_minimum,
            'weight' => (int) ($this->weight ?: 500),
            'warehouse_bin' => $this->warehouse_bin ?: 'Gudang Utama',
            'image_url' => $this->image_url,
            'active' => (bool) $this->active,
            'status' => $this->status ?: ($this->active ? 'active' : 'inactive'),
            'is_low_stock' => $this->isLowStock(),
            'is_out_of_stock' => $this->isOutOfStock(),
            'specifications' => $this->specifications ?: [],
            'variants' => $this->variants ?: [],
            'rating' => (float) ($this->rating ?: 5.0),
            'sold_count' => (int) ($this->sold_count ?: 0),
            'point_type' => $this->point_type ?: 'manual',
            'point_value' => (float) ($this->point_value ?: 0),
            'reward_points' => (int) $this->reward_points,
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
