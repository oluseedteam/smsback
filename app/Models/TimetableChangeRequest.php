<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableChangeRequest extends Model
{
    use HasFactory;

    protected $table = 'timetable_change_requests';

    protected $fillable = [
        'timetable_id',
        'teacher_id',
        'requested_day',
        'requested_period_number',
        'requested_start_time',
        'requested_end_time',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'requested_period_number' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function timetable(): BelongsTo
    {
        return $this->belongsTo(Timetable::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewed_by');
    }
}
