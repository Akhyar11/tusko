<?php

namespace Tests\Feature;

use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\IdentityCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class IdentityCodeServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_code_with_prefix_ddmmyyyy_increment_format(): void
    {
        $code = IdentityCodeService::generate(Vendor::class, 'VND', 'code', Carbon::create(2026, 9, 23));

        $this->assertEquals('VND/23092026/001', $code);
    }

    public function test_increment_increases_per_date_and_resets_on_new_date(): void
    {
        $day1 = Carbon::create(2026, 9, 23);

        $first = IdentityCodeService::generate(Vendor::class, 'VND', 'code', $day1);
        Vendor::create([
            'code' => $first,
            'company_name' => 'Vendor Satu',
            'contact_person' => 'A',
            'phone' => '0811',
            'address' => 'Jakarta',
        ]);

        $second = IdentityCodeService::generate(Vendor::class, 'VND', 'code', $day1);
        $this->assertEquals('VND/23092026/002', $second);
        Vendor::create([
            'code' => $second,
            'company_name' => 'Vendor Dua',
            'contact_person' => 'B',
            'phone' => '0822',
            'address' => 'Bandung',
        ]);

        // Tanggal berbeda -> increment direset ke 001
        $nextDay = IdentityCodeService::generate(Vendor::class, 'VND', 'code', Carbon::create(2026, 9, 24));
        $this->assertEquals('VND/24092026/001', $nextDay);
    }

    public function test_warehouse_prefix_uses_same_canonical_format(): void
    {
        $code = IdentityCodeService::generate(Warehouse::class, 'WH', 'code', Carbon::create(2026, 9, 23));

        $this->assertEquals('WH/23092026/001', $code);
        $this->assertMatchesRegularExpression('/^WH\/\d{8}\/\d{3,}$/', $code);
    }
}
