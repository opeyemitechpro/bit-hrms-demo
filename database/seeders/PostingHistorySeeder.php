<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;
use App\Models\StaffPosting;

class PostingHistorySeeder extends Seeder
{
    public function run(): void
    {
        $allStaff = Staff::all();

        foreach ($allStaff as $staff) {
            // First posting: initial appointment at Headquarters
            StaffPosting::firstOrCreate(
                [
                    'staff_id' => $staff->id,
                    'station_name' => 'Bureau of Information Technology HQ, Oke-Mosan, Abeokuta',
                    'effective_date' => $staff->date_of_first_appointment,
                ],
                [
                    'mda_name' => 'Bureau of Information Technology',
                    'deployment_type' => 'HEADQUARTERS',
                    'is_current' => !str_contains($staff->current_station ?? '', 'Posted'),
                    'circular_reference' => 'OG/CSC/APPT/' . substr($staff->date_of_first_appointment, 0, 4) . '/' . str_pad($staff->id, 3, '0', STR_PAD_LEFT),
                    'remarks' => 'Initial Establishment Appointment',
                    'created_by' => 1,
                ]
            );

            // If currently posted elsewhere, add second posting record
            if ($staff->current_station && str_contains($staff->current_station, 'Posted:')) {
                $mda = trim(str_replace('Posted:', '', $staff->current_station));
                StaffPosting::firstOrCreate(
                    [
                        'staff_id' => $staff->id,
                        'station_name' => $staff->current_station,
                        'effective_date' => $staff->date_of_present_appointment ?? $staff->date_of_first_appointment,
                    ],
                    [
                        'mda_name' => $mda,
                        'deployment_type' => 'POSTED',
                        'is_current' => true,
                        'circular_reference' => 'OG/CSC/POST/' . substr($staff->date_of_present_appointment ?? '2024', 0, 4) . '/' . str_pad($staff->id, 3, '0', STR_PAD_LEFT),
                        'remarks' => 'Cadre Deployment to External MDA',
                        'created_by' => 1,
                    ]
                );
            }
        }
    }
}
