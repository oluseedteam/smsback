<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthProfile extends Model
{
    protected $fillable = [
        'user_id',
        'user_role',
        'blood_group',
        'genotype',
        'allergies',
        'emergency_contact',
    ];
}
