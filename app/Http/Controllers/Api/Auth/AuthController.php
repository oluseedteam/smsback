<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    /**
     * Register a student or teacher account and return an access token.
     *
     * Request body:
     * - student: `fullName`, `studentId`, `email`, `password`, `confirmPassword`, `role=student`,
     * - teacher: `fullName`, `employeeId`, `email`, `password`, `confirmPassword`, `role=teacher`,
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $payload = $request->validated();
        [$user, $token] = $this->authService->register($payload);

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->buildUserPayload($user, $payload['role']),
        ], 201);
    }

    /**
     * Authenticate user and return access token.
     *
     * Request body:
     * - `login`: email or role ID (`student_id` / `employee_id`)
     * - `password`: account password
     * - `role`: `student` or `teacher`
     *
     * Frontend note:
     * - `email` is accepted and normalized into `login`.
     *
     * Response:
     * - `token` (Bearer) for authenticated API requests.
     */
    public function authenticate(LoginRequest $request): JsonResponse
    {
        $payload = $request->validated();

        try {
            [$user, $token] = $this->authService->login($payload);
            \Illuminate\Support\Facades\Log::info("User logged in: {$user->email} (Role: {$payload['role']})");
        } catch (AuthenticationException) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->buildUserPayload($user, $payload['role']),
        ]);
    }

    /**
     * Revoke the current user's access token(s).
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Update the logged-in user's profile picture and remove the first_login flag.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'profile_picture' => ['nullable', 'string'],
            'gender' => ['nullable', 'string'],
            'is_skipped' => ['nullable', 'boolean'],
            'parent_name' => ['nullable', 'string'],
            'parent_phone' => ['nullable', 'string'],
            'parent_email' => ['nullable', 'string'],
            'parent_address' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        
        $updateData = ['is_first_login' => false];
        if (isset($payload['profile_picture'])) {
            $updateData['profile_picture'] = $payload['profile_picture'];
        }
        if (isset($payload['gender'])) {
            $updateData['gender'] = strtolower($payload['gender']);
        }
        
        // Allow student and teacher models to have these fields
        $role = strtolower(class_basename($user));
        if (in_array($role, ['student', 'teacher'])) {
            if (isset($payload['parent_name'])) $updateData['parent_name'] = $payload['parent_name'];
            if (isset($payload['parent_phone'])) $updateData['parent_phone'] = $payload['parent_phone'];
            if (isset($payload['parent_email'])) $updateData['parent_email'] = $payload['parent_email'];
            if (isset($payload['parent_address'])) $updateData['parent_address'] = $payload['parent_address'];
        }

        $user->update($updateData);

        // Infer role from model class name
        $role = strtolower(class_basename($user));

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->buildUserPayload($user->fresh()->load('classes'), $role),
        ]);
    }

    private function buildUserPayload($user, string $role): array
    {
        $idPayload = match ($role) {
            'worker' => ['employee_id' => $user->employee_id ?? null],
            'teacher' => [
                'employee_id' => $user->employee_id ?? null,
                'parent_name' => $user->parent_name ?? null,
                'parent_phone' => $user->parent_phone ?? null,
                'parent_email' => $user->parent_email ?? null,
                'parent_address' => $user->parent_address ?? null,
            ],
            'student' => [
                'student_id' => $user->student_id ?? null,
                'parent_name' => $user->parent_name ?? null,
                'parent_phone' => $user->parent_phone ?? null,
                'parent_email' => $user->parent_email ?? null,
                'parent_address' => $user->parent_address ?? null,
                'department' => $user->department ?? null,
                'is_prefect' => $user->is_prefect ?? false,
                'prefect_title' => $user->prefect_title ?? null,
                'school_classes' => $user->classes ?? [],
            ],
            default => [],
        };

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $role,
            'gender' => $user->gender,
            'profile_picture' => $user->profile_picture,
            'is_first_login' => $user->is_first_login,
            'can_create_students' => $user->can_create_students ?? false,
            ...$idPayload,
        ];
    }
}
