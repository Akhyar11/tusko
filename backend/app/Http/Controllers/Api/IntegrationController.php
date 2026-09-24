<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\IntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    /**
     * Daftar konfigurasi integrasi (nilai rahasia disamarkan).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Integration::query();

        if ($request->filled('group')) {
            $query->where('group', $request->query('group'));
        }

        $items = $query->orderBy('group')->orderBy('key')->get()->map(function (Integration $integration) {
            $isConfigured = $integration->value !== null && $integration->value !== '';

            return [
                'key' => $integration->key,
                'group' => $integration->group,
                'is_secret' => $integration->is_secret,
                'is_configured' => $isConfigured,
                'value' => $integration->is_secret
                    ? ($isConfigured ? '********' : null)
                    : $integration->value,
            ];
        });

        return response()->json([
            'data' => $items,
            'groups' => Integration::query()->distinct()->pluck('group')->values(),
        ]);
    }

    /**
     * Simpan/perbarui konfigurasi integrasi (bulk upsert).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'integrations' => 'required|array|min:1',
            'integrations.*.key' => 'required|string|max:150',
            'integrations.*.value' => 'nullable',
            'integrations.*.group' => 'nullable|string|max:100',
            'integrations.*.is_secret' => 'nullable|boolean',
        ]);

        foreach ($validated['integrations'] as $item) {
            $this->integrations->set(
                $item['key'],
                $item['value'] ?? null,
                $item['group'] ?? 'general',
                (bool) ($item['is_secret'] ?? false)
            );
        }

        return response()->json([
            'message' => 'Konfigurasi integrasi berhasil disimpan.',
        ]);
    }
}
