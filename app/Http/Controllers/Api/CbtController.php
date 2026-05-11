<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtAnswer;
use App\Models\CbtQuestion;
use App\Models\CbtSubmission;
use App\Models\CbtTest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CbtController extends Controller
{
    // ─── CBT Tests CRUD (Teacher) ───────────────────────────

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = CbtTest::with(['subject:id,name,code', 'schoolClass:id,name,grade_level', 'teacher:id,full_name', 'questions'])
            ->withCount(['questions', 'submissions']);

        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        } elseif ($user->role === 'student') {
            $classIds = $user->classes->pluck('id');
            $query->whereIn('school_class_id', $classIds)
                  ->where('is_published', true);
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->input('school_class_id'));
        }
        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'school_class_id' => 'required|exists:school_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'term' => 'required|in:1st Term,2nd Term,3rd Term',
            'duration_minutes' => 'required|integer|min:5|max:180',
            'is_published' => 'nullable|boolean',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
        ]);

        $validated['teacher_id'] = $user->id;

        $test = CbtTest::create($validated);

        return response()->json([
            'message' => 'CBT test created successfully.',
            'test' => $test->load(['subject', 'schoolClass'])
        ], 201);
    }

    public function show(CbtTest $cbtTest): JsonResponse
    {
        return response()->json(
            $cbtTest->load(['subject', 'schoolClass', 'teacher:id,full_name', 'questions'])
        );
    }

    public function update(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'school_class_id' => 'sometimes|exists:school_classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'term' => 'sometimes|in:1st Term,2nd Term,3rd Term',
            'duration_minutes' => 'sometimes|integer|min:5|max:180',
            'is_published' => 'nullable|boolean',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
        ]);

        $cbtTest->update($validated);

        return response()->json([
            'message' => 'CBT test updated successfully.',
            'test' => $cbtTest->fresh()->load(['subject', 'schoolClass'])
        ]);
    }

    public function destroy(CbtTest $cbtTest): JsonResponse
    {
        $cbtTest->delete();
        return response()->json(['message' => 'CBT test deleted.']);
    }

    // ─── Questions CRUD ─────────────────────────────────────

    public function storeQuestion(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string',
            'option_a' => 'required|string',
            'option_b' => 'required|string',
            'option_c' => 'required|string',
            'option_d' => 'required|string',
            'correct_answer' => 'required|in:A,B,C,D',
            'points' => 'nullable|integer|min:1',
        ]);

        $validated['cbt_test_id'] = $cbtTest->id;
        $validated['order'] = $cbtTest->questions()->count() + 1;

        $question = CbtQuestion::create($validated);

        return response()->json([
            'message' => 'Question added successfully.',
            'question' => $question
        ], 201);
    }

    public function storeBulkQuestions(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $validated = $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.question' => 'required|string',
            'questions.*.option_a' => 'required|string',
            'questions.*.option_b' => 'required|string',
            'questions.*.option_c' => 'required|string',
            'questions.*.option_d' => 'required|string',
            'questions.*.correct_answer' => 'required|in:A,B,C,D',
            'questions.*.points' => 'nullable|integer|min:1',
        ]);

        $startOrder = $cbtTest->questions()->count() + 1;
        $questions = [];

        foreach ($validated['questions'] as $i => $q) {
            $questions[] = CbtQuestion::create([
                'cbt_test_id' => $cbtTest->id,
                'question' => $q['question'],
                'option_a' => $q['option_a'],
                'option_b' => $q['option_b'],
                'option_c' => $q['option_c'],
                'option_d' => $q['option_d'],
                'correct_answer' => $q['correct_answer'],
                'points' => $q['points'] ?? 1,
                'order' => $startOrder + $i,
            ]);
        }

        return response()->json([
            'message' => count($questions) . ' questions added successfully.',
            'questions' => $questions
        ], 201);
    }

    public function updateQuestion(Request $request, CbtQuestion $question): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'sometimes|string',
            'option_a' => 'sometimes|string',
            'option_b' => 'sometimes|string',
            'option_c' => 'sometimes|string',
            'option_d' => 'sometimes|string',
            'correct_answer' => 'sometimes|in:A,B,C,D',
            'points' => 'nullable|integer|min:1',
        ]);

        $question->update($validated);

        return response()->json([
            'message' => 'Question updated successfully.',
            'question' => $question
        ]);
    }

    public function destroyQuestion(CbtQuestion $question): JsonResponse
    {
        $question->delete();
        return response()->json(['message' => 'Question deleted.']);
    }

    // ─── Student: Take Exam ─────────────────────────────────

    public function startExam(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();

        // Check if student has already submitted
        $existing = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing && $existing->submitted_at) {
            return response()->json(['message' => 'You have already completed this exam.'], 400);
        }

        // Create or get submission
        $submission = CbtSubmission::firstOrCreate(
            [
                'cbt_test_id' => $cbtTest->id,
                'student_id' => $student->id,
            ],
            [
                'started_at' => now(),
                'total_questions' => $cbtTest->questions()->count(),
            ]
        );

        // Return questions WITHOUT correct answers
        $questions = $cbtTest->questions()
            ->select('id', 'cbt_test_id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'points', 'order')
            ->get();

        return response()->json([
            'submission_id' => $submission->id,
            'test' => $cbtTest->load(['subject:id,name', 'schoolClass:id,name']),
            'questions' => $questions,
            'started_at' => $submission->started_at,
        ]);
    }

    public function submitExam(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();

        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:cbt_questions,id',
            'answers.*.selected_answer' => 'required|in:A,B,C,D',
            'time_spent_seconds' => 'nullable|integer',
        ]);

        $submission = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->where('student_id', $student->id)
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'You have not started this exam.'], 400);
        }

        if ($submission->submitted_at) {
            return response()->json(['message' => 'You have already submitted this exam.'], 400);
        }

        $correct = 0;
        $wrong = 0;
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($validated['answers'] as $ans) {
            $question = CbtQuestion::find($ans['question_id']);
            if (!$question || $question->cbt_test_id !== $cbtTest->id) continue;

            $isCorrect = $question->correct_answer === $ans['selected_answer'];
            $totalPoints += $question->points;

            if ($isCorrect) {
                $correct++;
                $earnedPoints += $question->points;
            } else {
                $wrong++;
            }

            CbtAnswer::updateOrCreate(
                [
                    'cbt_submission_id' => $submission->id,
                    'cbt_question_id' => $question->id,
                ],
                [
                    'selected_answer' => $ans['selected_answer'],
                    'is_correct' => $isCorrect,
                ]
            );
        }

        $scorePercent = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;

        $submission->update([
            'score' => $scorePercent,
            'total_questions' => $cbtTest->questions()->count(),
            'correct_answers' => $correct,
            'wrong_answers' => $wrong,
            'time_spent_seconds' => $validated['time_spent_seconds'] ?? null,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'message' => 'Exam submitted successfully.',
            'submission' => $submission->fresh(),
            'score' => $scorePercent,
            'correct' => $correct,
            'wrong' => $wrong,
        ]);
    }

    // ─── Teacher: View Results ──────────────────────────────

    public function testResults(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $submissions = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->with(['student:id,full_name,student_id', 'answers.question'])
            ->get();

        return response()->json([
            'test' => $cbtTest->load(['subject:id,name', 'schoolClass:id,name']),
            'submissions' => $submissions,
        ]);
    }

    // ─── Student: View own result for a test ────────────────

    public function myResult(Request $request, CbtTest $cbtTest): JsonResponse
    {
        $student = $request->user();

        $submission = CbtSubmission::where('cbt_test_id', $cbtTest->id)
            ->where('student_id', $student->id)
            ->with(['answers.question'])
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'No submission found.'], 404);
        }

        return response()->json([
            'test' => $cbtTest->load(['subject:id,name', 'schoolClass:id,name']),
            'submission' => $submission,
        ]);
    }

    // ─── Class-wise assignment counts ───────────────────────

    public function classCounts(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'student') {
            $classIds = $user->classes->pluck('id');
        } elseif ($user->role === 'teacher') {
            $classIds = CbtTest::where('teacher_id', $user->id)->pluck('school_class_id')->unique();
        } else {
            $classIds = CbtTest::pluck('school_class_id')->unique();
        }

        $counts = CbtTest::whereIn('school_class_id', $classIds)
            ->where('is_published', true)
            ->selectRaw('school_class_id, count(*) as total')
            ->groupBy('school_class_id')
            ->with('schoolClass:id,name')
            ->get();

        return response()->json($counts);
    }

    // ─── Admin CBT Results Approval ─────────────────────────
    
    public function allSubmissions(Request $request): JsonResponse
    {
        $query = CbtSubmission::with([
            'test:id,title,subject_id,school_class_id', 
            'test.subject:id,name', 
            'test.schoolClass:id,name', 
            'student:id,full_name,student_id'
        ]);

        if ($request->filled('status')) {
            if ($request->input('status') === 'pending') {
                $query->where('result_released', false);
            } else if ($request->input('status') === 'released') {
                $query->where('result_released', true);
            }
        }

        return response()->json($query->latest('submitted_at')->get());
    }

    public function releaseResult(Request $request, CbtSubmission $submission): JsonResponse
    {
        $submission->update(['result_released' => true]);

        return response()->json([
            'message' => 'Result released successfully.',
            'submission' => $submission->fresh()->load([
                'test:id,title,subject_id,school_class_id', 
                'test.subject:id,name', 
                'test.schoolClass:id,name', 
                'student:id,full_name,student_id'
            ])
        ]);
    }

    public function releaseAllPending(Request $request): JsonResponse
    {
        CbtSubmission::where('result_released', false)->update(['result_released' => true]);

        return response()->json([
            'message' => 'All pending results have been released successfully.'
        ]);
    }
}
