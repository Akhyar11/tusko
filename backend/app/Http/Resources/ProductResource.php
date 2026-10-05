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
        $allCategories = $this->relationLoaded('categories') ? $this->categories : $this->categories()->get();
        $categoryIds = $allCategories->isNotEmpty()
            ? $allCategories->pluck('id')->values()->all()
            : ($this->category_id ? [$this->category_id] : []);

        // Sumber varian OTORITATIF = tabel `product_variants` (id asli untuk PO/GRN).
        // Atribut tampilan (mis. size/color) tetap diambil dari kolom JSON legacy
        // `products.variants` dan digabung berdasarkan SKU (tanpa duplikasi id virtual).
        $legacyVariants = collect($this->variants ?: []);
        $variantRows = $this->relationLoaded('variants') ? $this->getRelation('variants') : collect();
        $reserved = ['id', 'sku', 'name', 'variant_name', 'price', 'original_price', 'cost_price', 'stock', 'is_active'];
        $jsonBySku = $legacyVariants->keyBy(fn ($v) => strtoupper((string) ($v['sku'] ?? '')));

        $variants = $variantRows->map(function ($row) use ($jsonBySku, $reserved) {
            $json = $jsonBySku->get(strtoupper((string) $row->sku)) ?? [];
            $attrs = collect($json)->except($reserved)->all();

            return array_merge($attrs, [
                'id' => $row->id,
                'sku' => $row->sku,
                'name' => $json['name'] ?? $row->variant_name,
                'variant_name' => $row->variant_name,
                'price' => (float) $row->price,
                'original_price' => $row->original_price !== null ? (float) $row->original_price : null,
                'cost_price' => (float) ($row->current_cogs ?? 0),
                'stock' => (int) $row->stock,
                'is_active' => (bool) $row->is_active,
            ]);
        })->values();

        if ($variants->isEmpty()) {
            $variants = $legacyVariants->values();
        }

        // Turunkan level varian (kode + opsi) dari atribut pada varian untuk UI storefront.
        $attrCodes = $variants
            ->flatMap(fn ($v) => array_keys(array_diff_key($v, array_flip($reserved))))
            ->unique()->values();
        $variantLevels = $attrCodes->map(function ($code) use ($variants) {
            return [
                'name' => ucfirst(str_replace('_', ' ', $code)),
                'code' => $code,
                'options' => $variants->pluck($code)->filter()->unique()->values()->all(),
            ];
        })->values();

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
            ],
            'categories' => $allCategories->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
            ]),
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
            'free_shipping' => (bool) $this->free_shipping,
            'status' => $this->status ?: ($this->active ? 'active' : 'inactive'),
            'stock_status' => $this->isOutOfStock() ? 'out_of_stock' : ($this->isLowStock() ? 'low' : 'safe'),
            'is_low_stock' => $this->isLowStock(),
            'is_out_of_stock' => $this->isOutOfStock(),
            'specifications' => $this->specifications ?: [],
            'variants' => $variants,
            'variant_levels' => $variantLevels,
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
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
