<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * T45.3 — Riwayat log email notifikasi (admin).
 */
class EmailLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmailLog::query()->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('recipient_email', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) ($request->input('per_page') ?: 15), 1), 100);

        return response()->json($query->paginate($perPage));
    }
}
