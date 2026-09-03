<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'cbt_test_id',
        'student_id',
        'score',
        'raw_score',
        'weighted_score',
        'percentage',
        'total_questions',
        'correct_answers',
        'wrong_answers',
        'time_spent_seconds',
        'duration_used',
        'attempt_number',
        'status',
        'started_at',
        'submitted_at',
        'result_released',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'raw_score' => 'decimal:2',
            'weighted_score' => 'decimal:2',
            'percentage' => 'decimal:2',
            'attempt_number' => 'integer',
        ];
    }

    public function test(): BelongsTo
    {
        return $this->belongsTo(CbtTest::class, 'cbt_test_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(CbtAnswer::class);
    }
}
