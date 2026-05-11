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

        $query = Message::query();

        // If requesting admin broadcasts specifically
        if ($request->input('sender_type') === 'admin') {
            $query->where('sender_type', \App\Models\Admin::class)
                  ->where('receiver_id', $user->id)
                  ->where('receiver_type', $userClass);
        } else {
            $query->where(function ($q) use ($user, $userClass) {
                $q->where('sender_id', $user->id)
                  ->where('sender_type', $userClass);
            })
            ->orWhere(function ($q) use ($user, $userClass) {
                $q->where('receiver_id', $user->id)
                  ->where('receiver_type', $userClass);
            });
        }

        return $query->with(['sender', 'receiver'])
            ->latest()
            ->paginate($request->input('per_page', 20));
    }

    public function store(Request $request)
    {
        $sender = $request->user();
        
        $validated = $request->validate([
            'content' => 'required|string',
            'receiver_id' => 'nullable|integer',
            'receiver_type' => 'nullable|string',
            'target_type' => 'sometimes|string|in:single,class',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        $content = $validated['content'];
        $target = $validated['target_type'] ?? 'single';

        if ($target === 'class' && $sender->role === 'teacher') {
            $classId = $validated['school_class_id'];
            if (!$classId) {
                return response()->json(['message' => 'Class ID is required for class broadcast.'], 422);
            }

            $class = \App\Models\SchoolClass::with('students')->findOrFail($classId);
            $students = $class->students;

            foreach ($students as $student) {
                Message::create([
                    'sender_id' => $sender->id,
                    'sender_type' => get_class($sender),
                    'receiver_id' => $student->id,
                    'receiver_type' => \App\Models\Student::class,
                    'content' => $content,
                ]);
            }

            return response()->json([
                'message' => 'Class announcement sent successfully.',
                'sent_count' => $students->count(),
            ], 201);
        }

        // Default single message logic
        if (empty($validated['receiver_id'])) {
            return response()->json(['message' => 'Receiver ID is required for single message.'], 422);
        }

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
            'content' => $content,
        ]);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => $message
        ], 201);
    }

    public function show(Message $message)
    {
        return $message->load(['sender', 'receiver']);
    }

    /**
     * Admin broadcasts a message to various groups or specific users.
     */
    public function adminBroadcast(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'target_type' => 'required|string|in:all_students,all_teachers,everyone,student,teacher',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $admin = $request->user();
        $adminType = get_class($admin);
        $content = $validated['content'];
        $target = $validated['target_type'];

        $receivers = [];

        if ($target === 'all_teachers') {
            $receivers = \App\Models\Teacher::all()->map(fn($t) => ['id' => $t->id, 'type' => \App\Models\Teacher::class]);
        } elseif ($target === 'all_students') {
            $receivers = \App\Models\Student::all()->map(fn($s) => ['id' => $s->id, 'type' => \App\Models\Student::class]);
        } elseif ($target === 'everyone') {
            $t = \App\Models\Teacher::all()->map(fn($t) => ['id' => $t->id, 'type' => \App\Models\Teacher::class]);
            $s = \App\Models\Student::all()->map(fn($s) => ['id' => $s->id, 'type' => \App\Models\Student::class]);
            $w = \App\Models\Worker::all()->map(fn($w) => ['id' => $w->id, 'type' => \App\Models\Worker::class]);
            $receivers = $t->concat($s)->concat($w);
        } elseif ($target === 'student' && !empty($validated['student_id'])) {
            $receivers[] = ['id' => $validated['student_id'], 'type' => \App\Models\Student::class];
        } elseif ($target === 'teacher' && !empty($validated['teacher_id'])) {
            $receivers[] = ['id' => $validated['teacher_id'], 'type' => \App\Models\Teacher::class];
        }

        if (empty($receivers)) {
            return response()->json(['message' => 'No receivers found for the specified target.'], 422);
        }

        $count = 0;
        foreach ($receivers as $rcv) {
            Message::create([
                'sender_id' => $admin->id,
                'sender_type' => $adminType,
                'receiver_id' => $rcv['id'],
                'receiver_type' => $rcv['type'],
                'content' => $content,
            ]);
            $count++;
        }

        return response()->json([
            'message' => "Message sent to $count recipient(s) successfully.",
            'sent_count' => $count
        ], 201);
    }

    public function update(Request $request, Message $message)
    {
        $user = $request->user();
        if ($message->sender_id !== $user->id || $message->sender_type !== get_class($user)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $message->update(['content' => $validated['content']]);

        return response()->json([
            'message' => 'Message updated successfully.',
            'data' => $message
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        $user = $request->user();
        // Allow sender or receiver to delete
        $isSender = ($message->sender_id === $user->id && $message->sender_type === get_class($user));
        $isReceiver = ($message->receiver_id === $user->id && $message->receiver_type === get_class($user));

        if (!$isSender && !$isReceiver && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $message->delete();

        return response()->json(['message' => 'Message deleted successfully.']);
    }

    public function clearChat(Request $request)
    {
        $user = $request->user();
        $userClass = get_class($user);
        $otherId = $request->input('other_id');
        $otherType = $request->input('other_type'); // 'student', 'teacher', 'admin'

        if (!$otherId || !$otherType) {
            return response()->json(['message' => 'Other user info required.'], 422);
        }

        $otherModel = match ($otherType) {
            'teacher' => \App\Models\Teacher::class,
            'admin' => \App\Models\Admin::class,
            default => \App\Models\Student::class,
        };

        Message::where(function($q) use ($user, $userClass, $otherId, $otherModel) {
            $q->where('sender_id', $user->id)->where('sender_type', $userClass)
              ->where('receiver_id', $otherId)->where('receiver_type', $otherModel);
        })->orWhere(function($q) use ($user, $userClass, $otherId, $otherModel) {
            $q->where('sender_id', $otherId)->where('sender_type', $otherModel)
              ->where('receiver_id', $user->id)->where('receiver_type', $userClass);
        })->delete();

        return response()->json(['message' => 'Chat cleared successfully.']);
    }

    public function clearAll(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        
        // This clears all broadcast logs and messages visible to admin
        Message::truncate(); 
        
        return response()->json(['message' => 'All communication records cleared.']);
    }
}
