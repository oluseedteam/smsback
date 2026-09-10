<?php

namespace App\Models;

use App\Models\Concerns\HasApiRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory, HasApiRole, Notifiable;

    protected $table = 'admins';

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'gender',
        'profile_picture',
        'is_first_login',
        'onboarding_tour',
        'role',
        'permissions',
        'phone',
        'qr_code_identifier',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
            'onboarding_tour' => 'array',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return ($this->role ?? 'admin') === 'admin';
    }

    public function isSubAdmin(): bool
    {
        return ($this->role ?? 'admin') === 'sub_admin';
    }

    public function hasPermission(string $perm): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $permissions = $this->permissions ?? [];
        return in_array($perm, $permissions);
    }
}
