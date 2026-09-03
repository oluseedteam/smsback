<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'school_class_id',
        'subject_id',
        'academic_session_id',
        'term',
        'ca1_score',
        'ca2_score',
        'assessment_scores',
        'cbt_submission_id',
        'exam_score',
        'exam_method',
        'total_score',
        'total_obtainable',
        'percentage',
        'grade',
        'grade_point',
        'is_pass',
        'remark',
        'teacher_id',
        'status',
        'submitted_at',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'ca1_score' => 'decimal:2',
            'ca2_score' => 'decimal:2',
            'assessment_scores' => 'array',
            'exam_score' => 'decimal:2',
            'total_score' => 'decimal:2',
            'total_obtainable' => 'decimal:2',
            'percentage' => 'decimal:2',
            'grade_point' => 'decimal:2',
            'is_pass' => 'boolean',
            'submitted_at' => 'datetime',
            'locked_at' => 'datetime',
        ];
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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function cbtSubmission(): BelongsTo
    {
        return $this->belongsTo(CbtSubmission::class);
    }
}
