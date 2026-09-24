<?php

namespace App\Observers;

use App\Models\User;
use App\Services\ActivityLogService;

class UserObserver
{
    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        if (!$user->wasChanged('role')) {
            return;
        }

        app(ActivityLogService::class)->log('user.role_updated', $user, [
            'before' => $user->getOriginal('role'),
            'after' => $user->getAttribute('role'),
        ]);
    }
}
