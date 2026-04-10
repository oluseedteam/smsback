<?php

namespace App\Repositories;

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
        return Student::query()->where('email', $email)->first()
            ?? Teacher::query()->where('email', $email)->first();
    }

    public function modelForRole(string $role): string
    {
        return $role === 'teacher' ? Teacher::class : Student::class;
    }
}
