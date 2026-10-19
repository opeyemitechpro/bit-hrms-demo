<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmploymentStatus;

class EmploymentStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ["name" => "Active in Bureau", "code" => "ACTIVE", "is_active_nominal" => true],
            ["name" => "Posted to MDA", "code" => "POSTED", "is_active_nominal" => true],
            ["name" => "On Leave", "code" => "ON_LEAVE", "is_active_nominal" => true],
            ["name" => "On Secondment", "code" => "SECONDED", "is_active_nominal" => true],
            ["name" => "Suspended", "code" => "SUSPENDED", "is_active_nominal" => false],
            ["name" => "Retired", "code" => "RETIRED", "is_active_nominal" => false],
        ];

        foreach ($statuses as $s) {
            EmploymentStatus::updateOrCreate(['code' => $s['code']], $s);
        }
    }
}
