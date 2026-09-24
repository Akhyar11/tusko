<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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

    /**
     * Simpan nilai satu grup (hanya key grup tsb; catat activity_logs G9 tanpa secret).
     */
    public function update(Request $request, string $group): JsonResponse
    {
        if (!in_array($group, SettingsRegistry::groupNames(), true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grup pengaturan tidak ditemukan.',
            ], 404);
        }

        $rules = SettingsRegistry::rulesForGroup($group);
        $all = $request->all();

        // Validator memperlakukan titik sebagai nesting; gunakan alias aman lalu petakan balik.
        $aliasRules = [];
        $aliasToKey = [];
        $aliasInput = [];

        foreach ($rules as $key => $rule) {
            if (!array_key_exists($key, $all)) {
                continue;
            }

            $alias = str_replace('.', '__', $key);
            $aliasRules[$alias] = $rule;
            $aliasToKey[$alias] = $key;
            $aliasInput[$alias] = $all[$key];
        }

        $validator = Validator::make($aliasInput, $aliasRules);

        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->messages() as $alias => $messages) {
                $errors[$aliasToKey[$alias] ?? $alias] = $messages;
            }

            throw ValidationException::withMessages($errors);
        }

        $validated = [];
        foreach ($validator->validated() as $alias => $value) {
            $validated[$aliasToKey[$alias]] = $value;
        }

        $changes = DB::transaction(fn () => $this->settings->setGroup(
            $group,
            $validated,
            $request->user()?->id,
            $request->ip()
        ));

        return response()->json([
            'status' => 'success',
            'message' => count($changes) . ' pengaturan diperbarui.',
            'data' => [
                'group' => $group,
                'values' => $this->settings->maskedGroup($group),
                'changed' => array_keys($changes),
            ],
        ]);
    }
}
