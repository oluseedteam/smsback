<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_type',
        'user_name',
        'action',
        'student_id',
        'academic_session_id',
        'term',
        'details',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public static function record(string $action, ?int $studentId = null, ?int $sessionId = null, ?string $term = null, ?array $details = null, ?object $user = null): self
    {
        $request = request();
        $user = $user ?? ($request ? $request->user() : null);

        return self::create([
            'user_id' => $user?->id,
            'user_type' => $user ? (method_exists($user, 'getRole') ? $user->getRole() : ($user->role ?? class_basename($user))) : 'system',
            'user_name' => $user?->full_name ?? $user?->name ?? 'System',
            'action' => $action,
            'student_id' => $studentId,
            'academic_session_id' => $sessionId,
            'term' => $term,
            'details' => $details,
            'ip_address' => $request ? $request->ip() : null,
        ]);
    }
}
