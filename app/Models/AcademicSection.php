<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSection extends Model
{
    use HasFactory;

    protected $table = 'academic_sections';

    protected $fillable = [
        'name',
        'description',
        'ordering',
        'status',
        'school_id',
    ];

    protected $casts = [
        'ordering' => 'integer',
    ];

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'academic_section_id')->orderBy('name');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'academic_section_id')->orderBy('name');
    }

    public function cbtTests(): HasMany
    {
        return $this->hasMany(CbtTest::class, 'academic_section_id');
    }

    public function assessmentConfigurations(): HasMany
    {
        return $this->hasMany(AssessmentConfiguration::class, 'academic_section_id');
    }
}
