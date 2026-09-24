<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class GuestAuthOptionalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('auth.optional')->get('/api/__guest-user', function (Request $request) {
            return response()->json(['user_id' => $request->user()?->id]);
        });
    }

    public function test_auth_optional_resolves_user_from_bearer_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('guest-optional')->plainTextToken;

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/api/__guest-user')
            ->assertStatus(200)
            ->assertJsonPath('user_id', $user->id);
    }

    public function test_auth_optional_allows_guest_without_token(): void
    {
        $this->getJson('/api/__guest-user')
            ->assertStatus(200)
            ->assertJsonPath('user_id', null);
    }

    public function test_shipping_rates_route_allows_guest(): void
    {
        // Tanpa origin terkonfigurasi → 422 (bukan 401/403): tamu tetap boleh akses.
        $response = $this->getJson('/api/shipping/rates?weight=1000');

        $this->assertNotContains($response->status(), [401, 403]);
    }
}
