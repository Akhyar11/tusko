<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

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
}
