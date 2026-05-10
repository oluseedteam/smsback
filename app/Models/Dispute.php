<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Dispute extends Model
{
    protected $fillable = [
        'sender_type',
        'sender_id',
        'category',
        'subject',
        'message',
        'status',
        'admin_reply',
    ];

    public function sender(): MorphTo
    {
        return $this->morphTo();
    }
}
