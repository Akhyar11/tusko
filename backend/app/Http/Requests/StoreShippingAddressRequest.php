<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShippingAddressRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare data for validation.
     */
    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('lat') && !$this->has('latitude')) {
            $merge['latitude'] = $this->input('lat');
        }
        if ($this->has('lng') && !$this->has('longitude')) {
            $merge['longitude'] = $this->input('lng');
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'min:2', 'max:100'],
            'phone' => ['required', 'string', 'min:8', 'max:30'],
            'full_address' => ['required', 'string', 'min:5'],
            'district' => ['nullable', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:10'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string', 'max:255'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'recipient_name.required' => 'Nama penerima wajib diisi.',
            'phone.required' => 'Nomor telepon wajib diisi.',
            'full_address.required' => 'Alamat lengkap wajib diisi.',
            'city.required' => 'Kota / Kabupaten wajib diisi.',
            'province.required' => 'Provinsi wajib diisi.',
            'postal_code.required' => 'Kode pos wajib diisi.',
        ];
    }
}
