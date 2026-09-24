<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\EmailVerificationNotification;
use App\Notifications\ResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name', 
    'email', 
    'password', 
    'phone', 
    'avatar', 
    'gender', 
    'birth_date', 
    'points', 
    'membership_tier', 
    'role', 
    'is_active'
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'points' => 0,
        'membership_tier' => 'Member',
        'is_active' => true,
        'role' => 'customer',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date',
            'points' => 'integer',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function getAvatarAttribute($value): ?string
    {
        return \App\Services\FileStorageService::url($value);
    }

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new EmailVerificationNotification());
    }

    /**
     * Get user profile summary stats.
     */
    public function getProfileStats(): array
    {
        $totalSpent = (float) $this->orders()
            ->whereNotIn('status', ['cancelled', 'failed'])
            ->sum('grand_total');

        $completedOrdersCount = $this->orders()
            ->whereIn('status', ['delivered', 'completed', 'paid', 'processing'])
            ->count();

        $savedAddressesCount = $this->shippingAddresses()->count();
        $activeVouchersCount = Voucher::active()->count();

        return [
            'total_spent' => $totalSpent,
            'completed_orders_count' => $completedOrdersCount,
            'saved_addresses_count' => $savedAddressesCount,
            'active_vouchers_count' => $activeVouchersCount,
            'points' => (int) $this->points,
            'membership_tier' => $this->membership_tier ?: 'Member',
        ];
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is customer.
     */
    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /**
     * User's carts.
     */
    public function carts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Cart::class);
    }

    /**
     * User's orders.
     */
    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * User's shipping addresses.
     */
    public function shippingAddresses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ShippingAddress::class);
    }

    /**
     * User's default shipping address.
     */
    public function defaultShippingAddress(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ShippingAddress::class)->where('is_default', true);
    }

    /**
     * User's lifetime loyalty points ledger.
     */
    public function loyaltyPointsLedgers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LoyaltyPointsLedger::class);
    }

    /**
     * User's RBAC roles.
     */
    public function roles(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }
}
