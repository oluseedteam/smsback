<?php

namespace App\Services\Auth;

use App\Models\AuditLog;
use App\Repositories\UserRepository;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(private readonly UserRepository $users)
    {
    }

    public function register(array $payload): array
    {
        $data = [
            'full_name' => $payload['fullName'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'status' => 'active',
        ];

        if ($payload['role'] === 'teacher' || $payload['role'] === 'worker') {
            $data['employee_id'] = $payload['employeeId'];
            $data['qr_code_identifier'] = 'GHRA-TCH-' . strtoupper(Str::random(10));
        } else {
            $data['student_id'] = $payload['studentId'];
            $data['qr_code_identifier'] = 'GHRA-STU-' . strtoupper(Str::random(10));
            if (!empty($payload['department'])) {
                $data['department'] = $payload['department'];
            }
        }

        $user = $this->users->create($payload['role'], $data);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    public function login(array $payload): array
    {
        $user = $this->users->findByRoleAndLogin($payload['role'], $payload['login']);

        if (!$user || !Hash::check($payload['password'], $user->password)) {
            throw new AuthenticationException('Invalid credentials.');
        }

        // Check account status
        $status = $user->status ?? 'active';
        if ($status === 'pending_approval') {
            throw new AuthenticationException('Your student registration is pending administrative approval.');
        }

        if ($status === 'suspended') {
            throw new AuthenticationException('Your account has been suspended. Please contact the school administration.');
        }

        if ($status === 'inactive') {
            throw new AuthenticationException('Your account is currently inactive.');
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        // Record Audit Log for successful login
        AuditLog::create([
            'user_id' => $user->id,
            'user_type' => $payload['role'],
            'user_name' => $user->full_name,
            'action' => 'LOGIN',
            'details' => [
                'email' => $user->email,
                'role' => $payload['role'],
                'login_time' => now()->toIso8601String(),
            ],
            'ip_address' => request()->ip(),
        ]);

        return [$user, $token];
    }

    public function logout($user): void
    {
        $user->tokens()->delete();
    }
}
