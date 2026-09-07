<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmManualPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_proof' => ['required', 'file', 'mimes:jpeg,png,jpg,pdf,webp', 'max:5120'],
            'bank_name' => ['nullable', 'string', 'max:50'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
            'transfer_amount' => ['nullable', 'numeric', 'min:0'],
            'transferred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_proof.required' => 'Bukti transfer pembayaran wajib diunggah.',
            'payment_proof.file' => 'Bukti transfer harus berupa file dokumen atau gambar yang valid.',
            'payment_proof.mimes' => 'Format bukti transfer harus berupa JPEG, PNG, JPG, WEBP, atau PDF.',
            'payment_proof.max' => 'Ukuran file bukti transfer maksimal 5 MB.',
        ];
    }
}
