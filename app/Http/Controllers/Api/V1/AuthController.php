<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|max:150']);

        Password::sendResetLink([
            'email' => $request->input('email'),
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'If an active account matches that email, a password reset link has been sent. Check your inbox and spam folder.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email|max:150',
            'password' => 'required|string|min:8|max:255|confirmed',
        ]);
        $credentials['status'] = 'active';

        $status = Password::reset($credentials, function (User $user, string $password) {
            DB::transaction(function () use ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
                $user->tokens()->delete();
            });

            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => 'This password reset link is invalid or has expired. Please request a new link.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Sign in with your new password.',
        ]);
    }

    /**
     * Authenticate user with credentials and issue a Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $throttleKey = 'login:' . strtolower($request->input('username')) . '|' . $request->ip();

        // Rate limiting: Maximum 5 failed attempts per minute
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Too many failed login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $identifier = $request->input('username');
        $user = User::with('role')
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        // Credential validation
        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            AuditLogService::log(
                action: 'LOGIN_FAILED',
                module: 'AUTHENTICATION',
                recordType: User::class,
                recordId: $user?->id,
                previousValues: null,
                newValues: ['attempted_identifier' => $identifier],
                actor: $user,
                actorUsername: $identifier,
                ipAddress: $request->ip()
            );

            return response()->json([
                'success' => false,
                'message' => 'Invalid username/email or password.',
            ], 401);
        }

        // Account status check
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is suspended or deactivated. Contact Super Administrator.',
            ], 403);
        }

        // Clear rate limiter on success
        RateLimiter::clear($throttleKey);

        // Update last login
        $user->last_login_at = now();
        $user->last_login_ip = $request->ip();
        $user->save();

        // Issue Sanctum Bearer Token
        $token = $user->createToken('bit_hrms_token')->plainTextToken;

        AuditLogService::log(
            action: 'LOGIN_SUCCESS',
            module: 'AUTHENTICATION',
            recordType: User::class,
            recordId: $user->id,
            previousValues: null,
            newValues: ['role' => $user->role?->code],
            actor: $user,
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Authentication successful.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'department_id' => $user->department_id,
                    'is_first_login' => (bool)$user->is_first_login,
                    'designation' => $user->designation,
                    'grade_level' => $user->grade_level,
                    'last_login_at' => $user->last_login_at,
                ]
            ]
        ]);
    }

    /**
     * Get profile of authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role', 'department');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'status' => $user->status,
                'is_first_login' => (bool)$user->is_first_login,
                'designation' => $user->designation,
                'grade_level' => $user->grade_level,
                'last_login_at' => $user->last_login_at,
            ]
        ]);
    }

    /**
     * Complete first-login onboarding (change password and set full profile).
     */
    public function completeOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'designation' => 'required|string|max:255',
            'grade_level' => 'required|string|max:50',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        $user->name = $request->input('name');
        $user->designation = $request->input('designation');
        $user->grade_level = $request->input('grade_level');
        $user->password = Hash::make($request->input('new_password'));
        $user->is_first_login = false;
        $user->save();

        AuditLogService::log(
            action: 'ONBOARDING_COMPLETED',
            module: 'AUTHENTICATION',
            recordType: User::class,
            recordId: $user->id,
            previousValues: null,
            newValues: [
                'name' => $user->name,
                'designation' => $user->designation,
                'grade_level' => $user->grade_level,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile setup and password updated successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'department' => $user->department,
                    'status' => $user->status,
                    'is_first_login' => false,
                    'designation' => $user->designation,
                    'grade_level' => $user->grade_level,
                ]
            ]
        ]);
    }

    /**
     * Revoke authenticated token and logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();

            AuditLogService::log(
                action: 'LOGOUT',
                module: 'AUTHENTICATION',
                recordType: User::class,
                recordId: $user->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }

    /**
     * Change user password securely.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|different:current_password',
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        AuditLogService::log(
            action: 'PASSWORD_CHANGED',
            module: 'AUTHENTICATION',
            recordType: User::class,
            recordId: $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.'
        ]);
    }
}
