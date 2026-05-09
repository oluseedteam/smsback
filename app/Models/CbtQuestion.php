<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'cbt_test_id',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'points',
        'order',
    ];

    public function test(): BelongsTo
    {
        return $this->belongsTo(CbtTest::class, 'cbt_test_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(CbtAnswer::class);
    }
}
