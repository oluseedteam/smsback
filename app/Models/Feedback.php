<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedbacks';

    protected $fillable = [
        'role_type',
        'full_name',
        'email',
        'phone',
        'rating',
        'category',
        'subject',
        'message',
        'student_name',
        'student_class',
        'graduation_year',
        'department',
        'current_occupation',
        'stay_connected',
        'is_public_testimonial',
        'is_published',
        'status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_public_testimonial' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeParents($query)
    {
        return $query->where('role_type', 'parent');
    }

    public function scopeAlumni($query)
    {
        return $query->where('role_type', 'alumni');
    }
}
