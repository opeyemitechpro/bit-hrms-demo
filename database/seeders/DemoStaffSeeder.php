<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;
use App\Models\Department;
use App\Models\Unit;
use App\Models\Designation;
use App\Models\GradeLevel;
use App\Models\EmploymentStatus;

class DemoStaffSeeder extends Seeder
{
    public function run(): void
    {
        $depts = Department::all()->keyBy("code");
        $units = Unit::all()->keyBy("code");
        $designations = Designation::all()->keyBy("code");
        $gradeLevels = GradeLevel::all()->keyBy("name");
        $statuses = EmploymentStatus::all()->keyBy("code");

        $demoStaff = [
            // 1. Program Analyst - Active at BIT HQ
            [
                "staff_number" => "BIT/EMP/0001",
                "ogun_employee_number" => "OG/EMP/2020/001",
                "file_number" => "BIT/PF/001",
                "ippis_number" => "IPPIS-9001",
                "title" => "Engr.",
                "surname" => "Adeyemi",
                "first_name" => "Olanrewaju",
                "middle_name" => "Tunde",
                "gender" => "Male",
                "date_of_birth" => "1985-04-12",
                "official_email" => "o.adeyemi@bit.ogunstate.gov.ng",
                "phone_number" => "08031234567",
                "department_id" => $depts["BIT-INF"]->id,
                "unit_id" => $units["BIT-INF-SWE"]->id,
                "designation_id" => $designations["PPA-12"]->id,
                "grade_level_id" => $gradeLevels["GL 14"]->id,
                "step" => 3,
                "employment_status_id" => $statuses["ACTIVE"]->id,
                "current_station" => "BIT Headquarters, Oke-Mosan, Abeokuta",
                "date_of_first_appointment" => "2010-08-01",
                "date_of_present_appointment" => "2021-01-15",
                "expected_retirement_date" => "2045-04-12",
            ],
            // 2. Administrative Officer - Active at BIT HQ
            [
                "staff_number" => "BIT/EMP/0002",
                "ogun_employee_number" => "OG/EMP/2021/045",
                "file_number" => "BIT/PF/045",
                "ippis_number" => "IPPIS-9045",
                "title" => "Mrs.",
                "surname" => "Ogunlesi",
                "first_name" => "Bolanle",
                "middle_name" => "Folake",
                "gender" => "Female",
                "date_of_birth" => "1990-09-23",
                "official_email" => "b.ogunlesi@bit.ogunstate.gov.ng",
                "phone_number" => "08059876543",
                "department_id" => $depts["BIT-ADM"]->id,
                "unit_id" => $units["BIT-ADM-PERS"]->id,
                "designation_id" => $designations["HEO-GD-08"]->id,
                "grade_level_id" => $gradeLevels["GL 08"]->id,
                "step" => 2,
                "employment_status_id" => $statuses["ACTIVE"]->id,
                "current_station" => "BIT Headquarters, Oke-Mosan, Abeokuta",
                "date_of_first_appointment" => "2016-03-10",
                "date_of_present_appointment" => "2020-07-01",
                "expected_retirement_date" => "2050-09-23",
            ],
            // 3. Data Processing Officer - Posted to Ministry of Finance
            [
                "staff_number" => "BIT/EMP/0003",
                "ogun_employee_number" => "OG/EMP/2018/112",
                "file_number" => "BIT/PF/112",
                "ippis_number" => "IPPIS-9112",
                "title" => "Mr.",
                "surname" => "Bakare",
                "first_name" => "Idowu",
                "middle_name" => "Olusegun",
                "gender" => "Male",
                "date_of_birth" => "1988-11-05",
                "official_email" => "i.bakare@bit.ogunstate.gov.ng",
                "phone_number" => "08023456789",
                "department_id" => $depts["BIT-FIN"]->id,
                "unit_id" => $units["BIT-FIN-PAY"]->id,
                "designation_id" => $designations["SDPO-10"]->id,
                "grade_level_id" => $gradeLevels["GL 10"]->id,
                "step" => 4,
                "employment_status_id" => $statuses["POSTED"]->id,
                "current_station" => "Posted: Ministry of Finance - State Treasury Division",
                "date_of_first_appointment" => "2014-06-15",
                "date_of_present_appointment" => "2019-11-01",
                "expected_retirement_date" => "2048-11-05",
            ],
            // 4. Program Analyst I - Posted to OGIRS
            [
                "staff_number" => "BIT/EMP/0004",
                "ogun_employee_number" => "OG/EMP/2019/088",
                "file_number" => "BIT/PF/088",
                "ippis_number" => "IPPIS-9088",
                "title" => "Mr.",
                "surname" => "Oladimeji",
                "first_name" => "Kayode",
                "middle_name" => "Babajide",
                "gender" => "Male",
                "date_of_birth" => "1991-07-19",
                "official_email" => "k.oladimeji@bit.ogunstate.gov.ng",
                "phone_number" => "08076543210",
                "department_id" => $depts["BIT-INF"]->id,
                "unit_id" => $units["BIT-INF-SWE"]->id,
                "designation_id" => $designations["PA1-09"]->id,
                "grade_level_id" => $gradeLevels["GL 10"]->id,
                "step" => 1,
                "employment_status_id" => $statuses["POSTED"]->id,
                "current_station" => "Posted: Ogun State Internal Revenue Service (OGIRS)",
                "date_of_first_appointment" => "2017-02-01",
                "date_of_present_appointment" => "2022-01-01",
                "expected_retirement_date" => "2051-07-19",
            ],
            // 5. Senior Program Analyst - Active at BIT HQ (Standards & Regulations)
            [
                "staff_number" => "BIT/EMP/0005",
                "ogun_employee_number" => "OG/EMP/2015/022",
                "file_number" => "BIT/PF/022",
                "ippis_number" => "IPPIS-9022",
                "title" => "Dr.",
                "surname" => "Sowunmi",
                "first_name" => "Abimbola",
                "middle_name" => "Comfort",
                "gender" => "Female",
                "date_of_birth" => "1983-02-14",
                "official_email" => "a.sowunmi@bit.ogunstate.gov.ng",
                "phone_number" => "08033334455",
                "department_id" => $depts["BIT-SRP"]->id,
                "unit_id" => $units["BIT-SRP-STD"]->id,
                "designation_id" => $designations["SPA-10"]->id,
                "grade_level_id" => $gradeLevels["GL 12"]->id,
                "step" => 5,
                "employment_status_id" => $statuses["ACTIVE"]->id,
                "current_station" => "BIT Headquarters, Oke-Mosan, Abeokuta",
                "date_of_first_appointment" => "2009-10-12",
                "date_of_present_appointment" => "2020-01-01",
                "expected_retirement_date" => "2043-02-14",
            ],
            // 6. Program Analyst II - Posted to Ministry of Health
            [
                "staff_number" => "BIT/EMP/0006",
                "ogun_employee_number" => "OG/EMP/2022/190",
                "file_number" => "BIT/PF/190",
                "ippis_number" => "IPPIS-9190",
                "title" => "Miss",
                "surname" => "Adewunmi",
                "first_name" => "Temitope",
                "middle_name" => "Grace",
                "gender" => "Female",
                "date_of_birth" => "1995-12-08",
                "official_email" => "t.adewunmi@bit.ogunstate.gov.ng",
                "phone_number" => "08098761234",
                "department_id" => $depts["BIT-INF"]->id,
                "unit_id" => $units["BIT-INF-SWE"]->id,
                "designation_id" => $designations["PA2-08"]->id,
                "grade_level_id" => $gradeLevels["GL 08"]->id,
                "step" => 1,
                "employment_status_id" => $statuses["POSTED"]->id,
                "current_station" => "Posted: Ministry of Health - State Health Records",
                "date_of_first_appointment" => "2022-04-01",
                "date_of_present_appointment" => "2022-04-01",
                "expected_retirement_date" => "2055-12-08",
            ],
            // 7. Chief Program Analyst - Director Level (BIT HQ)
            [
                "staff_number" => "BIT/EMP/0007",
                "ogun_employee_number" => "OG/EMP/2005/003",
                "file_number" => "BIT/PF/003",
                "ippis_number" => "IPPIS-9003",
                "title" => "Engr.",
                "surname" => "Balogun",
                "first_name" => "Fatai",
                "middle_name" => "Alabi",
                "gender" => "Male",
                "date_of_birth" => "1971-08-30",
                "official_email" => "f.balogun@bit.ogunstate.gov.ng",
                "phone_number" => "08022221111",
                "department_id" => $depts["BIT-INF"]->id,
                "unit_id" => $units["BIT-INF-SWE"]->id,
                "designation_id" => $designations["CPA-14"]->id,
                "grade_level_id" => $gradeLevels["GL 16"]->id,
                "step" => 6,
                "employment_status_id" => $statuses["ACTIVE"]->id,
                "current_station" => "BIT Headquarters, Oke-Mosan, Abeokuta",
                "date_of_first_appointment" => "1998-05-15",
                "date_of_present_appointment" => "2018-01-01",
                "expected_retirement_date" => "2031-08-30",
            ],
            // 8. Data Processing Officer - Posted to Civil Service Commission
            [
                "staff_number" => "BIT/EMP/0008",
                "ogun_employee_number" => "OG/EMP/2021/101",
                "file_number" => "BIT/PF/101",
                "ippis_number" => "IPPIS-9101",
                "title" => "Mr.",
                "surname" => "Fashola",
                "first_name" => "Sunday",
                "middle_name" => "Adebayo",
                "gender" => "Male",
                "date_of_birth" => "1993-03-21",
                "official_email" => "s.fashola@bit.ogunstate.gov.ng",
                "phone_number" => "08061112233",
                "department_id" => $depts["BIT-ADM"]->id,
                "unit_id" => $units["BIT-ADM-PERS"]->id,
                "designation_id" => $designations["SDPO-10"]->id,
                "grade_level_id" => $gradeLevels["GL 10"]->id,
                "step" => 2,
                "employment_status_id" => $statuses["POSTED"]->id,
                "current_station" => "Posted: Civil Service Commission - Records Unit",
                "date_of_first_appointment" => "2018-09-01",
                "date_of_present_appointment" => "2021-08-01",
                "expected_retirement_date" => "2053-03-21",
            ],
        ];

        foreach ($demoStaff as $staff) {
            Staff::updateOrCreate(["staff_number" => $staff["staff_number"]], $staff);
        }
    }
}
