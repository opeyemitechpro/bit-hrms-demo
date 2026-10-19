<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Administrator',
                'username' => 'superadmin',
                'email' => 'superadmin@bit.ogunstate.gov.ng',
                'password' => Hash::make('password123'),
                'role_id' => 1, // Super Admin
                'status' => 'active',
            ],
            [
                'name' => 'HR Administrator',
                'username' => 'hradmin',
                'email' => 'hradmin@bit.ogunstate.gov.ng',
                'password' => Hash::make('password123'),
                'role_id' => 2, // HR Admin
                'status' => 'active',
            ],
            [
                'name' => 'HR Officer',
                'username' => 'hrofficer',
                'email' => 'hrofficer@bit.ogunstate.gov.ng',
                'password' => Hash::make('password123'),
                'role_id' => 3, // HR Officer
                'status' => 'active',
            ],
            [
                'name' => 'Department Admin (Software)',
                'username' => 'deptadmin',
                'email' => 'deptadmin@bit.ogunstate.gov.ng',
                'password' => Hash::make('password123'),
                'role_id' => 4, // Dept Admin
                'department_id' => 4,
                'status' => 'active',
            ],
            [
                'name' => 'HR Viewer',
                'username' => 'viewer',
                'email' => 'viewer@bit.ogunstate.gov.ng',
                'password' => Hash::make('password123'),
                'role_id' => 5, // Viewer
                'status' => 'active',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }
    }
}
