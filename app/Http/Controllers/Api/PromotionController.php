<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AuditLog;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\StudentPromotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PromotionController extends Controller
{
    /**
     * Admin: Get students eligible for promotion from a given session and class.
     */
    public function getEligibleStudents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'school_class_id' => 'required|exists:school_classes,id',
            'section' => 'nullable|string',
        ]);

        $students = Student::whereHas('classes', function ($q) use ($validated) {
            $q->where('school_classes.id', $validated['school_class_id']);
        })
        ->when($validated['section'] ?? null, function ($q, $sec) {
            $q->where('section', $sec);
        })
        ->with(['reportCards' => function ($q) use ($validated) {
            $q->where('academic_session_id', $validated['academic_session_id']);
        }])
        ->orderBy('full_name')
        ->get();

        $rows = $students->map(function ($s) use ($validated) {
            $thirdTermReport = $s->reportCards
                ->first(fn ($report) => in_array(strtolower(str_replace([' ', '-'], '_', $report->term)), ['3rd_term', 'third_term'], true));

            return [
                'id' => $s->id,
                'student_id' => $s->student_id,
                'full_name' => $s->full_name,
                'email' => $s->email,
                'gender' => $s->gender,
                'section' => $s->section,
                'status' => $s->status,
                'third_term_average' => $thirdTermReport?->average_score,
                'cumulative_average' => $thirdTermReport?->cumulative_average,
                'promotion_status' => $thirdTermReport?->promotion_status,
                'recommendation' => $thirdTermReport?->cumulative_average !== null
                    ? ((float) $thirdTermReport->cumulative_average >= 50 ? 'promote' : 'repeat')
                    : 'incomplete',
            ];
        });

        return response()->json([
            'students' => $rows,
            'total' => count($rows),
        ]);
    }

    /**
     * Admin: Execute bulk promotion of students to destination session/class/section.
     */
    public function promote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_session_id' => 'required|exists:academic_sessions,id',
            'from_class_id' => 'required|exists:school_classes,id',
            'from_section' => 'nullable|string',
            'to_session_id' => 'nullable|required_unless:promotion_status,graduated,withdrawn,transferred|exists:academic_sessions,id',
            'to_class_id' => 'nullable|required_unless:promotion_status,graduated,withdrawn,transferred|exists:school_classes,id',
            'to_section' => 'nullable|string',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'promotion_status' => 'required|string|in:promoted,promoted_on_trial,retained,graduated,transferred,withdrawn',
            'notes' => 'nullable|string',
        ]);

        $admin = $request->user();
        $status = $validated['promotion_status'];
        $promotedCount = 0;

        $eligibleStudentIds = Student::whereIn('id', $validated['student_ids'])
            ->whereHas('classes', fn ($query) => $query->where('school_classes.id', $validated['from_class_id']))
            ->pluck('id');
        if ($eligibleStudentIds->count() !== count(array_unique($validated['student_ids']))) {
            return response()->json(['message' => 'Every selected student must belong to the source class.'], 422);
        }

        DB::transaction(function () use ($validated, $admin, $status, &$promotedCount) {
            $toClass = !empty($validated['to_class_id']) ? SchoolClass::findOrFail($validated['to_class_id']) : null;
            $toSession = !empty($validated['to_session_id']) ? AcademicSession::findOrFail($validated['to_session_id']) : null;

            foreach ($validated['student_ids'] as $studentId) {
                $student = Student::findOrFail($studentId);

                $annualReport = $student->reportCards()
                    ->where('academic_session_id', $validated['from_session_id'])
                    ->whereIn('term', ['3rd Term', 'Third Term', 'third_term'])
                    ->whereIn('status', ['approved', 'released'])
                    ->first();
                if (!$annualReport) {
                    throw ValidationException::withMessages([
                        'student_ids' => "Student {$student->student_id} has no approved Third Term annual result.",
                    ]);
                }

                // 1. Record permanent history log
                $previousPromotion = StudentPromotion::where('student_id', $student->id)
                    ->where('from_session_id', $validated['from_session_id'])
                    ->first();
                StudentPromotion::updateOrCreate([
                    'student_id' => $student->id,
                    'from_session_id' => $validated['from_session_id'],
                ], [
                    'from_class_id' => $validated['from_class_id'],
                    'from_section' => $validated['from_section'] ?? $student->section,
                    'to_session_id' => $validated['to_session_id'] ?? null,
                    'to_class_id' => $validated['to_class_id'] ?? null,
                    'to_section' => $validated['to_section'] ?? $student->section,
                    'promotion_status' => $status,
                    'annual_average' => $annualReport->cumulative_average,
                    'reason' => $validated['notes'] ?? null,
                    'promoted_by' => $admin?->id,
                    'promoted_at' => now(),
                    'notes' => $validated['notes'] ?? ($toClass ? "Academic decision recorded for {$toClass->name}" : 'Final academic decision recorded by Administration'),
                ]);

                // 2. Update Student's active class without modifying past course registrations/results
                if (in_array($status, ['graduated', 'withdrawn', 'transferred'], true)) {
                    $student->update([
                        'status' => $status === 'graduated' ? 'graduated' : 'inactive',
                    ]);
                } else {
                    $student->update([
                        'section' => $validated['to_section'] ?? $student->section,
                        'academic_session_id' => $validated['to_session_id'],
                    ]);

                    // Sync student's primary active class to destination
                    $student->classes()->sync([$validated['to_class_id']]);
                }

                // 3. Create student in-app notification
                StudentNotification::create([
                    'user_id' => $student->id,
                    'user_type' => 'student',
                    'title' => 'Academic Promotion Announcement',
                    'message' => $toClass && $toSession
                        ? "Your academic status is {$status}. Your class for {$toSession->name} is {$toClass->name}."
                        : "Your academic status has been updated to {$status}.",
                    'link' => '/student/my-classes',
                    'type' => 'promotion',
                ]);

                $displayStatus = match ($status) {
                    'promoted' => 'Promoted',
                    'promoted_on_trial' => 'Promoted on Trial',
                    'retained' => 'Repeat',
                    'graduated' => 'Graduated',
                    'transferred' => 'Transferred',
                    'withdrawn' => 'Withdrawn',
                };
                $annualReport->update([
                    'promotion_status' => $displayStatus,
                    'destination_class_id' => $status === 'graduated' ? null : $toClass?->id,
                    'destination_class_name' => $status === 'graduated' ? null : $toClass?->name,
                    'pdf_path' => null,
                    'pdf_generated_at' => null,
                ]);

                if ($previousPromotion) {
                    AuditLog::record('PROMOTION_CHANGED', $student->id, $validated['from_session_id'], '3rd Term', [
                        'previous' => $previousPromotion->toArray(),
                        'new_status' => $status,
                        'new_class_id' => $toClass?->id,
                    ]);
                }

                $promotedCount++;
            }

            // 4. Record Audit Log
            AuditLog::create([
                'user_id' => $admin?->id,
                'user_type' => 'admin',
                'user_name' => $admin?->full_name ?? 'Admin',
                'action' => 'PROMOTION',
                'academic_session_id' => $validated['to_session_id'],
                'details' => [
                    'count' => $promotedCount,
                    'from_class_id' => $validated['from_class_id'],
                    'to_class_id' => $validated['to_class_id'] ?? null,
                    'promotion_status' => $status,
                ],
                'ip_address' => request()->ip(),
            ]);
        });

        return response()->json([
            'message' => "Successfully promoted {$promotedCount} student(s).",
            'promoted_count' => $promotedCount,
        ]);
    }

    /**
     * Get promotion history for a student or globally.
     */
    public function history(Request $request): JsonResponse
    {
        $query = StudentPromotion::with([
            'student:id,full_name,student_id,email',
            'fromSession:id,name',
            'fromClass:id,name',
            'toSession:id,name',
            'toClass:id,name',
            'promotedBy:id,full_name',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('from_session_id')) {
            $query->where('from_session_id', $request->integer('from_session_id'));
        }

        return response()->json($query->latest('promoted_at')->paginate(50));
    }
}
