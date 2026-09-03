<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_type',
        'title',
        'message',
        'link',
        'is_read',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'user_id');
    }

    public static function notifyStudent(int $studentId, string $title, string $message, string $link = '/portal/results', string $type = 'report_card_released'): self
    {
        return self::create([
            'user_id' => $studentId,
            'user_type' => 'student',
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'is_read' => false,
            'type' => $type,
        ]);
    }
}
