<?php

namespace App\Observers;

use App\Models\Role;
use App\Models\User;
use App\Services\ActivityLogService;

class UserObserver
{
    /**
     * Handle the User "created" event — sinkronkan pivot user_roles (T24.5).
     */
    public function created(User $user): void
    {
        $this->syncRole($user);
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        if (!$user->wasChanged('role')) {
            return;
        }

        $this->syncRole($user);

        app(ActivityLogService::class)->log('user.role_updated', $user, [
            'before' => $user->getOriginal('role'),
            'after' => $user->getAttribute('role'),
        ]);
    }

    /**
     * Samakan pivot `user_roles` dengan `users.role` (D5).
     */
    private function syncRole(User $user): void
    {
        $roleId = Role::where('name', $user->role)->value('id');

        if ($roleId) {
            $user->roles()->sync([$roleId]);
        }
    }
}
