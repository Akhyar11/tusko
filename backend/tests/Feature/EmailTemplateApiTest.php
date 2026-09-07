<?php

namespace Tests\Feature;

use App\Models\EmailTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailTemplateApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_email_templates_and_auto_seeds_defaults(): void
    {
        $response = $this->getJson('/api/templates/emails');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'key', 'name', 'subject', 'body', 'color_theme', 'is_active'],
                ],
            ]);

        $this->assertDatabaseHas('email_templates', [
            'key' => 'order_placed',
        ]);
        $this->assertDatabaseHas('email_templates', [
            'key' => 'order_shipped',
        ]);
    }

    public function test_can_store_new_email_template(): void
    {
        $payload = [
            'key' => 'order_refunded',
            'name' => 'Pengembalian Dana Berhasil',
            'event' => 'order.refunded',
            'category' => 'Billing',
            'from_name' => 'Tusko Finance',
            'reply_to' => 'finance@tusko.com',
            'color_theme' => 'blue',
            'subject' => 'Pengembalian Dana Pesanan {order_number} Telah Diproses',
            'preheader' => 'Dana Anda telah kami kembalikan ke rekening asal.',
            'headline' => 'Pengembalian Dana Berhasil Diselesaikan',
            'body' => 'Halo {customer_name}, pengembalian dana untuk pesanan {order_number} sebesar {total_amount} telah berhasil diproses.',
            'button_text' => 'Cek Mutasi',
            'button_link' => 'https://tusko.com/finance',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/templates/emails', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.key', 'order_refunded')
            ->assertJsonPath('data.name', 'Pengembalian Dana Berhasil');

        $this->assertDatabaseHas('email_templates', [
            'key' => 'order_refunded',
            'name' => 'Pengembalian Dana Berhasil',
        ]);
    }

    public function test_can_update_existing_email_template(): void
    {
        $template = EmailTemplate::create([
            'key' => 'custom_promo',
            'name' => 'Promo Spesial',
            'subject' => 'Diskon Eksklusif Minggu Ini',
            'body' => 'Dapatkan diskon 50% untuk pesanan berikutnya.',
            'color_theme' => 'emerald',
            'is_active' => true,
        ]);

        $response = $this->putJson("/api/templates/emails/{$template->key}", [
            'subject' => 'Diskon Kilat 70% Hanya Hari Ini!',
            'body' => 'Konten email promosi telah diperbarui.',
            'color_theme' => 'rose',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.subject', 'Diskon Kilat 70% Hanya Hari Ini!')
            ->assertJsonPath('data.color_theme', 'rose');

        $template->refresh();
        $this->assertEquals('Diskon Kilat 70% Hanya Hari Ini!', $template->subject);
    }

    public function test_validation_errors_on_missing_required_fields_when_storing(): void
    {
        $response = $this->postJson('/api/templates/emails', [
            'key' => 'incomplete_template',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'subject', 'body']);
    }

    public function test_can_reset_email_templates_to_default(): void
    {
        EmailTemplate::create([
            'key' => 'dummy_extra',
            'name' => 'Dummy Extra',
            'subject' => 'Dummy',
            'body' => 'Dummy body',
        ]);

        $this->assertDatabaseHas('email_templates', ['key' => 'dummy_extra']);

        $response = $this->postJson('/api/templates/emails/reset');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Template email berhasil direset ke konfigurasi awal bawaan sistem.');

        $this->assertDatabaseMissing('email_templates', ['key' => 'dummy_extra']);
        $this->assertDatabaseHas('email_templates', ['key' => 'order_placed']);
    }
}
