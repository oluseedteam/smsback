<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Teacher;
use App\Models\Worker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    /**
     * List all users filtered by their role (admin, teacher, student, worker).
     */
    public function index(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['required', Rule::in(['admin', 'teacher', 'student', 'worker'])],
            'status' => ['nullable', 'string'],
        ]);

        $query = $this->resolveModel($payload['role'])::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($payload['role'] === 'student') {
            $query->with(['classes', 'academicSession']);
        } elseif ($payload['role'] === 'teacher') {
            $query->with(['subjects', 'assignedClass']);
        }

        $users = $query->latest()->paginate(100);

        return response()->json($users);
    }

    /**
     * Create a new user account (admin, sub_admin, teacher, student, worker).
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['required', Rule::in(['admin', 'teacher', 'student', 'worker'])],
            'full_name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'other_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'student_id' => ['nullable', 'required_if:role,student', 'string', 'max:50'],
            'employee_id' => ['nullable', 'required_if:role,teacher,worker', 'string', 'max:50'],
            'is_prefect' => ['nullable', 'boolean'],
            'prefect_title' => ['nullable', 'string', 'max:255'],
            'institutional_role' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
            'phone' => ['nullable', 'string', 'max:50'],
            'profile_picture' => ['nullable', 'string'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'section' => ['nullable', 'string', 'max:50'],
            'academic_session_id' => ['nullable', 'exists:academic_sessions,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['exists:subjects,id'],
            'teaching_assignments' => ['nullable', 'array'],
            'teaching_assignments.*.school_class_id' => ['required', 'exists:school_classes,id'],
            'teaching_assignments.*.subject_id' => ['required', 'exists:subjects,id'],
            'can_create_students' => ['nullable', 'boolean'],
            'class_teacher_of' => ['nullable', 'exists:school_classes,id'],
            'department' => ['nullable', 'string', 'max:100'],
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:50'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            'parent_address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:100'],
            'admin_role_type' => ['nullable', 'string', 'in:admin,sub_admin'],
            'permissions' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'in:active,pending_approval,suspended,inactive'],
        ]);

        if ($this->emailExists($payload['email'])) {
            return response()->json(['message' => 'The email has already been taken.'], 422);
        }

        if (!empty($payload['student_id']) && Student::query()->where('student_id', $payload['student_id'])->exists()) {
            return response()->json(['message' => 'Student ID is already taken.'], 422);
        }

        if (
            !empty($payload['employee_id']) && 
            (Teacher::query()->where('employee_id', $payload['employee_id'])->exists() || Worker::query()->where('employee_id', $payload['employee_id'])->exists())
        ) {
            return response()->json(['message' => 'Employee ID is already taken.'], 422);
        }

        $fullName = trim($payload['full_name'] ?? '');
        if (empty($fullName)) {
            $fullName = trim(($payload['first_name'] ?? '') . ' ' . ($payload['last_name'] ?? '') . ' ' . ($payload['other_name'] ?? ''));
        }
        if (empty($fullName)) {
            $fullName = ucfirst($payload['role']) . ' User';
        }

        $modelClass = $this->resolveModel($payload['role']);
        $creationData = [
            'full_name' => $fullName,
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'gender' => $payload['gender'] ?? null,
            'profile_picture' => $payload['profile_picture'] ?? null,
            'status' => $payload['status'] ?? 'active',
        ];

        if ($payload['role'] === 'student') {
            $creationData['student_id'] = $payload['student_id'] ?? null;
            $creationData['first_name'] = $payload['first_name'] ?? null;
            $creationData['last_name'] = $payload['last_name'] ?? null;
            $creationData['other_name'] = $payload['other_name'] ?? null;
            $creationData['section'] = $payload['section'] ?? null;
            $creationData['academic_session_id'] = $payload['academic_session_id'] ?? null;
            $creationData['is_prefect'] = $payload['is_prefect'] ?? false;
            $creationData['prefect_title'] = $payload['prefect_title'] ?? null;
            $creationData['department'] = $payload['department'] ?? null;
            $creationData['parent_name'] = $payload['parent_name'] ?? null;
            $creationData['parent_phone'] = $payload['parent_phone'] ?? null;
            $creationData['parent_email'] = $payload['parent_email'] ?? null;
            $creationData['parent_address'] = $payload['parent_address'] ?? null;
            $creationData['emergency_contact_name'] = $payload['emergency_contact_name'] ?? null;
            $creationData['emergency_contact_phone'] = $payload['emergency_contact_phone'] ?? null;
            $creationData['emergency_contact_relationship'] = $payload['emergency_contact_relationship'] ?? null;
            $creationData['qr_code_identifier'] = 'GHRA-STU-' . strtoupper(Str::random(10));
        } elseif ($payload['role'] === 'teacher') {
            $creationData['employee_id'] = $payload['employee_id'] ?? null;
            $creationData['phone'] = $payload['phone'] ?? null;
            $creationData['institutional_role'] = $payload['institutional_role'] ?? null;
            $creationData['can_create_students'] = $payload['can_create_students'] ?? false;
            $creationData['class_teacher_of'] = $payload['class_teacher_of'] ?? null;
            $creationData['emergency_contact_name'] = $payload['emergency_contact_name'] ?? null;
            $creationData['emergency_contact_phone'] = $payload['emergency_contact_phone'] ?? null;
            $creationData['emergency_contact_relationship'] = $payload['emergency_contact_relationship'] ?? null;
            $creationData['qr_code_identifier'] = 'GHRA-TCH-' . strtoupper(Str::random(10));
        } elseif ($payload['role'] === 'worker') {
            $creationData['employee_id'] = $payload['employee_id'] ?? null;
            $creationData['phone'] = $payload['phone'] ?? null;
            $creationData['institutional_role'] = $payload['institutional_role'] ?? null;
            $creationData['qr_code_identifier'] = 'GHRA-WRK-' . strtoupper(Str::random(10));
        } elseif ($payload['role'] === 'admin') {
            $creationData['role'] = $payload['admin_role_type'] ?? 'admin';
            $creationData['permissions'] = $payload['permissions'] ?? null;
            $creationData['phone'] = $payload['phone'] ?? null;
            $creationData['qr_code_identifier'] = 'GHRA-ADM-' . strtoupper(Str::random(10));
        }

        $user = $modelClass::query()->create($creationData);

        if ($payload['role'] === 'student' && !empty($payload['class_id'])) {
            $user->classes()->sync([$payload['class_id']]);
        }

        if ($payload['role'] === 'teacher') {
            $assignments = $payload['teaching_assignments'] ?? [];
            if ($assignments === [] && !empty($payload['class_teacher_of'])) {
                $assignments = collect($payload['subject_ids'] ?? [])->map(fn ($subjectId) => [
                    'school_class_id' => $payload['class_teacher_of'],
                    'subject_id' => $subjectId,
                ])->all();
            }
            $this->syncTeacherAssignments($user, $assignments);
        }

        // Audit Log
        $actionName = match ($payload['role']) {
            'student' => 'STUDENT_CREATED',
            'teacher' => 'TEACHER_CREATED',
            'admin' => 'ADMIN_CREATED',
            default => 'USER_CREATED',
        };

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_type' => 'admin',
            'user_name' => $request->user()?->full_name ?? 'Admin',
            'action' => $actionName,
            'details' => [
                'created_user_id' => $user->id,
                'email' => $user->email,
                'role' => $payload['role'],
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => ucfirst($payload['role']) . ' created successfully.',
            'user' => $this->formatUser($user, $payload['role'])
        ], 201);
    }

    /**
     * Admin: Approve a student created by a teacher.
     */
    public function approveStudent(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        if (!$admin || !in_array($admin->role, ['admin', 'sub_admin'])) {
            return response()->json(['message' => 'Unauthorized. Teachers cannot approve students.'], 403);
        }

        $student = Student::findOrFail($id);
        $student->update(['status' => 'active']);

        // Audit Log
        AuditLog::create([
            'user_id' => $admin->id,
            'user_type' => 'admin',
            'user_name' => $admin->full_name,
            'action' => 'STUDENT_APPROVED',
            'student_id' => $student->id,
            'details' => [
                'student_id' => $student->student_id,
                'email' => $student->email,
            ],
            'ip_address' => $request->ip(),
        ]);

        // Notification
        StudentNotification::create([
            'user_id' => $student->id,
            'user_type' => 'student',
            'title' => 'Admission & Account Approved',
            'message' => 'Your student account has been approved by the Administration. You may now access your portal.',
            'link' => '/student',
            'type' => 'student_approved',
        ]);

        return response()->json([
            'message' => "Student {$student->full_name} has been approved and activated.",
            'student' => $student->fresh()->load('classes'),
        ]);
    }

    /**
     * Admin: Reject a student registration.
     */
    public function rejectStudent(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        if (!$admin || !in_array($admin->role, ['admin', 'sub_admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $student = Student::findOrFail($id);
        $student->update(['status' => 'rejected']);

        AuditLog::create([
            'user_id' => $admin->id,
            'user_type' => 'admin',
            'user_name' => $admin->full_name,
            'action' => 'STUDENT_REJECTED',
            'student_id' => $student->id,
            'details' => ['reason' => $request->input('reason', 'Admin decision')],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => "Student registration for {$student->full_name} has been rejected.",
            'student' => $student->fresh(),
        ]);
    }

    /**
     * Get details of a specific user.
     */
    public function show(string $role, int $id): JsonResponse
    {
        $query = $this->resolveModel($role)::query();
        
        if ($role === 'student') {
            $query->with(['classes', 'academicSession']);
        } elseif ($role === 'teacher') {
            $query->with(['subjects', 'assignedClass']);
        }

        $user = $query->findOrFail($id);
        $formatted = $this->formatUser($user, $role);

        // Include attendance data for students
        if ($role === 'student') {
            $attendance = AttendanceRecord::where('student_id', $id)
                ->with(['schoolClass:id,name', 'subject:id,name'])
                ->orderBy('attendance_date', 'desc')
                ->get();

            $presentCount = $attendance->where('status', 'present')->count();
            $absentCount = $attendance->where('status', 'absent')->count();
            $lateCount = $attendance->where('status', 'late')->count();
            $total = $attendance->count();
            $rate = $total > 0 ? round(($presentCount / $total) * 100) : 100;

            $formatted['attendance'] = [
                'records' => $attendance,
                'summary' => [
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'late' => $lateCount,
                    'total' => $total,
                    'rate' => $rate,
                ],
            ];
        }

        return response()->json($formatted);
    }

    /**
     * Update user profile information.
     */
    public function update(Request $request, string $role, int $id): JsonResponse
    {
        $user = $this->resolveModel($role)::query()->findOrFail($id);

        $payload = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'password' => ['sometimes', 'string', 'min:8'],
            'student_id' => ['nullable', 'string', 'max:50'],
            'employee_id' => ['nullable', 'string', 'max:50'],
            'is_prefect' => ['nullable', 'boolean'],
            'prefect_title' => ['nullable', 'string', 'max:255'],
            'institutional_role' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
            'phone' => ['nullable', 'string', 'max:50'],
            'profile_picture' => ['nullable', 'string'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'section' => ['nullable', 'string', 'max:50'],
            'academic_session_id' => ['nullable', 'exists:academic_sessions,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['exists:subjects,id'],
            'teaching_assignments' => ['nullable', 'array'],
            'teaching_assignments.*.school_class_id' => ['required', 'exists:school_classes,id'],
            'teaching_assignments.*.subject_id' => ['required', 'exists:subjects,id'],
            'is_first_login' => ['sometimes', 'boolean'],
            'can_create_students' => ['nullable', 'boolean'],
            'class_teacher_of' => ['nullable', 'exists:school_classes,id'],
            'department' => ['nullable', 'string', 'max:100'],
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:50'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            'parent_address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:active,pending_approval,suspended,inactive,rejected,graduated'],
        ]);

        if (isset($payload['email']) && $payload['email'] !== $user->email && $this->emailExists($payload['email'], $role, $id)) {
            return response()->json(['message' => 'The email has already been taken.'], 422);
        }

        if (!empty($payload['password'])) {
            $payload['password'] = Hash::make($payload['password']);
        }

        $user->update($payload);

        if ($role === 'student' && array_key_exists('class_id', $payload)) {
            if ($payload['class_id']) {
                $user->classes()->sync([$payload['class_id']]);
            } else {
                $user->classes()->detach();
            }
        }

        if ($role === 'teacher' && (array_key_exists('teaching_assignments', $payload) || array_key_exists('subject_ids', $payload))) {
            $assignments = $payload['teaching_assignments'] ?? [];
            if ($assignments === [] && !empty($payload['class_teacher_of'] ?? $user->class_teacher_of)) {
                $assignments = collect($payload['subject_ids'] ?? [])->map(fn ($subjectId) => [
                    'school_class_id' => $payload['class_teacher_of'] ?? $user->class_teacher_of,
                    'subject_id' => $subjectId,
                ])->all();
            }
            $this->syncTeacherAssignments($user, $assignments);
        }

        $user = $user->fresh();
        if ($role === 'student') {
            $user->load('classes');
        } elseif ($role === 'teacher') {
            $user->load('subjects');
        }

        return response()->json([
            'message' => ucfirst($role) . ' updated successfully.',
            'user' => $this->formatUser($user, $role)
        ]);
    }

    /**
     * Delete a user account.
     */
    public function destroy(string $role, int $id): JsonResponse
    {
        $user = $this->resolveModel($role)::query()->findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    private function resolveModel(string $role): string
    {
        return match ($role) {
            'admin' => Admin::class,
            'teacher' => Teacher::class,
            'worker' => Worker::class,
            default => Student::class,
        };
    }

    private function emailExists(string $email, ?string $excludeRole = null, ?int $excludeId = null): bool
    {
        $check = function ($query, $role) use ($excludeRole, $excludeId) {
            if ($excludeRole === $role && $excludeId) {
                $query->whereKeyNot($excludeId);
            }
            return $query;
        };

        return $check(Admin::query()->where('email', $email), 'admin')->exists()
            || $check(Student::query()->where('email', $email), 'student')->exists()
            || $check(Teacher::query()->where('email', $email), 'teacher')->exists()
            || $check(Worker::query()->where('email', $email), 'worker')->exists();
    }

    private function formatUser($user, $role): array
    {
        $formatted = [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role ?? $role,
            'status' => $user->status ?? 'active',
            'created_at' => $user->created_at,
            'gender' => $user->gender,
            'phone' => $user->phone ?? null,
            'profile_picture' => $user->profile_picture,
            'emergency_contact_name' => $user->emergency_contact_name ?? null,
            'emergency_contact_phone' => $user->emergency_contact_phone ?? null,
            'emergency_contact_relationship' => $user->emergency_contact_relationship ?? null,
            'qr_code_identifier' => $user->qr_code_identifier ?? null,
            'is_first_login' => $user->is_first_login,
        ];

        if ($role === 'student') {
            $formatted['student_id'] = $user->student_id;
            $formatted['section'] = $user->section ?? null;
            $formatted['is_prefect'] = $user->is_prefect;
            $formatted['prefect_title'] = $user->prefect_title;
            $formatted['department'] = $user->department;
            $formatted['parent_name'] = $user->parent_name;
            $formatted['parent_phone'] = $user->parent_phone;
            $formatted['parent_email'] = $user->parent_email;
            $formatted['parent_address'] = $user->parent_address;
            if ($user->relationLoaded('classes')) {
                $formatted['school_classes'] = $user->classes;
            }
        } elseif (in_array($role, ['teacher', 'worker'])) {
            $formatted['employee_id'] = $user->employee_id;
            $formatted['institutional_role'] = $user->institutional_role;
            if ($role === 'teacher') {
                $formatted['can_create_students'] = $user->can_create_students ?? false;
                $formatted['class_teacher_of'] = $user->class_teacher_of;
                if ($user->relationLoaded('subjects')) {
                    $formatted['subjects'] = $user->subjects;
                }
                if ($user->relationLoaded('assignedClass')) {
                    $formatted['assigned_class'] = $user->assignedClass;
                }
            }
        } elseif ($role === 'admin') {
            $formatted['role_type'] = $user->role ?? 'admin';
            $formatted['permissions'] = $user->permissions ?? null;
        }

        return $formatted;
    }

    private function syncTeacherAssignments(Teacher $teacher, array $assignments): void
    {
        DB::transaction(function () use ($teacher, $assignments): void {
            DB::table('class_subject')->where('teacher_id', $teacher->id)->update([
                'teacher_id' => null,
                'updated_at' => now(),
            ]);

            foreach (collect($assignments)->unique(fn ($assignment) => $assignment['school_class_id'].':'.$assignment['subject_id']) as $assignment) {
                DB::table('class_subject')->updateOrInsert(
                    [
                        'school_class_id' => $assignment['school_class_id'],
                        'subject_id' => $assignment['subject_id'],
                    ],
                    [
                        'teacher_id' => $teacher->id,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        });
    }
}
