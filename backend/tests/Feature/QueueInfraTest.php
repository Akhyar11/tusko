<?php

namespace Tests\Feature;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\Support\QueueProbeJob;
use Tests\TestCase;

class QueueInfraTest extends TestCase
{
    use RefreshDatabase;

    public function test_queue_infrastructure_tables_and_base_job_exist(): void
    {
        $this->assertTrue(Schema::hasTable('jobs'));
        $this->assertTrue(Schema::hasTable('job_batches'));
        $this->assertTrue(Schema::hasTable('failed_jobs'));

        $probe = new QueueProbeJob();

        $this->assertInstanceOf(ShouldQueue::class, $probe);
        $this->assertSame(3, $probe->tries);
        $this->assertSame(120, $probe->timeout);
        $this->assertNotEmpty($probe->backoff);
    }

    public function test_job_can_be_dispatched_and_faked(): void
    {
        Queue::fake();

        QueueProbeJob::dispatch();

        Queue::assertPushed(QueueProbeJob::class);
    }

    public function test_job_is_processed_on_database_driver(): void
    {
        config(['queue.default' => 'database']);
        Cache::forget('queue_probe_ran');

        QueueProbeJob::dispatch();

        $this->assertDatabaseCount('jobs', 1);

        $this->artisan('queue:work', ['--once' => true, '--queue' => 'default']);

        $this->assertTrue((bool) Cache::get('queue_probe_ran', false));
        $this->assertDatabaseCount('jobs', 0);
    }
}
