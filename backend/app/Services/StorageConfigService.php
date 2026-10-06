<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

/**
 * StorageConfigService — menerapkan konfigurasi penyimpanan (Cloudflare R2 / S3)
 * dari Settings Hub (T36 / G6) ke runtime filesystems config Laravel.
 *
 * Mengizinkan seluruh kredensial (Access Key, Secret Key, Endpoint, Region,
 * Bucket Publik & Privat, Base URL) diatur secara dinamis dari database/UI.
 */
class StorageConfigService
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    /**
     * Terapkan konfigurasi storage dari database ke runtime config Laravel.
     */
    public function apply(): void
    {
        $values = [
            'storage.disk' => $this->integrations->get('storage.disk'),
            'storage.endpoint' => $this->integrations->get('storage.endpoint'),
            'storage.key' => $this->integrations->get('storage.key'),
            'storage.secret' => $this->integrations->get('storage.secret'),
            'storage.region' => $this->integrations->get('storage.region'),
            'storage.public_bucket' => $this->integrations->get('storage.public_bucket'),
            'storage.private_bucket' => $this->integrations->get('storage.private_bucket'),
            'storage.base_url' => $this->integrations->get('storage.base_url'),
            'storage.use_path_style_endpoint' => $this->integrations->get('storage.use_path_style_endpoint'),
        ];

        $this->applyValues($values);
    }

    /**
     * Terapkan array konfigurasi storage ke runtime filesystems config.
     *
     * @param  array<string, mixed>  $values
     */
    public function applyValues(array $values): void
    {
        $disk = trim((string) ($values['storage.disk'] ?? config('filesystems.default', 's3')));
        if ($disk === '') {
            $disk = config('filesystems.default', 's3');
        }

        $endpoint = trim((string) ($values['storage.endpoint'] ?? config('filesystems.disks.s3.endpoint') ?? ''));
        $key = trim((string) ($values['storage.key'] ?? config('filesystems.disks.s3.key') ?? ''));
        $secret = (string) ($values['storage.secret'] ?? config('filesystems.disks.s3.secret') ?? '');
        $region = trim((string) ($values['storage.region'] ?? config('filesystems.disks.s3.region') ?? 'auto'));
        $publicBucket = trim((string) ($values['storage.public_bucket'] ?? config('filesystems.disks.s3.bucket') ?? ''));
        $privateBucket = trim((string) ($values['storage.private_bucket'] ?? config('filesystems.disks.s3_private.bucket') ?? ''));
        $baseUrl = trim((string) ($values['storage.base_url'] ?? config('filesystems.disks.s3.url') ?? ''));
        $usePathStyle = $values['storage.use_path_style_endpoint'] ?? config('filesystems.disks.s3.use_path_style_endpoint', false);

        config(['filesystems.default' => $disk]);

        if ($disk === 's3') {
            config([
                'filesystems.private_disk' => 's3_private',

                'filesystems.disks.s3.driver' => 's3',
                'filesystems.disks.s3.key' => $key !== '' ? $key : config('filesystems.disks.s3.key'),
                'filesystems.disks.s3.secret' => $secret !== '' ? $secret : config('filesystems.disks.s3.secret'),
                'filesystems.disks.s3.region' => $region !== '' ? $region : (config('filesystems.disks.s3.region') ?: 'auto'),
                'filesystems.disks.s3.bucket' => $publicBucket !== '' ? $publicBucket : config('filesystems.disks.s3.bucket'),
                'filesystems.disks.s3.url' => $baseUrl !== '' ? $baseUrl : config('filesystems.disks.s3.url'),
                'filesystems.disks.s3.endpoint' => $endpoint !== '' ? $endpoint : config('filesystems.disks.s3.endpoint'),
                'filesystems.disks.s3.use_path_style_endpoint' => filter_var($usePathStyle, FILTER_VALIDATE_BOOLEAN),

                'filesystems.disks.s3_private.driver' => 's3',
                'filesystems.disks.s3_private.key' => $key !== '' ? $key : config('filesystems.disks.s3.key'),
                'filesystems.disks.s3_private.secret' => $secret !== '' ? $secret : config('filesystems.disks.s3.secret'),
                'filesystems.disks.s3_private.region' => $region !== '' ? $region : (config('filesystems.disks.s3.region') ?: 'auto'),
                'filesystems.disks.s3_private.bucket' => $privateBucket !== '' ? $privateBucket : ($publicBucket !== '' ? $publicBucket : config('filesystems.disks.s3.bucket')),
                'filesystems.disks.s3_private.endpoint' => $endpoint !== '' ? $endpoint : config('filesystems.disks.s3.endpoint'),
                'filesystems.disks.s3_private.use_path_style_endpoint' => filter_var($usePathStyle, FILTER_VALIDATE_BOOLEAN),
                'filesystems.disks.s3_private.visibility' => 'private',
            ]);
        } else {
            config([
                'filesystems.private_disk' => 'private',
            ]);
        }

        // Hapus instance singleton disk yang sudah pernah ter-resolve agar Laravel membaca config baru
        Storage::forgetDisk('s3');
        Storage::forgetDisk('s3_private');
    }
}
