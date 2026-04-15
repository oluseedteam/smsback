<?php

namespace App\Repositories;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Contracts\Auth\Authenticatable;

class UserRepository
{
    public function create(string $role, array $data): Authenticatable
    {
        return $this->modelForRole($role)::query()->create($data);
    }

    public function findByRoleAndLogin(string $role, string $login): ?Authenticatable
    {
        if ($role === 'admin') {
            return Admin::query()->where('email', $login)->first();
        }

        $idColumn = $role === 'teacher' ? 'employee_id' : 'student_id';

        return $this->modelForRole($role)::query()
            ->where(function ($query) use ($login, $idColumn) {
                $query->where('email', $login)
                    ->orWhere($idColumn, $login);
            })
            ->first();
    }

    public function findByEmail(string $email): ?Authenticatable
    {
        return Admin::query()->where('email', $email)->first()
            ?? Student::query()->where('email', $email)->first()
            ?? Teacher::query()->where('email', $email)->first();
    }

    public function modelForRole(string $role): string
    {
        return match ($role) {
            'teacher' => Teacher::class,
            'admin' => Admin::class,
            default => Student::class,
        };
    }
}
