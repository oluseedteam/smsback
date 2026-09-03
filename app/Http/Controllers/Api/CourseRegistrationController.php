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

        $classId = $request->input('school_class_id') ?? $student->classes->first()?->id;
        $class = $student->classes->firstWhere('id', (int) $classId);
        if (!$class) {
            return response()->json(['message' => 'The selected class is not assigned to your student account.'], 403);
        }

        $sessionId = $request->input('academic_session_id') ?? AcademicSession::where('is_current', true)->value('id');
        if (!$sessionId || !AcademicSession::whereKey($sessionId)->exists()) {
            return response()->json(['message' => 'No valid academic session is available.'], 422);
        }
        $term = $request->input('term', '1st Term');

        $allSubjects = $class->subjects()->where('subjects.status', 'active')->orderBy('subjects.name')->get();

        $registeredSubjectIds = CourseRegistration::where('student_id', $student->id)
            ->where('academic_session_id', $sessionId)
            ->where('school_class_id', $class->id)
            ->where('term', $term)
            ->pluck('subject_id')
            ->toArray();

        $subjects = $allSubjects->map(function ($s) use ($registeredSubjectIds) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'is_registered' => in_array($s->id, $registeredSubjectIds),
            ];
        });

        return response()->json([
            'student' => ['id' => $student->id, 'name' => $student->full_name],
            'class_id' => $classId,
            'session_id' => $sessionId,
            'term' => $term,
            'subjects' => $subjects,
            'registered_count' => count($registeredSubjectIds),
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
        $newSubjectIds = $validated['subject_ids'];

        if (($student->status ?? 'active') !== 'active') {
            return response()->json(['message' => 'Only active student accounts can register courses.'], 403);
        }

        if (!$student->classes()->whereKey($classId)->exists()) {
            return response()->json(['message' => 'The selected class is not assigned to your student account.'], 403);
        }

        $allowedSubjectIds = SchoolClass::findOrFail($classId)->subjects()
            ->where('subjects.status', 'active')
            ->pluck('subjects.id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $invalidSubjectIds = array_values(array_diff(array_map('intval', $newSubjectIds), $allowedSubjectIds));
        if ($invalidSubjectIds !== []) {
            return response()->json([
                'message' => 'One or more selected subjects are not assigned to this class.',
                'invalid_subject_ids' => $invalidSubjectIds,
            ], 422);
        }

        // Remove unselected registrations for this session/term
        CourseRegistration::where('student_id', $student->id)
            ->where('academic_session_id', $sessionId)
            ->where('school_class_id', $classId)
            ->where('term', $term)
            ->whereNotIn('subject_id', $newSubjectIds)
            ->delete();

        // Create or keep selected registrations
        $added = 0;
        foreach ($newSubjectIds as $subjectId) {
            CourseRegistration::firstOrCreate([
                'student_id' => $student->id,
                'school_class_id' => $classId,
                'subject_id' => $subjectId,
                'academic_session_id' => $sessionId,
                'term' => $term,
            ], [
                'status' => 'active',
            ]);
            $added++;
        }

        return response()->json([
            'message' => "Successfully registered {$added} subjects for {$term}.",
            'registered_count' => $added,
        ]);
    }
}
