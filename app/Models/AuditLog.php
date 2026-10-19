<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $fillable = ['user_id', 'username', 'action', 'module', 'record_type', 'record_id', 'previous_values', 'new_values', 'ip_address', 'user_agent', 'created_at'];
    protected $casts = ['previous_values' => 'array', 'new_values' => 'array', 'created_at' => 'datetime'];
}