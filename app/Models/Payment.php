<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'DRAFT';
    public const STATUS_PENDING_VERIFICATION = 'PENDING_VERIFICATION';
    public const STATUS_CONFIRMED = 'CONFIRMED';
    public const STATUS_REJECTED = 'REJECTED';
    public const STATUS_CANCELLED = 'CANCELLED';
    public const STATUS_REFUNDED = 'REFUNDED';

    protected $fillable = [
        'school_id',
        'student_id',
        'academic_session_id',
        'term',
        'school_class_id',
        'fee_structure_id',
        'amount',
        'payment_method',
        'bank_used',
        'sender_account_name',
        'sender_account_last4',
        'transaction_reference',
        'payment_date',
        'receipt_url',
        'receipt_file_type',
        'receipt_path',
        'student_note',
        'status',
        'submitted_at',
        'verified_at',
        'verified_by',
        'rejection_reason',
        'admin_note',
        'official_receipt_number',
        'official_receipt_issued_at',
        'type',
        'reference',
        'description',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
            'official_receipt_issued_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function feeStructure(): BelongsTo
    {
        return $this->belongsTo(FeeStructure::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function verifiedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'verified_by');
    }

    public function isConfirmed(): bool
    {
        return in_array($this->status, [self::STATUS_CONFIRMED, 'successful'], true);
    }

    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING_VERIFICATION, 'pending'], true);
    }

    public function isRejected(): bool
    {
        return in_array($this->status, [self::STATUS_REJECTED, 'failed'], true);
    }
}
