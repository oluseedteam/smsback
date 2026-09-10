<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseRegistration extends Model
{
    use HasFactory;

    public const STATUS_REGISTERED = 'registered';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_DROPPED = 'dropped';
    public const STATUS_WITHDRAWN = 'withdrawn';

    public const ELIGIBLE_STATUSES = [
        self::STATUS_REGISTERED,
        self::STATUS_APPROVED,
        self::STATUS_ACTIVE,
    ];

    protected $fillable = [
        'student_id',
        'school_class_id',
        'subject_id',
        'academic_session_id',
        'term',
        'status',
    ];

    public function scopeEligible($query)
    {
        return $query->whereIn('status', self::ELIGIBLE_STATUSES);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }
}
