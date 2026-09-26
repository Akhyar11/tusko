<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductReviewController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    /**
     * Daftar ulasan produk yang disetujui + agregat rating (publik) — T32.2.
     */
    public function indexForProduct(Request $request, string $idOrSlug): JsonResponse
    {
        $product = Product::query()
            ->where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        $reviews = ProductReview::query()
            ->with('user:id,name,avatar')
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->latest()
            ->paginate(min(50, max(1, (int) $request->query('per_page', 10))));

        $distribution = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        $aggregate = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->selectRaw('COUNT(*) as count, COALESCE(AVG(rating), 0) as average')
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
            'aggregate' => [
                'count' => (int) ($aggregate->count ?? 0),
                'average' => round((float) ($aggregate->average ?? 0), 2),
                'distribution' => collect([1, 2, 3, 4, 5])->mapWithKeys(fn ($star) => [
                    (string) $star => (int) ($distribution[$star] ?? 0),
                ]),
            ],
        ]);
    }

    /**
     * Buat ulasan (hanya pembeli yang pesanannya memuat produk tsb) — T32.2.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'order_id' => ['required', 'integer', Rule::exists('orders', 'id')],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:150'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ], [
            'rating.required' => 'Rating wajib diisi.',
            'rating.min' => 'Rating minimal 1 bintang.',
            'rating.max' => 'Rating maksimal 5 bintang.',
        ]);

        $user = $request->user();
        $order = Order::query()->whereKey($validated['order_id'])->where('user_id', $user->id)->first();

        if (!$order) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan untuk akun Anda.',
            ], 403);
        }

        if (!in_array($order->payment_status, ['paid'], true) && !in_array($order->status, ['completed', 'delivered', 'processing', 'shipped'], true)) {
            return response()->json([
                'message' => 'Ulasan hanya dapat diberikan untuk pesanan yang sudah dibayar/selesai.',
            ], 422);
        }

        if (!$order->items()->where('product_id', $validated['product_id'])->exists()) {
            return response()->json([
                'message' => 'Produk ini tidak ada pada pesanan tersebut.',
            ], 422);
        }

        if (ProductReview::where('product_id', $validated['product_id'])->where('order_id', $order->id)->exists()) {
            return response()->json([
                'message' => 'Anda sudah mengulas produk ini untuk pesanan tersebut.',
            ], 422);
        }

        $review = ProductReview::create([
            'product_id' => $validated['product_id'],
            'user_id' => $user->id,
            'order_id' => $order->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'is_approved' => false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Ulasan berhasil dikirim dan menunggu moderasi.',
            'data' => $review->load('user:id,name,avatar'),
        ], 201);
    }

    /**
     * Daftar ulasan untuk moderasi admin (server-side) — T32.2.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = ProductReview::query()->with(['product:id,name,slug', 'user:id,name,email', 'order:id,order_number']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        if ($request->filled('product_id') && $request->input('product_id') !== 'all') {
            $query->where('product_id', (int) $request->input('product_id'));
        }

        if ($request->filled('rating') && $request->input('rating') !== 'all') {
            $query->where('rating', (int) $request->input('rating'));
        }

        if ($request->has('is_approved') && $request->input('is_approved') !== 'all') {
            $query->where('is_approved', filter_var($request->input('is_approved'), FILTER_VALIDATE_BOOLEAN));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['rating', 'created_at', 'id'];
        $query->orderBy(in_array($sortBy, $allowedSorts, true) ? $sortBy : 'created_at', $sortDir);

        $perPage = min(100, max(1, (int) ($request->input('per_page') ?: 15)));
        $paginated = $query->paginate($perPage);
        $paginated->through(fn (ProductReview $review) => $this->formatReview($review));

        return response()->json($paginated);
    }

    /**
     * Setujui/tolak ulasan (moderasi) + recompute agregat produk — T32.2.
     */
    public function moderate(Request $request, ProductReview $review): JsonResponse
    {
        $validated = $request->validate([
            'is_approved' => ['required', 'boolean'],
        ]);

        $approved = (bool) $validated['is_approved'];

        DB::transaction(function () use ($review, $approved, $request) {
            $review->update([
                'is_approved' => $approved,
                'approved_at' => $approved ? now() : null,
                'approved_by' => $approved ? $request->user()->id : null,
            ]);

            $this->recalculateProductRating((int) $review->product_id);

            $this->activityLog->log('review.moderated', $review, [
                'is_approved' => $approved,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => $approved ? 'Ulasan disetujui.' : 'Ulasan ditolak.',
            'data' => $this->formatReview($review->fresh(['product:id,name,slug', 'user:id,name,email'])),
        ]);
    }

    /**
     * Hapus ulasan + recompute agregat produk — T32.2.
     */
    public function destroy(ProductReview $review): JsonResponse
    {
        $productId = (int) $review->product_id;

        DB::transaction(function () use ($review, $productId) {
            $review->delete();
            $this->recalculateProductRating($productId);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Ulasan berhasil dihapus.',
        ]);
    }

    private function recalculateProductRating(int $productId): void
    {
        $product = Product::find($productId);
        if (!$product) {
            return;
        }

        $stats = ProductReview::query()
            ->where('product_id', $productId)
            ->where('is_approved', true)
            ->selectRaw('COUNT(*) as count, COALESCE(AVG(rating), 0) as average')
            ->first();

        $product->forceFill([
            'rating' => round((float) ($stats->average ?? 0), 2) ?: 5.00,
            'rating_count' => (int) ($stats->count ?? 0),
        ])->save();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReview(ProductReview $review): array
    {
        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'title' => $review->title,
            'comment' => $review->comment,
            'is_approved' => $review->is_approved,
            'approved_at' => $review->approved_at,
            'created_at' => $review->created_at,
            'product' => $review->relationLoaded('product') && $review->product ? [
                'id' => $review->product->id,
                'name' => $review->product->name,
                'slug' => $review->product->slug,
            ] : null,
            'user' => $review->relationLoaded('user') && $review->user ? [
                'id' => $review->user->id,
                'name' => $review->user->name,
                'email' => $review->user->email,
            ] : null,
            'order' => $review->relationLoaded('order') && $review->order ? [
                'id' => $review->order->id,
                'order_number' => $review->order->order_number,
            ] : null,
        ];
    }
}
