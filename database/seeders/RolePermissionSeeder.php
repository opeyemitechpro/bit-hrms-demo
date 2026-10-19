<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'id' => 1,
                'name' => 'Super Administrator',
                'code' => 'SUPER_ADMIN',
                'description' => 'Full administrative access to all system modules, settings, users, and audit logs.',
            ],
            [
                'id' => 2,
                'name' => 'HR Administrator',
                'code' => 'HR_ADMIN',
                'description' => 'Manages nominal roll, staff records, departments, data imports, exports, and HR reports.',
            ],
            [
                'id' => 3,
                'name' => 'HR Officer',
                'code' => 'HR_OFFICER',
                'description' => 'Creates and updates staff records, searches nominal roll, and generates approved reports.',
            ],
            [
                'id' => 4,
                'name' => 'Department Administrator',
                'code' => 'DEPT_ADMIN',
                'description' => 'Views staff records and departmental reports exclusively within their assigned department.',
            ],
            [
                'id' => 5,
                'name' => 'Viewer / Management',
                'code' => 'VIEWER',
                'description' => 'Read-only access to staff directory, nominal roll, and executive dashboards.',
            ],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['id' => $role['id']], $role);
        }

        $permissions = [
            'staff.view', 'staff.create', 'staff.update', 'staff.archive', 'staff.import', 'staff.export',
            'department.view', 'department.manage',
            'unit.view', 'unit.manage',
            'designation.manage', 'grade.manage',
            'users.manage', 'roles.manage',
            'audit.view', 'reports.view', 'reports.export'
        ];

        foreach ($permissions as $perm) {
            DB::table('permissions')->updateOrInsert(['code' => $perm], ['name' => ucfirst(str_replace('.', ' ', $perm)), 'code' => $perm]);
        }
    }
}
