<?php

namespace App\Services\Auth;

use App\Repositories\UserRepository;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class PasswordResetService
{
    public function __construct(private readonly UserRepository $users)
    {
    }

    public function sendResetLink(string $email): string
    {
        $user = $this->users->findByEmail($email);

        if (!$user) {
            return Password::INVALID_USER;
        }

        $broker = $user instanceof \App\Models\Teacher ? 'teachers' : 'students';

        return Password::broker($broker)->sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $payload): string
    {
        $credentials = [
            'email' => $payload['email'],
            'token' => $payload['token'],
            'password' => $payload['password'],
            'password_confirmation' => $payload['password_confirmation'],
        ];

        foreach (['students', 'teachers'] as $broker) {
            $status = Password::broker($broker)->reset(
                $credentials,
                function (CanResetPassword $user, string $password): void {
                    $user->forceFill([
                        'password' => Hash::make($password),
                    ])->save();
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return $status;
            }
        }

        return Password::INVALID_TOKEN;
    }
}
