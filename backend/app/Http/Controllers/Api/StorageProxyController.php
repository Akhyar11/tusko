<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class StorageProxyController extends Controller
{
    /**
     * Peta Content-Type berdasarkan ekstensi berkas.
     * Menghindari alokasi memori berlebih dari libmagic/finfo saat streaming.
     */
    private static array $mimeTypes = [
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'pdf' => 'application/pdf',
        'ico' => 'image/x-icon',
    ];

    /**
     * Melayani berkas dari storage (S3 / R2 / Local Public) secara streaming.
     * Mengatasi kendala DNS poisoning / SSL error domain *.r2.dev pada ISP lokal di Indonesia.
     */
    public function serve(Request $request, string $path): Response
    {
        $cleanPath = FileStorageService::extractStoragePath($path) ?? ltrim(trim($path), '/');

        if (empty($cleanPath) || str_contains($cleanPath, '..')) {
            abort(400, 'Invalid path');
        }

        $extension = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
        $contentType = self::$mimeTypes[$extension] ?? 'application/octet-stream';

        // 1. Coba dari disk aktif (misal s3 / r2)
        $disk = FileStorageService::disk();
        if (Storage::disk($disk)->exists($cleanPath)) {
            $stream = Storage::disk($disk)->readStream($cleanPath);
            if ($stream !== null) {
                return response()->stream(function () use ($stream) {
                    fpassthru($stream);
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }, 200, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'public, max-age=31536000, immutable',
                ]);
            }
        }

        // 2. Jika disk aktif bukan 'public', coba fallback ke disk 'public' lokal
        if ($disk !== 'public' && Storage::disk('public')->exists($cleanPath)) {
            $stream = Storage::disk('public')->readStream($cleanPath);
            if ($stream !== null) {
                return response()->stream(function () use ($stream) {
                    fpassthru($stream);
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }, 200, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'public, max-age=31536000, immutable',
                ]);
            }
        }

        abort(404, 'File tidak ditemukan di storage.');
    }
}
