<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
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
        ];

        if ($payload['role'] === 'student') {
            $creationData['student_id'] = $payload['student_id'] ?? null;
            $creationData['is_prefect'] = $payload['is_prefect'] ?? false;
            $creationData['prefect_title'] = $payload['prefect_title'] ?? null;
        } elseif ($payload['role'] === 'teacher') {
            $creationData['employee_id'] = $payload['employee_id'] ?? null;
            $creationData['institutional_role'] = $payload['institutional_role'] ?? null;
        } elseif ($payload['role'] === 'worker') {
            $creationData['employee_id'] = $payload['employee_id'] ?? null;
            $creationData['institutional_role'] = $payload['institutional_role'] ?? null;
        }

        $user = $modelClass::query()->create($creationData);

        return response()->json($this->formatUser($user, $payload['role']), 201);
    }

    /**
     * Get details of a specific user.
     */
    public function show(string $role, int $id): JsonResponse
    {
        $user = $this->resolveModel($role)::query()->findOrFail($id);

        return response()->json($this->formatUser($user, $role));
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

        return response()->json($this->formatUser($user->fresh(), $role));
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
        } elseif (in_array($role, ['teacher', 'worker'])) {
            $formatted['employee_id'] = $user->employee_id;
            $formatted['institutional_role'] = $user->institutional_role;
        }

        return $formatted;
    }
}
