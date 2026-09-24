<?php

namespace App\Services;

use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileStorageService
{
    /**
     * Get the active default filesystem disk.
     */
    public static function disk(): string
    {
        return config('filesystems.default', 'public');
    }

    /**
     * Disk untuk dokumen sensitif (D7) — bukti transfer, invoice, bukti bayar.
     */
    public static function privateDisk(): string
    {
        return config('filesystems.private_disk', 'private');
    }

    /**
     * Store a sensitive UploadedFile on the private disk (tanpa URL publik).
     *
     * @return array{path: string, disk: string}
     */
    public static function storePrivate(UploadedFile $file, string $directory = 'private'): array
    {
        $disk = self::privateDisk();
        $path = Storage::disk($disk)->putFile($directory, $file);

        return [
            'path' => $path,
            'disk' => $disk,
        ];
    }

    /**
     * Store a base64 Data URL on the private disk (tanpa URL publik).
     *
     * @return array{path: ?string, disk: string}
     */
    public static function storeBase64Private(?string $value, string $directory = 'private'): array
    {
        $disk = self::privateDisk();
        $decoded = self::decodeDataUri($value);

        if ($decoded === null) {
            return ['path' => $value ?: null, 'disk' => $disk];
        }

        $path = $directory . '/' . Str::uuid() . '.' . $decoded['extension'];
        Storage::disk($disk)->put($path, $decoded['binary']);

        return ['path' => $path, 'disk' => $disk];
    }

    /**
     * Buat URL sementara (presigned) untuk dokumen sensitif (D7).
     */
    public static function temporaryUrl(?string $path, ?DateTimeInterface $expiry = null): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            return Storage::disk(self::privateDisk())->temporaryUrl(
                $path,
                $expiry ?? now()->addMinutes(30)
            );
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Hapus file sensitif dari private disk.
     */
    public static function deletePrivate(?string $path): bool
    {
        if (empty($path)) {
            return false;
        }

        $clean = self::extractStoragePath($path) ?? $path;
        $disk = self::privateDisk();

        if (Storage::disk($disk)->exists($clean)) {
            return Storage::disk($disk)->delete($clean);
        }

        return false;
    }

    /**
     * Decode base64 data URI menjadi ekstensi + biner (null bila bukan data URI).
     *
     * @return array{extension: string, binary: string}|null
     */
    private static function decodeDataUri(?string $value): ?array
    {
        if (empty($value) || !preg_match('/^data:([a-zA-Z0-9\+\-\.\/]+);base64,(.+)$/s', $value, $matches)) {
            return null;
        }

        $mime = strtolower($matches[1]);
        $extension = match (true) {
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => 'jpg',
            str_contains($mime, 'png') => 'png',
            str_contains($mime, 'svg') => 'svg',
            str_contains($mime, 'webp') => 'webp',
            str_contains($mime, 'pdf') => 'pdf',
            default => 'bin',
        };

        $binary = base64_decode($matches[2]);

        return $binary === false ? null : ['extension' => $extension, 'binary' => $binary];
    }

    /**
     * Store an UploadedFile and return its storage path and public URL.
     *
     * @return array{path: string, url: string}
     */
    public static function storeUploadedFile(UploadedFile $file, string $directory = 'products'): array
    {
        $disk = self::disk();
        $path = Storage::disk($disk)->putFile($directory, $file);
        $url = Storage::disk($disk)->url($path);

        return [
            'path' => $path,
            'url' => $url,
        ];
    }

    /**
     * Store a base64 Data URL (e.g. data:image/png;base64,...) and return its storage path and public URL.
     * If $value is already a regular http/https URL, return it as is.
     *
     * @return array{path: ?string, url: ?string}
     */
    public static function storeBase64OrUrl(?string $value, string $directory = 'products'): array
    {
        if (empty($value)) {
            return ['path' => null, 'url' => null];
        }

        // If it's already an external or cloud URL (http:// or https://) and not a base64 data URI
        if (!str_starts_with($value, 'data:image/') && (str_starts_with($value, 'http://') || str_starts_with($value, 'https://'))) {
            return ['path' => null, 'url' => $value];
        }

        // Check if it is a base64 Data URL
        $decoded = self::decodeDataUri($value);
        if ($decoded !== null) {
            $filename = Str::uuid() . '.' . $decoded['extension'];
            $path = $directory . '/' . $filename;
            $disk = self::disk();

            Storage::disk($disk)->put($path, $decoded['binary']);
            $url = Storage::disk($disk)->url($path);

            return [
                'path' => $path,
                'url' => $url,
            ];
        }

        // If not a data URI and not http, treat as existing storage path
        return [
            'path' => $value,
            'url' => self::url($value),
        ];
    }

    /**
     * Generate a public URL for a given storage path or return the URL if already absolute.
     */
    public static function url(?string $pathOrUrl): ?string
    {
        if (empty($pathOrUrl)) {
            return null;
        }

        if (str_starts_with($pathOrUrl, 'http://') || str_starts_with($pathOrUrl, 'https://')) {
            return $pathOrUrl;
        }

        return Storage::disk(self::disk())->url($pathOrUrl);
    }

    /**
     * Extract the relative storage path from a relative path or full URL.
     * Returns null if the value is empty or invalid.
     */
    public static function extractStoragePath(?string $pathOrUrl): ?string
    {
        if (empty($pathOrUrl)) {
            return null;
        }

        $trimmed = trim($pathOrUrl);

        // If it's a full http(s) URL
        if (str_starts_with($trimmed, 'http://') || str_starts_with($trimmed, 'https://')) {
            $parsedPath = parse_url($trimmed, PHP_URL_PATH);
            if (!$parsedPath) {
                return null;
            }
            $cleanPath = ltrim($parsedPath, '/');

            // If path contains 'storage/', strip it for public disk paths (e.g. /storage/products/xyz.png -> products/xyz.png)
            if (str_starts_with($cleanPath, 'storage/')) {
                $cleanPath = substr($cleanPath, 8);
            }

            return $cleanPath ?: null;
        }

        return ltrim($trimmed, '/');
    }

    /**
     * Delete a file from the active storage disk.
     * Supports both relative storage paths (e.g. 'products/abc.png')
     * and absolute URLs (e.g. 'https://pub-r2.dev/products/abc.png').
     */
    public static function delete(?string $pathOrUrl): bool
    {
        $path = self::extractStoragePath($pathOrUrl);
        if (empty($path)) {
            return false;
        }

        $disk = self::disk();
        if (Storage::disk($disk)->exists($path)) {
            return Storage::disk($disk)->delete($path);
        }

        return false;
    }
}
