<?php

namespace App\Models;

use App\Models\Concerns\HasApiRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Student extends Authenticatable
{
    use HasFactory, HasApiTokens, HasApiRole, Notifiable;

    protected $table = 'students';

    protected $fillable = [
        'full_name',
        'student_id',
        'email',
        'password',
        'gender',
        'profile_picture',
        'is_first_login',
        'department',
        'parent_name',
        'parent_phone',
        'parent_email',
        'parent_address',
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
        ];
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_student')
            ->withTimestamps();
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(WalletBalance::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function cbtSubmissions(): HasMany
    {
        return $this->hasMany(CbtSubmission::class);
    }
}
