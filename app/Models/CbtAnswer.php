<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CbtAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'cbt_submission_id',
        'cbt_question_id',
        'selected_answer',
        'is_correct',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(CbtSubmission::class, 'cbt_submission_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(CbtQuestion::class, 'cbt_question_id');
    }
}
