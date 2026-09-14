<?php

namespace App\Services;

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
        if (preg_match('/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/s', $value, $matches)) {
            $extension = strtolower($matches[1]);
            if ($extension === 'jpeg') {
                $extension = 'jpg';
            } elseif ($extension === 'svg+xml') {
                $extension = 'svg';
            }
            $binaryData = base64_decode($matches[2]);

            if ($binaryData !== false) {
                $filename = Str::uuid() . '.' . $extension;
                $path = $directory . '/' . $filename;
                $disk = self::disk();

                Storage::disk($disk)->put($path, $binaryData);
                $url = Storage::disk($disk)->url($path);

                return [
                    'path' => $path,
                    'url' => $url,
                ];
            }
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
     * Delete a file from the active storage disk.
     */
    public static function delete(?string $path): bool
    {
        if (empty($path) || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return false;
        }

        return Storage::disk(self::disk())->delete($path);
    }
}
