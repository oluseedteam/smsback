<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ReportCardAccessToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'report_card_id',
        'token_hash',
        'recipient_type',
        'expires_at',
        'is_revoked',
        'used_count',
        'last_accessed_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_revoked' => 'boolean',
            'last_accessed_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reportCard(): BelongsTo
    {
        return $this->belongsTo(ReportCard::class);
    }

    public static function generateToken(ReportCard $reportCard, string $recipientType = 'parent', int $validDays = 30): string
    {
        $rawToken = Str::random(40) . bin2hex(random_bytes(12));
        $hash = hash('sha256', $rawToken);

        self::create([
            'student_id' => $reportCard->student_id,
            'report_card_id' => $reportCard->id,
            'token_hash' => $hash,
            'recipient_type' => $recipientType,
            'expires_at' => now()->addDays($validDays),
            'is_revoked' => false,
            'used_count' => 0,
        ]);

        return $rawToken;
    }

    public static function verifyToken(string $rawToken): ?self
    {
        $hash = hash('sha256', $rawToken);
        $record = self::where('token_hash', $hash)->with(['reportCard', 'student'])->first();

        if (!$record) {
            return null;
        }

        if ($record->is_revoked || $record->expires_at->isPast()) {
            return null;
        }

        $record->increment('used_count');
        $record->update(['last_accessed_at' => now()]);

        return $record;
    }
}
