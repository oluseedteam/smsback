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
            $query->whereIn('school_class_id', $classIds)
                  ->with(['submissions' => function($q) use ($user) {
                      $q->where('student_id', $user->id);
                  }]);
        }

        return $query->paginate($request->input('per_page', 15));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'attachment' => 'nullable|string',
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

        return response()->json([
            'message' => 'Assignment created successfully.',
            'assignment' => $assignment
        ], 201);
    }

    public function show(Request $request, Assignment $assignment)
    {
        $this->authorizeAssignmentAccess($request, $assignment);

        return $assignment->load(['subject', 'schoolClass']);
    }

    public function update(Request $request, Assignment $assignment)
    {
        $this->authorizeAssignmentManagement($request, $assignment);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'attachment' => 'nullable|string',
            'school_class_id' => 'sometimes|required|exists:school_classes,id',
            'subject_id' => 'sometimes|required|exists:subjects,id',
            'assigned_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'max_score' => 'nullable|numeric',
            'status' => 'sometimes|required|string',
        ]);

        $assignment->update($validated);

        return response()->json([
            'message' => 'Assignment updated successfully.',
            'assignment' => $assignment
        ]);
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        $this->authorizeAssignmentManagement($request, $assignment);

        $assignment->delete();
        return response()->json([
            'message' => 'Assignment deleted successfully.'
        ], 200);
    }

    public function submit(Request $request, Assignment $assignment)
    {
        $user = $request->user();
        if ($user->role !== 'student') {
            return response()->json(['message' => 'Only students can submit assignments.'], 403);
        }
        $this->authorizeAssignmentAccess($request, $assignment);

        $validated = $request->validate([
            'submission_text' => 'nullable|string',
            'submission_file' => 'nullable|string'
        ]);

        $submission = \App\Models\AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'student_id' => $user->id],
            [
                'submission_text' => $validated['submission_text'],
                'submission_file' => $validated['submission_file'],
                'submitted_at' => now(),
                'status' => 'pending'
            ]
        );

        return response()->json([
            'message' => 'Assignment submitted successfully.',
            'submission' => $submission
        ]);
    }

    public function submissions(Request $request, Assignment $assignment)
    {
        $this->authorizeAssignmentManagement($request, $assignment);

        return response()->json($assignment->submissions()->with('student:id,full_name,student_id')->get());
    }

    public function grade(Request $request, $submissionId)
    {
        $submission = \App\Models\AssignmentSubmission::findOrFail($submissionId);
        $this->authorizeAssignmentManagement($request, $submission->assignment);
        
        $validated = $request->validate([
            'score' => 'required|numeric',
            'feedback' => 'nullable|string'
        ]);

        $submission->update([
            'score' => $validated['score'],
            'feedback' => $validated['feedback'],
            'status' => 'graded'
        ]);

        return response()->json([
            'message' => 'Assignment graded successfully.',
            'submission' => $submission
        ]);
    }

    private function authorizeAssignmentAccess(Request $request, Assignment $assignment): void
    {
        $user = $request->user();
        $allowed = match ($user->role) {
            'admin' => true,
            'teacher' => (int) $assignment->teacher_id === (int) $user->id,
            'student' => $user->classes()->whereKey($assignment->school_class_id)->exists(),
            default => false,
        };

        abort_unless($allowed, 403, 'You do not have access to this assignment.');
    }

    private function authorizeAssignmentManagement(Request $request, Assignment $assignment): void
    {
        $user = $request->user();
        $allowed = $user->role === 'admin'
            || ($user->role === 'teacher' && (int) $assignment->teacher_id === (int) $user->id);

        abort_unless($allowed, 403, 'You cannot modify this assignment.');
    }
}
