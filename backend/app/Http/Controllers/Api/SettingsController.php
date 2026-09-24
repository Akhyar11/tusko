<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    public function __construct(private readonly SettingsService $settings)
    {
    }

    /**
     * Daftar seluruh grup pengaturan beserta nilainya (secret dimask).
     */
    public function index(): JsonResponse
    {
        $groups = [];

        foreach (SettingsRegistry::groupNames() as $group) {
            $groups[] = [
                'group' => $group,
                'label' => SettingsRegistry::groupLabel($group),
                'description' => SettingsRegistry::groupDescription($group),
                'values' => $this->settings->maskedGroup($group),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => ['groups' => $groups],
        ]);
    }

    /**
     * Nilai satu grup pengaturan (secret dimask) + metadata registry.
     */
    public function show(string $group): JsonResponse
    {
        if (!in_array($group, SettingsRegistry::groupNames(), true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grup pengaturan tidak ditemukan.',
            ], 404);
        }

        $fields = [];
        foreach (SettingsRegistry::keys($group) as $key => $config) {
            $fields[] = [
                'key' => $key,
                'type' => $config['type'],
                'is_secret' => $config['is_secret'],
                'label' => $config['label'],
                'description' => $config['description'],
                'options' => $config['options'] ?? [],
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'group' => $group,
                'label' => SettingsRegistry::groupLabel($group),
                'description' => SettingsRegistry::groupDescription($group),
                'values' => $this->settings->maskedGroup($group),
                'fields' => $fields,
            ],
        ]);
    }

    /**
     * Simpan nilai satu grup (hanya key grup tsb; catat activity_logs G9 tanpa secret).
     */
    public function update(Request $request, string $group): JsonResponse
    {
        if (!in_array($group, SettingsRegistry::groupNames(), true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grup pengaturan tidak ditemukan.',
            ], 404);
        }

        $rules = SettingsRegistry::rulesForGroup($group);
        $all = $request->all();

        // Validator memperlakukan titik sebagai nesting; gunakan alias aman lalu petakan balik.
        $aliasRules = [];
        $aliasToKey = [];
        $aliasInput = [];

        foreach ($rules as $key => $rule) {
            if (!array_key_exists($key, $all)) {
                continue;
            }

            $alias = str_replace('.', '__', $key);
            $aliasRules[$alias] = $rule;
            $aliasToKey[$alias] = $key;
            $aliasInput[$alias] = $all[$key];
        }

        $validator = Validator::make($aliasInput, $aliasRules);

        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->messages() as $alias => $messages) {
                $errors[$aliasToKey[$alias] ?? $alias] = $messages;
            }

            throw ValidationException::withMessages($errors);
        }

        $validated = [];
        foreach ($validator->validated() as $alias => $value) {
            $validated[$aliasToKey[$alias]] = $value;
        }

        $changes = DB::transaction(fn () => $this->settings->setGroup(
            $group,
            $validated,
            $request->user()?->id,
            $request->ip()
        ));

        return response()->json([
            'status' => 'success',
            'message' => count($changes) . ' pengaturan diperbarui.',
            'data' => [
                'group' => $group,
                'values' => $this->settings->maskedGroup($group),
                'changed' => array_keys($changes),
            ],
        ]);
    }

    /**
     * Uji koneksi sebuah grup (shipping/payment/storage/notification).
     */
    public function testConnection(Request $request, string $group): JsonResponse
    {
        if (!in_array($group, SettingsRegistry::groupNames(), true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grup pengaturan tidak ditemukan.',
            ], 404);
        }

        $values = $this->settings->all($group);

        try {
            $result = match ($group) {
                'shipping' => $this->testShipping($values),
                'payment' => $this->testPayment($values),
                'storage' => $this->testStorage($values),
                'notification' => $this->testNotification($values),
                default => null,
            };
        } catch (\Throwable $exception) {
            return response()->json([
                'status' => 'error',
                'message' => 'Koneksi gagal: ' . $exception->getMessage(),
                'data' => ['group' => $group, 'ok' => false],
            ], 422);
        }

        if ($result === null) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grup ini tidak mendukung uji koneksi.',
                'data' => ['group' => $group, 'ok' => false],
            ], 422);
        }

        return response()->json([
            'status' => $result['ok'] ? 'success' : 'error',
            'message' => $result['message'],
            'data' => [
                'group' => $group,
                'ok' => $result['ok'],
                'details' => $result['details'] ?? [],
            ],
        ], $result['ok'] ? 200 : 422);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array{ok: bool, message: string, details?: array<string, mixed>}
     */
    private function testShipping(array $values): array
    {
        $baseUrl = $values['shipping.base_url'] ?? null;

        if (empty($baseUrl)) {
            return ['ok' => false, 'message' => 'Base URL agregator logistik belum diisi.'];
        }

        $headers = [];
        if (!empty($values['shipping.api_key'])) {
            $headers['Authorization'] = 'Bearer ' . $values['shipping.api_key'];
        }

        $response = Http::timeout(8)->acceptJson()->withHeaders($headers)->get(rtrim($baseUrl, '/'));

        return [
            'ok' => $response->successful(),
            'message' => $response->successful()
                ? 'Koneksi ke agregator logistik berhasil.'
                : 'Agregator menolak koneksi (HTTP ' . $response->status() . ').',
            'details' => ['http_status' => $response->status()],
        ];
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array{ok: bool, message: string, details?: array<string, mixed>}
     */
    private function testPayment(array $values): array
    {
        $serverKey = $values['payment.midtrans_server_key'] ?? null;
        $snapUrl = $values['payment.snap_url'] ?? null;

        if (empty($serverKey)) {
            return ['ok' => false, 'message' => 'Server key Midtrans belum diisi.'];
        }

        if (empty($snapUrl)) {
            return ['ok' => false, 'message' => 'Snap URL Midtrans belum diisi.'];
        }

        $response = Http::timeout(8)->acceptJson()
            ->withHeaders(['Authorization' => 'Basic ' . base64_encode($serverKey . ':')])
            ->get($snapUrl);

        // Endpoint Snap mengembalikan 4xx bila method salah; kredensial dianggap
        // terjangkau selama bukan error server.
        $ok = $response->status() < 500;

        return [
            'ok' => $ok,
            'message' => $ok
                ? 'Kredensial Midtrans dapat menjangkau gateway.'
                : 'Gateway Midtrans mengembalikan error server (HTTP ' . $response->status() . ').',
            'details' => ['http_status' => $response->status()],
        ];
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array{ok: bool, message: string, details?: array<string, mixed>}
     */
    private function testStorage(array $values): array
    {
        $disk = $values['storage.disk'] ?: config('filesystems.default', 'public');
        $path = 'settings-probe/' . uniqid('probe_', true) . '.txt';

        Storage::disk($disk)->put($path, 'ok');
        $exists = Storage::disk($disk)->exists($path);
        Storage::disk($disk)->delete($path);

        return [
            'ok' => $exists,
            'message' => $exists
                ? 'Penyimpanan dapat menulis & membaca objek uji.'
                : 'Gagal menulis objek uji pada penyimpanan.',
            'details' => ['disk' => $disk],
        ];
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array{ok: bool, message: string, details?: array<string, mixed>}
     */
    private function testNotification(array $values): array
    {
        $mailer = $values['notification.mailer'] ?? null;
        $ok = !empty($mailer);

        return [
            'ok' => $ok,
            'message' => $ok
                ? 'Konfigurasi mailer tersedia.'
                : 'Mailer belum dikonfigurasi.',
            'details' => ['mailer' => $mailer],
        ];
    }
}
