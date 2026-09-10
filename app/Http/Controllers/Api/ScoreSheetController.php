<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AffectiveAssessment;
use App\Models\AssessmentConfiguration;
use App\Models\AuditLog;
use App\Models\CbtSubmission;
use App\Models\CourseRegistration;
use App\Models\PsychomotorAssessment;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectResult;
use App\Services\ReportCardCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScoreSheetController extends Controller
{
    public function __construct(
        protected ReportCardCalculationService $calculator
    ) {}

    /**
     * Check if the authenticated user is authorized to manage scores for this class and subject.
     */
    protected function authorizeTeacherForSubject(Request $request, int $classId, int $subjectId): bool
    {
        $user = $request->user();
        if (!$user) return false;
        if ($user->role === "admin") return true;

        if ($user->role === "teacher") {
            // Check if assigned in class_subject pivot table
            $assigned = DB::table("class_subject")
                ->where("school_class_id", $classId)
                ->where("subject_id", $subjectId)
                ->where("teacher_id", $user->id)
                ->exists();

            if ($assigned) return true;

            // Check if this teacher is the overall class teacher
            $isClassTeacher = SchoolClass::where("id", $classId)
                ->where("teacher_id", $user->id)
                ->exists();

            if ($isClassTeacher) return true;
        }

        return false;
    }

    /**
     * Teacher: Get score sheet for Class, Session, Term, and Subject.
     * Automatically retrieves ONLY students who registered for this subject.
     */
    public function getScoreSheet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "school_class_id" => "required|exists:school_classes,id",
            "academic_session_id" => "required|exists:academic_sessions,id",
            "term" => "required|string",
            "subject_id" => "required|exists:subjects,id",
        ]);

        $classId = (int) $validated["school_class_id"];
        $subjectId = (int) $validated["subject_id"];

        if (!$this->authorizeTeacherForSubject($request, $classId, $subjectId)) {
            return response()->json([
                "message" => "Unauthorized. You are not assigned to teach this subject in this class."
            ], 403);
        }

        $class = SchoolClass::findOrFail($classId);
        $session = AcademicSession::findOrFail($validated["academic_session_id"]);
        $subject = Subject::findOrFail($subjectId);
        $term = $validated["term"];

        // Get assessment config
        $config = $this->calculator->getAssessmentConfiguration($class->id, $session->id, $subject->id, $term);
        $components = $config->resolvedComponents();
        $hasCbt = collect($components)->contains(fn ($component) => ($component['type'] ?? null) === 'cbt');

        // Fetch students who registered for this subject in this class, session, and term
        $registeredStudentIds = CourseRegistration::where("school_class_id", $class->id)
            ->where("academic_session_id", $session->id)
            ->where("term", $term)
            ->where("subject_id", $subject->id)
            ->whereIn('status', CourseRegistration::ELIGIBLE_STATUSES)
            ->pluck("student_id");

        $students = Student::whereIn("id", $registeredStudentIds)
            ->where('status', 'active')
            ->whereHas('classes', fn ($query) => $query->where('school_classes.id', $class->id))
            ->orderBy("full_name")
            ->get();

        $rows = [];
        $isLocked = false;

        foreach ($students as $student) {
            // Find existing subject result
            $result = SubjectResult::where("student_id", $student->id)
                ->where("school_class_id", $class->id)
                ->where("academic_session_id", $session->id)
                ->where("term", $term)
                ->where("subject_id", $subject->id)
                ->first();

            if ($result && in_array($result->status, ["approved", "released", "locked"])) {
                $isLocked = true;
            }

            // Check CBT status if examMethod is CBT
            $cbtScore = null;
            $cbtPending = false;
            $cbtSubmission = null;

            if ($hasCbt) {
                $cbtSubmission = CbtSubmission::where("student_id", $student->id)
                    ->whereNotNull('submitted_at')
                    ->whereHas("test", function ($q) use ($subject, $class, $session, $term) {
                        $q->where("subject_id", $subject->id)
                          ->where("school_class_id", $class->id)
                          ->where("term", $term)
                          ->where(function ($sessionQuery) use ($session) {
                              $sessionQuery->where('academic_session_id', $session->id)
                                  ->orWhereNull('academic_session_id');
                          });
                    })
                    ->latest('submitted_at')
                    ->first();

                if ($cbtSubmission && $cbtSubmission->submitted_at) {
                    $cbtComponent = collect($components)->firstWhere('type', 'cbt');
                    $percentage = (float) $cbtSubmission->percentage > 0
                        ? (float) $cbtSubmission->percentage
                        : (float) $cbtSubmission->score;
                    $cbtScore = round(($percentage / 100.0) * (float) $cbtComponent['max_score'], 2);
                } else {
                    $cbtPending = true;
                }
            }

            $assessmentScores = $result?->assessment_scores ?: [
                'ca1' => $result?->ca1_score !== null ? (float) $result->ca1_score : null,
                'ca2' => $result?->ca2_score !== null ? (float) $result->ca2_score : null,
                $result?->exam_method === 'cbt' ? 'cbt' : 'written' => $result?->exam_score !== null ? (float) $result->exam_score : null,
            ];
            if ($hasCbt) {
                $assessmentScores['cbt'] = $cbtScore;
            }

            $ca1 = $assessmentScores['ca1'] ?? null;
            $ca2 = $assessmentScores['ca2'] ?? null;
            $exam = $assessmentScores['written'] ?? $assessmentScores['cbt'] ?? null;
            $total = round(array_sum(array_map(fn ($score) => $score ?? 0, $assessmentScores)), 2);
            $totalMax = (float) $config->total_max;
            $percentage = $totalMax > 0 ? round(($total / $totalMax) * 100.0, 2) : 0.0;

            $gradeInfo = $this->calculator->determineGradeAndRemark($percentage, $class->id, $session->id);

            $rows[] = [
                "student_id" => $student->id,
                "student_name" => $student->full_name,
                "student_identifier" => $student->student_id,
                "ca1_score" => $ca1,
                "ca2_score" => $ca2,
                "exam_score" => $exam,
                'assessment_scores' => $assessmentScores,
                "is_cbt" => $hasCbt,
                "cbt_pending" => $cbtPending,
                "cbt_raw_percent" => $cbtSubmission?->score,
                "total_score" => $total,
                "percentage" => $percentage,
                "grade" => $result?->grade ?: $gradeInfo["grade"],
                "remark" => $result?->remark ?: $gradeInfo["remark"],
                "status" => $result?->status ?: "draft",
            ];
        }

        return response()->json([
            "class" => ["id" => $class->id, "name" => $class->name],
            "session" => ["id" => $session->id, "name" => $session->name],
            "subject" => ["id" => $subject->id, "name" => $subject->name, "code" => $subject->code],
            "term" => $term,
            "is_locked" => $isLocked,
            "config" => [
                "ca1_max" => (float) $config->ca1_max,
                "ca2_max" => (float) $config->ca2_max,
                "exam_max" => (float) $config->exam_max,
                "total_max" => (float) $config->total_max,
                "exam_method" => $config->exam_method,
                'components' => $components,
            ],
            "students" => $rows,
            "total_registered" => count($rows),
        ]);
    }

    /**
     * Teacher: Bulk save / update score sheet entries.
     */
    public function saveScoreSheet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "school_class_id" => "required|exists:school_classes,id",
            "academic_session_id" => "required|exists:academic_sessions,id",
            "term" => "required|string",
            "subject_id" => "required|exists:subjects,id",
            "scores" => "required|array",
            "scores.*.student_id" => "required|exists:students,id",
            "scores.*.ca1_score" => "nullable|numeric|min:0",
            "scores.*.ca2_score" => "nullable|numeric|min:0",
            "scores.*.exam_score" => "nullable|numeric|min:0",
            'scores.*.assessment_scores' => 'nullable|array',
            'scores.*.assessment_scores.*' => 'nullable|numeric|min:0',
        ]);

        $classId = (int) $validated["school_class_id"];
        $subjectId = (int) $validated["subject_id"];

        if (!$this->authorizeTeacherForSubject($request, $classId, $subjectId)) {
            return response()->json([
                "message" => "Unauthorized. You are not assigned to teach this subject in this class."
            ], 403);
        }

        $class = SchoolClass::findOrFail($classId);
        $session = AcademicSession::findOrFail($validated["academic_session_id"]);
        $subject = Subject::findOrFail($subjectId);
        $term = $validated["term"];
        $teacher = $request->user();

        // Check if marksheet is locked/approved
        $isLocked = ReportCard::where("school_class_id", $classId)
            ->where("academic_session_id", $session->id)
            ->where("term", $term)
            ->whereIn("status", ["approved", "released", "locked"])
            ->exists()
            || SubjectResult::where("school_class_id", $classId)
            ->where("academic_session_id", $session->id)
            ->where("term", $term)
            ->where("subject_id", $subjectId)
            ->whereIn("status", ["approved", "released", "locked"])
            ->exists();

        if ($isLocked) {
            return response()->json([
                "message" => "Cannot edit scores. Results for this subject have been approved or released by administration."
            ], 422);
        }

        $students = Student::whereIn('id', collect($validated['scores'])->pluck('student_id'))
            ->get()
            ->keyBy('id');

        foreach ($validated["scores"] as $entry) {
            $student = $students->get($entry['student_id']);

            $eligible = CourseRegistration::where('student_id', $student->id)
                ->where('school_class_id', $class->id)
                ->where('subject_id', $subject->id)
                ->where('academic_session_id', $session->id)
                ->where('term', $term)
                ->whereIn('status', ['registered', 'pending', 'approved', 'active'])
                ->exists()
                && $student->classes()->whereKey($class->id)->exists();

            if (!$eligible) {
                return response()->json([
                    'message' => "Student {$student->student_id} is not eligible for this marksheet.",
                ], 422);
            }
        }

        $savedCount = 0;
        DB::transaction(function () use ($validated, $students, $class, $subject, $session, $term, $teacher, &$savedCount): void {
            foreach ($validated['scores'] as $entry) {
                $student = $students->get($entry['student_id']);

                $this->calculator->calculateSubjectResult(
                    $student,
                    $class,
                    $subject,
                    $session,
                    $term,
                    isset($entry['ca1_score']) && $entry['ca1_score'] !== '' ? (float) $entry['ca1_score'] : null,
                    isset($entry['ca2_score']) && $entry['ca2_score'] !== '' ? (float) $entry['ca2_score'] : null,
                    isset($entry['exam_score']) && $entry['exam_score'] !== '' ? (float) $entry['exam_score'] : null,
                    $teacher?->id,
                    $entry['assessment_scores'] ?? []
                );

                $this->calculator->generateReportCard($student, $class, $session, $term);
                $savedCount++;
            }
        });

        $this->calculator->updateClassPositions($class->id, $session->id, $term);

        return response()->json([
            "message" => "Scores for {$savedCount} student(s) saved successfully.",
            "count" => $savedCount,
        ]);
    }

    /**
     * Teacher: Submit marksheet to Admin for approval.
     */
    public function submitScoreSheet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "school_class_id" => "required|exists:school_classes,id",
            "academic_session_id" => "required|exists:academic_sessions,id",
            "term" => "required|string",
            "subject_id" => "required|exists:subjects,id",
        ]);

        $classId = (int) $validated["school_class_id"];
        $subjectId = (int) $validated["subject_id"];

        if (!$this->authorizeTeacherForSubject($request, $classId, $subjectId)) {
            return response()->json([
                "message" => "Unauthorized. You are not assigned to teach this subject in this class."
            ], 403);
        }

        $teacher = $request->user();

        $results = SubjectResult::where("school_class_id", $classId)
            ->where("academic_session_id", $validated["academic_session_id"])
            ->where("term", $validated["term"])
            ->where("subject_id", $subjectId)
            ->get();

        if ($results->isEmpty()) {
            return response()->json(['message' => 'No scores exist to submit.'], 422);
        }

        $config = $this->calculator->getAssessmentConfiguration($classId, $validated['academic_session_id'], $subjectId, $validated['term']);
        foreach ($results as $result) {
            $scores = $result->assessment_scores ?: [];
            foreach ($config->resolvedComponents() as $component) {
                if (!array_key_exists($component['key'], $scores) || $scores[$component['key']] === null) {
                    return response()->json([
                        'message' => "Cannot submit: {$component['label']} is missing for student {$result->student_id}.",
                    ], 422);
                }
            }
        }

        SubjectResult::whereKey($results->pluck('id'))->update(["status" => "submitted", 'submitted_at' => now()]);

        foreach ($results->pluck('student_id')->unique() as $studentId) {
            $registrationSubjectIds = CourseRegistration::where('student_id', $studentId)
                ->where('school_class_id', $classId)
                ->where('academic_session_id', $validated['academic_session_id'])
                ->where('term', $validated['term'])
                ->whereIn('status', ['registered', 'pending', 'approved', 'active'])
                ->pluck('subject_id');
            $submittedCount = SubjectResult::where('student_id', $studentId)
                ->where('school_class_id', $classId)
                ->where('academic_session_id', $validated['academic_session_id'])
                ->where('term', $validated['term'])
                ->whereIn('subject_id', $registrationSubjectIds)
                ->whereIn('status', ['submitted', 'approved'])
                ->count();

            if ($registrationSubjectIds->isNotEmpty() && $submittedCount === $registrationSubjectIds->unique()->count()) {
                ReportCard::where('student_id', $studentId)
                    ->where('academic_session_id', $validated['academic_session_id'])
                    ->where('term', $validated['term'])
                    ->where('status', 'draft')
                    ->update(['status' => 'submitted']);
            }
        }

        AuditLog::record(
            "RESULT_SUBMITTED",
            null,
            $validated["academic_session_id"],
            $validated["term"],
            [
                "school_class_id" => $classId,
                "subject_id" => $subjectId,
                "submitted_by" => $teacher->name ?? $teacher->full_name,
            ]
        );

        return response()->json([
            "message" => "Score sheet successfully submitted to Admin for approval.",
        ]);
    }

    /**
     * Teacher: Get Affective and Psychomotor assessments for students in class.
     */
    public function getAffectiveAndPsychomotor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "school_class_id" => "required|exists:school_classes,id",
            "academic_session_id" => "required|exists:academic_sessions,id",
            "term" => "required|string",
        ]);

        $settings = SchoolSetting::getSettings();
        $class = SchoolClass::with("students")->findOrFail($validated["school_class_id"]);
        $session = AcademicSession::findOrFail($validated["academic_session_id"]);
        $term = $validated["term"];

        $studentsData = [];
        foreach ($class->students as $student) {
            $affective = AffectiveAssessment::where("student_id", $student->id)
                ->where("academic_session_id", $session->id)
                ->where("term", $term)
                ->first();

            $psychomotor = PsychomotorAssessment::where("student_id", $student->id)
                ->where("academic_session_id", $session->id)
                ->where("term", $term)
                ->first();

            $reportCard = ReportCard::where("student_id", $student->id)
                ->where("academic_session_id", $session->id)
                ->where("term", $term)
                ->first();

            $studentsData[] = [
                "student_id" => $student->id,
                "student_name" => $student->full_name,
                "student_identifier" => $student->student_id,
                "affective_ratings" => $affective?->ratings ?: [],
                "psychomotor_ratings" => $psychomotor?->ratings ?: [],
                "class_teacher_comment" => $reportCard?->class_teacher_comment ?: "",
                "principal_comment" => $reportCard?->principal_comment ?: "",
            ];
        }

        return response()->json([
            "affective_traits" => $settings->affective_traits ?: ["Punctuality", "Neatness", "Honesty", "Cooperation", "Responsibility", "Attitude"],
            "psychomotor_traits" => $settings->psychomotor_traits ?: ["Handwriting", "Drawing", "Sports", "Practical Skills", "Coordination"],
            "max_rating_scale" => $settings->max_rating_scale ?: 5,
            "students" => $studentsData,
        ]);
    }

    /**
     * Teacher: Save Affective, Psychomotor ratings and comments.
     * Restricted to assigned Class Teacher or Admin.
     */
    public function saveAffectiveAndPsychomotor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "school_class_id" => "required|exists:school_classes,id",
            "academic_session_id" => "required|exists:academic_sessions,id",
            "term" => "required|string",
            "entries" => "required|array",
            "entries.*.student_id" => "required|exists:students,id",
            "entries.*.affective_ratings" => "nullable|array",
            "entries.*.psychomotor_ratings" => "nullable|array",
            "entries.*.class_teacher_comment" => "nullable|string|max:1000",
            "entries.*.principal_comment" => "nullable|string|max:1000",
        ]);

        $classId = (int) $validated["school_class_id"];
        $sessionId = (int) $validated["academic_session_id"];
        $term = $validated["term"];
        $user = $request->user();

        // Check if class teacher or admin
        $class = SchoolClass::findOrFail($classId);
        if ($user->role === "teacher" && $class->teacher_id !== $user->id) {
            return response()->json([
                "message" => "Unauthorized. Only the assigned Class Teacher can record class teacher remarks and behavioral ratings."
            ], 403);
        }

        foreach ($validated["entries"] as $entry) {
            $studentId = $entry["student_id"];

            if (isset($entry["affective_ratings"])) {
                AffectiveAssessment::updateOrCreate(
                    ["student_id" => $studentId, "academic_session_id" => $sessionId, "term" => $term],
                    ["school_class_id" => $classId, "ratings" => $entry["affective_ratings"], "teacher_id" => $user?->id]
                );
            }

            if (isset($entry["psychomotor_ratings"])) {
                PsychomotorAssessment::updateOrCreate(
                    ["student_id" => $studentId, "academic_session_id" => $sessionId, "term" => $term],
                    ["school_class_id" => $classId, "ratings" => $entry["psychomotor_ratings"], "teacher_id" => $user?->id]
                );
            }

            $updateComments = [];
            if (isset($entry["class_teacher_comment"])) {
                $updateComments["class_teacher_comment"] = $entry["class_teacher_comment"];
            }
            if (isset($entry["principal_comment"]) && $user->role === "admin") {
                $updateComments["principal_comment"] = $entry["principal_comment"];
            }

            if (!empty($updateComments)) {
                ReportCard::updateOrCreate(
                    ["student_id" => $studentId, "academic_session_id" => $sessionId, "term" => $term],
                    array_merge(["school_class_id" => $classId], $updateComments)
                );
            }
        }

        return response()->json([
            "message" => "Affective, psychomotor ratings and comments saved successfully.",
        ]);
    }
}
