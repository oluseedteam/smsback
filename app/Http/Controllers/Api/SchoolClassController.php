<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    /**
     * List all school classes with their assigned teachers and subjects.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SchoolClass::query()->with(['teacher:id,full_name', 'subjects:id,name,code']);

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->integer('teacher_id'));
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Create a new school class and optionally assign students and subjects.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade_level' => ['required', 'string', 'max:50'],
            'room' => ['nullable', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:50'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:students,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        $class = SchoolClass::query()->create($payload);
        $class->students()->sync($payload['student_ids'] ?? []);
        if (!empty($payload['subject_ids'])) {
            $syncPayload = collect($payload['subject_ids'])
                ->mapWithKeys(fn ($id) => [$id => ['teacher_id' => $payload['teacher_id'] ?? null]])
                ->all();
            $class->subjects()->sync($syncPayload);
        }

        return response()->json($class->load(['teacher:id,full_name', 'students:id,full_name', 'subjects:id,name,code']), 201);
    }

    /**
     * Get detailed information about a specific school class.
     */
    public function show(SchoolClass $class): JsonResponse
    {
        return response()->json($class->load([
            'teacher:id,full_name',
            'students:id,full_name,student_id',
            'subjects:id,name,code',
        ]));
    }

    /**
     * Update school class details and manage student/subject assignments.
     */
    public function update(Request $request, SchoolClass $class): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'grade_level' => ['sometimes', 'string', 'max:50'],
            'room' => ['nullable', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:50'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:students,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        $class->update($payload);

        if (array_key_exists('student_ids', $payload)) {
            $class->students()->sync($payload['student_ids'] ?? []);
        }

        if (array_key_exists('subject_ids', $payload)) {
            $syncPayload = collect($payload['subject_ids'] ?? [])
                ->mapWithKeys(fn ($id) => [$id => ['teacher_id' => $payload['teacher_id'] ?? $class->teacher_id]])
                ->all();
            $class->subjects()->sync($syncPayload);
        }

        return response()->json($class->load(['teacher:id,full_name', 'students:id,full_name', 'subjects:id,name,code']));
    }

    /**
     * Delete a school class.
     */
    public function destroy(SchoolClass $class): JsonResponse
    {
        $class->delete();

        return response()->json(['message' => 'Class deleted successfully.']);
    }
}
