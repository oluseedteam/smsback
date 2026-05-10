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

    /** Admin replies to / updates status of a dispute */
    public function update(Request $request, Dispute $dispute): JsonResponse
    {
        $validated = $request->validate([
            'status'      => 'sometimes|in:open,in_progress,resolved,closed',
            'admin_reply' => 'sometimes|string',
        ]);

        $dispute->update($validated);

        return response()->json($dispute->fresh()->load('sender'));
    }
}
