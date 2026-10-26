<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:255',
            'action' => 'nullable|string|max:100',
            'module' => 'nullable|string|max:50',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = AuditLog::query()->with('user:id,name');

        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('username', 'LIKE', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'LIKE', "%{$search}%"))
                    ->orWhere('action', 'LIKE', "%{$search}%")
                    ->orWhere('module', 'LIKE', "%{$search}%")
                    ->orWhere('ip_address', 'LIKE', "%{$search}%")
                    ->orWhere('record_type', 'LIKE', "%{$search}%")
                    ->orWhere('record_id', 'LIKE', "%{$search}%");
            });
        }

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($module = $request->input('module')) {
            $query->where('module', $module);
        }

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $perPage = min(max($request->integer('per_page', 25), 10), 100);
        $logs = $query->orderByDesc('created_at')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'actions' => AuditLog::query()->select('action')->distinct()->orderBy('action')->pluck('action'),
                'modules' => AuditLog::query()->select('module')->distinct()->orderBy('module')->pluck('module'),
            ]
        ]);
    }
}
