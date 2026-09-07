<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
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
            'transaction_number' => $this->transaction_number,
            'order_id' => $this->order_id,
            'order_number' => $this->order?->order_number,
            'type' => $this->type,
            'category' => $this->category,
            'category_label' => $this->category_label,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'customer_name' => $this->customer_name,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
