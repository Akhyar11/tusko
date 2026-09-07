<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpeditionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $weight = (float) ($request->query('weight') ?: 1.0);
        $chargedWeight = max(1, (int) ceil($weight));

        // Dynamic cost calculation based on weight if provided
        $baseCost = (float) $this->base_cost;
        $calculatedCost = (float) $this->cost;

        if ($weight > 1.0) {
            $baseCost = (float) ($this->base_cost * $chargedWeight);
            $calculatedCost = $this->is_free ? 0.0 : (float) ($this->cost * $chargedWeight);
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'service' => $this->service,
            'category' => $this->category,
            'etd' => $this->etd,
            'base_cost' => $baseCost,
            'cost' => $calculatedCost,
            'is_free' => (bool) $this->is_free,
            'is_active' => (bool) $this->is_active,
            'is_default' => (bool) $this->is_default,
            'rate_type' => $this->rate_type ?: 'per_kg',
            'service_grade' => $this->service_grade,
            'badge' => $this->badge,
            'description' => $this->description,
            'tracking_support' => (bool) $this->tracking_support,
            'cod_support' => (bool) $this->cod_support,
            'weight_calculated_kg' => $chargedWeight,
        ];
    }
}
