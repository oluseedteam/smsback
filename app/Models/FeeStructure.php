<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeStructure extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_name',
        'department',
        'term',
        'academic_year',
        'amount',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
