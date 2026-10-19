<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffPosting extends Model
{
    use HasFactory;

    protected $table = 'staff_postings';

    protected $fillable = [
        'staff_id',
        'station_name',
        'mda_name',
        'deployment_type',
        'effective_date',
        'end_date',
        'is_current',
        'circular_reference',
        'remarks',
        'created_by'
    ];

    protected $casts = [
        'effective_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'is_current' => 'boolean',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
