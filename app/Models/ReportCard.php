<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'school_class_id',
        'academic_section_id',
        'academic_section_name',
        'class_name',
        'class_arm',
        'academic_session_id',
        'term',
        'total_score',
        'total_obtainable',
        'average_score',
        'total_subjects',
        'position',
        'total_students_in_class',
        'overall_grade',
        'class_teacher_comment',
        'principal_comment',
        'promotion_status',
        'destination_class_id',
        'destination_class_name',
        'term1_average',
        'term2_average',
        'term3_average',
        'cumulative_average',
        'attendance_present',
        'attendance_total',
        'subject_results_snapshot',
        'assessment_configuration_snapshot',
        'grading_configuration_snapshot',
        'school_snapshot',
        'student_snapshot',
        'affective_snapshot',
        'psychomotor_snapshot',
        'pdf_path',
        'pdf_generated_at',
        'template_version',
        'status',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
        'withheld_reason',
    ];

    protected function casts(): array
    {
        return [
            'total_score' => 'decimal:2',
            'total_obtainable' => 'decimal:2',
            'average_score' => 'decimal:2',
            'term1_average' => 'decimal:2',
            'term2_average' => 'decimal:2',
            'term3_average' => 'decimal:2',
            'cumulative_average' => 'decimal:2',
            'subject_results_snapshot' => 'array',
            'assessment_configuration_snapshot' => 'array',
            'grading_configuration_snapshot' => 'array',
            'school_snapshot' => 'array',
            'student_snapshot' => 'array',
            'affective_snapshot' => 'array',
            'psychomotor_snapshot' => 'array',
            'pdf_generated_at' => 'datetime',
            'template_version' => 'integer',
            'approved_at' => 'datetime',
            'released_at' => 'datetime',
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

    public function academicSection(): BelongsTo
    {
        return $this->belongsTo(AcademicSection::class, 'academic_section_id');
    }

    public function destinationClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'destination_class_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'approved_by');
    }

    public function releaser(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'released_by');
    }

    public function accessTokens(): HasMany
    {
        return $this->hasMany(ReportCardAccessToken::class);
    }

    public function emailEvents(): HasMany
    {
        return $this->hasMany(EmailEvent::class);
    }
}
