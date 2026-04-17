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
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
        ]);

        $users = $this->resolveModel($payload['role'])::query()
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Create a new user account (admin, teacher, or student).
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'student_id' => ['nullable', 'required_if:role,student', 'string', 'max:50'],
            'employee_id' => ['nullable', 'required_if:role,teacher', 'string', 'max:50'],
        ]);

        if ($this->emailExists($payload['email'])) {
            return response()->json(['message' => 'The email has already been taken.'], 422);
        }

        if (!empty($payload['student_id']) && Student::query()->where('student_id', $payload['student_id'])->exists()) {
            return response()->json(['message' => 'Student ID is already taken.'], 422);
        }

        if (!empty($payload['employee_id']) && Teacher::query()->where('employee_id', $payload['employee_id'])->exists()) {
            return response()->json(['message' => 'Employee ID is already taken.'], 422);
        }

        $modelClass = $this->resolveModel($payload['role']);
        $user = $modelClass::query()->create([
            'full_name' => $payload['full_name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'student_id' => $payload['student_id'] ?? null,
            'employee_id' => $payload['employee_id'] ?? null,
        ]);

        return response()->json($this->formatUser($user), 201);
    }

    /**
     * Get details of a specific user.
     */
    public function show(string $role, int $id): JsonResponse
    {
        $user = $this->resolveModel($role)::query()->findOrFail($id);

        return response()->json($this->formatUser($user));
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
        ]);

        if (isset($payload['email']) && $payload['email'] !== $user->email && $this->emailExists($payload['email'])) {
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

        if ($role === 'teacher' && isset($payload['employee_id'])) {
            $exists = Teacher::query()
                ->where('employee_id', $payload['employee_id'])
                ->whereKeyNot($id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Employee ID is already taken.'], 422);
            }
        }

        if (!empty($payload['password'])) {
            $payload['password'] = Hash::make($payload['password']);
        }

        $user->update($payload);

        return response()->json($this->formatUser($user->fresh()));
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
            default => Student::class,
        };
    }

    private function emailExists(string $email): bool
    {
        return Admin::query()->where('email', $email)->exists()
            || Student::query()->where('email', $email)->exists()
            || Teacher::query()->where('email', $email)->exists();
    }

    private function formatUser($user): array
    {
        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'student_id' => $user->student_id ?? null,
            'employee_id' => $user->employee_id ?? null,
            'created_at' => $user->created_at,
        ];
    }
}
