<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'instructions',
        'teacher_id',
        'school_class_id',
        'academic_section_id',
        'academic_session_id',
        'subject_id',
        'term',
        'duration_minutes',
        'total_questions',
        'total_marks',
        'max_score',
        'attempt_limit',
        'randomize_questions',
        'randomize_options',
        'status',
        'is_published',
        'start_time',
        'end_time',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'randomize_questions' => 'boolean',
            'randomize_options' => 'boolean',
            'attempt_limit' => 'integer',
            'total_questions' => 'integer',
            'total_marks' => 'decimal:2',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function academicSection(): BelongsTo
    {
        return $this->belongsTo(AcademicSection::class, 'academic_section_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(CbtQuestion::class)->orderBy('order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(CbtSubmission::class);
    }
}
