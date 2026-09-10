<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\AssessmentConfiguration;
use App\Models\CbtSubmission;
use App\Models\CourseRegistration;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectResult;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ReportCardCalculationService
{
    /**
     * Normalize term identifier to canonical form ('1st Term', '2nd Term', '3rd Term').
     */
    public static function normalizeTerm(?string $term): string
    {
        if (!$term) return '1st Term';
        $cleaned = strtolower(str_replace([' ', '-', '_'], '', $term));
        if (in_array($cleaned, ['1stterm', 'firstterm', 'first', '1st', 'term1'], true)) {
            return '1st Term';
        }
        if (in_array($cleaned, ['2ndterm', 'secondterm', 'second', '2nd', 'term2'], true)) {
            return '2nd Term';
        }
        if (in_array($cleaned, ['3rdterm', 'thirdterm', 'third', '3rd', 'term3', 'annual'], true)) {
            return '3rd Term';
        }
        return $term;
    }

    /**
     * Get all compatible representations of a term.
     */
    public static function getTermVariants(?string $term): array
    {
        $normalized = self::normalizeTerm($term);
        return match ($normalized) {
            '1st Term' => ['1st Term', 'First Term', 'first_term', 'FIRST_TERM', '1st_term'],
            '2nd Term' => ['2nd Term', 'Second Term', 'second_term', 'SECOND_TERM', '2nd_term'],
            '3rd Term' => ['3rd Term', 'Third Term', 'third_term', 'THIRD_TERM', '3rd_term'],
            default => [$term],
        };
    }

    /**
     * Get default grading scale when none is configured in DB.
     */
    public static function getDefaultGradingScale(): array
    {
        return [
            ['grade' => 'A', 'min_score' => 75.00, 'max_score' => 100.00, 'grade_point' => 4.00, 'remark' => 'Excellent', 'is_pass' => true],
            ['grade' => 'B', 'min_score' => 65.00, 'max_score' => 74.99,  'grade_point' => 3.00, 'remark' => 'Very Good', 'is_pass' => true],
            ['grade' => 'C', 'min_score' => 50.00, 'max_score' => 64.99,  'grade_point' => 2.00, 'remark' => 'Credit', 'is_pass' => true],
            ['grade' => 'D', 'min_score' => 45.00, 'max_score' => 49.99,  'grade_point' => 1.00, 'remark' => 'Pass', 'is_pass' => true],
            ['grade' => 'E', 'min_score' => 40.00, 'max_score' => 44.99,  'grade_point' => 0.50, 'remark' => 'Fair', 'is_pass' => true],
            ['grade' => 'F', 'min_score' => 0.00,  'max_score' => 39.99,  'grade_point' => 0.00, 'remark' => 'Fail', 'is_pass' => false],
        ];
    }

    /**
     * Retrieve active grading scales for a specific class and session.
     */
    public function getGradingScaleForClassAndSession(?int $classId, ?int $sessionId): Collection
    {
        // 1. Exact class + session match
        if ($classId && $sessionId) {
            $scales = GradingScale::where('school_class_id', $classId)
                ->where('academic_session_id', $sessionId)
                ->orderBy('min_score', 'desc')
                ->get();
            if ($scales->isNotEmpty()) return $scales;
        }

        // 2. Class-specific match (any session)
        if ($classId) {
            $scales = GradingScale::where('school_class_id', $classId)
                ->whereNull('academic_session_id')
                ->orderBy('min_score', 'desc')
                ->get();
            if ($scales->isNotEmpty()) return $scales;
        }

        // 3. Session-specific global match
        if ($sessionId) {
            $scales = GradingScale::whereNull('school_class_id')
                ->where('academic_session_id', $sessionId)
                ->orderBy('min_score', 'desc')
                ->get();
            if ($scales->isNotEmpty()) return $scales;
        }

        // 4. Global database scales
        $scales = GradingScale::whereNull('school_class_id')
            ->whereNull('academic_session_id')
            ->orderBy('min_score', 'desc')
            ->get();
        if ($scales->isNotEmpty()) return $scales;

        // 5. Fallback defaults
        return collect(self::getDefaultGradingScale());
    }

    /**
     * Resolve grade and remark for a percentage score.
     */
    public function determineGradeAndRemark(float $percentage, ?int $classId, ?int $sessionId): array
    {
        $scales = $this->getGradingScaleForClassAndSession($classId, $sessionId);

        foreach ($scales as $scale) {
            $min = (float) (is_array($scale) ? $scale['min_score'] : $scale->min_score);
            $max = (float) (is_array($scale) ? $scale['max_score'] : $scale->max_score);

            if ($percentage >= $min && $percentage <= $max) {
                return [
                    'grade' => is_array($scale) ? $scale['grade'] : $scale->grade,
                    'remark' => is_array($scale) ? $scale['remark'] : $scale->remark,
                    'grade_point' => is_array($scale) ? ($scale['grade_point'] ?? null) : $scale->grade_point,
                    'is_pass' => is_array($scale) ? (bool) ($scale['is_pass'] ?? true) : (bool) $scale->is_pass,
                ];
            }
        }

        return ['grade' => 'F', 'remark' => 'Fail', 'grade_point' => 0.0, 'is_pass' => false];
    }

    /**
     * Get or create assessment configuration for a class/session/subject/term.
     */
    public function getAssessmentConfiguration(?int $classId, ?int $sessionId, ?int $subjectId, string $term): AssessmentConfiguration
    {
        $config = AssessmentConfiguration::query()
            ->when($classId, fn($q) => $q->where('school_class_id', $classId))
            ->when($sessionId, fn($q) => $q->where('academic_session_id', $sessionId))
            ->when($subjectId, fn($q) => $q->where('subject_id', $subjectId))
            ->where('term', $term)
            ->first();

        if (!$config && $subjectId) {
            // Fallback without subject
            $config = AssessmentConfiguration::query()
                ->when($classId, fn($q) => $q->where('school_class_id', $classId))
                ->when($sessionId, fn($q) => $q->where('academic_session_id', $sessionId))
                ->whereNull('subject_id')
                ->where('term', $term)
                ->first();
        }

        if (!$config) {
            // Global default
            return new AssessmentConfiguration([
                'school_class_id' => $classId,
                'academic_session_id' => $sessionId,
                'subject_id' => $subjectId,
                'term' => $term,
                'ca1_max' => 20.00,
                'ca2_max' => 20.00,
                'exam_max' => 60.00,
                'total_max' => 100.00,
                'exam_method' => 'written',
                'components' => [
                    ['key' => 'ca1', 'label' => 'CA 1', 'type' => 'continuous_assessment', 'max_score' => 20.0],
                    ['key' => 'ca2', 'label' => 'CA 2', 'type' => 'continuous_assessment', 'max_score' => 20.0],
                    ['key' => 'written', 'label' => 'Written Exam', 'type' => 'written', 'max_score' => 60.0],
                ],
            ]);
        }

        return $config;
    }

    /**
     * Calculate and persist a single subject result.
     */
    public function calculateSubjectResult(
        Student $student,
        SchoolClass $class,
        Subject $subject,
        AcademicSession $session,
        string $term,
        ?float $ca1,
        ?float $ca2,
        ?float $writtenExam,
        ?int $teacherId = null,
        array $componentScores = []
    ): SubjectResult {
        $config = $this->getAssessmentConfiguration($class->id, $session->id, $subject->id, $term);
        $components = $config->resolvedComponents();
        $hasCbt = collect($components)->contains(fn ($component) => ($component['type'] ?? null) === 'cbt');
        $hasWritten = collect($components)->contains(fn ($component) => ($component['type'] ?? null) === 'written');
        $examMethod = ($hasCbt && $hasWritten) || $config->exam_method === 'combined'
            ? 'combined'
            : ($hasCbt ? 'cbt' : 'written');
        $cbtSubmissionId = null;
        $cbtSubmission = null;
        if ($hasCbt) {
            $cbtSubmission = CbtSubmission::where('student_id', $student->id)
                ->whereNotNull('submitted_at')
                ->whereHas('test', function ($q) use ($subject, $class, $session, $term) {
                    $q->where('subject_id', $subject->id)
                        ->where('school_class_id', $class->id)
                        ->where('term', $term)
                        ->where(function ($sessionQuery) use ($session) {
                            $sessionQuery->where('academic_session_id', $session->id)
                                ->orWhereNull('academic_session_id');
                        });
                })
                ->latest('submitted_at')
                ->first();
            $cbtSubmissionId = $cbtSubmission?->id;
        }

        $componentScores = array_merge([
            'ca1' => $ca1,
            'ca2' => $ca2,
            'written' => $writtenExam,
        ], $componentScores);
        $resolvedScores = [];

        foreach ($components as $component) {
            $key = (string) $component['key'];
            $type = (string) ($component['type'] ?? $key);
            $max = (float) $component['max_score'];
            $value = $componentScores[$key] ?? null;

            if ($type === 'cbt') {
                if ($cbtSubmission) {
                    $percentage = (float) $cbtSubmission->percentage > 0
                        ? (float) $cbtSubmission->percentage
                        : (float) ($cbtSubmission?->score ?? 0);
                    $value = round(($percentage / 100) * $max, 2);
                } else {
                    $value = $componentScores[$key] ?? null;
                }
            }

            if ($value !== null && ($value < 0 || $value > $max)) {
                throw ValidationException::withMessages([
                    "assessment_scores.{$key}" => "{$component['label']} must be between 0 and {$max}.",
                ]);
            }

            $resolvedScores[$key] = $value === null ? null : round((float) $value, 2);
        }

        $totalMax = (float) $config->total_max;
        $totalScore = round(array_sum(array_map(fn ($value) => $value ?? 0, $resolvedScores)), 2);
        $percentage = $totalMax > 0 ? round(($totalScore / $totalMax) * 100.0, 2) : 0.0;

        $gradeInfo = $this->determineGradeAndRemark($percentage, $class->id, $session->id);

        $examScore = null;
        if ($examMethod === 'combined') {
            $examScore = round((float) ($resolvedScores['written'] ?? 0) + (float) ($resolvedScores['cbt'] ?? 0), 2);
        } else {
            $examScore = $resolvedScores['written'] ?? $resolvedScores['cbt'] ?? null;
        }

        return SubjectResult::updateOrCreate(
            [
                'student_id' => $student->id,
                'subject_id' => $subject->id,
                'academic_session_id' => $session->id,
                'term' => $term,
            ],
            [
                'school_class_id' => $class->id,
                'ca1_score' => $resolvedScores['ca1'] ?? null,
                'ca2_score' => $resolvedScores['ca2'] ?? null,
                'assessment_scores' => $resolvedScores,
                'cbt_submission_id' => $cbtSubmissionId,
                'exam_score' => $examScore,
                'exam_method' => $examMethod,
                'total_score' => $totalScore,
                'total_obtainable' => $totalMax,
                'percentage' => $percentage,
                'grade' => $gradeInfo['grade'],
                'grade_point' => $gradeInfo['grade_point'],
                'is_pass' => $gradeInfo['is_pass'],
                'remark' => $gradeInfo['remark'],
                'teacher_id' => $teacherId,
                'status' => 'draft',
            ]
        );
    }

    /**
     * Generate or recalculate the official ReportCard record for a student.
     */
    public function generateReportCard(Student $student, SchoolClass $class, AcademicSession $session, string $term): ReportCard
    {
        $existing = ReportCard::where('student_id', $student->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $term)
            ->first();

        // Released report cards are immutable historical records.
        if ($existing?->status === 'released') {
            return $existing;
        }

        $registrations = CourseRegistration::where('student_id', $student->id)
            ->where('school_class_id', $class->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $term)
            ->whereIn('status', ['registered', 'pending', 'approved', 'active'])
            ->get();

        $registeredSubjectIds = $registrations->pluck('subject_id');

        $subjectResults = SubjectResult::where('student_id', $student->id)
            ->where('school_class_id', $class->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $term)
            ->whereIn('subject_id', $registeredSubjectIds)
            ->with('subject:id,name,code')
            ->get();

        $totalSubjects = $subjectResults->count();
        $totalScore = $subjectResults->sum('total_score');
        $totalObtainable = $subjectResults->sum('total_obtainable');
        $averageScore = $totalSubjects > 0 ? round($subjectResults->avg('percentage'), 2) : 0.0;

        $overallGradeInfo = $this->determineGradeAndRemark($averageScore, $class->id, $session->id);

        $assessmentSnapshots = [];
        $termSubjectSnapshot = $subjectResults->map(function (SubjectResult $result) use ($class, $session, $term, &$assessmentSnapshots): array {
            $configuration = $this->getAssessmentConfiguration($class->id, $session->id, $result->subject_id, $term);
            $components = $configuration->resolvedComponents();
            $assessmentSnapshots[(string) $result->subject_id] = [
                'subject_id' => $result->subject_id,
                'total_max' => (float) $configuration->total_max,
                'components' => $components,
            ];

            $scores = $result->assessment_scores ?: [
                'ca1' => $result->ca1_score !== null ? (float) $result->ca1_score : null,
                'ca2' => $result->ca2_score !== null ? (float) $result->ca2_score : null,
                $result->exam_method === 'cbt' ? 'cbt' : 'written' => $result->exam_score !== null ? (float) $result->exam_score : null,
            ];

            return [
                'id' => $result->id,
                'subject_id' => $result->subject_id,
                'subject_name' => $result->subject?->name ?? 'Subject',
                'subject_code' => $result->subject?->code ?? '',
                'assessment_scores' => $scores,
                'ca1_score' => $result->ca1_score !== null ? (float) $result->ca1_score : null,
                'ca2_score' => $result->ca2_score !== null ? (float) $result->ca2_score : null,
                'exam_score' => $result->exam_score !== null ? (float) $result->exam_score : null,
                'exam_method' => $result->exam_method,
                'is_cbt' => collect($components)->contains(fn ($component) => ($component['type'] ?? null) === 'cbt'),
                'cbt_pending' => collect($components)->contains(fn ($component) => ($component['type'] ?? null) === 'cbt')
                    && data_get($scores, 'cbt') === null,
                'total_score' => (float) $result->total_score,
                'total_obtainable' => (float) $result->total_obtainable,
                'percentage' => (float) $result->percentage,
                'grade' => $result->grade,
                'grade_point' => $result->grade_point !== null ? (float) $result->grade_point : null,
                'is_pass' => (bool) $result->is_pass,
                'remark' => $result->remark,
            ];
        })->values()->all();

        // 2. Term separation & 3rd term cumulative logic
        $term1Avg = null;
        $term2Avg = null;
        $term3Avg = null;
        $cumulativeAvg = null;
        $promotionStatus = null;
        $destinationClassId = null;
        $destinationClassName = null;

        $isThirdTerm = in_array(strtolower(str_replace(' ', '', $term)), ['3rdterm', 'thirdterm', 'third_term']);
        $settings = SchoolSetting::getSettings();

        if ($isThirdTerm) {
            $prevReport1 = ReportCard::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->whereIn('term', ['1st Term', 'first_term', 'First Term'])
                ->first();

            $prevReport2 = ReportCard::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->whereIn('term', ['2nd Term', 'second_term', 'Second Term'])
                ->first();

            $term1Avg = $prevReport1 ? (float) $prevReport1->average_score : null;
            $term2Avg = $prevReport2 ? (float) $prevReport2->average_score : null;
            $term3Avg = $averageScore;

            // Apply the configured annual calculation and missing-term policy.
            $calcMethod = $settings->annual_calculation_method ?: 'equal';
            $weights = $settings->annual_term_weights ?: [33.33, 33.33, 33.34];
            $missingPolicy = $settings->missing_term_policy ?: 'average_available';

            if ($missingPolicy === 'require_all' && ($term1Avg === null || $term2Avg === null || $term3Avg === null)) {
                $cumulativeAvg = null;
            } elseif ($calcMethod === 'third_term_only') {
                $cumulativeAvg = $term3Avg;
            } elseif ($calcMethod === 'weighted' && is_array($weights) && count($weights) >= 3) {
                $w1 = (float) $weights[0];
                $w2 = (float) $weights[1];
                $w3 = (float) $weights[2];

                $weightedSum = 0.0;
                $weightTotal = 0.0;

                if ($term1Avg !== null) {
                    $weightedSum += ($term1Avg * ($w1 / 100.0));
                    $weightTotal += ($w1 / 100.0);
                }
                if ($term2Avg !== null) {
                    $weightedSum += ($term2Avg * ($w2 / 100.0));
                    $weightTotal += ($w2 / 100.0);
                }
                if ($term3Avg !== null) {
                    $weightedSum += ($term3Avg * ($w3 / 100.0));
                    $weightTotal += ($w3 / 100.0);
                }

                $cumulativeAvg = $weightTotal > 0 ? round($weightedSum / $weightTotal, 2) : $term3Avg;
            } else {
                // Equal weighting across available terms
                $validTerms = array_filter([$term1Avg, $term2Avg, $term3Avg], fn($v) => $v !== null);
                if (count($validTerms) > 0) {
                    $cumulativeAvg = round(array_sum($validTerms) / count($validTerms), 2);
                }
            }

            // Check if there's an existing StudentPromotion record for this student and session
            $promotionRecord = \App\Models\StudentPromotion::where('student_id', $student->id)
                ->where('from_session_id', $session->id)
                ->latest('promoted_at')
                ->first();

            if ($promotionRecord) {
                $promotionStatus = match ($promotionRecord->promotion_status) {
                    'promoted' => 'Promoted',
                    'promoted_on_trial' => 'Promoted on Trial',
                    'retained' => 'Not Promoted (Repeat)',
                    'graduated' => 'Graduated',
                    default => ucfirst(str_replace('_', ' ', $promotionRecord->promotion_status)),
                };
                $destinationClassId = $promotionRecord->to_class_id;
                $destinationClassName = $promotionRecord->toClass?->name;
            }

            if ($cumulativeAvg !== null) {
                $overallGradeInfo = $this->determineGradeAndRemark($cumulativeAvg, $class->id, $session->id);
            }
        }

        // Attendance stats for student in this term
        $attendanceCount = \App\Models\AttendanceRecord::where('student_id', $student->id)
            ->where('school_class_id', $class->id)
            ->where('term', $term)
            ->count();
        $presentCount = \App\Models\AttendanceRecord::where('student_id', $student->id)
            ->where('school_class_id', $class->id)
            ->where('term', $term)
            ->where('status', 'present')
            ->count();

        $class->loadMissing('academicSection:id,name');
        $settings = SchoolSetting::getSettings();
        $affective = \App\Models\AffectiveAssessment::where('student_id', $student->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $term)
            ->first();
        $psychomotor = \App\Models\PsychomotorAssessment::where('student_id', $student->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $term)
            ->first();

        $subjectSnapshot = $isThirdTerm
            ? $this->getThirdTermCumulativeSubjectBreakdown($student, $class, $session)
            : $termSubjectSnapshot;

        $reportCard = ReportCard::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_session_id' => $session->id,
                'term' => $term,
            ],
            [
                'school_class_id' => $class->id,
                'academic_section_id' => $class->academic_section_id,
                'academic_section_name' => $class->academicSection?->name,
                'class_name' => $class->name,
                'class_arm' => $class->arm,
                'total_score' => $totalScore,
                'total_obtainable' => $totalObtainable,
                'average_score' => $averageScore,
                'total_subjects' => $totalSubjects,
                'overall_grade' => $overallGradeInfo['grade'],
                'term1_average' => $term1Avg,
                'term2_average' => $term2Avg,
                'term3_average' => $term3Avg,
                'cumulative_average' => $cumulativeAvg,
                'promotion_status' => $promotionStatus,
                'destination_class_id' => $destinationClassId,
                'destination_class_name' => $destinationClassName,
                'attendance_present' => $presentCount,
                'attendance_total' => $attendanceCount,
                'subject_results_snapshot' => $subjectSnapshot,
                'assessment_configuration_snapshot' => array_values($assessmentSnapshots),
                'grading_configuration_snapshot' => $this->getGradingScaleForClassAndSession($class->id, $session->id)->values()->toArray(),
                'school_snapshot' => [
                    'name' => $settings->school_name,
                    'motto' => $settings->motto,
                    'address' => $settings->address,
                    'phone' => $settings->phone,
                    'email' => $settings->email,
                    'website' => $settings->website,
                    'logo_url' => $settings->logo_url,
                    'principal_name' => $settings->principal_name,
                    'principal_signature_url' => $settings->principal_signature_url,
                    'school_stamp_url' => $settings->school_stamp_url,
                    'report_card_theme' => $settings->report_card_theme,
                    'show_student_photo' => $settings->show_student_photo,
                    'show_grade_point' => $settings->show_grade_point,
                    'show_attendance' => $settings->show_attendance,
                    'show_teacher_signature' => $settings->show_teacher_signature,
                    'show_principal_signature' => $settings->show_principal_signature,
                    'show_school_stamp' => $settings->show_school_stamp,
                    'show_watermark' => $settings->show_watermark,
                    'show_promotion' => $settings->show_promotion,
                    'show_annual_summary' => $settings->show_annual_summary,
                    'show_position' => $settings->show_position,
                    'report_card_footer_text' => $settings->report_card_footer_text,
                ],
                'student_snapshot' => [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'student_id' => $student->student_id,
                    'admission_number' => $student->student_id,
                    'gender' => $student->gender,
                    'profile_picture' => $student->profile_picture,
                    'department' => $student->department,
                    'parent_name' => $student->parent_name,
                    'parent_phone' => $student->parent_phone,
                    'parent_email' => $student->parent_email,
                ],
                'affective_snapshot' => $affective?->ratings ?: [],
                'psychomotor_snapshot' => $psychomotor?->ratings ?: [],
                'pdf_path' => null,
                'pdf_generated_at' => null,
            ]
        );

        // Recalculate class ranks
        $this->updateClassPositions($class->id, $session->id, $term);

        return $reportCard->fresh();
    }

    /**
     * Return release-blocking completeness errors for an official result.
     */
    public function validateResultCompleteness(ReportCard $reportCard): array
    {
        $registrations = CourseRegistration::where('student_id', $reportCard->student_id)
            ->where('school_class_id', $reportCard->school_class_id)
            ->where('academic_session_id', $reportCard->academic_session_id)
            ->where('term', $reportCard->term)
            ->whereIn('status', CourseRegistration::ELIGIBLE_STATUSES)
            ->get();

        if ($registrations->isEmpty()) {
            return ['No active course registrations exist for this student, class, session, and term.'];
        }

        $results = SubjectResult::where('student_id', $reportCard->student_id)
            ->where('school_class_id', $reportCard->school_class_id)
            ->where('academic_session_id', $reportCard->academic_session_id)
            ->where('term', $reportCard->term)
            ->whereIn('subject_id', $registrations->pluck('subject_id'))
            ->get()
            ->keyBy('subject_id');

        $errors = [];
        foreach ($registrations as $registration) {
            $result = $results->get($registration->subject_id);
            if (!$result) {
                $errors[] = "Subject {$registration->subject_id} has no score record.";
                continue;
            }

            if (!in_array($result->status, ['submitted', 'class_teacher_reviewed', 'approved'], true)) {
                $errors[] = "Subject {$registration->subject_id} has not been submitted.";
            }

            $config = $this->getAssessmentConfiguration(
                $reportCard->school_class_id,
                $reportCard->academic_session_id,
                $registration->subject_id,
                $reportCard->term
            );
            $scores = $result->assessment_scores ?: [];
            foreach ($config->resolvedComponents() as $component) {
                if (!array_key_exists($component['key'], $scores) || $scores[$component['key']] === null) {
                    $errors[] = "Subject {$registration->subject_id} is missing {$component['label']}.";
                }
            }
        }

        if ($this->isThirdTerm($reportCard->term)
            && SchoolSetting::getSettings()->missing_term_policy === 'require_all'
            && ($reportCard->term1_average === null || $reportCard->term2_average === null || $reportCard->term3_average === null)) {
            $errors[] = 'Annual results require complete First, Second, and Third Term records.';
        }

        return array_values(array_unique($errors));
    }

    private function isThirdTerm(string $term): bool
    {
        return in_array(strtolower(str_replace([' ', '-'], '_', $term)), ['3rd_term', 'third_term'], true);
    }

    /**
     * Compute cumulative multi-term subject performance breakdown for 3rd Term Report Cards.
     */
    public function getThirdTermCumulativeSubjectBreakdown(
        Student $student,
        SchoolClass $class,
        AcademicSession $session
    ): array {
        $registeredSubjectIds = CourseRegistration::where('student_id', $student->id)
            ->where('school_class_id', $class->id)
            ->where('academic_session_id', $session->id)
            ->whereIn('term', ['3rd Term', 'third_term', 'Third Term'])
            ->pluck('subject_id')
            ->unique();

        if ($registeredSubjectIds->isEmpty()) {
            $registeredSubjectIds = SubjectResult::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->pluck('subject_id')
                ->unique();
        }

        $subjects = Subject::whereIn('id', $registeredSubjectIds)->get();
        $settings = SchoolSetting::getSettings();
        $calcMethod = $settings->annual_calculation_method ?: 'equal';
        $weights = $settings->annual_term_weights ?: [33.33, 33.33, 33.34];

        $breakdown = [];

        foreach ($subjects as $subject) {
            $r1 = SubjectResult::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->where('subject_id', $subject->id)
                ->whereIn('term', ['1st Term', 'first_term', 'First Term'])
                ->first();

            $r2 = SubjectResult::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->where('subject_id', $subject->id)
                ->whereIn('term', ['2nd Term', 'second_term', 'Second Term'])
                ->first();

            $r3 = SubjectResult::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->where('subject_id', $subject->id)
                ->whereIn('term', ['3rd Term', 'third_term', 'Third Term'])
                ->first();

            $t1 = $r1 ? (float) $r1->percentage : null;
            $t2 = $r2 ? (float) $r2->percentage : null;
            $t3 = $r3 ? (float) $r3->percentage : null;

            $annualAverage = null;
            $requiresAllTerms = ($settings->missing_term_policy ?? 'average_available') === 'require_all';

            if ($requiresAllTerms && ($t1 === null || $t2 === null || $t3 === null)) {
                $annualAverage = null;
            } elseif ($calcMethod === 'third_term_only') {
                $annualAverage = $t3 ?? 0.0;
            } elseif ($calcMethod === 'weighted' && is_array($weights) && count($weights) >= 3) {
                $w1 = (float) $weights[0];
                $w2 = (float) $weights[1];
                $w3 = (float) $weights[2];

                $weightedSum = 0.0;
                $weightTotal = 0.0;

                if ($t1 !== null) {
                    $weightedSum += ($t1 * ($w1 / 100.0));
                    $weightTotal += ($w1 / 100.0);
                }
                if ($t2 !== null) {
                    $weightedSum += ($t2 * ($w2 / 100.0));
                    $weightTotal += ($w2 / 100.0);
                }
                if ($t3 !== null) {
                    $weightedSum += ($t3 * ($w3 / 100.0));
                    $weightTotal += ($w3 / 100.0);
                }

                $annualAverage = $weightTotal > 0 ? round($weightedSum / $weightTotal, 2) : ($t3 ?? 0.0);
            } else {
                $validScores = array_filter([$t1, $t2, $t3], fn($v) => $v !== null);
                if (count($validScores) > 0) {
                    $annualAverage = round(array_sum($validScores) / count($validScores), 2);
                }
            }

            $gradeInfo = $this->determineGradeAndRemark($annualAverage ?? 0.0, $class->id, $session->id);

            $breakdown[] = [
                'id' => $r3?->id ?? $r2?->id ?? $r1?->id,
                'subject_id' => $subject->id,
                'subject_name' => $subject->name,
                'subject_code' => $subject->code,
                'term1_score' => $t1,
                'term2_score' => $t2,
                'term3_score' => $t3,
                'ca1_score' => $r3?->ca1_score !== null ? (float) $r3->ca1_score : null,
                'ca2_score' => $r3?->ca2_score !== null ? (float) $r3->ca2_score : null,
                'exam_score' => $r3?->exam_score !== null ? (float) $r3->exam_score : null,
                'exam_method' => $r3?->exam_method ?? 'written',
                'is_cbt' => ($r3?->exam_method ?? 'written') === 'cbt',
                'cbt_pending' => ($r3?->exam_method ?? 'written') === 'cbt' && $r3?->exam_score === null,
                'total_score' => $t3 ?? 0.0,
                'percentage' => $r3?->percentage ? (float) $r3->percentage : ($t3 ?? 0.0),
                'annual_average' => $annualAverage,
                'annual_grade' => $gradeInfo['grade'],
                'annual_remark' => $gradeInfo['remark'],
                'grade' => $gradeInfo['grade'],
                'remark' => $gradeInfo['remark'],
            ];
        }

        return $breakdown;
    }

    /**
     * Calculate and update student rankings for an entire class.
     */
    public function updateClassPositions(int $classId, int $sessionId, string $term): void
    {
        $reportCards = ReportCard::where('school_class_id', $classId)
            ->where('academic_session_id', $sessionId)
            ->where('term', $term)
            ->orderBy('average_score', 'desc')
            ->get();

        $totalInClass = $reportCards->count();
        $currentRank = 1;

        foreach ($reportCards as $index => $rc) {
            // Standard competition ranking
            if ($index > 0 && $rc->average_score < $reportCards[$index - 1]->average_score) {
                $currentRank = $index + 1;
            }

            $rc->update([
                'position' => $currentRank,
                'total_students_in_class' => $totalInClass,
            ]);
        }
    }
}
