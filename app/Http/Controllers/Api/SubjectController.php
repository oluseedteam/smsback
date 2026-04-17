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
     * List all available subjects.
     */
    public function index(): JsonResponse
    {
        return response()->json(Subject::query()->latest()->get());
    }

    /**
     * Create a new subject with a unique code.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:30', Rule::unique('subjects', 'code')],
        ]);

        $subject = Subject::query()->create($payload);

        return response()->json($subject, 201);
    }

    /**
     * Get details of a subject and its associated classes.
     */
    public function show(Subject $subject): JsonResponse
    {
        return response()->json($subject->load('classes:id,name,grade_level'));
    }

    /**
     * Update subject name or code.
     */
    public function update(Request $request, Subject $subject): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:30', Rule::unique('subjects', 'code')->ignore($subject->id)],
        ]);

        $subject->update($payload);

        return response()->json($subject);
    }

    /**
     * Delete a subject.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json(['message' => 'Subject deleted successfully.']);
    }
}
