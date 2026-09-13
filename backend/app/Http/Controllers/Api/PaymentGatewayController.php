<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewaySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentGatewayController extends Controller
{
    /**
     * Get payment gateway settings.
     * Public fields are safe to be exposed to storefront.
     */
    public function index(): JsonResponse
    {
        $setting = PaymentGatewaySetting::first() ?? PaymentGatewaySetting::create([
            'gateway_name' => 'midtrans',
            'payment_mode' => 'midtrans_popup',
            'is_production' => false,
            'merchant_id' => config('midtrans.merchant_id'),
            'client_key' => config('midtrans.client_key'),
            'server_key' => config('midtrans.server_key'),
            'expiry_duration_hours' => 24,
            'enable_va' => true,
            'enable_qris' => true,
            'enable_cc' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan payment gateway berhasil diambil.',
            'data' => [
                'id' => $setting->id,
                'gateway_name' => $setting->gateway_name,
                'payment_mode' => $setting->payment_mode, // 'midtrans_popup' | 'store_custom' | 'midtrans_redirect'
                'is_production' => (bool) $setting->is_production,
                'merchant_id' => $setting->merchant_id,
                'client_key' => $setting->client_key,
                'expiry_duration_hours' => (int) $setting->expiry_duration_hours,
                'enable_va' => (bool) $setting->enable_va,
                'enable_qris' => (bool) $setting->enable_qris,
                'enable_cc' => (bool) $setting->enable_cc,
                'is_active' => (bool) $setting->is_active,
                // Masked server key for admin security
                'has_server_key' => !empty($setting->server_key),
                'snap_script_url' => $setting->is_production
                    ? 'https://app.midtrans.com/snap/snap.js'
                    : 'https://app.sandbox.midtrans.com/snap/snap.js',
            ],
        ]);
    }

    /**
     * Update payment gateway settings (Admin ERP).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_mode' => ['required', 'string', 'in:midtrans_popup,store_custom,midtrans_redirect'],
            'is_production' => ['nullable', 'boolean'],
            'merchant_id' => ['nullable', 'string', 'max:100'],
            'client_key' => ['nullable', 'string', 'max:255'],
            'server_key' => ['nullable', 'string', 'max:255'],
            'expiry_duration_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
            'enable_va' => ['nullable', 'boolean'],
            'enable_qris' => ['nullable', 'boolean'],
            'enable_cc' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $setting = PaymentGatewaySetting::first() ?? new PaymentGatewaySetting();

        $setting->payment_mode = $validated['payment_mode'];
        if (array_key_exists('is_production', $validated)) {
            $setting->is_production = (bool) $validated['is_production'];
        }
        if (isset($validated['merchant_id'])) {
            $setting->merchant_id = $validated['merchant_id'];
        }
        if (isset($validated['client_key'])) {
            $setting->client_key = $validated['client_key'];
        }
        if (!empty($validated['server_key'])) {
            $setting->server_key = $validated['server_key'];
        }
        if (isset($validated['expiry_duration_hours'])) {
            $setting->expiry_duration_hours = (int) $validated['expiry_duration_hours'];
        }
        if (array_key_exists('enable_va', $validated)) {
            $setting->enable_va = (bool) $validated['enable_va'];
        }
        if (array_key_exists('enable_qris', $validated)) {
            $setting->enable_qris = (bool) $validated['enable_qris'];
        }
        if (array_key_exists('enable_cc', $validated)) {
            $setting->enable_cc = (bool) $validated['enable_cc'];
        }
        if (array_key_exists('is_active', $validated)) {
            $setting->is_active = (bool) $validated['is_active'];
        }

        $setting->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan payment gateway berhasil diperbarui.',
            'data' => [
                'id' => $setting->id,
                'gateway_name' => $setting->gateway_name,
                'payment_mode' => $setting->payment_mode,
                'is_production' => (bool) $setting->is_production,
                'merchant_id' => $setting->merchant_id,
                'client_key' => $setting->client_key,
                'expiry_duration_hours' => (int) $setting->expiry_duration_hours,
                'enable_va' => (bool) $setting->enable_va,
                'enable_qris' => (bool) $setting->enable_qris,
                'enable_cc' => (bool) $setting->enable_cc,
                'is_active' => (bool) $setting->is_active,
                'has_server_key' => !empty($setting->server_key),
                'snap_script_url' => $setting->is_production
                    ? 'https://app.midtrans.com/snap/snap.js'
                    : 'https://app.sandbox.midtrans.com/snap/snap.js',
            ],
        ]);
    }
}
