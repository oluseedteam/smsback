<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    /**
     * List all users filtered by their role (admin, teacher, student).
     */
    public function index(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['required', Rule::in(['admin', 'teacher', 'student', 'worker'])],
        ]);

        $users = $this->resolveModel($payload['role'])::query()
            ->latest()
            ->paginate(100); // Changed to 100 for better UI

        return response()->json($users);
    }

    /**
     * Create a new user account (admin, teacher, student, worker).
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['required', Rule::in(['admin', 'teacher', 'student', 'worker'])],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'student_id' => ['nullable', 'required_if:role,student', 'string', 'max:50'],
            'employee_id' => ['nullable', 'required_if:role,teacher,worker', 'string', 'max:50'],
            'is_prefect' => ['nullable', 'boolean'],
            'prefect_title' => ['nullable', 'string', 'max:255'],
            'institutional_role' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
            'profile_picture' => ['nullable', 'string'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['exists:subjects,id'],
            'can_create_students' => ['nullable', 'boolean'],
            'class_teacher_of' => ['nullable', 'exists:school_classes,id'],
            'department' => ['nullable', 'string', 'max:100'],
        ]);

        if ($this->emailExists($payload['email'])) {
            return response()->json(['message' => 'The email has already been taken.'], 422);
        }

        if (!empty($payload['student_id']) && Student::query()->where('student_id', $payload['student_id'])->exists()) {
            return response()->json(['message' => 'Student ID is already taken.'], 422);
        }

        if (
            !empty($payload['employee_id']) && 
            (Teacher::query()->where('employee_id', $payload['employee_id'])->exists() || \App\Models\Worker::query()->where('employee_id', $payload['employee_id'])->exists())
        ) {
            return response()->json(['message' => 'Employee ID is already taken.'], 422);
        }

        $modelClass = $this->resolveModel($payload['role']);
        $creationData = [
            'full_name' => $payload['full_name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'gender' => $payload['gender'] ?? null,
            'profile_picture' => $payload['profile_picture'] ?? null,
        ];

        if ($payload['role'] === 'student') {
            $creationData['student_id'] = $payload['student_id'] ?? null;
            $creationData['is_prefect'] = $payload['is_prefect'] ?? false;
            $creationData['prefect_title'] = $payload['prefect_title'] ?? null;
            $creationData['department'] = $payload['department'] ?? null;
        } elseif ($payload['role'] === 'teacher') {
            $creationData['employee_id'] = $payload['employee_id'] ?? null;
            $creationData['institutional_role'] = $payload['institutional_role'] ?? null;
            $creationData['can_create_students'] = $payload['can_create_students'] ?? false;
            $creationData['class_teacher_of'] = $payload['class_teacher_of'] ?? null;
        } elseif ($payload['role'] === 'worker') {
            $creationData['employee_id'] = $payload['employee_id'] ?? null;
            $creationData['institutional_role'] = $payload['institutional_role'] ?? null;
        }

        $user = $modelClass::query()->create($creationData);

        if ($payload['role'] === 'student' && !empty($payload['class_id'])) {
            $user->classes()->sync([$payload['class_id']]);
        }

        if ($payload['role'] === 'teacher' && !empty($payload['subject_ids'])) {
            $user->subjects()->sync($payload['subject_ids']);
        }

        return response()->json($this->formatUser($user, $payload['role']), 201);
    }

    /**
     * Get details of a specific user.
     */
    public function show(string $role, int $id): JsonResponse
    {
        $query = $this->resolveModel($role)::query();
        
        if ($role === 'student') {
            $query->with('classes');
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
                'by_term' => [
                    '1st Term' => $this->termAttendanceSummary($attendance, '1st Term'),
                    '2nd Term' => $this->termAttendanceSummary($attendance, '2nd Term'),
                    '3rd Term' => $this->termAttendanceSummary($attendance, '3rd Term'),
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
            'profile_picture' => ['nullable', 'string'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['exists:subjects,id'],
            'is_first_login' => ['sometimes', 'boolean'],
            'can_create_students' => ['nullable', 'boolean'],
            'class_teacher_of' => ['nullable', 'exists:school_classes,id'],
            'department' => ['nullable', 'string', 'max:100'],
        ]);

        if (isset($payload['email']) && $payload['email'] !== $user->email && $this->emailExists($payload['email'], $role, $id)) {
            return response()->json(['message' => 'The email has already been taken.'], 422);
        }

        if ($role === 'student' && isset($payload['student_id'])) {
            $exists = Student::query()
                ->where('student_id', $payload['student_id'])
                ->whereKeyNot($id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Student ID is already taken.'], 422);
            }
        }

        if (in_array($role, ['teacher', 'worker']) && isset($payload['employee_id'])) {
            $existsTeacher = Teacher::query()
                ->where('employee_id', $payload['employee_id'])
                ->when($role === 'teacher', fn ($q) => $q->whereKeyNot($id))
                ->exists();

            $existsWorker = \App\Models\Worker::query()
                ->where('employee_id', $payload['employee_id'])
                ->when($role === 'worker', fn ($q) => $q->whereKeyNot($id))
                ->exists();

            if ($existsTeacher || $existsWorker) {
                return response()->json(['message' => 'Employee ID is already taken.'], 422);
            }
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

        if ($role === 'teacher' && array_key_exists('subject_ids', $payload)) {
            $user->subjects()->sync($payload['subject_ids'] ?? []);
        }

        $user = $user->fresh();
        if ($role === 'student') {
            $user->load('classes');
        } elseif ($role === 'teacher') {
            $user->load('subjects');
        }

        return response()->json($this->formatUser($user, $role));
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
            'worker' => \App\Models\Worker::class,
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
            || $check(\App\Models\Worker::query()->where('email', $email), 'worker')->exists();
    }

    private function formatUser($user, $role): array
    {
        $formatted = [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role ?? $role,
            'created_at' => $user->created_at,
        ];

        if ($role === 'student') {
            $formatted['student_id'] = $user->student_id;
            $formatted['is_prefect'] = $user->is_prefect;
            $formatted['prefect_title'] = $user->prefect_title;
            $formatted['department'] = $user->department;
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
        }

        $formatted['gender'] = $user->gender;
        $formatted['profile_picture'] = $user->profile_picture;
        $formatted['is_first_login'] = $user->is_first_login;

        return $formatted;
    }

    private function termAttendanceSummary($attendance, string $term): array
    {
        $termRecords = $attendance->where('term', $term);
        $present = $termRecords->where('status', 'present')->count();
        $absent = $termRecords->where('status', 'absent')->count();
        $late = $termRecords->where('status', 'late')->count();
        $total = $termRecords->count();

        return [
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'total' => $total,
            'rate' => $total > 0 ? round(($present / $total) * 100) : 0,
        ];
    }
}
