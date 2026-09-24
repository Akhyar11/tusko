<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

/**
 * ActivityLogService — pencatatan audit aksi admin (G9).
 *
 * Dipakai ulang oleh observer & service lain agar format log konsisten.
 */
class ActivityLogService
{
    /**
     * Catat satu aksi ke `activity_logs`.
     *
     * @param  array<string, mixed>  $properties
     */
    public function log(
        string $action,
        ?Model $subject = null,
        array $properties = [],
        ?int $userId = null,
        ?string $ipAddress = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $userId ?? (auth()->check() ? auth()->id() : null),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'properties' => $properties !== [] ? $properties : null,
            'ip_address' => $ipAddress ?? (request()?->ip()),
        ]);
    }
}
