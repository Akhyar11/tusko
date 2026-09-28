<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BiteshipClient;
use App\Services\BiteshipWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BiteshipWebhookController extends Controller
{
    /**
     * Terima webhook Biteship (T40.9).
     *
     * Signature diverifikasi via header yang dikonfigurasi admin. Bila header
     * signature belum diatur, verifikasi dilewati (mode pengembangan). Event
     * yang tidak dikenal dibalas 422; signature tidak valid dibalas 403.
     */
    public function handle(
        Request $request,
        BiteshipClient $client,
        BiteshipWebhookService $service
    ): JsonResponse {
        if (! $this->signatureValid($request, $client)) {
            return response()->json(['message' => 'Signature webhook tidak valid.'], 403);
        }

        $result = $service->handle($request->all(), true);

        return match ($result['status']) {
            'unknown' => response()->json([
                'status' => 'ignored',
                'message' => 'Event webhook tidak dikenal.',
            ], 422),
            'duplicate' => response()->json([
                'status' => 'ok',
                'duplicate' => true,
            ]),
            default => response()->json([
                'status' => 'ok',
                'event' => $result['event'] ?? null,
            ]),
        };
    }

    private function signatureValid(Request $request, BiteshipClient $client): bool
    {
        $expected = $client->webhookSignatureHeaders();

        if ($expected === []) {
            return true;
        }

        foreach ($expected as $header => $secret) {
            $actual = $request->header($header);

            if (! is_string($actual) || ! hash_equals($secret, $actual)) {
                return false;
            }
        }

        return true;
    }
}
