<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = CalendarEvent::with(['schoolClass']);

        if ($user->role === 'student') {
            $classIds = $user->classes->pluck('id');
            $query->whereIn('school_class_id', $classIds);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'type' => 'nullable|string',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        $user = $request->user();
        $validated['creator_id'] = $user->id;
        $validated['creator_type'] = get_class($user);

        $event = CalendarEvent::create($validated);

        return response()->json($event, 201);
    }

    public function show(Request $request, CalendarEvent $calendar_event)
    {
        if ($request->user()->role === 'student' && $calendar_event->school_class_id !== null) {
            abort_unless(
                $request->user()->classes()->whereKey($calendar_event->school_class_id)->exists(),
                403,
                'You do not have access to this calendar event.'
            );
        }

        return $calendar_event->load('schoolClass');
    }

    public function update(Request $request, CalendarEvent $calendar_event)
    {
        $this->authorizeEventManagement($request, $calendar_event);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'sometimes|required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'type' => 'nullable|string',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        $calendar_event->update($validated);

        return response()->json([
            'message' => 'Calendar event updated successfully.',
            'event' => $calendar_event->fresh()->load('schoolClass'),
        ]);
    }

    public function destroy(Request $request, CalendarEvent $calendar_event)
    {
        $this->authorizeEventManagement($request, $calendar_event);

        $calendar_event->delete();
        return response()->json(null, 204);
    }

    private function authorizeEventManagement(Request $request, CalendarEvent $event): void
    {
        $user = $request->user();
        $allowed = $user->role === 'admin'
            || (
                $user->role === 'teacher'
                && $event->creator_type === get_class($user)
                && (int) $event->creator_id === (int) $user->id
            );

        abort_unless($allowed, 403, 'You cannot modify this calendar event.');
    }
}
