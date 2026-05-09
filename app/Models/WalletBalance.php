<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
