<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_class_id',
        'academic_section_id',
        'academic_session_id',
        'subject_id',
        'term',
        'ca1_max',
        'ca2_max',
        'assignment_max',
        'test_max',
        'project_max',
        'attendance_max',
        'cbt_max',
        'written_max',
        'components',
        'exam_max',
        'total_max',
        'exam_method',
    ];

    protected function casts(): array
    {
        return [
            'ca1_max' => 'decimal:2',
            'ca2_max' => 'decimal:2',
            'assignment_max' => 'decimal:2',
            'test_max' => 'decimal:2',
            'project_max' => 'decimal:2',
            'attendance_max' => 'decimal:2',
            'cbt_max' => 'decimal:2',
            'written_max' => 'decimal:2',
            'components' => 'array',
            'exam_max' => 'decimal:2',
            'total_max' => 'decimal:2',
        ];
    }

    /**
     * Return the ordered assessment columns used by marksheets and report cards.
     */
    public function resolvedComponents(): array
    {
        if (is_array($this->components) && count($this->components) > 0) {
            return collect($this->components)
                ->filter(fn ($component) => (float) ($component['max_score'] ?? 0) > 0)
                ->values()
                ->all();
        }

        $components = [];
        $legacy = [
            ['key' => 'ca1', 'label' => 'CA 1', 'type' => 'continuous_assessment', 'max_score' => (float) $this->ca1_max],
            ['key' => 'ca2', 'label' => 'CA 2', 'type' => 'continuous_assessment', 'max_score' => (float) $this->ca2_max],
            ['key' => 'assignment', 'label' => 'Assignment', 'type' => 'assignment', 'max_score' => (float) $this->assignment_max],
            ['key' => 'test', 'label' => 'Test', 'type' => 'test', 'max_score' => (float) $this->test_max],
            ['key' => 'project', 'label' => 'Project', 'type' => 'project', 'max_score' => (float) $this->project_max],
            ['key' => 'attendance', 'label' => 'Attendance', 'type' => 'attendance', 'max_score' => (float) $this->attendance_max],
        ];

        foreach ($legacy as $component) {
            if ($component['max_score'] > 0) {
                $components[] = $component;
            }
        }

        if ((float) $this->cbt_max > 0) {
            $components[] = ['key' => 'cbt', 'label' => 'CBT', 'type' => 'cbt', 'max_score' => (float) $this->cbt_max];
        }
        if ((float) $this->written_max > 0) {
            $components[] = ['key' => 'written', 'label' => 'Written Exam', 'type' => 'written', 'max_score' => (float) $this->written_max];
        }

        if ((float) $this->cbt_max <= 0 && (float) $this->written_max <= 0 && (float) $this->exam_max > 0) {
            $isCbt = $this->exam_method === 'cbt';
            $components[] = [
                'key' => $isCbt ? 'cbt' : 'written',
                'label' => $isCbt ? 'CBT' : 'Written Exam',
                'type' => $isCbt ? 'cbt' : 'written',
                'max_score' => (float) $this->exam_max,
            ];
        }

        return $components;
    }

    public function academicSection(): BelongsTo
    {
        return $this->belongsTo(AcademicSection::class, 'academic_section_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
