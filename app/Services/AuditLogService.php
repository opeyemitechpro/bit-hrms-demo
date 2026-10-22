<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public static function log(string $action, string $module, ?string $recordType = null, ?int $recordId = null, ?array $previousValues = null, ?array $newValues = null, ?User $actor = null, ?string $actorUsername = null, ?string $ipAddress = null): void
    {
        $user = $actor ?? Auth::user();
        AuditLog::create([
            'user_id' => $user?->id,
            'username' => $user?->username ?? $actorUsername ?? 'SYSTEM',
            'action' => $action,
            'module' => $module,
            'record_type' => $recordType,
            'record_id' => $recordId,
            'previous_values' => $previousValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress ?? Request::ip(),
            'user_agent' => Request::userAgent(),
            'created_at' => now(),
        ]);
    }
}
