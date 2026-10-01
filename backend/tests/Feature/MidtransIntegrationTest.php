<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Warehouse::create([
            'code' => 'GDG-CHK-MID',
            'name' => 'Gudang Checkout Midtrans',
            'address' => 'Jl. Checkout',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }




    public function test_midtrans_service_verify_signature(): void
    {
        $service = app(MidtransService::class);
        $serverKey = config('midtrans.server_key');

        $orderId = 'INV/20260907/TK/112233';
        $statusCode = '200';
        $grossAmount = '500000.00';

        $validSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        $this->assertTrue($service->verifySignature($orderId, $statusCode, $grossAmount, $validSignature));
        $this->assertFalse($service->verifySignature($orderId, $statusCode, $grossAmount, 'invalid-signature'));
    }
}
