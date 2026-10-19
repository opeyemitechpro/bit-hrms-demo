<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GradeLevel;

class GradeLevelSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 17; $i++) {
            $padded = str_pad($i, 2, "0", STR_PAD_LEFT);
            GradeLevel::updateOrCreate(
                ["name" => "GL {$padded}"],
                [
                    "level_number" => $i,
                    "min_step" => 1,
                    "max_step" => 15,
                    "salary_structure" => "CONPSS",
                    "description" => "Consolidated Public Service Salary Structure GL {$padded}",
                    "is_active" => true,
                ]
            );
        }

        GradeLevel::updateOrCreate(
            ["name" => "CON"],
            [
                "level_number" => 99,
                "min_step" => 1,
                "max_step" => 1,
                "salary_structure" => "CONSOLIDATED",
                "description" => "Consolidated / Political / Special Appointee",
                "is_active" => true,
            ]
        );
    }
}
