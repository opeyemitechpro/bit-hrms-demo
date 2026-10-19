<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Unit;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                "name" => "Office of the Director-General / Executive",
                "code" => "BIT-DIR",
                "description" => "Executive leadership, Special Advisers, and Bureau Director-General.",
                "units" => [
                    ["name" => "Executive Directorate Unit", "code" => "BIT-DIR-EXEC"],
                ]
            ],
            [
                "name" => "Department of Administration and Supplies",
                "code" => "BIT-ADM",
                "description" => "Manages administrative operations and procurement.",
                "units" => [
                    ["name" => "Personnel Management Unit", "code" => "BIT-ADM-PERS"],
                    ["name" => "Procurement & Logistics Unit", "code" => "BIT-ADM-PROC"],
                ]
            ],
            [
                "name" => "Department of Finance and Accounts",
                "code" => "BIT-FIN",
                "description" => "Oversees financial management and payroll accounting.",
                "units" => [
                    ["name" => "Finance and Accounts Unit", "code" => "BIT-FIN-ACC"],
                    ["name" => "Budget & Planning Unit", "code" => "BIT-FIN-BGT"],
                    ["name" => "Payroll Unit", "code" => "BIT-FIN-PAY"],
                ]
            ],
            [
                "name" => "Department of Standard, Regulation, Planning and Research",
                "code" => "BIT-SRP",
                "description" => "Sets ICT standards and project monitoring.",
                "units" => [
                    ["name" => "ICT Standards & Compliance Unit", "code" => "BIT-SRP-STD"],
                ]
            ],
            [
                "name" => "Infrastructure and Software Department",
                "code" => "BIT-INF",
                "description" => "Manages data centers, networking, and software engineering.",
                "units" => [
                    ["name" => "Software Engineering & e-Gov Unit", "code" => "BIT-INF-SWE"],
                    ["name" => "Data Processing Centre Unit", "code" => "BIT-INF-DPC"],
                    ["name" => "Network & Infrastructure Unit", "code" => "BIT-INF-NET"],
                ]
            ],
        ];

        foreach ($departments as $deptData) {
            $units = $deptData["units"];
            unset($deptData["units"]);
            $department = Department::updateOrCreate(["code" => $deptData["code"]], $deptData);
            foreach ($units as $unitData) {
                $unitData["department_id"] = $department->id;
                Unit::updateOrCreate(["code" => $unitData["code"]], $unitData);
            }
        }
    }
}
