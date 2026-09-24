<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class SyncUserRoles extends Command
{
    protected $signature = 'rbac:sync-user-roles';

    protected $description = 'Sinkronkan kolom users.role dengan pivot user_roles (D5).';

    public function handle(): int
    {
        $count = 0;

        User::query()->chunkById(200, function ($users) use (&$count) {
            foreach ($users as $user) {
                $roleId = Role::where('name', $user->role)->value('id');

                if ($roleId) {
                    $user->roles()->sync([$roleId]);
                    $count++;
                }
            }
        });

        $this->info("User disinkronkan ke user_roles: {$count}");

        return self::SUCCESS;
    }
}
