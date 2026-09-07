<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'invoice_number' => $this->order_number,
            'status' => $this->status,
            'tracking_number' => $this->tracking_number,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'payment_channel' => $this->payment_channel,
            'va_number' => $this->va_number,
            'midtrans_snap_token' => $this->midtrans_snap_token,
            'midtrans_transaction_id' => $this->midtrans_transaction_id,
            'midtrans_pdf_url' => $this->midtrans_pdf_url,
            'payment_proof' => $this->payment_proof ? asset('storage/' . $this->payment_proof) : null,
            'address' => [
                'recipient_name' => $this->recipient_name,
                'phone' => $this->phone ?: $this->phone_number,
                'phone_number' => $this->phone_number ?: $this->phone,
                'full_address' => $this->full_address,
                'province' => $this->province,
                'city' => $this->city,
                'district' => $this->district,
                'postal_code' => $this->postal_code,
                'label' => $this->address_label,
            ],
            'expedition' => [
                'id' => $this->expedition_id,
                'name' => $this->expedition_name,
                'service' => $this->expedition_service,
                'etd' => $this->expedition_etd,
                'tracking_number' => $this->tracking_number,
                'shipping_cost' => (float) $this->shipping_cost,
            ],
            'totals' => [
                'subtotal' => (float) $this->subtotal,
                'shipping_cost' => (float) $this->shipping_cost,
                'insurance_cost' => (float) $this->insurance_cost,
                'service_fee' => (float) $this->service_fee,
                'discount_amount' => (float) $this->discount_amount,
                'grand_total' => (float) $this->grand_total,
                'total_weight' => (float) $this->total_weight,
            ],
            'coupon_code' => $this->coupon_code,
            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'transactions' => TransactionResource::collection($this->whenLoaded('transactions')),
            'flags' => [
                'can_pay' => $this->status === 'pending' && $this->payment_status === 'pending',
                'can_cancel' => in_array($this->status, ['pending', 'processing']),
                'can_confirm_payment' => $this->payment_method === 'manual_transfer' && $this->payment_status === 'pending',
                'is_completed' => $this->status === 'completed',
            ],
            'timestamps' => [
                'created_at' => $this->created_at?->toISOString(),
                'expires_at' => $this->expires_at?->toISOString(),
                'paid_at' => $this->paid_at?->toISOString(),
                'shipped_at' => $this->shipped_at?->toISOString(),
                'completed_at' => $this->completed_at?->toISOString(),
            ],
        ];
    }
}
