<?php

namespace Tests\Support;

use App\Jobs\BaseJob;
use Illuminate\Support\Facades\Cache;

class QueueProbeJob extends BaseJob
{
    public function __construct(public string $marker = 'queue_probe_ran')
    {
    }

    public function handle(): void
    {
        Cache::put($this->marker, true);
    }
}
