<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    /**
     * List all school classes with their assigned teachers, sections, and subjects.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SchoolClass::query()->with([
            "teacher:id,full_name,employee_id",
            "academicSection:id,name",
            "subjects:id,name,code"
        ])->withCount("students");

        $user = $request->user();
        if ($user?->role === 'student') {
            $hasClasses = SchoolClass::whereHas('students', fn ($studentQuery) => $studentQuery->where('students.id', $user->id))->exists();
            if (!$hasClasses) {
                $defaultClass = SchoolClass::where('status', 'active')->first() ?: SchoolClass::first();
                if ($defaultClass) {
                    $student = \App\Models\Student::find($user->id);
                    $student?->classes()->syncWithoutDetaching([$defaultClass->id]);
                }
            }
            $query->whereHas('students', fn ($studentQuery) => $studentQuery->where('students.id', $user->id));
        } elseif ($user?->role === 'teacher') {
            $query->where(function ($teacherQuery) use ($user): void {
                $teacherQuery->where('teacher_id', $user->id)
                    ->orWhereHas('subjects', fn ($subjectQuery) => $subjectQuery->where('class_subject.teacher_id', $user->id));
            });
        }

        if ($request->filled("teacher_id")) {
            $query->where("teacher_id", $request->integer("teacher_id"));
        }

        if ($request->filled("academic_section_id")) {
            $query->where("academic_section_id", $request->integer("academic_section_id"));
        }

        if ($request->filled("status")) {
            $query->where("status", $request->input("status"));
        }

        return response()->json($query->orderBy("grade_level")->orderBy("name")->get());
    }

    /**
     * Create a new school class and optionally assign students, subjects, and class teacher.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            "name" => ["required", "string", "max:255"],
            "grade_level" => ["required", "string", "max:50"],
            "academic_section_id" => ["nullable", "exists:academic_sections,id"],
            "arm" => ["nullable", "string", "max:50"],
            "room" => ["nullable", "string", "max:255"],
            "academic_year" => ["nullable", "string", "max:50"],
            "teacher_id" => ["nullable", "exists:teachers,id"],
            "status" => ["nullable", "in:active,inactive"],
            "student_ids" => ["nullable", "array"],
            "student_ids.*" => ["integer", "exists:students,id"],
            "subject_ids" => ["nullable", "array"],
            "subject_ids.*" => ["integer", "exists:subjects,id"],
            "subject_teachers" => ["nullable", "array"], // e.g. [{ "subject_id": 1, "teacher_id": 2 }]
        ]);

        $class = SchoolClass::query()->create($payload);
        $class->students()->sync($payload["student_ids"] ?? []);

        if (!empty($payload["subject_ids"])) {
            $teacherMap = [];
            if (!empty($payload["subject_teachers"])) {
                foreach ($payload["subject_teachers"] as $st) {
                    if (isset($st["subject_id"])) {
                        $teacherMap[$st["subject_id"]] = $st["teacher_id"] ?? null;
                    }
                }
            }

            $syncPayload = collect($payload["subject_ids"])
                ->mapWithKeys(fn ($id) => [
                    $id => ["teacher_id" => $teacherMap[$id] ?? $payload["teacher_id"] ?? null]
                ])
                ->all();
            $class->subjects()->sync($syncPayload);
        }

        return response()->json($class->load([
            "teacher:id,full_name,employee_id",
            "academicSection:id,name",
            "students:id,full_name,student_id",
            "subjects:id,name,code"
        ]), 201);
    }

    /**
     * Get detailed information about a specific school class.
     */
    public function show(Request $request, SchoolClass $class): JsonResponse
    {
        $user = $request->user();
        $authorized = $user?->role === 'admin'
            || ($user?->role === 'student' && $class->students()->whereKey($user->id)->exists())
            || ($user?->role === 'teacher' && ($class->teacher_id === $user->id || $class->subjects()->wherePivot('teacher_id', $user->id)->exists()));
        if (!$authorized) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json($class->load([
            "teacher:id,full_name,employee_id",
            "academicSection:id,name",
            "students:id,full_name,student_id,gender,status",
            "subjects:id,name,code",
        ]));
    }

    /**
     * Update school class details and manage student/subject assignments.
     */
    public function update(Request $request, SchoolClass $class): JsonResponse
    {
        $payload = $request->validate([
            "name" => ["sometimes", "string", "max:255"],
            "grade_level" => ["sometimes", "string", "max:50"],
            "academic_section_id" => ["nullable", "exists:academic_sections,id"],
            "arm" => ["nullable", "string", "max:50"],
            "room" => ["nullable", "string", "max:255"],
            "academic_year" => ["nullable", "string", "max:50"],
            "teacher_id" => ["nullable", "exists:teachers,id"],
            "status" => ["nullable", "in:active,inactive"],
            "student_ids" => ["nullable", "array"],
            "student_ids.*" => ["integer", "exists:students,id"],
            "subject_ids" => ["nullable", "array"],
            "subject_ids.*" => ["integer", "exists:subjects,id"],
            "subject_teachers" => ["nullable", "array"],
        ]);

        $class->update($payload);

        if (array_key_exists("student_ids", $payload)) {
            $class->students()->sync($payload["student_ids"] ?? []);
        }

        if (array_key_exists("subject_ids", $payload)) {
            $teacherMap = [];
            if (!empty($payload["subject_teachers"])) {
                foreach ($payload["subject_teachers"] as $st) {
                    if (isset($st["subject_id"])) {
                        $teacherMap[$st["subject_id"]] = $st["teacher_id"] ?? null;
                    }
                }
            }

            $syncPayload = collect($payload["subject_ids"] ?? [])
                ->mapWithKeys(fn ($id) => [
                    $id => ["teacher_id" => $teacherMap[$id] ?? $payload["teacher_id"] ?? $class->teacher_id]
                ])
                ->all();
            $class->subjects()->sync($syncPayload);
        }

        return response()->json($class->load([
            "teacher:id,full_name,employee_id",
            "academicSection:id,name",
            "students:id,full_name,student_id",
            "subjects:id,name,code"
        ]));
    }

    /**
     * Delete a school class.
     */
    public function destroy(SchoolClass $class): JsonResponse
    {
        if ($class->students()->exists() || $class->subjects()->exists() || $class->results()->exists()) {
            return response()->json(['message' => 'Only unused classes can be deleted.'], 409);
        }
        $class->delete();

        return response()->json(["message" => "Class deleted successfully."]);
    }
}
