<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolBankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'bank_name',
        'account_name',
        'account_number',
        'branch_name',
        'payment_instructions',
        'support_phone',
        'support_email',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'updated_by');
    }

    public static function getActiveAccount(int $schoolId = 1): ?self
    {
        return self::where('school_id', $schoolId)
            ->where('is_active', true)
            ->latest('updated_at')
            ->first();
    }
}
