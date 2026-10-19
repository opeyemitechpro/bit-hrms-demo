<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'staff_id', 'name', 'email', 'username', 'password',
        'role_id', 'department_id', 'status', 'is_first_login',
        'designation', 'grade_level', 'last_login_at', 'last_login_ip'
    ];

    protected $casts = [
        'is_first_login' => 'boolean',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}