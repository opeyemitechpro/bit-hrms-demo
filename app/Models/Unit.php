<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Unit extends Model
{
    protected $fillable = ['department_id', 'name', 'code', 'description', 'head_of_unit_id', 'is_active'];

    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
}