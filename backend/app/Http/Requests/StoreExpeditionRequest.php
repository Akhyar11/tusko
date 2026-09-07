<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpeditionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'code' => ['required', 'string', 'min:2', 'max:50'],
            'service' => ['required', 'string', 'min:1', 'max:100'],
            'service_grade' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:50'],
            'etd' => ['required', 'string', 'max:50'],
            'rate_type' => ['nullable', 'string', 'in:per_kg,flat'],
            'rateType' => ['nullable', 'string', 'in:per_kg,flat'],
            'base_cost' => ['nullable', 'numeric', 'min:0'],
            'baseRate' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'is_free' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'isActive' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'isDefault' => ['nullable', 'boolean'],
            'badge' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'tracking_support' => ['nullable', 'boolean'],
            'trackingSupport' => ['nullable', 'boolean'],
            'cod_support' => ['nullable', 'boolean'],
            'codSupport' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Custom validation messages in Indonesian.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama ekspedisi wajib diisi.',
            'name.min' => 'Nama ekspedisi minimal 2 karakter.',
            'code.required' => 'Kode ekspedisi wajib diisi.',
            'service.required' => 'Nama layanan kurir wajib diisi.',
            'etd.required' => 'Estimasi pengiriman (ETD) wajib diisi.',
            'rate_type.in' => 'Tipe tarif harus per_kg atau flat.',
            'rateType.in' => 'Tipe tarif harus per_kg atau flat.',
            'base_cost.numeric' => 'Tarif dasar pengiriman harus berupa angka valid.',
            'cost.numeric' => 'Biaya pengiriman harus berupa angka valid.',
        ];
    }
}
