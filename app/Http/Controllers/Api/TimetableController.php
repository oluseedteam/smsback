<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AuditLog;
use App\Models\SchoolClass;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timetable;
use App\Models\TimetableChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    /**
     * Get timetable matrix grid filtered by session, term, class, section, or teacher.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Timetable::with([
            'academicSession:id,name,current_term',
            'schoolClass:id,name,grade_level',
            'subject:id,name,code',
            'teacher:id,full_name,employee_id',
        ]);

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->integer('academic_session_id'));
        }

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->integer('school_class_id'));
        }

        if ($request->filled('section')) {
            $query->where('section', $request->input('section'));
        }

        // If filtering specifically by teacher
        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->integer('teacher_id'));
        } elseif ($user && $user->role === 'teacher' && !$request->filled('school_class_id')) {
            // By default, if teacher requests without classId, show teacher's schedule
            $query->where('teacher_id', $user->id);
        }

        // If student requests without classId, show their class schedule
        if ($user && $user->role === 'student' && !$request->filled('school_class_id')) {
            $classIds = $user->classes->pluck('id');
            $query->whereIn('school_class_id', $classIds);
        }

        $entries = $query->orderBy('day_of_week')
            ->orderBy('period_number')
            ->get();

        return response()->json([
            'entries' => $entries,
            'days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'default_periods' => [
                ['period_number' => 1, 'period_name' => 'Period 1', 'start_time' => '08:00', 'end_time' => '08:45', 'is_break' => false],
                ['period_number' => 2, 'period_name' => 'Period 2', 'start_time' => '08:45', 'end_time' => '09:30', 'is_break' => false],
                ['period_number' => 3, 'period_name' => 'Period 3', 'start_time' => '09:30', 'end_time' => '10:15', 'is_break' => false],
                ['period_number' => 4, 'period_name' => 'Short Break', 'start_time' => '10:15', 'end_time' => '10:45', 'is_break' => true],
                ['period_number' => 5, 'period_name' => 'Period 4', 'start_time' => '10:45', 'end_time' => '11:30', 'is_break' => false],
                ['period_number' => 6, 'period_name' => 'Period 5', 'start_time' => '11:30', 'end_time' => '12:15', 'is_break' => false],
                ['period_number' => 7, 'period_name' => 'Lunch Break', 'start_time' => '12:15', 'end_time' => '13:00', 'is_break' => true],
                ['period_number' => 8, 'period_name' => 'Period 6', 'start_time' => '13:00', 'end_time' => '13:45', 'is_break' => false],
                ['period_number' => 9, 'period_name' => 'Period 7', 'start_time' => '13:45', 'end_time' => '14:30', 'is_break' => false],
            ]
        ]);
    }

    /**
     * Store or update a single timetable entry with conflict checking.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term' => 'required|string',
            'school_class_id' => 'required|exists:school_classes,id',
            'section' => 'nullable|string',
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday',
            'period_number' => 'required|integer|min:1|max:12',
            'period_name' => 'nullable|string',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'subject_id' => 'nullable|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string',
            'is_break' => 'nullable|boolean',
        ]);

        $isBreak = $validated['is_break'] ?? false;

        // 1. Conflict Check: Class conflict (unless break)
        $classConflict = Timetable::where('academic_session_id', $validated['academic_session_id'])
            ->where('term', $validated['term'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where('period_number', $validated['period_number'])
            ->first();

        // 2. Conflict Check: Teacher conflict (if teacher assigned and not break)
        if (!$isBreak && !empty($validated['teacher_id'])) {
            $teacherConflict = Timetable::where('academic_session_id', $validated['academic_session_id'])
                ->where('term', $validated['term'])
                ->where('teacher_id', $validated['teacher_id'])
                ->where('day_of_week', $validated['day_of_week'])
                ->where('period_number', $validated['period_number'])
                ->where('school_class_id', '!=', $validated['school_class_id'])
                ->with(['schoolClass:id,name'])
                ->first();

            if ($teacherConflict) {
                return response()->json([
                    'message' => "Teacher conflict: Assigned teacher is already scheduled for {$teacherConflict->schoolClass?->name} at this time.",
                    'conflict' => $teacherConflict
                ], 422);
            }
        }

        if ($classConflict) {
            $classConflict->update($validated);
            $entry = $classConflict;
        } else {
            $entry = Timetable::create($validated);
        }

        // Audit Log
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_type' => $request->user()?->role ?? 'admin',
            'user_name' => $request->user()?->full_name ?? 'Admin',
            'action' => 'TIMETABLE_CHANGED',
            'academic_session_id' => $validated['academic_session_id'],
            'term' => $validated['term'],
            'details' => [
                'entry_id' => $entry->id,
                'class_id' => $validated['school_class_id'],
                'day' => $validated['day_of_week'],
                'period' => $validated['period_number'],
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Timetable cell saved successfully.',
            'entry' => $entry->load(['subject', 'teacher', 'schoolClass', 'academicSession']),
        ]);
    }

    /**
     * Delete a timetable entry.
     */
    public function destroy(Timetable $timetable): JsonResponse
    {
        $timetable->delete();
        return response()->json(['message' => 'Timetable cell cleared.']);
    }

    /**
     * Teacher: Request a change to a timetable entry.
     */
    public function requestChange(Request $request): JsonResponse
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'timetable_id' => 'required|exists:timetables,id',
            'requested_day' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday',
            'requested_period_number' => 'required|integer|min:1|max:12',
            'requested_start_time' => 'nullable|string',
            'requested_end_time' => 'nullable|string',
            'reason' => 'required|string|max:500',
        ]);

        $timetable = Timetable::findOrFail($validated['timetable_id']);

        // Verify teacher belongs to timetable or is assigned
        if ($timetable->teacher_id && $timetable->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'You can only request changes for your own timetable entries.'], 403);
        }

        $changeRequest = TimetableChangeRequest::create([
            'timetable_id' => $timetable->id,
            'teacher_id' => $teacher->id,
            'requested_day' => $validated['requested_day'],
            'requested_period_number' => $validated['requested_period_number'],
            'requested_start_time' => $validated['requested_start_time'] ?? $timetable->start_time,
            'requested_end_time' => $validated['requested_end_time'] ?? $timetable->end_time,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Timetable change request submitted to Administration.',
            'request' => $changeRequest->load(['timetable.subject', 'timetable.schoolClass']),
        ], 201);
    }

    /**
     * Admin/Teacher: List timetable change requests.
     */
    public function listChangeRequests(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = TimetableChangeRequest::with([
            'timetable.subject:id,name,code',
            'timetable.schoolClass:id,name',
            'teacher:id,full_name,employee_id',
            'reviewer:id,full_name',
        ]);

        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Admin: Approve timetable change request.
     */
    public function approveChangeRequest(Request $request, int $id): JsonResponse
    {
        $changeRequest = TimetableChangeRequest::with('timetable')->findOrFail($id);
        $timetable = $changeRequest->timetable;
        $admin = $request->user();

        // Revalidate conflicts for destination cell
        $conflict = Timetable::where('academic_session_id', $timetable->academic_session_id)
            ->where('term', $timetable->term)
            ->where('day_of_week', $changeRequest->requested_day)
            ->where('period_number', $changeRequest->requested_period_number)
            ->where('id', '!=', $timetable->id)
            ->where(function ($q) use ($timetable) {
                $q->where('school_class_id', $timetable->school_class_id)
                  ->orWhere('teacher_id', $timetable->teacher_id);
            })
            ->first();

        if ($conflict) {
            return response()->json([
                'message' => 'Cannot approve: Conflict exists in the requested time slot.',
                'conflict' => $conflict
            ], 422);
        }

        // Update timetable entry
        $timetable->update([
            'day_of_week' => $changeRequest->requested_day,
            'period_number' => $changeRequest->requested_period_number,
            'start_time' => $changeRequest->requested_start_time ?: $timetable->start_time,
            'end_time' => $changeRequest->requested_end_time ?: $timetable->end_time,
        ]);

        $changeRequest->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        // Audit Log
        AuditLog::create([
            'user_id' => $admin->id,
            'user_type' => 'admin',
            'user_name' => $admin->full_name,
            'action' => 'TIMETABLE_CHANGED',
            'academic_session_id' => $timetable->academic_session_id,
            'term' => $timetable->term,
            'details' => [
                'change_request_id' => $changeRequest->id,
                'teacher_id' => $changeRequest->teacher_id,
                'new_day' => $changeRequest->requested_day,
                'new_period' => $changeRequest->requested_period_number,
            ],
            'ip_address' => $request->ip(),
        ]);

        // Notification for Teacher
        StudentNotification::create([
            'user_id' => $changeRequest->teacher_id,
            'user_type' => 'teacher',
            'title' => 'Timetable Change Request Approved',
            'message' => "Your timetable change request for {$changeRequest->requested_day} (Period {$changeRequest->requested_period_number}) has been approved.",
            'link' => '/teacher/calendar',
            'type' => 'timetable_approved',
        ]);

        return response()->json([
            'message' => 'Timetable change request approved and timetable updated.',
            'request' => $changeRequest->fresh(),
        ]);
    }

    /**
     * Admin: Reject timetable change request.
     */
    public function rejectChangeRequest(Request $request, int $id): JsonResponse
    {
        $changeRequest = TimetableChangeRequest::findOrFail($id);
        $admin = $request->user();

        $changeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->input('admin_notes', 'Request could not be accommodated at this time.'),
        ]);

        // Notification for Teacher
        StudentNotification::create([
            'user_id' => $changeRequest->teacher_id,
            'user_type' => 'teacher',
            'title' => 'Timetable Change Request Declined',
            'message' => "Your timetable change request was not approved. Note: " . ($changeRequest->admin_notes ?: 'Schedule conflict.'),
            'link' => '/teacher/calendar',
            'type' => 'timetable_rejected',
        ]);

        return response()->json([
            'message' => 'Timetable change request rejected.',
            'request' => $changeRequest->fresh(),
        ]);
    }
}
