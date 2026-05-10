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

    /**
     * Admin broadcasts a message to all teachers or a specific teacher.
     */
    public function adminBroadcast(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'teacher_id' => 'nullable|exists:teachers,id', // null = broadcast to all
        ]);

        $admin = $request->user();
        $adminClass = get_class($admin);

        if ($validated['teacher_id']) {
            // Single teacher
            $msg = Message::create([
                'sender_id' => $admin->id,
                'sender_type' => $adminClass,
                'receiver_id' => $validated['teacher_id'],
                'receiver_type' => \App\Models\Teacher::class,
                'content' => $validated['content'],
            ]);
            return response()->json(['sent' => 1, 'message' => $msg], 201);
        }

        // Broadcast to all teachers
        $teachers = \App\Models\Teacher::all();
        $count = 0;
        foreach ($teachers as $teacher) {
            Message::create([
                'sender_id' => $admin->id,
                'sender_type' => $adminClass,
                'receiver_id' => $teacher->id,
                'receiver_type' => \App\Models\Teacher::class,
                'content' => $validated['content'],
            ]);
            $count++;
        }

        return response()->json(['sent' => $count], 201);
    }

    // Messages are usually not updated/deleted in simple SMS, but let's leave them as default
}
