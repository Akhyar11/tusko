<?php

namespace App\Services;

use App\Models\Integration;

/**
 * IntegrationService — akses konfigurasi integrasi pihak ketiga (T21.1).
 *
 * Nilai disimpan terenkripsi di database (cast `encrypted`) dan diakses via
 * key agar seluruh modul memakai sumber konfigurasi yang sama (G6 — tanpa hardcode).
 */
class IntegrationService
{
    /**
     * Ambil nilai konfigurasi berdasarkan key.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $integration = Integration::where('key', $key)->first();

        if (!$integration || $integration->value === null || $integration->value === '') {
            return $default;
        }

        return $integration->value;
    }

    /**
     * Simpan/perbarui konfigurasi.
     */
    public function set(string $key, mixed $value, string $group = 'general', bool $isSecret = false): Integration
    {
        return Integration::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'group' => $group,
                'is_secret' => $isSecret,
            ]
        );
    }

    /**
     * Ambil seluruh konfigurasi pada satu grup.
     *
     * @return array<string, mixed>
     */
    public function group(string $group): array
    {
        return Integration::where('group', $group)
            ->get()
            ->pluck('value', 'key')
            ->all();
    }

    /**
     * Apakah konfigurasi key tertentu sudah diisi.
     */
    public function isConfigured(string $key): bool
    {
        $value = $this->get($key);

        return $value !== null && $value !== '';
    }
}
