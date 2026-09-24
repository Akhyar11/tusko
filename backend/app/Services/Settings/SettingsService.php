<?php

namespace App\Services\Settings;

use App\Services\ActivityLogService;
use App\Services\IntegrationService;

/**
 * SettingsService — baca/tulis konfigurasi per grup (T36.2).
 *
 * - Cast nilai sesuai tipe registry.
 * - Mask nilai secret saat dibaca untuk admin.
 * - Deteksi perubahan & catat `activity_logs` (G9) TANPA nilai secret.
 * - Resolusi default dari registry bila key belum diisi.
 */
class SettingsService
{
    public const SECRET_MASK = '********';

    public function __construct(
        private readonly IntegrationService $integrations,
        private readonly ActivityLogService $activityLog
    ) {
    }

    /**
     * Nilai mentah (ter-cast) sebuah key; fallback ke default registry.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        if (!SettingsRegistry::has($key)) {
            return $default;
        }

        $raw = $this->integrations->get($key);

        if ($raw === null || $raw === '') {
            return $default ?? SettingsRegistry::default($key);
        }

        return $this->cast($key, $raw);
    }

    /**
     * Seluruh nilai grup (mentah, termasuk secret) — untuk pemakaian internal.
     *
     * @return array<string, mixed>
     */
    public function all(string $group): array
    {
        $stored = $this->integrations->group($group);
        $result = [];

        foreach (SettingsRegistry::keys($group) as $key => $config) {
            $raw = $stored[$key] ?? null;
            $result[$key] = ($raw === null || $raw === '')
                ? SettingsRegistry::default($key)
                : $this->cast($key, $raw);
        }

        return $result;
    }

    /**
     * Nilai grup dengan secret dimask (untuk respons admin).
     *
     * @return array<string, mixed>
     */
    public function maskedGroup(string $group): array
    {
        $values = $this->all($group);

        foreach ($values as $key => $value) {
            if (SettingsRegistry::isSecret($key)) {
                $values[$key] = ($value === null || $value === '') ? null : self::SECRET_MASK;
            }
        }

        return $values;
    }

    /**
     * Simpan nilai-nilai pada satu grup; hanya key yang terdaftar di grup tsb.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, array{before: mixed, after: mixed}>  perubahan (nilai secret dimask)
     */
    public function setGroup(string $group, array $values, ?int $userId = null, ?string $ipAddress = null): array
    {
        $allowed = SettingsRegistry::keys($group);
        $before = $this->all($group);
        $changes = [];

        foreach ($values as $key => $value) {
            if (!isset($allowed[$key])) {
                continue;
            }

            $isSecret = SettingsRegistry::isSecret($key);
            $typed = $this->cast($key, $value);

            $this->integrations->set($key, $this->serialize($typed), $group, $isSecret);

            if ($this->changed($before[$key] ?? null, $typed)) {
                $changes[$key] = [
                    'before' => $isSecret ? $this->maskIfPresent($before[$key] ?? null) : ($before[$key] ?? null),
                    'after' => $isSecret ? $this->maskIfPresent($typed) : $typed,
                ];
            }
        }

        if ($changes !== []) {
            $this->activityLog->log('settings.updated', null, [
                'group' => $group,
                'changes' => $changes,
            ], $userId, $ipAddress);
        }

        return $changes;
    }

    /**
     * Cast nilai sesuai tipe registry.
     */
    private function cast(string $key, mixed $value): mixed
    {
        $type = SettingsRegistry::get($key)['type'] ?? 'string';

        if ($value === null) {
            return null;
        }

        return match ($type) {
            'integer' => (int) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            default => (string) $value,
        };
    }

    /**
     * Serialisasi nilai untuk disimpan sebagai string di `integrations.value`.
     */
    private function serialize(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }

    private function changed(mixed $before, mixed $after): bool
    {
        return $before !== $after;
    }

    private function maskIfPresent(mixed $value): ?string
    {
        return ($value === null || $value === '') ? null : self::SECRET_MASK;
    }
}
