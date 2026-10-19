<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle incoming request and verify user role permissions.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated access.'
            ], 401);
        }

        $userRoleCode = $user->role?->code;

        // Super Admin always has full bypass authority
        if ($userRoleCode === 'SUPER_ADMIN') {
            return $next($request);
        }

        if (in_array($userRoleCode, $roles)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Access denied. Your role (' . ($user->role?->name ?? 'User') . ') is not authorized for this resource.'
        ], 403);
    }
}
