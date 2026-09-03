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
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            "name" => ["required", "string", "max:255"],
            "code" => ["required", "string", "max:30", Rule::unique("subjects", "code")],
            "academic_section_id" => ["nullable", "exists:academic_sections,id"],
            "description" => ["nullable", "string"],
            "status" => ["nullable", "in:active,inactive"],
            "class_ids" => ["nullable", "array"],
            "class_ids.*" => ["integer", "exists:school_classes,id"],
        ]);

        $subject = Subject::query()->create($payload);

        if (!empty($payload["class_ids"])) {
            $subject->classes()->sync($payload["class_ids"]);
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
            "status" => ["nullable", "in:active,inactive"],
            "class_ids" => ["nullable", "array"],
            "class_ids.*" => ["integer", "exists:school_classes,id"],
        ]);

        $subject->update($payload);

        if (array_key_exists("class_ids", $payload)) {
            $subject->classes()->sync($payload["class_ids"] ?? []);
        }

        return response()->json($subject->load(["academicSection:id,name", "classes:id,name,grade_level"]));
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
