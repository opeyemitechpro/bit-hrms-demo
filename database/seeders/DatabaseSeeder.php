<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            DepartmentSeeder::class,
            GradeLevelSeeder::class,
            DesignationSeeder::class,
            EmploymentStatusSeeder::class,
            UserSeeder::class,
            DemoStaffSeeder::class,
        ]);
    }
}
