<?php

namespace Database\Seeders;

use App\Models\Integration;
use App\Services\Settings\SettingsRegistry;
use Illuminate\Database\Seeder;

/**
 * SettingsSeeder — mengisi default konfigurasi sistem dari registry (T36.3).
 *
 * Idempotent & TIDAK menimpa nilai yang sudah diubah admin (firstOrCreate).
 */
class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SettingsRegistry::groups() as $group => $definition) {
            foreach ($definition['keys'] as $key => $config) {
                if ($config['default'] === null) {
                    continue;
                }

                Integration::firstOrCreate(
                    ['key' => $key],
                    [
                        'value' => $this->serialize($config['default']),
                        'group' => $group,
                        'is_secret' => $config['is_secret'],
                    ]
                );
            }
        }
    }

    private function serialize(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }
}
