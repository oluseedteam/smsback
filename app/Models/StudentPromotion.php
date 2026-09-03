<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPromotion extends Model
{
    use HasFactory;

    protected $table = 'student_promotions';

    protected $fillable = [
        'student_id',
        'from_session_id',
        'from_class_id',
        'from_section',
        'to_session_id',
        'to_class_id',
        'to_section',
        'promotion_status',
        'annual_average',
        'reason',
        'promoted_by',
        'promoted_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'promoted_at' => 'datetime',
            'annual_average' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function fromSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'from_session_id');
    }

    public function fromClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'from_class_id');
    }

    public function toSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'to_session_id');
    }

    public function toClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'to_class_id');
    }

    public function promotedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'promoted_by');
    }
}
