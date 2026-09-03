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

class Student extends Authenticatable
{
    use HasFactory, HasApiTokens, HasApiRole, Notifiable;

    protected $table = 'students';

    protected $fillable = [
        'full_name',
        'first_name',
        'last_name',
        'other_name',
        'student_id',
        'email',
        'password',
        'gender',
        'profile_picture',
        'is_first_login',
        'department',
        'section',
        'academic_session_id',
        'parent_name',
        'parent_phone',
        'parent_email',
        'parent_address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'qr_code_identifier',
        'status',
        'created_by_teacher_id',
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

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function createdByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'created_by_teacher_id');
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(StudentPromotion::class);
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

    public function courseRegistrations(): HasMany
    {
        return $this->hasMany(CourseRegistration::class);
    }

    public function subjectResults(): HasMany
    {
        return $this->hasMany(SubjectResult::class);
    }

    public function reportCards(): HasMany
    {
        return $this->hasMany(ReportCard::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(StudentNotification::class, 'user_id');
    }

    public function affectiveAssessments(): HasMany
    {
        return $this->hasMany(AffectiveAssessment::class);
    }

    public function psychomotorAssessments(): HasMany
    {
        return $this->hasMany(PsychomotorAssessment::class);
    }
}
