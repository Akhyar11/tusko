<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\FileStorageService;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * T43.2 — Konten storefront publik (navbar kategori + konten halaman).
 *
 * Navbar dirender dari POHON KATEGORI (induk + sub) yang diatur admin —
 * bukan konten statis. Mirip mega-menu adidas.
 */
class StorefrontController extends Controller
{
    /**
     * Pohon kategori untuk navbar storefront.
     */
    public function navbar(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->where('is_navbar', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'parent_id', 'sort_order']);

        $byParent = [];
        foreach ($categories as $category) {
            $key = $category->parent_id ? (int) $category->parent_id : 0;
            $byParent[$key][] = $category;
        }

        $build = function (int $parentKey) use (&$build, $byParent): array {
            $nodes = [];
            foreach ($byParent[$parentKey] ?? [] as $category) {
                $nodes[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $category->icon,
                    'children' => $build((int) $category->id),
                ];
            }

            return $nodes;
        };

        return response()->json([
            'data' => $build(0),
        ]);
    }

    /**
     * Konten halaman depan (grup `storefront`) — publik, tanpa secret.
     * Field JSON (chips/cards/banners) di-parse menjadi array.
     */
    public function content(SettingsService $settings): JsonResponse
    {
        $values = $settings->all('storefront');
        $jsonFields = ['popular_chips', 'sports_cards', 'promo_banners'];

        $content = [];
        foreach ($values as $key => $value) {
            if (SettingsRegistry::isSecret($key)) {
                continue;
            }

            $short = str_starts_with($key, 'storefront.') ? substr($key, 11) : $key;

            if (in_array($short, $jsonFields, true)) {
                $decoded = (is_string($value) && $value !== '') ? json_decode($value, true) : null;
                $content[$short] = is_array($decoded) ? $decoded : [];
            } else {
                $content[$short] = $value;
            }
        }

        return response()->json(['data' => $content]);
    }

    /**
     * Upload gambar konten storefront ke Storage (R2 publik) — admin.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ], [
            'image.required' => 'Berkas gambar wajib dipilih.',
            'image.image' => 'Berkas harus berupa gambar.',
            'image.max' => 'Ukuran gambar maksimal 4 MB.',
        ]);

        $result = FileStorageService::storeUploadedFile($request->file('image'), 'storefront');

        return response()->json([
            'message' => 'Gambar berhasil diunggah.',
            'data' => [
                'url' => $result['url'],
                'path' => $result['path'],
            ],
        ]);
    }
}
