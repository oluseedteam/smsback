<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'academic_section_id',
        'description',
        'is_compulsory',
        'status',
        'school_id',
    ];

    protected $attributes = [
        'is_compulsory' => false,
    ];

    protected function casts(): array
    {
        return [
            'is_compulsory' => 'boolean',
        ];
    }

    public function academicSection(): BelongsTo
    {
        return $this->belongsTo(AcademicSection::class, 'academic_section_id');
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_subject')
            ->withPivot(['teacher_id', 'is_compulsory'])
            ->withTimestamps();
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}
