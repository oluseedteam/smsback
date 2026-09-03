<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionApplication extends Model
{
    use HasFactory;

    protected $table = 'admission_applications';

    protected $fillable = [
        'application_number',
        'type',
        'full_name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'target_class',
        'department',
        'parent_name',
        'parent_phone',
        'parent_email',
        'previous_school',
        'last_grade_completed',
        'subject_specialization',
        'qualification',
        'experience_years',
        'cover_letter',
        'status',
        'admin_notes',
        'reviewed_at',
        'provisioned_id_code',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeStudents($query)
    {
        return $query->where('type', 'student');
    }

    public function scopeTeachers($query)
    {
        return $query->where('type', 'teacher');
    }
}
