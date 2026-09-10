<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\CourseRegistration;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseRegistrationController extends Controller
{
    /**
     * List registrations for a student or class.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = CourseRegistration::with(['student:id,full_name,student_id', 'subject:id,name,code', 'schoolClass:id,name', 'academicSession:id,name']);

        if ($user->role === 'student') {
            $query->where('student_id', $user->id);
        } elseif ($user->role === 'teacher') {
            $authorizedPairs = DB::table('class_subject')
                ->where('teacher_id', $user->id)
                ->get(['school_class_id', 'subject_id']);

            if ($authorizedPairs->isEmpty()) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($scope) use ($authorizedPairs): void {
                    foreach ($authorizedPairs as $pair) {
                        $scope->orWhere(function ($pairQuery) use ($pair): void {
                            $pairQuery->where('school_class_id', $pair->school_class_id)
                                ->where('subject_id', $pair->subject_id);
                        });
                    }
                });
            }
        } elseif ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->integer('school_class_id'));
        }

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->integer('academic_session_id'));
        }

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        return response()->json($query->get());
    }

    /**
     * Get available subjects for a student to register for a given class, session, and term.
     */
    public function availableSubjects(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::with('classes.subjects')->findOrFail($user->id);

        if (($student->status ?? 'active') !== 'active') {
            return response()->json(['message' => 'Only active student accounts can register courses.'], 403);
        }

        $classId = $request->input('school_class_id');
        $class = null;
        if ($classId) {
            $class = $student->classes->firstWhere('id', (int) $classId);
        }
        if (!$class) {
            $class = $student->classes->first();
        }

        // If student is not yet attached to any class, assign to the first active class
        if (!$class) {
            $class = SchoolClass::where('status', 'active')->first() ?: SchoolClass::first();
            if ($class && !$student->classes()->whereKey($class->id)->exists()) {
                $student->classes()->attach($class->id);
                $student->load('classes.subjects');
            }
        }

        if (!$class) {
            return response()->json(['message' => 'No school class is available. Please contact the administrator.'], 422);
        }

        $sessionId = $request->input('academic_session_id') ?? AcademicSession::where('is_current', true)->value('id');
        if (!$sessionId || !AcademicSession::whereKey($sessionId)->exists()) {
            return response()->json(['message' => 'No valid academic session is available.'], 422);
        }
        $session = AcademicSession::findOrFail($sessionId);
        $term = $request->input('term', '1st Term');

        $isRegistrationOpen = true;
        if ($session->registration_deadline && now()->gt($session->registration_deadline) && !$session->registration_reopened) {
            $isRegistrationOpen = false;
        }

        // Fetch ALL active subjects across the entire school
        $allSubjects = Subject::where('status', 'active')
            ->orderBy('name')
            ->get();

        if ($allSubjects->isEmpty()) {
            $allSubjects = Subject::orderBy('name')->get();
        }

        // Get class pivot assignments if any
        $classSubjectPivot = DB::table('class_subject')
            ->where('school_class_id', $class->id)
            ->get()
            ->keyBy('subject_id');

        $teacherIds = $classSubjectPivot->pluck('teacher_id')->filter()->unique();
        $teachers = \App\Models\Teacher::whereIn('id', $teacherIds)->pluck('full_name', 'id');

        $registrations = CourseRegistration::where('student_id', $student->id)
            ->where('academic_session_id', $sessionId)
            ->where('school_class_id', $class->id)
            ->where('term', $term)
            ->get()
            ->keyBy('subject_id');

        $subjects = $allSubjects->map(function ($s) use ($registrations, $classSubjectPivot, $teachers) {
            $reg = $registrations->get($s->id);
            $pivot = $classSubjectPivot->get($s->id);

            // If explicitly configured in class_subject pivot, use its setting; otherwise default to subject's is_compulsory
            $isCompulsory = $pivot !== null
                ? (bool) ($pivot->is_compulsory ?? false)
                : (bool) ($s->is_compulsory ?? false);

            $teacherName = ($pivot && $pivot->teacher_id) ? ($teachers[$pivot->teacher_id] ?? null) : null;

            return [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'is_compulsory' => $isCompulsory,
                'teacher_name' => $teacherName,
                'is_registered' => $reg && in_array($reg->status, CourseRegistration::ELIGIBLE_STATUSES, true),
                'status' => $reg?->status ?? 'unregistered',
            ];
        });

        $registeredCount = $subjects->where('is_registered', true)->count();

        return response()->json([
            'student' => ['id' => $student->id, 'name' => $student->full_name],
            'class_id' => $class->id,
            'class_name' => $class->name,
            'session_id' => $sessionId,
            'term' => $term,
            'is_registration_open' => $isRegistrationOpen,
            'registration_deadline' => $session->registration_deadline,
            'registration_reopened' => (bool) $session->registration_reopened,
            'subjects' => $subjects,
            'registered_count' => $registeredCount,
        ]);
    }

    /**
     * Save / Sync course registrations for a student.
     */
    public function register(Request $request): JsonResponse
    {
        $user = $request->user();
        $studentId = $user->role === 'student' ? $user->id : $request->integer('student_id');

        $validated = $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'school_class_id' => 'required|exists:school_classes,id',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term' => 'required|string',
            'subject_ids' => 'required|array|min:1',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $student = Student::findOrFail($studentId);
        $classId = $validated['school_class_id'];
        $sessionId = $validated['academic_session_id'];
        $term = $validated['term'];
        $newSubjectIds = array_values(array_unique(array_map('intval', $validated['subject_ids'])));

        if (($student->status ?? 'active') !== 'active') {
            return response()->json(['message' => 'Only active student accounts can register courses.'], 403);
        }

        $session = AcademicSession::findOrFail($sessionId);
        if ($user->role === 'student') {
            if ($session->registration_deadline && now()->gt($session->registration_deadline) && !$session->registration_reopened) {
                return response()->json(['message' => 'Course registration is closed for this academic session.'], 422);
            }
        }

        if (!$student->classes()->whereKey($classId)->exists()) {
            if ($student->classes()->count() === 0) {
                $student->classes()->attach($classId);
            } else {
                return response()->json(['message' => 'The selected class is not assigned to your student account.'], 403);
            }
        }

        $class = SchoolClass::findOrFail($classId);

        // Fetch all active subjects in the school
        $allActiveSubjects = Subject::where('status', 'active')->pluck('id')->map(fn ($id) => (int) $id)->all();
        if (empty($allActiveSubjects)) {
            $allActiveSubjects = Subject::pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        $invalidSubjectIds = array_values(array_diff($newSubjectIds, $allActiveSubjects));
        if ($invalidSubjectIds !== []) {
            return response()->json([
                'message' => 'One or more selected subjects are not valid subjects in the school.',
                'invalid_subject_ids' => $invalidSubjectIds,
            ], 422);
        }

        // Attach any newly registered subjects to the class in class_subject pivot
        foreach ($newSubjectIds as $subId) {
            if (!$class->subjects()->where('subjects.id', $subId)->exists()) {
                $class->subjects()->attach($subId, ['is_compulsory' => false]);
            }
        }

        // Validate that all compulsory subjects for this class are included
        $compulsorySubjectIds = DB::table('class_subject')
            ->where('school_class_id', $classId)
            ->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')
            ->where('subjects.status', 'active')
            ->where(function ($q) {
                $q->where('class_subject.is_compulsory', true)
                  ->orWhere('subjects.is_compulsory', true);
            })
            ->pluck('subjects.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $missingCompulsory = array_values(array_diff($compulsorySubjectIds, $newSubjectIds));
        if (!empty($missingCompulsory)) {
            $missingNames = Subject::whereIn('id', $missingCompulsory)->pluck('name')->implode(', ');
            return response()->json([
                'message' => "All compulsory subjects must be registered. Missing: {$missingNames}.",
                'missing_compulsory_ids' => $missingCompulsory,
            ], 422);
        }

        // Check unselected registrations: if scores/submissions exist, mark as 'withdrawn', else delete
        $unselectedRegistrations = CourseRegistration::where('student_id', $student->id)
            ->where('academic_session_id', $sessionId)
            ->where('school_class_id', $classId)
            ->where('term', $term)
            ->whereNotIn('subject_id', $newSubjectIds)
            ->get();

        foreach ($unselectedRegistrations as $reg) {
            $hasScores = DB::table('subject_results')
                ->where('student_id', $student->id)
                ->where('subject_id', $reg->subject_id)
                ->where('academic_session_id', $sessionId)
                ->where('term', $term)
                ->exists()
                || DB::table('cbt_submissions')
                ->join('cbt_tests', 'cbt_submissions.cbt_test_id', '=', 'cbt_tests.id')
                ->where('cbt_submissions.student_id', $student->id)
                ->where('cbt_tests.subject_id', $reg->subject_id)
                ->where('cbt_tests.term', $term)
                ->exists();

            if ($hasScores) {
                $reg->update(['status' => CourseRegistration::STATUS_WITHDRAWN]);
            } else {
                $reg->delete();
            }
        }

        // Create or reactivate selected registrations
        $added = 0;
        foreach ($newSubjectIds as $subjectId) {
            $reg = CourseRegistration::where([
                'student_id' => $student->id,
                'school_class_id' => $classId,
                'subject_id' => $subjectId,
                'academic_session_id' => $sessionId,
                'term' => $term,
            ])->first();

            if ($reg) {
                if (in_array($reg->status, [CourseRegistration::STATUS_WITHDRAWN, CourseRegistration::STATUS_DROPPED], true)) {
                    $reg->update(['status' => CourseRegistration::STATUS_ACTIVE]);
                }
            } else {
                CourseRegistration::create([
                    'student_id' => $student->id,
                    'school_class_id' => $classId,
                    'subject_id' => $subjectId,
                    'academic_session_id' => $sessionId,
                    'term' => $term,
                    'status' => CourseRegistration::STATUS_ACTIVE,
                ]);
            }
            $added++;
        }

        return response()->json([
            'message' => "Successfully registered {$added} subjects for {$term}.",
            'registered_count' => $added,
        ]);
    }
}
