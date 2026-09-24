<?php

namespace Tests\Feature;

use App\Services\Settings\SettingsRegistry;
use Tests\TestCase;

class SettingsRegistryTest extends TestCase
{
    public function test_registry_contains_expected_groups(): void
    {
        $this->assertSame(
            ['store', 'shipping', 'payment', 'storage', 'loyalty', 'notification', 'feature_flags', 'security'],
            SettingsRegistry::groupNames()
        );

        foreach (SettingsRegistry::groupNames() as $group) {
            $this->assertNotEmpty(SettingsRegistry::groupLabel($group));
            $this->assertNotEmpty(SettingsRegistry::groupDescription($group));
        }
    }

    public function test_registry_entries_are_complete_and_unique(): void
    {
        $keys = SettingsRegistry::keys();
        $this->assertNotEmpty($keys);

        $expectedCount = 0;
        foreach (SettingsRegistry::groups() as $group) {
            $expectedCount += count($group['keys']);
        }
        $this->assertCount($expectedCount, $keys, 'Terdapat key duplikat antar grup.');

        foreach ($keys as $key => $config) {
            $this->assertArrayHasKey('type', $config, $key);
            $this->assertArrayHasKey('default', $config, $key);
            $this->assertArrayHasKey('rule', $config, $key);
            $this->assertArrayHasKey('is_secret', $config, $key);
            $this->assertNotEmpty($config['label'] ?? null, $key);
            $this->assertNotEmpty($config['description'] ?? null, $key);
            $this->assertIsString($config['rule'], $key);
            $this->assertNotSame('', trim($config['rule']), $key);
            $this->assertIsBool($config['is_secret'], $key);
        }
    }

    public function test_group_of_key_is_consistent_and_secret_flag_matches_type(): void
    {
        foreach (SettingsRegistry::groups() as $group => $definition) {
            foreach ($definition['keys'] as $key => $config) {
                $this->assertSame($group, SettingsRegistry::groupOf($key), $key);
                $this->assertSame($group, explode('.', $key, 2)[0], $key);
                $this->assertSame($config['is_secret'], SettingsRegistry::isSecret($key), $key);

                if ($config['type'] === 'secret') {
                    $this->assertTrue($config['is_secret'], "Key {$key} bertipe secret wajib is_secret=true.");
                }
            }
        }
    }

    public function test_rules_and_defaults_are_available(): void
    {
        $rules = SettingsRegistry::rulesForGroup('shipping');
        $this->assertArrayHasKey('shipping.base_url', $rules);
        $this->assertArrayHasKey('shipping.rate_cache_ttl', $rules);

        $this->assertSame(3600, SettingsRegistry::default('shipping.rate_cache_ttl'));
        $this->assertSame(12, SettingsRegistry::default('loyalty.points_expiry_months'));
        $this->assertNull(SettingsRegistry::default('unknown.key'));
        $this->assertNull(SettingsRegistry::groupOf('unknown.key'));
    }
}
