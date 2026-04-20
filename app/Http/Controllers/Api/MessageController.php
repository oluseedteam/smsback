<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userClass = get_class($user);

        return Message::where(function ($query) use ($user, $userClass) {
            $query->where('sender_id', $user->id)
                ->where('sender_type', $userClass);
        })
            ->orWhere(function ($query) use ($user, $userClass) {
                $query->where('receiver_id', $user->id)
                    ->where('receiver_type', $userClass);
            })
            ->with(['sender', 'receiver'])
            ->latest()
            ->paginate($request->input('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|integer',
            'receiver_type' => 'sometimes|string',
            'content' => 'required|string',
        ]);

        $sender = $request->user();
        $receiverType = $validated['receiver_type'] ?? ($sender->role === 'student' ? 'teacher' : 'student');

        $receiverModel = match ($receiverType) {
            'teacher' => \App\Models\Teacher::class,
            'admin' => \App\Models\Admin::class,
            default => \App\Models\Student::class,
        };

        $message = Message::create([
            'sender_id' => $sender->id,
            'sender_type' => get_class($sender),
            'receiver_id' => $validated['receiver_id'],
            'receiver_type' => $receiverModel,
            'content' => $validated['content'],
        ]);

        return response()->json($message, 201);
    }

    public function show(Message $message)
    {
        return $message->load(['sender', 'receiver']);
    }

    // Messages are usually not updated/deleted in simple SMS, but let's leave them as default
}
