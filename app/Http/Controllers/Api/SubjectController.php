<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    /**
     * List all available subjects with section and class relationships.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Subject::query()->with([
            "academicSection:id,name",
            "classes:id,name,grade_level"
        ]);

        $user = $request->user();
        if ($user?->role === 'student') {
            $query->whereHas('classes.students', fn ($studentQuery) => $studentQuery->where('students.id', $user->id));
        } elseif ($user?->role === 'teacher') {
            $query->whereHas('classes', fn ($classQuery) => $classQuery->where('class_subject.teacher_id', $user->id));
        }

        if ($request->filled("academic_section_id")) {
            $query->where("academic_section_id", $request->integer("academic_section_id"));
        }

        if ($request->filled("status")) {
            $query->where("status", $request->input("status"));
        }

        return response()->json($query->orderBy("name")->get());
    }

    /**
     * Create a new subject with code and section.
     */
    /**
     * Create a new subject with code and section.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            "name" => ["required", "string", "max:255"],
            "code" => ["required", "string", "max:30", Rule::unique("subjects", "code")],
            "academic_section_id" => ["nullable", "exists:academic_sections,id"],
            "description" => ["nullable", "string"],
            "is_compulsory" => ["nullable", "boolean"],
            "status" => ["nullable", "in:active,inactive,draft"],
            "class_ids" => ["nullable", "array"],
            "class_ids.*" => ["integer", "exists:school_classes,id"],
            "class_assignments" => ["nullable", "array"],
            "class_assignments.*.class_id" => ["required_with:class_assignments", "integer", "exists:school_classes,id"],
            "class_assignments.*.teacher_id" => ["nullable", "integer", "exists:teachers,id"],
            "class_assignments.*.is_compulsory" => ["nullable", "boolean"],
        ]);

        $payload['is_compulsory'] = $payload['is_compulsory'] ?? false;
        $subject = Subject::query()->create($payload);

        $assignedClassIds = [];
        if (!empty($payload["class_assignments"])) {
            $syncData = [];
            foreach ($payload["class_assignments"] as $assignment) {
                $syncData[$assignment['class_id']] = [
                    'teacher_id' => $assignment['teacher_id'] ?? null,
                    'is_compulsory' => $assignment['is_compulsory'] ?? $subject->is_compulsory,
                ];
                $assignedClassIds[] = $assignment['class_id'];
            }
            $subject->classes()->sync($syncData);
        } elseif (!empty($payload["class_ids"])) {
            $syncData = [];
            foreach ($payload["class_ids"] as $classId) {
                $syncData[$classId] = [
                    'is_compulsory' => $subject->is_compulsory,
                ];
                $assignedClassIds[] = $classId;
            }
            $subject->classes()->sync($syncData);
        }

        // Notify affected students in enrolled classes
        if (!empty($assignedClassIds) && ($payload['status'] ?? 'active') === 'active') {
            $this->notifyEnrolledStudents($subject, $assignedClassIds);
        }

        return response()->json($subject->load(["academicSection:id,name", "classes:id,name,grade_level"]), 201);
    }

    /**
     * Get details of a subject and its associated classes and section.
     */
    public function show(Request $request, Subject $subject): JsonResponse
    {
        $user = $request->user();
        $authorized = $user?->role === 'admin'
            || ($user?->role === 'student' && $subject->classes()->whereHas('students', fn ($query) => $query->where('students.id', $user->id))->exists())
            || ($user?->role === 'teacher' && $subject->classes()->wherePivot('teacher_id', $user->id)->exists());
        if (!$authorized) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json($subject->load(["academicSection:id,name", "classes:id,name,grade_level"]));
    }

    /**
     * Update subject name, code, description, or classes.
     */
    public function update(Request $request, Subject $subject): JsonResponse
    {
        $payload = $request->validate([
            "name" => ["sometimes", "string", "max:255"],
            "code" => ["sometimes", "string", "max:30", Rule::unique("subjects", "code")->ignore($subject->id)],
            "academic_section_id" => ["nullable", "exists:academic_sections,id"],
            "description" => ["nullable", "string"],
            "is_compulsory" => ["nullable", "boolean"],
            "status" => ["nullable", "in:active,inactive,draft"],
            "class_ids" => ["nullable", "array"],
            "class_ids.*" => ["integer", "exists:school_classes,id"],
            "class_assignments" => ["nullable", "array"],
            "class_assignments.*.class_id" => ["required_with:class_assignments", "integer", "exists:school_classes,id"],
            "class_assignments.*.teacher_id" => ["nullable", "integer", "exists:teachers,id"],
            "class_assignments.*.is_compulsory" => ["nullable", "boolean"],
        ]);

        $subject->update($payload);

        $existingClassIds = $subject->classes()->pluck('school_classes.id')->all();
        $newlyAssignedClassIds = [];

        if (array_key_exists("class_assignments", $payload) && is_array($payload["class_assignments"])) {
            $syncData = [];
            foreach ($payload["class_assignments"] as $assignment) {
                $cid = $assignment['class_id'];
                $syncData[$cid] = [
                    'teacher_id' => $assignment['teacher_id'] ?? null,
                    'is_compulsory' => $assignment['is_compulsory'] ?? $subject->is_compulsory,
                ];
                if (!in_array($cid, $existingClassIds, true)) {
                    $newlyAssignedClassIds[] = $cid;
                }
            }
            $subject->classes()->sync($syncData);
        } elseif (array_key_exists("class_ids", $payload)) {
            $syncData = [];
            foreach (($payload["class_ids"] ?? []) as $classId) {
                $syncData[$classId] = [
                    'is_compulsory' => $subject->is_compulsory,
                ];
                if (!in_array($classId, $existingClassIds, true)) {
                    $newlyAssignedClassIds[] = $classId;
                }
            }
            $subject->classes()->sync($syncData);
        }

        if (!empty($newlyAssignedClassIds) && ($subject->status ?? 'active') === 'active') {
            $this->notifyEnrolledStudents($subject, $newlyAssignedClassIds);
        }

        return response()->json($subject->load(["academicSection:id,name", "classes:id,name,grade_level"]));
    }

    private function notifyEnrolledStudents(Subject $subject, array $classIds): void
    {
        $studentIds = \Illuminate\Support\Facades\DB::table('class_student')
            ->whereIn('school_class_id', $classIds)
            ->pluck('student_id')
            ->unique();

        foreach ($studentIds as $studentId) {
            \App\Models\StudentNotification::notifyStudent(
                (int) $studentId,
                "New Subject Available: {$subject->name}",
                "Subject {$subject->name} ({$subject->code}) is now open for course registration in your class.",
                '/student/course-registration',
                'subject_published'
            );
        }
    }

    /**
     * Delete a subject.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        if ($subject->classes()->exists() || $subject->results()->exists()) {
            return response()->json(['message' => 'Only unused subjects can be deleted.'], 409);
        }
        $subject->delete();

        return response()->json(["message" => "Subject deleted successfully."]);
    }
}
