<?php

namespace App\Models\Concerns;

trait HasApiRole
{
    public function getRoleAttribute(): string
    {
        return match (class_basename($this)) {
            'Teacher' => 'teacher',
            'Admin' => 'admin',
            default => 'student',
        };
    }
}
