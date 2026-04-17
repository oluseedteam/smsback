<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    /**
     * List academic results with optional filtering.
     *
     * Students see only their results. Teachers/Admins can filter by student, class, and subject.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Result::query()->with([
            'student:id,full_name,student_id',
            'subject:id,name,code',
            'schoolClass:id,name,grade_level',
            'teacher:id,full_name',
        ]);

        if ($request->user()->role === 'student') {
            $query->where('student_id', $request->user()->id);
        } elseif ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->integer('school_class_id'));
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->integer('subject_id'));
        }

        return response()->json($query->latest('graded_at')->paginate(30));
    }

    /**
     * Create a new academic result record.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'assessment_name' => ['required', 'string', 'max:255'],
            'assessment_type' => ['required', 'in:homework,test,project,participation,exam'],
            'score' => ['required', 'numeric', 'min:0'],
            'max_score' => ['required', 'numeric', 'gt:0'],
            'weight' => ['nullable', 'numeric', 'between:0,100'],
            'graded_at' => ['nullable', 'date'],
        ]);

        if ($request->user()->role === 'teacher') {
            $payload['teacher_id'] = $request->user()->id;
        }

        $result = Result::query()->create($payload);

        return response()->json($result->load(['student:id,full_name', 'subject:id,name']), 201);
    }

    /**
     * Update an existing academic result record.
     */
    public function update(Request $request, Result $result): JsonResponse
    {
        $payload = $request->validate([
            'assessment_name' => ['sometimes', 'string', 'max:255'],
            'assessment_type' => ['sometimes', 'in:homework,test,project,participation,exam'],
            'score' => ['sometimes', 'numeric', 'min:0'],
            'max_score' => ['sometimes', 'numeric', 'gt:0'],
            'weight' => ['nullable', 'numeric', 'between:0,100'],
            'graded_at' => ['nullable', 'date'],
        ]);

        if ($request->user()->role === 'teacher') {
            $payload['teacher_id'] = $request->user()->id;
        }

        $result->update($payload);

        return response()->json($result->fresh()->load(['student:id,full_name', 'subject:id,name']));
    }

    /**
     * Delete an academic result record.
     */
    public function destroy(Result $result): JsonResponse
    {
        $result->delete();

        return response()->json(['message' => 'Result deleted successfully.']);
    }
}
