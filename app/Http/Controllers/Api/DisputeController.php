<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisputeController extends Controller
{
    /** List disputes. Admins see all; teachers/students see their own. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role ?? 'student';

        if ($role === 'admin') {
            $disputes = Dispute::with('sender')
                ->orderBy('created_at', 'desc')
                ->paginate(50);
        } else {
            $disputes = Dispute::where('sender_id', $user->id)
                ->where('sender_type', get_class($user))
                ->orderBy('created_at', 'desc')
                ->paginate(50);
        }

        return response()->json($disputes);
    }

    /** Submit a dispute/feedback */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject'  => 'required|string|max:255',
            'message'  => 'required|string',
            'category' => 'sometimes|in:complaint,suggestion,query,general',
        ]);

        $user = $request->user();

        $dispute = Dispute::create([
            'sender_type' => get_class($user),
            'sender_id'   => $user->id,
            'subject'     => $validated['subject'],
            'message'     => $validated['message'],
            'category'    => $validated['category'] ?? 'general',
        ]);

        return response()->json($dispute, 201);
    }

    /** Edit or reply to a dispute/feedback */
    public function update(Request $request, Dispute $dispute): JsonResponse
    {
        $user = $request->user();
        
        // Authorization: Admin can update anything. Sender can update subject/message if not resolved.
        $isSender = ($dispute->sender_id === $user->id && $dispute->sender_type === get_class($user));
        
        if ($user->role !== 'admin' && !$isSender) {
             return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'subject'     => 'sometimes|string|max:255',
            'message'     => 'sometimes|string',
            'category'    => 'sometimes|in:complaint,suggestion,query,general',
            'status'      => 'sometimes|in:open,in_progress,resolved,closed',
            'admin_reply' => 'sometimes|string',
        ]);

        // Non-admins can't change status or reply
        if ($user->role !== 'admin') {
            unset($validated['status'], $validated['admin_reply']);
        }

        $dispute->update($validated);

        return response()->json([
            'message' => 'Dispute updated successfully.',
            'dispute' => $dispute->fresh()->load('sender')
        ]);
    }

    /** Delete a dispute/feedback */
    public function destroy(Request $request, Dispute $dispute): JsonResponse
    {
        $user = $request->user();
        $isSender = ($dispute->sender_id === $user->id && $dispute->sender_type === get_class($user));

        if ($user->role !== 'admin' && !$isSender) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $dispute->delete();

        return response()->json(['message' => 'Dispute deleted successfully.']);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        Dispute::truncate();
        return response()->json(['message' => 'All disputes/feedback cleared successfully.']);
    }
}
