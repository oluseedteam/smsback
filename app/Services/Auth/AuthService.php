<?php

namespace App\Services\Auth;

use App\Repositories\UserRepository;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;

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
        ];

        if ($payload['role'] === 'teacher' || $payload['role'] === 'worker') {
            $data['employee_id'] = $payload['employeeId'];
        } else {
            $data['student_id'] = $payload['studentId'];
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

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    public function logout($user): void
    {
        $user->tokens()->delete();
    }
}
