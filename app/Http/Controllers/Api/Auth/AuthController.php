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

    private function buildUserPayload($user, string $role): array
    {
        $idPayload = match ($role) {
            'teacher' => ['employee_id' => $user->employee_id],
            'student' => ['student_id' => $user->student_id],
            default => [],
        };

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $role,
            ...$idPayload,
        ];
    }
}
