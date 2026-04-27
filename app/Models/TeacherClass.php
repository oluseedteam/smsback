<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherClass extends Model
{
    protected $fillable = ['title', 'grade', 'time', 'location', 'teacher_id'];
}
