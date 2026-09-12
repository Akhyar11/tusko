<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories with search and server-side filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()->withCount('products')->with('parent');

        // Search query
        $search = $request->input('search') ?? $request->input('q');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');
        if (in_array($sortBy, ['name', 'created_at', 'products_count', 'id'])) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('name', 'asc');
        }

        // Return all categories if requested
        if ($request->boolean('all')) {
            $categories = $query->get();
            return response()->json([
                'data' => $categories,
                'total' => $categories->count(),
            ]);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 100);
        $paginated = $query->paginate($perPage);

        return response()->json($paginated);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
        ]);

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $count = 1;
            while (Category::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$count}";
                $count++;
            }
            $validated['slug'] = $slug;
        }

        $category = Category::create($validated);
        $category->loadCount('products');

        return response()->json([
            'message' => 'Kategori berhasil dibuat.',
            'data' => $category,
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $category = Category::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->withCount('products')
            ->with(['parent', 'children'])
            ->firstOrFail();

        return response()->json([
            'data' => $category,
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, string $idOrSlug): JsonResponse
    {
        $category = Category::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->whereNot('id', $category->id),
            ],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
        ]);

        if (isset($validated['name']) && empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $count = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = "{$baseSlug}-{$count}";
                $count++;
            }
            $validated['slug'] = $slug;
        }

        $category->update($validated);
        $category->loadCount('products');

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(string $idOrSlug): JsonResponse
    {
        $category = Category::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->withCount('products')
            ->firstOrFail();

        if ($category->products_count > 0) {
            return response()->json([
                'message' => 'Kategori tidak dapat dihapus karena masih digunakan oleh produk aktif.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}
