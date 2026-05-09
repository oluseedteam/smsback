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
        'total_questions',
        'correct_answers',
        'wrong_answers',
        'time_spent_seconds',
        'started_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
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
