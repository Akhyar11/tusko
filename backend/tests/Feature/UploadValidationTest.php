<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(config('filesystems.default', 'public'));
    }

    public function test_rejects_non_image_base64_payload(): void
    {
        $response = $this->postJson('/api/products/upload-image', [
            'image_base64' => 'data:text/plain;base64,aGVsbG8gd29ybGQ=',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('image_base64');
    }

    public function test_rejects_non_image_uploaded_file(): void
    {
        $response = $this->postJson('/api/products/upload-image', [
            'image' => UploadedFile::fake()->create('dokumen.pdf', 100),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }

    public function test_rejects_oversize_uploaded_file(): void
    {
        $response = $this->postJson('/api/products/upload-image', [
            'image' => UploadedFile::fake()->image('besar.jpg')->size(10240 + 1),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }

    public function test_accepts_valid_image_base64_payload(): void
    {
        $base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->postJson('/api/products/upload-image', [
            'image_base64' => $base64,
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['data' => ['path', 'url']]);
    }
}
