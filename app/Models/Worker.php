<?php

namespace App\Models;

use App\Models\Concerns\HasApiRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Worker extends Authenticatable
{
    use HasFactory, HasApiTokens, HasApiRole, Notifiable;

    protected $table = 'workers';

    protected $fillable = [
        'full_name',
        'employee_id',
        'email',
        'password',
        'institutional_role',
        'phone',
        'gender',
        'profile_picture',
        'is_first_login',
        'onboarding_tour',
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
            'onboarding_tour' => 'array',
        ];
    }
}
