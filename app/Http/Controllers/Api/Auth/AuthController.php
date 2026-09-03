<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\SchoolSetting;
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
     */
    public function authenticate(LoginRequest $request): JsonResponse
    {
        $payload = $request->validated();

        try {
            [$user, $token] = $this->authService->login($payload);
            \Illuminate\Support\Facades\Log::info("User logged in: {$user->email} (Role: {$payload['role']})");
        } catch (AuthenticationException $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Invalid credentials.',
            ], 401);
        }

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->buildUserPayload($user, $payload['role']),
            'school' => SchoolSetting::getSettings(),
        ]);
    }

    /**
     * Get the currently authenticated user's profile and permissions.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $role = strtolower(class_basename($user));
        if ($role === 'admin' && ($user->role ?? null) === 'sub_admin') {
            $role = 'sub_admin';
        }

        return response()->json([
            'user' => $this->buildUserPayload($user, $role),
            'school' => SchoolSetting::getSettings(),
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
     * Update the logged-in user's profile picture and metadata.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'full_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
            'profile_picture' => ['nullable', 'string'],
            'gender' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'is_skipped' => ['nullable', 'boolean'],
            'parent_name' => ['nullable', 'string'],
            'parent_phone' => ['nullable', 'string'],
            'parent_email' => ['nullable', 'string'],
            'parent_address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string'],
            'emergency_contact_phone' => ['nullable', 'string'],
            'emergency_contact_relationship' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $updateData = ['is_first_login' => false];

        if (!empty($payload['full_name'])) {
            $updateData['full_name'] = $payload['full_name'];
        }
        if (!empty($payload['email'])) {
            $updateData['email'] = $payload['email'];
        }
        if (!empty($payload['password'])) {
            $updateData['password'] = \Illuminate\Support\Facades\Hash::make($payload['password']);
        }
        if (isset($payload['profile_picture'])) {
            $updateData['profile_picture'] = $payload['profile_picture'];
        }
        if (isset($payload['gender'])) {
            $updateData['gender'] = strtolower($payload['gender']);
        }
        if (isset($payload['phone'])) {
            $updateData['phone'] = $payload['phone'];
        }
        if (isset($payload['emergency_contact_name'])) {
            $updateData['emergency_contact_name'] = $payload['emergency_contact_name'];
        }
        if (isset($payload['emergency_contact_phone'])) {
            $updateData['emergency_contact_phone'] = $payload['emergency_contact_phone'];
        }
        if (isset($payload['emergency_contact_relationship'])) {
            $updateData['emergency_contact_relationship'] = $payload['emergency_contact_relationship'];
        }

        // Allow student and teacher models to update parent info
        $role = strtolower(class_basename($user));
        if (in_array($role, ['student', 'teacher'])) {
            if (isset($payload['parent_name'])) $updateData['parent_name'] = $payload['parent_name'];
            if (isset($payload['parent_phone'])) $updateData['parent_phone'] = $payload['parent_phone'];
            if (isset($payload['parent_email'])) $updateData['parent_email'] = $payload['parent_email'];
            if (isset($payload['parent_address'])) $updateData['parent_address'] = $payload['parent_address'];
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->buildUserPayload($user->fresh(), $role),
        ]);
    }

    /**
     * Update emergency contact details for student or teacher.
     */
    public function updateEmergencyContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_phone' => 'required|string|max:50',
            'emergency_contact_relationship' => 'nullable|string|max:100',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'message' => 'Emergency contact information updated successfully.',
            'emergency_contact' => [
                'name' => $user->emergency_contact_name,
                'phone' => $user->emergency_contact_phone,
                'relationship' => $user->emergency_contact_relationship,
            ]
        ]);
    }

    private function buildUserPayload($user, string $role): array
    {
        $idPayload = match ($role) {
            'worker' => [
                'employee_id' => $user->employee_id ?? null,
                'phone' => $user->phone ?? null,
            ],
            'teacher' => [
                'employee_id' => $user->employee_id ?? null,
                'phone' => $user->phone ?? null,
                'parent_name' => $user->parent_name ?? null,
                'parent_phone' => $user->parent_phone ?? null,
                'parent_email' => $user->parent_email ?? null,
                'parent_address' => $user->parent_address ?? null,
                'emergency_contact_name' => $user->emergency_contact_name ?? null,
                'emergency_contact_phone' => $user->emergency_contact_phone ?? null,
                'emergency_contact_relationship' => $user->emergency_contact_relationship ?? null,
            ],
            'student' => [
                'student_id' => $user->student_id ?? null,
                'section' => $user->section ?? null,
                'parent_name' => $user->parent_name ?? null,
                'parent_phone' => $user->parent_phone ?? null,
                'parent_email' => $user->parent_email ?? null,
                'parent_address' => $user->parent_address ?? null,
                'emergency_contact_name' => $user->emergency_contact_name ?? null,
                'emergency_contact_phone' => $user->emergency_contact_phone ?? null,
                'emergency_contact_relationship' => $user->emergency_contact_relationship ?? null,
                'department' => $user->department ?? null,
                'is_prefect' => $user->is_prefect ?? false,
                'prefect_title' => $user->prefect_title ?? null,
                'school_classes' => $user->classes ?? [],
            ],
            'admin', 'sub_admin' => [
                'phone' => $user->phone ?? null,
                'role_type' => $user->role ?? 'admin',
                'permissions' => $user->permissions ?? ['all'],
            ],
            default => [],
        };

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $role,
            'status' => $user->status ?? 'active',
            'gender' => $user->gender,
            'profile_picture' => $user->profile_picture,
            'qr_code_identifier' => $user->qr_code_identifier ?? null,
            'is_first_login' => $user->is_first_login,
            'can_create_students' => $user->can_create_students ?? false,
            ...$idPayload,
        ];
    }
}
