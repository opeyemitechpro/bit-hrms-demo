<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of system users (Superadmin only).
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::with(['role', 'department'])
            ->orderBy('id', 'desc')
            ->paginate($request->integer('per_page', 50));

        $roles = Role::orderBy('name')->get();
        $departments = Department::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
            'meta' => [
                'roles' => $roles,
                'departments' => $departments,
            ]
        ]);
    }

    /**
     * Create a new user account (Superadmin only).
     * Marked with is_first_login = true to require password reset and profile completion.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation' => 'nullable|string|max:255',
            'grade_level' => 'nullable|string|max:50',
            'status' => ['required', Rule::in(['active', 'suspended', 'deactivated'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => strtolower(trim($validated['username'])),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'department_id' => $validated['department_id'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'grade_level' => $validated['grade_level'] ?? null,
            'status' => $validated['status'],
            'is_first_login' => true, // Enforce password change and profile verification
        ]);

        $user->load(['role', 'department']);

        AuditLogService::log(
            action: 'USER_CREATED',
            module: 'USER_MANAGEMENT',
            recordType: User::class,
            recordId: $user->id,
            previousValues: null,
            newValues: [
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role?->code,
                'status' => $user->status,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "User account for {$user->name} created successfully.",
            'data' => $user,
        ], 201);
    }
}
