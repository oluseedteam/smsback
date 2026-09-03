<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\AdminLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdmissionController extends Controller
{
    /**
     * Public: Submit an admission or teacher application.
     */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:student,teacher'],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            
            // Student specific
            'target_class' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:50'],
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:50'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            'previous_school' => ['nullable', 'string', 'max:255'],
            'last_grade_completed' => ['nullable', 'string', 'max:100'],

            // Teacher specific
            'subject_specialization' => ['nullable', 'string', 'max:255'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'experience_years' => ['nullable', 'string', 'max:50'],
            'cover_letter' => ['nullable', 'string', 'max:3000'],
        ]);

        // Generate unique application reference number
        $prefix = $validated['type'] === 'teacher' ? 'TCH' : 'ADM';
        $year = date('Y');
        $random = strtoupper(Str::random(5));
        $appNumber = "{$prefix}-{$year}-{$random}";

        // Ensure uniqueness
        while (AdmissionApplication::where('application_number', $appNumber)->exists()) {
            $random = strtoupper(Str::random(5));
            $appNumber = "{$prefix}-{$year}-{$random}";
        }

        $validated['application_number'] = $appNumber;
        $validated['status'] = 'pending';

        $application = AdmissionApplication::create($validated);

        return response()->json([
            'message' => 'Application submitted successfully!',
            'application_number' => $application->application_number,
            'application' => $application,
        ], 201);
    }

    /**
     * Public: Track application status by application number or email.
     */
    public function checkStatus(string $identifier): JsonResponse
    {
        $application = AdmissionApplication::where('application_number', $identifier)
            ->orWhere('email', $identifier)
            ->latest()
            ->first();

        if (!$application) {
            return response()->json([
                'message' => 'No application found with the provided reference number or email.',
            ], 404);
        }

        return response()->json([
            'application' => $application,
        ]);
    }

    /**
     * Admin: List all applications with filtering and stats.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AdmissionApplication::query();

        // Filter by role type (student / teacher)
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by status (pending / approved / rejected)
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search query
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('application_number', 'like', "%{$search}%")
                  ->orWhere('target_class', 'like', "%{$search}%")
                  ->orWhere('subject_specialization', 'like', "%{$search}%");
            });
        }

        $applications = $query->latest()->get();

        // Aggregate statistics for dashboard badges
        $stats = [
            'total' => AdmissionApplication::count(),
            'pending' => AdmissionApplication::where('status', 'pending')->count(),
            'approved' => AdmissionApplication::where('status', 'approved')->count(),
            'rejected' => AdmissionApplication::where('status', 'rejected')->count(),
            'students' => AdmissionApplication::where('type', 'student')->count(),
            'teachers' => AdmissionApplication::where('type', 'teacher')->count(),
        ];

        return response()->json([
            'applications' => $applications,
            'stats' => $stats,
        ]);
    }

    /**
     * Admin: View specific application details.
     */
    public function show(int $id): JsonResponse
    {
        $application = AdmissionApplication::findOrFail($id);

        return response()->json([
            'application' => $application,
        ]);
    }

    /**
     * Admin: Update application status (Accept/Approve or Reject).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $application = AdmissionApplication::findOrFail($id);
        $previousStatus = $application->status;
        $newStatus = $validated['status'];

        $application->status = $newStatus;
        $application->admin_notes = $validated['admin_notes'] ?? $application->admin_notes;
        $application->reviewed_at = now();

        $provisionInfo = null;

        // Auto-provision student or teacher account upon approval if not already provisioned
        if ($newStatus === 'approved' && $previousStatus !== 'approved') {
            if ($application->type === 'student') {
                $existingStudent = Student::where('email', $application->email)->first();
                if (!$existingStudent) {
                    $randNumber = rand(1000, 9999);
                    $studentId = "GHRA-STU-{$randNumber}";
                    while (Student::where('student_id', $studentId)->exists()) {
                        $randNumber = rand(1000, 9999);
                        $studentId = "GHRA-STU-{$randNumber}";
                    }

                    $tempPassword = 'Student' . rand(100, 999) . '#';

                    $student = Student::create([
                        'full_name' => $application->full_name,
                        'student_id' => $studentId,
                        'email' => $application->email,
                        'gender' => $application->gender ? strtolower($application->gender) : 'male',
                        'department' => $application->department ? strtolower($application->department) : null,
                        'parent_name' => $application->parent_name,
                        'parent_phone' => $application->parent_phone,
                        'parent_email' => $application->parent_email,
                        'parent_address' => $application->address,
                        'password' => Hash::make($tempPassword),
                        'is_first_login' => true,
                    ]);

                    // If target class specified, attach to class
                    if ($application->target_class) {
                        $matchingClass = SchoolClass::where('name', 'like', "%{$application->target_class}%")->first();
                        if ($matchingClass) {
                            $student->classes()->syncWithoutDetaching([$matchingClass->id]);
                        }
                    }

                    $application->provisioned_id_code = $studentId;
                    $provisionInfo = [
                        'account_type' => 'Student Portal Account',
                        'login_id' => $studentId,
                        'email' => $student->email,
                        'temporary_password' => $tempPassword,
                    ];
                } else {
                    $application->provisioned_id_code = $existingStudent->student_id;
                }
            } elseif ($application->type === 'teacher') {
                $existingTeacher = Teacher::where('email', $application->email)->first();
                if (!$existingTeacher) {
                    $randNumber = rand(1000, 9999);
                    $employeeId = "GHRA-TCH-{$randNumber}";
                    while (Teacher::where('employee_id', $employeeId)->exists()) {
                        $randNumber = rand(1000, 9999);
                        $employeeId = "GHRA-TCH-{$randNumber}";
                    }

                    $tempPassword = 'Teacher' . rand(100, 999) . '#';

                    $teacher = Teacher::create([
                        'full_name' => $application->full_name,
                        'employee_id' => $employeeId,
                        'email' => $application->email,
                        'gender' => $application->gender ? strtolower($application->gender) : 'male',
                        'parent_phone' => $application->phone,
                        'parent_address' => $application->address,
                        'password' => Hash::make($tempPassword),
                        'is_first_login' => true,
                        'can_create_students' => true,
                    ]);

                    $application->provisioned_id_code = $employeeId;
                    $provisionInfo = [
                        'account_type' => 'Teacher Portal Account',
                        'login_id' => $employeeId,
                        'email' => $teacher->email,
                        'temporary_password' => $tempPassword,
                    ];
                } else {
                    $application->provisioned_id_code = $existingTeacher->employee_id;
                }
            }
        }

        $application->save();

        return response()->json([
            'message' => "Application {$newStatus} successfully.",
            'application' => $application,
            'provision_info' => $provisionInfo,
        ]);
    }

    /**
     * Admin: Delete an application.
     */
    public function destroy(int $id): JsonResponse
    {
        $application = AdmissionApplication::findOrFail($id);
        $application->delete();

        return response()->json([
            'message' => 'Application removed successfully.',
        ]);
    }
}
