<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Assignment::with(['subject', 'schoolClass', 'teacher']);

        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        } elseif ($user->role === 'student') {
            $classIds = $user->classes->pluck('id');
            $query->whereIn('school_class_id', $classIds);
        }

        return $query->paginate($request->input('per_page', 15));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'school_class_id' => 'required|exists:school_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => [$user->role === 'admin' ? 'required' : 'nullable', 'exists:teachers,id'],
            'assigned_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'max_score' => 'nullable|numeric',
        ]);

        if ($user->role === 'teacher') {
            $validated['teacher_id'] = $user->id;
        }

        $assignment = Assignment::create($validated);

        return response()->json($assignment, 201);
    }

    public function show(Assignment $assignment)
    {
        return $assignment->load(['subject', 'schoolClass']);
    }

    public function update(Request $request, Assignment $assignment)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'school_class_id' => 'sometimes|required|exists:school_classes,id',
            'subject_id' => 'sometimes|required|exists:subjects,id',
            'assigned_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'max_score' => 'nullable|numeric',
            'status' => 'sometimes|required|string',
        ]);

        $assignment->update($validated);

        return response()->json($assignment);
    }

    public function destroy(Assignment $assignment)
    {
        $assignment->delete();
        return response()->json(null, 204);
    }
}
