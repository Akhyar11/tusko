<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function __construct(private readonly SettingsService $settings)
    {
    }

    /**
     * Daftar seluruh grup pengaturan beserta nilainya (secret dimask).
     */
    public function index(): JsonResponse
    {
        $groups = [];

        foreach (SettingsRegistry::groupNames() as $group) {
            $groups[] = [
                'group' => $group,
                'label' => SettingsRegistry::groupLabel($group),
                'description' => SettingsRegistry::groupDescription($group),
                'values' => $this->settings->maskedGroup($group),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => ['groups' => $groups],
        ]);
    }

    /**
     * Nilai satu grup pengaturan (secret dimask) + metadata registry.
     */
    public function show(string $group): JsonResponse
    {
        if (!in_array($group, SettingsRegistry::groupNames(), true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grup pengaturan tidak ditemukan.',
            ], 404);
        }

        $fields = [];
        foreach (SettingsRegistry::keys($group) as $key => $config) {
            $fields[] = [
                'key' => $key,
                'type' => $config['type'],
                'is_secret' => $config['is_secret'],
                'label' => $config['label'],
                'description' => $config['description'],
                'options' => $config['options'] ?? [],
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'group' => $group,
                'label' => SettingsRegistry::groupLabel($group),
                'description' => SettingsRegistry::groupDescription($group),
                'values' => $this->settings->maskedGroup($group),
                'fields' => $fields,
            ],
        ]);
    }
}
