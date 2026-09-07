<?php

namespace Tests\Feature;

use App\Models\Expedition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpeditionValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_expedition_fails_when_required_fields_are_missing(): void
    {
        $response = $this->postJson('/api/expeditions', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code', 'service', 'etd']);

        $errors = $response->json('errors');
        $this->assertEquals('Nama ekspedisi wajib diisi.', $errors['name'][0]);
        $this->assertEquals('Kode ekspedisi wajib diisi.', $errors['code'][0]);
        $this->assertEquals('Nama layanan kurir wajib diisi.', $errors['service'][0]);
        $this->assertEquals('Estimasi pengiriman (ETD) wajib diisi.', $errors['etd'][0]);
    }

    public function test_store_expedition_fails_when_rate_type_is_invalid(): void
    {
        $payload = [
            'name' => 'Kurir Express',
            'code' => 'kurir',
            'service' => 'Express',
            'etd' => '1 hari',
            'rate_type' => 'invalid_type',
        ];

        $response = $this->postJson('/api/expeditions', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rate_type']);

        $this->assertEquals('Tipe tarif harus per_kg atau flat.', $response->json('errors.rate_type.0'));
    }

    public function test_update_expedition_validates_field_types(): void
    {
        $expedition = Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'REG',
            'etd' => '2-3 hari',
            'base_cost' => 18000,
            'cost' => 18000,
        ]);

        $response = $this->putJson("/api/expeditions/{$expedition->id}", [
            'name' => '',
            'cost' => 'bukan-angka',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'cost']);
    }

    public function test_store_expedition_succeeds_with_valid_data(): void
    {
        $payload = [
            'name' => 'GrabExpress Instant',
            'code' => 'grab',
            'service' => 'Instant Bike',
            'category' => 'Instan & Same Day',
            'etd' => '1 - 3 jam',
            'rate_type' => 'flat',
            'base_cost' => 25000,
            'cost' => 25000,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/expeditions', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'GrabExpress Instant')
            ->assertJsonPath('data.rate_type', 'flat');

        $this->assertDatabaseHas('expeditions', [
            'name' => 'GrabExpress Instant',
            'rate_type' => 'flat',
        ]);
    }
}
