<?php

namespace App\Console\Commands;

use Database\Seeders\SettingsSeeder;
use Illuminate\Console\Command;

class SyncSettingsDefaults extends Command
{
    protected $signature = 'settings:sync-defaults';

    protected $description = 'Sinkronkan default konfigurasi sistem dari registry (tanpa menimpa nilai admin).';

    public function handle(): int
    {
        $this->call('db:seed', ['--class' => SettingsSeeder::class, '--force' => true]);

        $this->info('Default pengaturan sistem disinkronkan.');

        return self::SUCCESS;
    }
}
