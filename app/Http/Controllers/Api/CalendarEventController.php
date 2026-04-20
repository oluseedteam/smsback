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

    public function destroy(CalendarEvent $calendar_event)
    {
        $calendar_event->delete();
        return response()->json(null, 204);
    }
}
