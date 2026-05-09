<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'teacher_id',
        'school_class_id',
        'subject_id',
        'term',
        'duration_minutes',
        'max_score',
        'is_published',
        'start_time',
        'end_time',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(CbtQuestion::class)->orderBy('order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(CbtSubmission::class);
    }
}
