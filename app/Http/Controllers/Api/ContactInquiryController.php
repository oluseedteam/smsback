<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactInquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactInquiryController extends Controller
{
    /**
     * Public: Store a newly submitted contact inquiry / tour booking.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'inquiry_type' => ['nullable', 'string', 'max:255'],
            'inquiryType' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $inquiryType = $validated['inquiry_type'] ?? $validated['inquiryType'] ?? 'General Inquiry';

        $inquiry = ContactInquiry::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'inquiry_type' => $inquiryType,
            'message' => $validated['message'],
            'status' => 'pending',
            'is_read' => false,
        ]);

        Log::info("New contact inquiry received from {$inquiry->name} ({$inquiry->email}) - Type: {$inquiry->inquiry_type}");

        return response()->json([
            'status' => 'success',
            'message' => 'Your message has been received! Our admissions team will contact you shortly.',
            'data' => $inquiry,
        ], 201);
    }

    /**
     * Admin: List all contact inquiries with filtering, search, and statistical metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContactInquiry::query();

        // Filter by status if provided and not 'all'
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by inquiry_type if provided and not 'all'
        if ($request->filled('inquiry_type') && $request->inquiry_type !== 'all') {
            $query->where('inquiry_type', $request->inquiry_type);
        }

        // Search by name, email, phone, or message content
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%")
                  ->orWhere('inquiry_type', 'like', "%{$search}%");
            });
        }

        $perPage = $request->integer('per_page', 50);
        $inquiries = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Aggregate statistics for admin metrics
        $stats = [
            'total' => ContactInquiry::count(),
            'pending' => ContactInquiry::where('status', 'pending')->count(),
            'unread' => ContactInquiry::where('is_read', false)->count(),
            'contacted' => ContactInquiry::where('status', 'contacted')->count(),
            'resolved' => ContactInquiry::where('status', 'resolved')->count(),
            'tours' => ContactInquiry::where('inquiry_type', 'like', '%tour%')->orWhere('inquiry_type', 'like', '%visit%')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $inquiries->items(),
            'meta' => [
                'current_page' => $inquiries->currentPage(),
                'last_page' => $inquiries->lastPage(),
                'per_page' => $inquiries->perPage(),
                'total' => $inquiries->total(),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Admin: View specific inquiry details and mark as read.
     */
    public function show(ContactInquiry $inquiry): JsonResponse
    {
        if (!$inquiry->is_read) {
            $inquiry->update(['is_read' => true]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $inquiry,
        ]);
    }

    /**
     * Admin: Update status, admin notes, or read state.
     */
    public function update(Request $request, ContactInquiry $inquiry): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,contacted,resolved,spam'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
            'is_read' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['status']) && in_array($validated['status'], ['contacted', 'resolved']) && !$inquiry->responded_at) {
            $validated['responded_at'] = now();
        }

        $inquiry->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Inquiry updated successfully.',
            'data' => $inquiry,
        ]);
    }

    /**
     * Admin: Delete specific inquiry.
     */
    public function destroy(ContactInquiry $inquiry): JsonResponse
    {
        $inquiry->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Inquiry deleted successfully.',
        ]);
    }

    /**
     * Admin: Clear all inquiries or clear resolved ones.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $onlyResolved = $request->boolean('only_resolved', false);

        if ($onlyResolved) {
            ContactInquiry::where('status', 'resolved')->delete();
            $msg = 'All resolved inquiries cleared.';
        } else {
            ContactInquiry::truncate();
            $msg = 'All inquiries cleared permanently.';
        }

        return response()->json([
            'status' => 'success',
            'message' => $msg,
        ]);
    }
}
