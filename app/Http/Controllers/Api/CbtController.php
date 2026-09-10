<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\AcademicSession;
use App\Models\CbtAnswer;
use App\Models\CbtQuestion;
use App\Models\CbtSubmission;
use App\Models\CbtTest;
use App\Models\CourseRegistration;
use App\Models\SchoolClass;
use App\Models\SubjectResult;
use App\Models\SchoolSetting;
use App\Models\StudentNotification;
use App\Services\ReportCardCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CbtController extends Controller
{
    public function __construct(private readonly ReportCardCalculationService $calculator)
    {
    }

    // ─── CBT Tests CRUD (Teacher / Admin) ───────────────────

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $settings = SchoolSetting::getSettings();

        // Check if student and CBT is disabled
        if ($user->role === "student" && !($settings->cbt_enabled ?? true)) {
            return response()->json([
                "cbt_enabled" => false,
                "message" => "CBT Portal is currently closed by Administration.",
                "tests" => [],
            ], 200);
        }

        $relations = ["subject:id,name,code", "schoolClass:id,name,grade_level", "teacher:id,full_name"];
        if ($user->role !== 'student') {
            $relations[] = 'questions';
        }

        $query = CbtTest::with($relations)
            ->withCount(["questions", "submissions"]);

        if ($user->role === "teacher") {
            $query->where("teacher_id", $user->id);
        } elseif ($user->role === "student") {
            $classIds = $user->classes->pluck("id");
            
            // Get subjects registered by student
            $registeredSubjectIds = CourseRegistration::where("student_id", $user->id)
                ->whereIn("status", ["approved", "active", "registered"])
                ->pluck("subject_id")
                ->unique();

            $query->whereIn("school_class_id", $classIds)
                  ->whereIn("subject_id", $registeredSubjectIds)
                  ->where("is_published", true);
        }

        if ($request->filled("school_class_id")) {
            $query->where("school_class_id", $request->input("school_class_id"));
        }
        if ($request->filled("term")) {
            $query->where("term", $request->input("term"));
        }

        $tests = $query->latest()->get();

        return response()->json($tests);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            "title" => "required|string|max:255",
            "description" => "nullable|string",
            'instructions' => 'nullable|string',
            "school_class_id" => "required|exists:school_classes,id",
            "academic_section_id" => "nullable|exists:academic_sections,id",
            "academic_session_id" => "nullable|exists:academic_sessions,id",
            "subject_id" => "required|exists:subjects,id",
            "term" => "required|in:1st Term,2nd Term,3rd Term",
            "duration_minutes" => "required|integer|min:5|max:180",
            'total_questions' => 'nullable|integer|min:1',
            'total_marks' => 'nullable|numeric|min:1',
            "attempt_limit" => "nullable|integer|min:1|max:10",
            "randomize_questions" => "nullable|boolean",
            "randomize_options" => "nullable|boolean",
            "is_published" => "nullable|boolean",
            "start_time" => "nullable|date",
            "end_time" => "nullable|date|after:start_time",
            'status' => 'nullable|in:DRAFT,PENDING_APPROVAL,SCHEDULED,ACTIVE,COMPLETED,CANCELLED',
        ]);

        $assigned = DB::table('class_subject')
            ->where('school_class_id', $validated['school_class_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('teacher_id', $user->id)
            ->exists();
        if (!$assigned) {
            return response()->json(['message' => 'You are not assigned to teach this subject in the selected class.'], 403);
        }

        $validated["teacher_id"] = $user->id;
        $validated["attempt_limit"] = $validated["attempt_limit"] ?? 1;
        $validated['status'] = $validated['status'] ?? (!empty($validated['is_published']) ? 'ACTIVE' : 'DRAFT');
        $validated['academic_session_id'] = $validated['academic_session_id'] ?? AcademicSession::where('is_current', true)->value('id');
        $validated['academic_section_id'] = $validated['academic_section_id'] ?? SchoolClass::whereKey($validated['school_class_id'])->value('academic_section_id');

        $test = CbtTest::create($validated);

        if ($test->is_published) {
            $this->logAndNotifyPublish($test, $user);
        }

        return response()->json([
            "message" => "CBT test created successfully.",
            "test" => $test->load(["subject", "schoolClass"])
        ], 201);
    }

    public function show(Request $request, CbtTest $cbtTest): JsonResponse
    {
        if (!$this->ownsTest($request, $cbtTest)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(
            $cbtTest->load(["subject", "schoolClass", "teacher:id,full_name", "questions"])
        );
    }

    public function update(Request $request, CbtTest $cbtTest): JsonResponse
    {
        if (!$this->ownsTest($request, $cbtTest)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $wasPublished = $cbtTest->is_published;

        $validated = $request->validate([
            "title" => "sometimes|string|max:255",
            "description" => "nullable|string",
            'instructions' => 'nullable|string',
            "school_class_id" => "sometimes|exists:school_classes,id",
            "academic_section_id" => "nullable|exists:academic_sections,id",
            "academic_session_id" => "nullable|exists:academic_sessions,id",
            "subject_id" => "sometimes|exists:subjects,id",
            "term" => "sometimes|in:1st Term,2nd Term,3rd Term",
            "duration_minutes" => "sometimes|integer|min:5|max:180",
            'total_questions' => 'nullable|integer|min:1',
            'total_marks' => 'nullable|numeric|min:1',
            "attempt_limit" => "nullable|integer|min:1|max:10",
            "randomize_questions" => "nullable|boolean",
            "randomize_options" => "nullable|boolean",
            "is_published" => "nullable|boolean",
            "start_time" => "nullable|date",
            "end_time" => "nullable|date",
            'status' => 'sometimes|in:DRAFT,PENDING_APPROVAL,SCHEDULED,ACTIVE,COMPLETED,CANCELLED',
        ]);

        $classId = (int) ($validated['school_class_id'] ?? $cbtTest->school_class_id);
        $subjectId = (int) ($validated['subject_id'] ?? $cbtTest->subject_id);
        if (!DB::table('class_subject')->where('school_class_id', $classId)->where('subject_id', $subjectId)->where('teacher_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'You are not assigned to teach this subject in the selected class.'], 403);
        }

        $cbtTest->update($validated);

        if (!$wasPublished && ($cbtTest->is_published)) {
            $this->logAndNotifyPublish($cbtTest, $request->user());
        }

        return response()->json([
            "message" => "CBT test updated successfully.",
            "test" => $cbtTest->fresh()->load(["subject", "schoolClass"])
        ]);
    }

    public function destroy(Request $request, CbtTest $cbtTest): JsonResponse
    {
        if (!$this->ownsTest($request, $cbtTest)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($cbtTest->submissions()->exists()) {
            return response()->json(['message' => 'An exam with student attempts cannot be deleted. Cancel it instead.'], 409);
        }
        $cbtTest->delete();
        return response()->json(["message" => "CBT test deleted."]);
    }

    // ─── Questions CRUD & Approval Workflow ──────────────────

    public function storeQuestion(Request $request, CbtTest $cbtTest): JsonResponse
    {
        if (!$this->ownsTest($request, $cbtTest)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $validated = $request->validate([
            "question" => "required|string",
            "option_a" => "required|string",
            "option_b" => "required|string",
            "option_c" => "required|string",
            "option_d" => "required|string",
            "correct_answer" => "required|in:A,B,C,D",
            "points" => "nullable|integer|min:1",
            "status" => "nullable|in:draft,pending_review,approved",
        ]);

        $validated["cbt_test_id"] = $cbtTest->id;
        $validated["order"] = $cbtTest->questions()->count() + 1;
        $validated["status"] = $validated["status"] ?? "approved";

        $question = CbtQuestion::create($validated);

        return response()->json([
            "message" => "Question added successfully.",
            "question" => $question
        ], 201);
    }

    public function storeBulkQuestions(Request $request, CbtTest $cbtTest): JsonResponse
    {
        if (!$this->ownsTest($request, $cbtTest)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $validated = $request->validate([
            "questions" => "required|array|min:1",
            "questions.*.question" => "required|string",
            "questions.*.option_a" => "required|string",
            "questions.*.option_b" => "required|string",
            "questions.*.option_c" => "required|string",
            "questions.*.option_d" => "required|string",
            "questions.*.correct_answer" => "required|in:A,B,C,D",
            "questions.*.points" => "nullable|integer|min:1",
        ]);

        $startOrder = $cbtTest->questions()->count() + 1;
        $questions = [];

        foreach ($validated["questions"] as $i => $q) {
            $questions[] = CbtQuestion::create([
                "cbt_test_id" => $cbtTest->id,
                "question" => $q["question"],
                "option_a" => $q["option_a"],
                "option_b" => $q["option_b"],
                "option_c" => $q["option_c"],
                "option_d" => $q["option_d"],
                "correct_answer" => $q["correct_answer"],
                "points" => $q["points"] ?? 1,
                "order" => $startOrder + $i,
                "status" => "approved",
            ]);
        }

        return response()->json([
            "message" => count($questions) . " questions added successfully.",
            "questions" => $questions
        ], 201);
    }

    public function updateQuestion(Request $request, CbtQuestion $question): JsonResponse
    {
        if (!$this->ownsTest($request, $question->test)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $validated = $request->validate([
            "question" => "sometimes|string",
            "option_a" => "sometimes|string",
            "option_b" => "sometimes|string",
            "option_c" => "sometimes|string",
            "option_d" => "sometimes|string",
            "correct_answer" => "sometimes|in:A,B,C,D",
            "points" => "nullable|integer|min:1",
            "status" => "sometimes|in:draft,pending_review,approved,rejected",
        ]);

        $question->update($validated);

        return response()->json([
            "message" => "Question updated successfully.",
            "question" => $question
        ]);
    }

    public function destroyQuestion(Request $request, CbtQuestion $question): JsonResponse
    {
        if (!$this->ownsTest($request, $question->test)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $question->delete();
        return response()->json(["message" => "Question deleted."]);
    }

    public function approveQuestion(Request $request, CbtQuestion $question): JsonResponse
    {
        $admin = $request->user();
        $question->update([
            "status" => "approved",
            "approved_by" => $admin->id,
            "rejection_reason" => null,
        ]);

        AuditLog::create([
            "user_id" => $admin->id,
            "user_type" => "admin",
            "user_name" => $admin->full_name,
            "action" => "CBT_QUESTION_APPROVED",
            "details" => ["question_id" => $question->id, "cbt_test_id" => $question->cbt_test_id],
            "ip_address" => $request->ip(),
        ]);

        return response()->json([
            "message" => "CBT question approved for published exams.",
            "question" => $question
        ]);
    }

    public function rejectQuestion(Request $request, CbtQuestion $question): JsonResponse
    {
        $question->update([
            "status" => "rejected",
            "rejection_reason" => $request->input("reason", "Does not meet curriculum guidelines."),
        ]);

        return response()->json([
            "message" => "CBT question rejected.",
            "question" => $question
        ]);
    }

    // ─── Student: Take Exam ─────────────────────────────────

    public function startExam(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();
        $settings = SchoolSetting::getSettings();

        if (($student->status ?? 'active') !== 'active') {
            return response()->json(['message' => 'Your student account is not active.'], 403);
        }

        // Check if CBT is globally enabled
        if (!($settings->cbt_enabled ?? true)) {
            return response()->json(["message" => "CBT examination access is currently closed by Administration."], 403);
        }

        // Check if test is published
        if (!$cbtTest->is_published || in_array($cbtTest->status, ['DRAFT', 'PENDING_APPROVAL', 'CANCELLED', 'COMPLETED'], true)) {
            return response()->json(["message" => "This examination has not been published yet."], 403);
        }

        if (!$student->classes()->whereKey($cbtTest->school_class_id)->exists()) {
            return response()->json(['message' => 'This examination is not assigned to your class.'], 403);
        }

        // Check start and end window
        if ($cbtTest->start_time && now()->lt($cbtTest->start_time)) {
            return response()->json([
                "message" => "This examination is scheduled for " . $cbtTest->start_time->format("d M Y, h:i A") . " and is not open yet."
            ], 403);
        }

        if ($cbtTest->end_time && now()->gt($cbtTest->end_time)) {
            return response()->json(["message" => "This examination schedule window has expired."], 403);
        }

        // Check course registration
        $isRegistered = CourseRegistration::where("student_id", $student->id)
            ->where("school_class_id", $cbtTest->school_class_id)
            ->where("subject_id", $cbtTest->subject_id)
            ->where("term", $cbtTest->term)
            ->when($cbtTest->academic_session_id, fn ($query, $sessionId) => $query->where('academic_session_id', $sessionId))
            ->whereIn("status", ["approved", "active", "registered"])
            ->exists();

        if (!$isRegistered) {
            return response()->json([
                "message" => "You are not registered for this subject ({$cbtTest->subject?->name}) in {$cbtTest->term}. Please complete course registration first."
            ], 403);
        }

        $attemptLimit = $cbtTest->attempt_limit ?: 1;
        $submission = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->where("student_id", $student->id)
            ->whereNull('submitted_at')
            ->latest()
            ->first();

        if ($submission && $submission->started_at?->diffInSeconds(now()) > ((int) $cbtTest->duration_minutes * 60) + 30) {
            $submission->update(['status' => 'expired', 'submitted_at' => now()]);
            $submission = null;
        }

        $attemptCount = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->where('student_id', $student->id)
            ->count();

        if (!$submission && $attemptCount >= $attemptLimit) {
            return response()->json(["message" => "You have reached the maximum allowed attempts ({$attemptLimit}) for this exam."], 400);
        }

        // Get approved questions for this exam
        $questionsQuery = $cbtTest->questions()->where(function ($q) {
            $q->where("status", "approved")
              ->orWhereNull("status");
        });

        if (!$questionsQuery->exists()) {
            return response()->json(['message' => 'This examination has no approved questions.'], 422);
        }

        if (!$submission) {
            $submission = CbtSubmission::create([
                'cbt_test_id' => $cbtTest->id,
                'student_id' => $student->id,
                'started_at' => now(),
                'total_questions' => $questionsQuery->count(),
                'attempt_number' => $attemptCount + 1,
                'status' => 'in_progress',
            ]);
        }

        // Return questions WITHOUT correct answers (Security protection)
        $questions = $questionsQuery
            ->select("id", "cbt_test_id", "question", "option_a", "option_b", "option_c", "option_d", "points", "order")
            ->when($cbtTest->randomize_questions, fn ($query) => $query->inRandomOrder())
            ->when(!$cbtTest->randomize_questions, fn ($query) => $query->orderBy('order'))
            ->get();

        $questions->transform(function (CbtQuestion $question) use ($cbtTest): CbtQuestion {
            $options = collect([
                ['value' => 'A', 'label' => $question->option_a],
                ['value' => 'B', 'label' => $question->option_b],
                ['value' => 'C', 'label' => $question->option_c],
                ['value' => 'D', 'label' => $question->option_d],
            ]);
            if ($cbtTest->randomize_options) {
                $options = $options->shuffle();
            }
            $question->setAttribute('options', $options->values()->all());

            return $question;
        });

        $savedAnswers = CbtAnswer::where('cbt_submission_id', $submission->id)
            ->pluck('selected_answer', 'cbt_question_id');
        $elapsedSeconds = $submission->started_at ? $submission->started_at->diffInSeconds(now()) : 0;
        $totalSeconds = (int) $cbtTest->duration_minutes * 60;
        $remainingSeconds = max(0, $totalSeconds - $elapsedSeconds);

        return response()->json([
            "submission_id" => $submission->id,
            "test" => $cbtTest->load(["subject:id,name", "schoolClass:id,name"]),
            "questions" => $questions,
            "duration_minutes" => $cbtTest->duration_minutes,
            "started_at" => $submission->started_at,
            'attempt_number' => $submission->attempt_number,
            'saved_answers' => $savedAnswers,
            'remaining_seconds' => $remainingSeconds,
        ]);
    }

    /**
     * Student: Save an individual question answer (autosave / network disconnect recovery).
     */
    public function saveAnswer(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();
        $settings = SchoolSetting::getSettings();

        if (!($settings->cbt_enabled ?? true)) {
            return response()->json(['message' => 'CBT examination access is currently closed by Administration.'], 403);
        }

        $validated = $request->validate([
            'question_id' => 'required|exists:cbt_questions,id',
            'selected_answer' => 'required|in:A,B,C,D',
            'time_spent_seconds' => 'nullable|integer|min:0',
        ]);

        $submission = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->where('student_id', $student->id)
            ->whereNull('submitted_at')
            ->latest()
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'No active exam session found to save answer.'], 400);
        }

        $allowedSeconds = max(60, ((int) $cbtTest->duration_minutes * 60) + 30);
        $elapsedSeconds = $submission->started_at ? $submission->started_at->diffInSeconds(now()) : $allowedSeconds + 1;
        if ($elapsedSeconds > $allowedSeconds) {
            $submission->update(['status' => 'expired']);
            return response()->json(['message' => 'The examination duration has elapsed.'], 422);
        }

        $question = CbtQuestion::where('id', $validated['question_id'])
            ->where('cbt_test_id', $cbtTest->id)
            ->first();

        if (!$question) {
            return response()->json(['message' => 'The question does not belong to this test.'], 422);
        }

        $isCorrect = $question->correct_answer === $validated['selected_answer'];

        CbtAnswer::updateOrCreate(
            [
                'cbt_submission_id' => $submission->id,
                'cbt_question_id' => $question->id,
            ],
            [
                'selected_answer' => $validated['selected_answer'],
                'is_correct' => $isCorrect,
            ]
        );

        if (isset($validated['time_spent_seconds'])) {
            $submission->update(['duration_used' => min((int) $validated['time_spent_seconds'], $allowedSeconds)]);
        }

        $totalSeconds = (int) $cbtTest->duration_minutes * 60;

        return response()->json([
            'message' => 'Answer saved.',
            'saved' => true,
            'question_id' => $question->id,
            'selected_answer' => $validated['selected_answer'],
            'remaining_seconds' => max(0, $totalSeconds - $elapsedSeconds),
        ]);
    }

    public function submitExam(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();

        $validated = $request->validate([
            "answers" => "present|array",
            'answers.*.question_id' => 'required|distinct|exists:cbt_questions,id',
            "answers.*.selected_answer" => "required|in:A,B,C,D",
            "time_spent_seconds" => "nullable|integer",
        ]);

        $submission = CbtSubmission::where("cbt_test_id", $cbtTest->id)
            ->where("student_id", $student->id)
            ->whereNull("submitted_at")
            ->latest()
            ->first();

        if (!$submission) {
            return response()->json(["message" => "No active exam session found to submit."], 400);
        }

        if ($cbtTest->end_time && now()->gt($cbtTest->end_time)) {
            return response()->json(['message' => 'The examination window has closed.'], 422);
        }

        $allowedSeconds = max(60, ((int) $cbtTest->duration_minutes * 60) + 30);
        $elapsedSeconds = $submission->started_at ? $submission->started_at->diffInSeconds(now()) : $allowedSeconds + 1;
        if ($elapsedSeconds > $allowedSeconds) {
            $submission->update(['status' => 'expired']);
            return response()->json(['message' => 'The examination duration has elapsed.'], 422);
        }

        $correct = 0;
        $wrong = 0;
        $approvedQuestions = $cbtTest->questions()->where(function ($query) {
            $query->where('status', 'approved')->orWhereNull('status');
        })->get()->keyBy('id');
        $totalPoints = (float) $approvedQuestions->sum('points');
        $earnedPoints = 0;

        // Merge DB saved answers with request answers
        $existingDbAnswers = CbtAnswer::where('cbt_submission_id', $submission->id)
            ->pluck('selected_answer', 'cbt_question_id')
            ->toArray();

        $submittedAnswers = [];
        foreach ($validated["answers"] as $ans) {
            $submittedAnswers[$ans['question_id']] = $ans['selected_answer'];
        }
        $mergedAnswers = $submittedAnswers + $existingDbAnswers;

        foreach ($mergedAnswers as $questionId => $selectedAnswer) {
            $question = $approvedQuestions->get($questionId);
            if (!$question) {
                continue;
            }

            $isCorrect = $question->correct_answer === $selectedAnswer;
            if ($isCorrect) {
                $correct++;
                $earnedPoints += $question->points;
            } else {
                $wrong++;
            }

            CbtAnswer::updateOrCreate(
                [
                    "cbt_submission_id" => $submission->id,
                    "cbt_question_id" => $question->id,
                ],
                [
                    "selected_answer" => $selectedAnswer,
                    "is_correct" => $isCorrect,
                ]
            );
        }

        $wrong = max(0, $approvedQuestions->count() - $correct);

        $scorePercent = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100, 2) : 0;
        $durationUsed = min($elapsedSeconds, $allowedSeconds);
        $weightedScore = round(($scorePercent / 100) * (float) ($cbtTest->total_marks ?: $cbtTest->max_score), 2);

        $submission->update([
            "score" => $scorePercent,
            'raw_score' => $earnedPoints,
            'weighted_score' => $weightedScore,
            'percentage' => $scorePercent,
            "total_questions" => $approvedQuestions->count(),
            "correct_answers" => $correct,
            "wrong_answers" => $wrong,
            "time_spent_seconds" => $durationUsed,
            'duration_used' => $durationUsed,
            "submitted_at" => now(),
            'status' => 'submitted',
        ]);

        // Auto synchronize with SubjectResult if CBT/combined exam method is configured
        $assessmentConfig = \App\Models\AssessmentConfiguration::where("school_class_id", $cbtTest->school_class_id)
            ->when($cbtTest->academic_session_id, fn ($query, $sessionId) => $query->where('academic_session_id', $sessionId))
            ->where("subject_id", $cbtTest->subject_id)
            ->where("term", $cbtTest->term)
            ->first();

        if ($assessmentConfig && (
            $assessmentConfig->exam_method === 'cbt' ||
            $assessmentConfig->exam_method === 'combined' ||
            collect($assessmentConfig->resolvedComponents())->contains(fn ($component) => in_array($component['type'] ?? null, ['cbt', 'combined'], true))
        )) {
            $currentSession = $cbtTest->academicSession ?: AcademicSession::where("is_current", true)->first();
            if ($currentSession) {
                $existingResult = SubjectResult::where('student_id', $student->id)
                    ->where('subject_id', $cbtTest->subject_id)
                    ->where('academic_session_id', $currentSession->id)
                    ->where('term', $cbtTest->term)
                    ->first();
                $assessmentScores = $existingResult?->assessment_scores ?: [];
                $this->calculator->calculateSubjectResult(
                    $student,
                    $cbtTest->schoolClass,
                    $cbtTest->subject,
                    $currentSession,
                    $cbtTest->term,
                    $existingResult?->ca1_score !== null ? (float) $existingResult->ca1_score : null,
                    $existingResult?->ca2_score !== null ? (float) $existingResult->ca2_score : null,
                    isset($assessmentScores['written']) ? (float) $assessmentScores['written'] : null,
                    $existingResult?->teacher_id,
                    $assessmentScores
                );
            }
        }

        return response()->json([
            "message" => "Exam submitted successfully.",
            "submission" => $submission->fresh(),
            "score" => $scorePercent,
            "correct" => $correct,
            "wrong" => $wrong,
        ]);
    }

    // ─── Results & Review ───────────────────────────────────

    public function testResults(Request $request, CbtTest $cbtTest): JsonResponse
    {
        if (!$this->ownsTest($request, $cbtTest)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $submissions = CbtSubmission::where("cbt_test_id", $cbtTest->id)
            ->with(["student:id,full_name,student_id", "answers.question"])
            ->get();

        return response()->json([
            "test" => $cbtTest->load(["subject:id,name", "schoolClass:id,name"]),
            "submissions" => $submissions,
        ]);
    }

    public function myResult(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();

        $submission = CbtSubmission::where("cbt_test_id", $cbtTest->id)
            ->where("student_id", $student->id)
            ->with(["answers.question"])
            ->first();

        if (!$submission) {
            return response()->json(["message" => "No submission found."], 404);
        }

        return response()->json([
            "test" => $cbtTest->load(["subject:id,name", "schoolClass:id,name"]),
            "submission" => $submission,
        ]);
    }

    public function classCounts(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === "student") {
            $classIds = $user->classes->pluck("id");
        } elseif ($user->role === "teacher") {
            $classIds = CbtTest::where("teacher_id", $user->id)->pluck("school_class_id")->unique();
        } else {
            $classIds = CbtTest::pluck("school_class_id")->unique();
        }

        $counts = CbtTest::whereIn("school_class_id", $classIds)
            ->where("is_published", true)
            ->selectRaw("school_class_id, count(*) as total")
            ->groupBy("school_class_id")
            ->with("schoolClass:id,name")
            ->get();

        return response()->json($counts);
    }

    public function allSubmissions(Request $request): JsonResponse
    {
        $query = CbtSubmission::with([
            "test:id,title,subject_id,school_class_id", 
            "test.subject:id,name", 
            "test.schoolClass:id,name", 
            "student:id,full_name,student_id"
        ]);

        if ($request->filled("status")) {
            if ($request->input("status") === "pending") {
                $query->where("result_released", false);
            } else if ($request->input("status") === "released") {
                $query->where("result_released", true);
            }
        }

        return response()->json($query->latest("submitted_at")->get());
    }

    public function releaseResult(Request $request, CbtSubmission $submission): JsonResponse
    {
        $submission->update(["result_released" => true]);

        return response()->json([
            "message" => "Result released successfully.",
            "submission" => $submission->fresh()->load([
                "test:id,title,subject_id,school_class_id", 
                "test.subject:id,name", 
                "test.schoolClass:id,name", 
                "student:id,full_name,student_id"
            ])
        ]);
    }

    public function releaseAllPending(Request $request): JsonResponse
    {
        CbtSubmission::where("result_released", false)->update(["result_released" => true]);

        return response()->json([
            "message" => "All pending results have been released successfully."
        ]);
    }

    private function logAndNotifyPublish(CbtTest $test, $user): void
    {
        AuditLog::create([
            "user_id" => $user->id,
            "user_type" => $user->role ?? "teacher",
            "user_name" => $user->full_name,
            "action" => "CBT_EXAM_PUBLISHED",
            "details" => ["cbt_test_id" => $test->id, "title" => $test->title, "class_id" => $test->school_class_id],
            "ip_address" => request()->ip(),
        ]);

        // Notify class students
        $class = $test->schoolClass()->with("students:id")->first();
        if ($class) {
            foreach ($class->students as $student) {
                StudentNotification::create([
                    "user_id" => $student->id,
                    "user_type" => "student",
                    "title" => "New CBT Published: {$test->title}",
                    "message" => "A new CBT exam ({$test->title}) is now active for your class. Duration: {$test->duration_minutes} mins.",
                    "link" => "/student/cbt",
                    "type" => "cbt_published",
                ]);
            }
        }
    }

    private function ownsTest(Request $request, CbtTest $test): bool
    {
        $user = $request->user();

        return $user && ($user->role === 'admin' || ($user->role === 'teacher' && $test->teacher_id === $user->id));
    }
}
