<?php

namespace App\Services;

/**
 * BiteshipAreaService — pencarian Area ID Biteship (T40.5).
 *
 * Area ID lebih akurat daripada kode pos untuk kalkulasi tarif & tujuan order.
 * Memakai endpoint GET /v1/maps/areas (parameter `input` + `countries`).
 */
class BiteshipAreaService
{
    public function __construct(private readonly BiteshipClient $client)
    {
    }

    public function isConfigured(): bool
    {
        return $this->client->isConfigured();
    }

    /**
     * Cari area berdasarkan kata kunci (nama wilayah / kode pos).
     *
     * @return array<int, array<string, mixed>>
     */
    public function search(string $input, string $country = 'ID', int $limit = 10): array
    {
        $input = trim($input);

        if ($input === '' || ! $this->isConfigured()) {
            return [];
        }

        $body = $this->client->get('/v1/maps/areas', [
            'input' => $input,
            'countries' => $country,
        ]);

        $areas = $body['areas'] ?? [];

        $normalized = [];
        $seen = [];

        foreach ($areas as $area) {
            $dedupeKey = ($area['id'] ?? '') . '|' . ($area['name'] ?? '');

            if (isset($seen[$dedupeKey])) {
                continue;
            }

            $seen[$dedupeKey] = true;
            $normalized[] = $this->normalize($area);
        }

        return array_slice($normalized, 0, max(1, $limit));
    }

    /**
     * @param  array<string, mixed>  $area
     * @return array<string, mixed>
     */
    private function normalize(array $area): array
    {
        return [
            'id' => (string) ($area['id'] ?? ''),
            'name' => $area['name'] ?? null,
            'province' => $area['administrative_division_level_1_name'] ?? null,
            'city' => $area['administrative_division_level_2_name'] ?? null,
            'district' => $area['administrative_division_level_3_name'] ?? null,
            'village' => $area['administrative_division_level_4_name'] ?? null,
            'postal_code' => isset($area['postal_code']) ? (string) $area['postal_code'] : null,
            'country' => $area['country_name'] ?? $area['country_code'] ?? null,
        ];
    }
}
