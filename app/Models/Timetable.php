<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timetable extends Model
{
    use HasFactory;

    protected $table = 'timetables';

    protected $fillable = [
        'academic_session_id',
        'term',
        'school_class_id',
        'section',
        'day_of_week',
        'period_number',
        'period_name',
        'start_time',
        'end_time',
        'subject_id',
        'teacher_id',
        'room',
        'is_break',
    ];

    protected function casts(): array
    {
        return [
            'period_number' => 'integer',
            'is_break' => 'boolean',
        ];
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function changeRequests(): HasMany
    {
        return $this->hasMany(TimetableChangeRequest::class);
    }
}
