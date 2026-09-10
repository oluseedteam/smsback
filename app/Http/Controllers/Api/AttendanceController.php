<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * List attendance records with optional filtering.
     *
     * Students see only their records. Teachers/Admins can filter by student, class, and date range.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::query()->with([
            'student:id,full_name,student_id',
            'schoolClass:id,name,grade_level',
            'subject:id,name,code',
        ]);

        if ($request->user()->role === 'student') {
            $query->where('student_id', $request->user()->id);
        } elseif ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->integer('school_class_id'));
        }

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('attendance_date', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('attendance_date', '<=', $request->date('date_to'));
        }

        return response()->json($query->latest('attendance_date')->paginate(30));
    }

    /**
     * Store or update attendance records in bulk for a class/subject on a specific date.
     */
    public function storeBulk(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'attendance_date' => ['required', 'date'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'term' => ['required', 'in:1st Term,2nd Term,3rd Term'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.arrival_time' => ['nullable', 'date_format:H:i'],
            'records.*.note' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        if ($user->role === 'teacher') {
            $class = SchoolClass::findOrFail($payload['school_class_id']);
            $isClassTeacher = (int) $class->teacher_id === (int) $user->id;
            $isSubjectTeacher = !empty($payload['subject_id']) && DB::table('class_subject')
                ->where('school_class_id', $class->id)
                ->where('subject_id', $payload['subject_id'])
                ->where('teacher_id', $user->id)
                ->exists();

            if (!$isClassTeacher && !$isSubjectTeacher) {
                return response()->json([
                    'message' => 'Unauthorized. Only the assigned class teacher or admin can mark attendance for this class.'
                ], 403);
            }
        }

        $teacherId = $user->role === 'teacher' ? $user->id : null;

        foreach ($payload['records'] as $record) {
            AttendanceRecord::query()->updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'school_class_id' => $payload['school_class_id'],
                    'subject_id' => $payload['subject_id'] ?? null,
                    'attendance_date' => $payload['attendance_date'],
                ],
                [
                    'status' => $record['status'],
                    'arrival_time' => $record['arrival_time'] ?? null,
                    'note' => $record['note'] ?? null,
                    'marked_by_teacher_id' => $teacherId,
                    'term' => $payload['term'],
                ]
            );
        }

        return response()->json(['message' => 'Attendance saved successfully.']);
    }

    /**
     * Update a single attendance record.
     */
    public function update(Request $request, AttendanceRecord $attendance): JsonResponse
    {
        $payload = $request->validate([
            'status' => ['sometimes', 'in:present,absent,late,excused'],
            'arrival_time' => ['nullable', 'date_format:H:i'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        if ($user->role === 'teacher') {
            $class = SchoolClass::findOrFail($attendance->school_class_id);
            $isClassTeacher = (int) $class->teacher_id === (int) $user->id;
            $isSubjectTeacher = !empty($attendance->subject_id) && DB::table('class_subject')
                ->where('school_class_id', $class->id)
                ->where('subject_id', $attendance->subject_id)
                ->where('teacher_id', $user->id)
                ->exists();

            if (!$isClassTeacher && !$isSubjectTeacher) {
                return response()->json([
                    'message' => 'Unauthorized. Only the assigned class teacher or admin can update attendance for this class.'
                ], 403);
            }
            $payload['marked_by_teacher_id'] = $user->id;
        }

        $attendance->update($payload);

        return response()->json($attendance->fresh()->load('student:id,full_name,student_id'));
    }
}
