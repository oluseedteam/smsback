<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_current',
        'terms',
        'current_term',
        'start_date',
        'end_date',
        'registration_deadline',
        'registration_reopened',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
            'terms' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'registration_deadline' => 'datetime',
            'registration_reopened' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    public function courseRegistrations(): HasMany
    {
        return $this->hasMany(CourseRegistration::class);
    }

    public function subjectResults(): HasMany
    {
        return $this->hasMany(SubjectResult::class);
    }

    public function reportCards(): HasMany
    {
        return $this->hasMany(ReportCard::class);
    }

    public function gradingScales(): HasMany
    {
        return $this->hasMany(GradingScale::class);
    }
}
