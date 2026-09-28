<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

/**
 * T30 — Verifikasi konfigurasi Laravel Task Scheduler untuk shared hosting.
 */
class SchedulerConfigurationTest extends TestCase
{
    /**
     * @return array<int, Event>
     */
    private function events(): array
    {
        return app(Schedule::class)->events();
    }

    private function findEvent(string $commandSubstring): ?Event
    {
        foreach ($this->events() as $event) {
            if (is_string($event->command) && str_contains($event->command, $commandSubstring)) {
                return $event;
            }
        }

        return null;
    }

    public function test_queue_worker_scheduled_every_minute_with_shared_hosting_guards(): void
    {
        $event = $this->findEvent('queue:work database');

        $this->assertNotNull($event, 'Schedule queue:work database tidak ditemukan.');
        $this->assertSame('* * * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping, 'Worker wajib withoutOverlapping().');
        $this->assertTrue($event->runInBackground, 'Worker wajib runInBackground().');

        foreach (['--stop-when-empty', '--max-time=50', '--memory=128', '--tries=3'] as $flag) {
            $this->assertStringContainsString($flag, $event->command, "Flag {$flag} wajib ada pada queue:work.");
        }
    }

    public function test_failed_jobs_pruned_weekly(): void
    {
        $event = $this->findEvent('queue:prune-failed');

        $this->assertNotNull($event);
        $this->assertSame('0 0 * * 0', $event->expression);
        $this->assertStringContainsString('--hours=168', $event->command);
        $this->assertTrue($event->withoutOverlapping);
    }

    public function test_batches_pruned_daily(): void
    {
        $event = $this->findEvent('queue:prune-batches');

        $this->assertNotNull($event);
        $this->assertSame('0 0 * * *', $event->expression);
        $this->assertStringContainsString('--hours=48', $event->command);
    }

    public function test_expired_orders_auto_cancel_run_ten_minutely_without_overlapping(): void
    {
        $event = $this->findEvent('orders:cancel-expired');

        $this->assertNotNull($event);
        $this->assertSame('*/10 * * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping);
    }

    public function test_expedition_sync_scheduled_daily_without_overlapping(): void
    {
        $event = $this->findEvent('expeditions:sync');

        $this->assertNotNull($event);
        $this->assertSame('0 2 * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping);
    }
}
