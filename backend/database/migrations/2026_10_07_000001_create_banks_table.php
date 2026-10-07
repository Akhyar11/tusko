<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('banks')) {
            Schema::create('banks', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name', 150);
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Seed initial reference bank names
        $initialBanks = [
            ['code' => 'BCA', 'name' => 'BCA (Bank Central Asia)', 'notes' => 'Bank swasta terbesar di Indonesia'],
            ['code' => 'MANDIRI', 'name' => 'Bank Mandiri', 'notes' => 'Bank BUMN nasional'],
            ['code' => 'BRI', 'name' => 'BRI (Bank Rakyat Indonesia)', 'notes' => 'Bank jaringan terluas di Indonesia'],
            ['code' => 'BNI', 'name' => 'BNI (Bank Negara Indonesia)', 'notes' => 'Bank BUMN'],
            ['code' => 'BSI', 'name' => 'BSI (Bank Syariah Indonesia)', 'notes' => 'Bank syariah terbesar di Indonesia'],
            ['code' => 'CIMB', 'name' => 'CIMB Niaga', 'notes' => 'Bank swasta'],
            ['code' => 'PERMATA', 'name' => 'Permata Bank', 'notes' => 'Bank swasta'],
            ['code' => 'DANAMON', 'name' => 'Bank Danamon', 'notes' => 'Bank swasta'],
            ['code' => 'JAGO', 'name' => 'Bank Jago', 'notes' => 'Bank digital'],
            ['code' => 'SEABANK', 'name' => 'SeaBank', 'notes' => 'Bank digital'],
            ['code' => 'BCA_DIGITAL', 'name' => 'BCA Digital (Blu)', 'notes' => 'Bank digital BCA'],
            ['code' => 'LAINNYA', 'name' => 'Bank Lainnya', 'notes' => 'Bank umum lainnya'],
        ];

        foreach ($initialBanks as $bank) {
            DB::table('banks')->updateOrInsert(
                ['code' => $bank['code']],
                array_merge($bank, [
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banks');
    }
};
