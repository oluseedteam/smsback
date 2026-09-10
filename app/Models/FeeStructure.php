<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeStructure extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'fee_type',
        'title',
        'class_name',
        'department',
        'term',
        'academic_year',
        'academic_session_id',
        'school_class_id',
        'academic_section_id',
        'amount',
        'due_date',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function academicSection(): BelongsTo
    {
        return $this->belongsTo(AcademicSection::class, 'academic_section_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
