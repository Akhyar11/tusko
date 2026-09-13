<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required_with:items', 'integer', 'exists:products,id'],
            'items.*.cart_item_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],

            'shipping_address_id' => ['nullable', 'integer', 'exists:shipping_addresses,id'],
            'recipient_name' => ['required_without:shipping_address_id', 'nullable', 'string', 'max:100'],
            'phone' => ['required_without:shipping_address_id', 'nullable', 'string', 'max:30'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'full_address' => ['required_without:shipping_address_id', 'nullable', 'string'],
            'province' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'address_label' => ['nullable', 'string', 'max:50'],

            'expedition_id' => ['nullable', 'integer', 'exists:expeditions,id'],
            'expedition_name' => ['required_without:expedition_id', 'nullable', 'string', 'max:100'],
            'expedition_service' => ['required_without:expedition_id', 'nullable', 'string', 'max:100'],
            'expedition_etd' => ['nullable', 'string', 'max:50'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],

            'payment_method' => ['nullable', 'string', 'in:midtrans,manual_transfer'],
            'payment_channel' => ['nullable', 'string', 'max:50'],

            'insurance_cost' => ['nullable', 'numeric', 'min:0'],
            'service_fee' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
            'session_id' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_name.required_without' => 'Nama penerima wajib diisi bila tidak memilih alamat tersimpan.',
            'phone.required_without' => 'Nomor telepon wajib diisi bila tidak memilih alamat tersimpan.',
            'full_address.required_without' => 'Alamat lengkap wajib diisi bila tidak memilih alamat tersimpan.',
            'expedition_name.required_without' => 'Nama ekspedisi wajib dipilih.',
            'expedition_service.required_without' => 'Layanan ekspedisi wajib dipilih.',
        ];
    }
}
