<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Public: Submit feedback (parents, alumni, students, community).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role_type' => ['required', 'in:parent,alumni,student,community'],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'category' => ['nullable', 'string', 'max:100'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            
            // Parent specific
            'student_name' => ['nullable', 'string', 'max:255'],
            'student_class' => ['nullable', 'string', 'max:100'],

            // Alumni specific
            'graduation_year' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'string', 'max:100'],
            'current_occupation' => ['nullable', 'string', 'max:255'],
            'stay_connected' => ['nullable', 'string', 'max:255'],

            'is_public_testimonial' => ['nullable', 'boolean'],
        ]);

        $validated['status'] = 'pending';
        // Auto-publish 4 and 5 star testimonials with consent, or keep pending for moderation
        $validated['is_published'] = false;

        $feedback = Feedback::create($validated);

        return response()->json([
            'message' => 'Thank you! Your feedback has been submitted successfully.',
            'feedback' => $feedback,
        ], 201);
    }

    /**
     * Public: Retrieve published parent and alumni testimonials for display on website.
     */
    public function publicTestimonials(Request $request): JsonResponse
    {
        $role = $request->query('role'); // parent or alumni

        $query = Feedback::query()
            ->where('is_public_testimonial', true)
            ->where(function ($q) {
                $q->where('is_published', true)
                  ->orWhere('rating', '>=', 4);
            });

        if ($role && in_array($role, ['parent', 'alumni'])) {
            $query->where('role_type', $role);
        }

        $testimonials = $query->latest()->limit(20)->get();

        return response()->json([
            'testimonials' => $testimonials,
        ]);
    }

    /**
     * Admin: List all feedbacks with filtering and stats.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Feedback::query();

        if ($request->filled('role_type') && $request->role_type !== 'all') {
            $query->where('role_type', $request->role_type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('rating') && $request->rating !== 'all') {
            $query->where('rating', $request->rating);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%")
                  ->orWhere('student_name', 'like', "%{$search}%")
                  ->orWhere('current_occupation', 'like', "%{$search}%");
            });
        }

        $feedbacks = $query->latest()->paginate(50);

        $stats = [
            'total' => Feedback::count(),
            'parents' => Feedback::where('role_type', 'parent')->count(),
            'alumni' => Feedback::where('role_type', 'alumni')->count(),
            'average_rating' => round(Feedback::avg('rating') ?? 5, 1),
            'published_testimonials' => Feedback::where('is_published', true)->count(),
        ];

        return response()->json([
            'feedbacks' => $feedbacks,
            'stats' => $stats,
        ]);
    }

    /**
     * Admin: Update feedback status or toggle published testimonial status.
     */
    public function update(Request $request, Feedback $feedback): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,reviewed,published,archived'],
            'is_published' => ['sometimes', 'boolean'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $feedback->update($validated);

        return response()->json([
            'message' => 'Feedback updated successfully.',
            'feedback' => $feedback->fresh(),
        ]);
    }

    /**
     * Admin: Delete feedback.
     */
    public function destroy(Feedback $feedback): JsonResponse
    {
        $feedback->delete();

        return response()->json([
            'message' => 'Feedback record removed successfully.',
        ]);
    }
}
