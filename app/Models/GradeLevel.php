<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeLevel extends Model
{
    protected $fillable = ['name', 'level_number', 'min_step', 'max_step', 'salary_structure', 'description', 'is_active'];
}