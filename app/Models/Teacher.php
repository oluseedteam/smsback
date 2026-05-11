<?php

namespace App\Models;

use App\Models\Concerns\HasApiRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Teacher extends Authenticatable
{
    use HasFactory, HasApiTokens, HasApiRole, Notifiable;

    protected $table = 'teachers';

    protected $fillable = [
        'full_name',
        'employee_id',
        'email',
        'password',
        'gender',
        'profile_picture',
        'is_first_login',
        'can_create_students',
        'class_teacher_of',
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
            'can_create_students' => 'boolean',
        ];
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function assignedClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_teacher_of');
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'class_subject')
            ->withPivot('school_class_id')
            ->withTimestamps();
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'marked_by_teacher_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function cbtTests(): HasMany
    {
        return $this->hasMany(CbtTest::class);
    }
}
