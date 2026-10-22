<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\NominalRollController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\StaffController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\StaffPostingController;
use App\Http\Controllers\Api\V1\StaffDocumentController;
use App\Http\Controllers\Api\V1\MilestoneAlertController;
use App\Http\Controllers\Api\V1\UserController;
use App\Models\User;

Route::prefix("v1")->group(function () {
    // Public Authentication & Demo Accounts Listing
    Route::post("/auth/login", [AuthController::class, "login"])->name("login");
    Route::post("/auth/forgot-password", [AuthController::class, "forgotPassword"])->middleware('throttle:5,1');
    Route::post("/auth/reset-password", [AuthController::class, "resetPassword"])->middleware('throttle:5,1');
    Route::get("/auth/demo-users", function () {
        return response()->json([
            'success' => true,
            'data' => User::with('role')->get(['id', 'name', 'username', 'email', 'role_id', 'department_id', 'status', 'is_first_login'])
        ]);
    });

    // Authenticated API Routes (Sanctum Token Protected)
    Route::middleware("auth:sanctum")->group(function () {
        // User Profile, Session & First Login Onboarding
        Route::get("/auth/me", [AuthController::class, "me"]);
        Route::post("/auth/logout", [AuthController::class, "logout"]);
        Route::post("/auth/change-password", [AuthController::class, "changePassword"]);
        Route::post("/auth/complete-onboarding", [AuthController::class, "completeOnboarding"]);

        // Superadmin User Management
        Route::middleware("role:SUPER_ADMIN")->group(function () {
            Route::get("/admin/users", [UserController::class, "index"]);
            Route::post("/admin/users", [UserController::class, "store"]);
        });

        // Dashboard Analytics (All Authenticated Users)
        Route::get("/dashboard/statistics", [DashboardController::class, "statistics"]);

        // Staff Lookups & Read Endpoints (All Authenticated Users)
        Route::get("/staff/lookups", [StaffController::class, "lookups"]);
        Route::get("/staff/nominal-roll", [NominalRollController::class, "index"]);
        Route::get("/staff", [StaffController::class, "index"]);
        Route::get("/staff/export", [StaffController::class, "export"]);
        Route::get("/staff/template", [StaffController::class, "template"]);
        Route::get("/staff/{staff}", [StaffController::class, "show"]);

        // Milestone & Statutory Retirement Alerts (Option 3)
        Route::get("/alerts/milestones", [MilestoneAlertController::class, "index"]);
        Route::get("/alerts/notice-letter/{staff}", [MilestoneAlertController::class, "generateNoticeLetter"]);

        // Staff Postings / Deployments (Option 2)
        Route::get("/staff/{staff}/postings", [StaffPostingController::class, "index"]);
        Route::middleware("role:SUPER_ADMIN,HR_ADMIN,HR_OFFICER")->group(function () {
            Route::post("/staff/{staff}/postings", [StaffPostingController::class, "store"]);
        });

        // Staff Documents / Digital Personnel Folders (Option 4)
        Route::get("/staff/{staff}/documents", [StaffDocumentController::class, "index"]);
        Route::middleware("role:SUPER_ADMIN,HR_ADMIN,HR_OFFICER")->group(function () {
            Route::post("/staff/{staff}/documents", [StaffDocumentController::class, "store"]);
            Route::delete("/staff/{staff}/documents/{document}", [StaffDocumentController::class, "destroy"]);
        });

        // Privileged Staff Write Operations (RBAC Enforced Server-Side)
        Route::middleware("role:SUPER_ADMIN,HR_ADMIN,HR_OFFICER")->group(function () {
            Route::post("/staff", [StaffController::class, "store"]);
            Route::post("/staff/import", [StaffController::class, "import"]);
        });

        Route::middleware("role:SUPER_ADMIN,HR_ADMIN,HR_OFFICER,DEPT_ADMIN")->group(function () {
            Route::put("/staff/{staff}", [StaffController::class, "update"]);
        });

        Route::middleware("role:SUPER_ADMIN,HR_ADMIN")->group(function () {
            Route::delete("/staff/{staff}", [StaffController::class, "destroy"]);
            Route::get("/admin/audit-logs", [AuditLogController::class, "index"]);
        });
    });
});
