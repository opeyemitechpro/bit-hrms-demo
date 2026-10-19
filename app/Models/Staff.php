<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Staff extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'staff';

    protected $fillable = [
        'staff_number', 'ogun_employee_number', 'file_number', 'ippis_number',
        'title', 'surname', 'first_name', 'middle_name', 'gender',
        'date_of_birth', 'place_of_birth', 'state_of_origin', 'lga_of_origin', 'qualification',
        'residential_address', 'phone_number', 'official_email', 'personal_email',
        'photo_path', 'department_id', 'unit_id', 'designation_id', 'grade_level_id',
        'step', 'salary_structure', 'employment_status_id', 'date_of_first_appointment',
        'date_of_present_appointment', 'date_of_confirmation', 'date_of_last_promotion',
        'date_of_last_deployment', 'expected_retirement_date', 'current_station',
        'supervisor_id', 'remarks', 'created_by', 'updated_by'
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
        'date_of_first_appointment' => 'date:Y-m-d',
        'date_of_present_appointment' => 'date:Y-m-d',
        'date_of_confirmation' => 'date:Y-m-d',
        'expected_retirement_date' => 'date:Y-m-d',
    ];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->title} {$this->surname}, {$this->first_name} {$this->middle_name}");
    }

    public static function calculateRetirementDate(string $dob, string $dofa): Carbon
    {
        $byAge = Carbon::parse($dob)->addYears(60);
        $byService = Carbon::parse($dofa)->addYears(35);
        return $byAge->lt($byService) ? $byAge : $byService;
    }

    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function unit(): BelongsTo { return $this->belongsTo(Unit::class); }
    public function designation(): BelongsTo { return $this->belongsTo(Designation::class); }
    public function gradeLevel(): BelongsTo { return $this->belongsTo(GradeLevel::class); }
    public function status(): BelongsTo { return $this->belongsTo(EmploymentStatus::class, 'employment_status_id'); }
    public function postings(): HasMany { return $this->hasMany(StaffPosting::class)->orderBy('effective_date', 'desc'); }
    public function documents(): HasMany { return $this->hasMany(StaffDocument::class)->orderBy('created_at', 'desc'); }
}