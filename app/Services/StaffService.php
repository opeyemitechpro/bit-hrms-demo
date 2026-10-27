<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\Department;
use App\Models\Unit;
use App\Models\Designation;
use App\Models\GradeLevel;
use App\Models\EmploymentStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StaffService
{
    public function createStaff(array $data): Staff
    {
        return DB::transaction(function () use ($data) {
            $data['title'] = $data['title'] ?? 'Mr.';
            $data['current_station'] = $data['current_station'] ?? 'BIT Headquarters, Abeokuta';
            $dob = $data['date_of_birth'];
            $dofa = $data['date_of_first_appointment'];
            $data['expected_retirement_date'] = Staff::calculateRetirementDate($dob, $dofa)->toDateString();
            $data['created_by'] = Auth::id() ?? 1;
            $data['updated_by'] = Auth::id() ?? 1;

            $staff = Staff::create($data);

            AuditLogService::log(
                action: 'STAFF_CREATED',
                module: 'STAFF_MANAGEMENT',
                recordType: Staff::class,
                recordId: $staff->id,
                previousValues: null,
                newValues: [
                    'staff_number' => $staff->staff_number,
                    'name' => $staff->full_name,
                    'department_id' => $staff->department_id,
                    'designation_id' => $staff->designation_id,
                    'grade_level_id' => $staff->grade_level_id,
                ]
            );

            return $staff;
        });
    }

    public function updateStaff(Staff $staff, array $data): Staff
    {
        return DB::transaction(function () use ($staff, $data) {
            $prev = [
                'staff_number' => $staff->staff_number,
                'name' => $staff->full_name,
                'department_id' => $staff->department_id,
                'designation_id' => $staff->designation_id,
                'grade_level_id' => $staff->grade_level_id,
                'step' => $staff->step,
                'employment_status_id' => $staff->employment_status_id,
            ];

            if (isset($data['date_of_birth']) || isset($data['date_of_first_appointment'])) {
                $dob = $data['date_of_birth'] ?? $staff->date_of_birth->toDateString();
                $dofa = $data['date_of_first_appointment'] ?? $staff->date_of_first_appointment->toDateString();
                $data['expected_retirement_date'] = Staff::calculateRetirementDate($dob, $dofa)->toDateString();
            }

            $data['updated_by'] = Auth::id() ?? 1;
            $staff->update($data);

            AuditLogService::log(
                action: 'STAFF_UPDATED',
                module: 'STAFF_MANAGEMENT',
                recordType: Staff::class,
                recordId: $staff->id,
                previousValues: $prev,
                newValues: [
                    'staff_number' => $staff->staff_number,
                    'name' => $staff->full_name,
                    'department_id' => $staff->department_id,
                    'designation_id' => $staff->designation_id,
                    'grade_level_id' => $staff->grade_level_id,
                    'step' => $staff->step,
                    'employment_status_id' => $staff->employment_status_id,
                ]
            );

            return $staff;
        });
    }

    public function archiveStaff(Staff $staff, string $reason = 'Administrative Archival'): void
    {
        DB::transaction(function () use ($staff, $reason) {
            $prev = [
                'staff_number' => $staff->staff_number,
                'name' => $staff->full_name,
                'deleted_at' => null,
            ];
            $staff->delete();

            AuditLogService::log(
                action: 'STAFF_ARCHIVED',
                module: 'STAFF_MANAGEMENT',
                recordType: Staff::class,
                recordId: $staff->id,
                previousValues: $prev,
                newValues: ['reason' => $reason, 'deleted_at' => now()->toDateTimeString()]
            );
        });
    }

    /**
     * Batch import rows from CSV array
     */
    public function importFromRows(array $rows): array
    {
        $errors = [];
        $validRecords = [];

        // Lookup maps for validation
        $depts = Department::all()->keyBy(fn($d) => strtoupper($d->code))->toArray();
        $units = Unit::all()->keyBy(fn($u) => strtoupper($u->code))->toArray();
        $designations = Designation::all()->keyBy(fn($d) => strtoupper($d->name))->toArray();
        $gradeLevels = GradeLevel::all()->keyBy(fn($g) => strtoupper($g->name))->toArray();
        $statuses = EmploymentStatus::all()->keyBy(fn($s) => strtoupper($s->code))->toArray();

        $existingStaffNumbers = Staff::withTrashed()->pluck('staff_number')->map(fn($v) => strtoupper($v))->toArray();
        $existingEmails = Staff::withTrashed()->pluck('official_email')->map(fn($v) => strtolower($v))->toArray();

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // header is row 1
            $rowErrors = [];

            // Trim inputs
            $staffNumber = trim($row['staff_number'] ?? '');
            $email = trim($row['official_email'] ?? '');
            $deptCode = strtoupper(trim($row['department_code'] ?? ''));
            $unitCode = strtoupper(trim($row['unit_code'] ?? ''));
            $desigName = strtoupper(trim($row['designation'] ?? ''));
            $gradeName = strtoupper(trim($row['grade_level'] ?? ''));
            $statusName = strtoupper(trim($row['status'] ?? 'ACTIVE'));

            // Basic validation
            if (empty($staffNumber)) $rowErrors[] = "Staff Number is required.";
            if (empty($row['surname'] ?? '')) $rowErrors[] = "Surname is required.";
            if (empty($row['first_name'] ?? '')) $rowErrors[] = "First Name is required.";
            if (empty($row['gender'] ?? '') || !in_array($row['gender'], ['Male', 'Female'])) $rowErrors[] = "Gender must be 'Male' or 'Female'.";
            if (empty($row['date_of_birth'] ?? '')) $rowErrors[] = "Date of Birth is required.";
            if (empty($row['date_of_first_appointment'] ?? '')) $rowErrors[] = "Date of First Appointment is required.";
            if (empty($row['date_of_present_appointment'] ?? '')) $rowErrors[] = "Date of Present Appointment is required.";

            // Uniqueness
            if (in_array(strtoupper($staffNumber), $existingStaffNumbers)) {
                $rowErrors[] = "Staff Number '{$staffNumber}' already exists in the system.";
            }
            if (in_array(strtolower($email), $existingEmails)) {
                $rowErrors[] = "Email '{$email}' is already in use.";
            }

            // Relationship existence
            if (!isset($depts[$deptCode])) {
                $rowErrors[] = "Unknown Department code '{$deptCode}'. Available: " . implode(', ', array_keys($depts));
            }
            if (!isset($units[$unitCode])) {
                $rowErrors[] = "Unknown Unit code '{$unitCode}'.";
            }
            if (!isset($designations[$desigName])) {
                $rowErrors[] = "Unknown Designation '{$desigName}'.";
            }
            if (!isset($gradeLevels[$gradeName])) {
                $rowErrors[] = "Unknown Grade Level '{$gradeName}'. (e.g. GL 08, GL 10, GL 14)";
            }

            if (!empty($rowErrors)) {
                $errors[] = [
                    'row' => $rowNum,
                    'staff_number' => $staffNumber ?: 'MISSING',
                    'name' => ($row['surname'] ?? '') . ' ' . ($row['first_name'] ?? ''),
                    'errors' => $rowErrors,
                ];
            } else {
                $dob = $row['date_of_birth'];
                $dofa = $row['date_of_first_appointment'];
                $retirementDate = Staff::calculateRetirementDate($dob, $dofa)->toDateString();

                $validRecords[] = [
                    'staff_number' => $staffNumber,
                    'ogun_employee_number' => $row['ogun_employee_number'] ?? null,
                    'file_number' => $row['file_number'] ?? null,
                    'ippis_number' => $row['ippis_number'] ?? null,
                    'title' => $row['title'] ?? 'Mr.',
                    'surname' => trim($row['surname']),
                    'first_name' => trim($row['first_name']),
                    'middle_name' => trim($row['middle_name'] ?? ''),
                    'gender' => $row['gender'],
                    'date_of_birth' => $dob,
                    'official_email' => $email,
                    'department_id' => $depts[$deptCode]['id'],
                    'unit_id' => $units[$unitCode]['id'],
                    'designation_id' => $designations[$desigName]['id'],
                    'grade_level_id' => $gradeLevels[$gradeName]['id'],
                    'step' => intval($row['step'] ?? 1),
                    'employment_status_id' => $statuses[$statusName]['id'] ?? 1,
                    'date_of_first_appointment' => $dofa,
                    'date_of_present_appointment' => $row['date_of_present_appointment'],
                    'expected_retirement_date' => $retirementDate,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $existingStaffNumbers[] = strtoupper($staffNumber);
                if (!empty($email)) $existingEmails[] = strtolower($email);
            }
        }

        // Insert valid records in chunks within a transaction
        if (!empty($validRecords)) {
            DB::transaction(function () use ($validRecords) {
                foreach (array_chunk($validRecords, 50) as $chunk) {
                    Staff::insert($chunk);
                }

                AuditLogService::log(
                    action: 'NOMINAL_ROLL_IMPORTED',
                    module: 'DATA_IMPORT',
                    newValues: [
                        'imported_count' => count($validRecords)
                    ]
                );
            });
        }

        return [
            'success' => count($errors) === 0,
            'total_rows' => count($rows),
            'imported_count' => count($validRecords),
            'failed_count' => count($errors),
            'errors' => $errors,
        ];
    }
}