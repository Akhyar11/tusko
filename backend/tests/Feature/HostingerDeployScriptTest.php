<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * T30.5 — Verifikasi skrip deploy Hostinger mendaftarkan Laravel Scheduler
 * via Cron dan memvalidasi driver queue/cache untuk shared hosting.
 */
class HostingerDeployScriptTest extends TestCase
{
    private function script(): string
    {
        $path = base_path('deploy/hostinger-deploy.sh');

        $this->assertFileExists($path);

        return (string) file_get_contents($path);
    }

    public function test_deploy_script_registers_scheduler_cron_idempotently(): void
    {
        $script = $this->script();

        $this->assertStringContainsString('artisan schedule:run', $script);
        $this->assertStringContainsString('crontab', $script);
        // Guard idempotent: tidak menambah baris cron ganda.
        $this->assertStringContainsString('grep -Fq "artisan schedule:run"', $script);
    }

    public function test_deploy_script_verifies_queue_and_cache_drivers(): void
    {
        $script = $this->script();

        $this->assertStringContainsString('QUEUE_CONNECTION', $script);
        $this->assertStringContainsString('CACHE_STORE', $script);
        $this->assertStringContainsString('withoutOverlapping', $script);
    }

    public function test_deploy_script_has_valid_bash_syntax(): void
    {
        $path = base_path('deploy/hostinger-deploy.sh');
        $output = [];
        $exitCode = 0;

        exec('bash -n ' . escapeshellarg($path) . ' 2>&1', $output, $exitCode);

        $this->assertSame(0, $exitCode, implode("\n", $output));
    }
}
