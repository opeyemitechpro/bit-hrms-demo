<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class MilestoneAlertController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();
        $in12Months = Carbon::today()->addMonths(12);
        $in6Months = Carbon::today()->addMonths(6);
        $in3Months = Carbon::today()->addMonths(3);
        $twoYearsAgo = Carbon::today()->subYears(2);

        // 1. Officers due for confirmation (DOFA was >= 2 years ago and no confirmation date)
        $confirmationDue = Staff::with(['department', 'designation', 'gradeLevel'])
            ->where('date_of_first_appointment', '<=', $twoYearsAgo)
            ->where(function ($q) {
                $q->whereNull('date_of_confirmation')
                  ->orWhere('date_of_confirmation', '');
            })
            ->orderBy('date_of_first_appointment', 'asc')
            ->get();

        // 2. Upcoming retirements in the next 12 months
        $retirementDue12m = Staff::with(['department', 'designation', 'gradeLevel'])
            ->whereBetween('expected_retirement_date', [$today, $in12Months])
            ->orderBy('expected_retirement_date', 'asc')
            ->get();

        // 3. Imminent retirements in the next 6 months
        $retirementDue6m = Staff::with(['department', 'designation', 'gradeLevel'])
            ->whereBetween('expected_retirement_date', [$today, $in6Months])
            ->orderBy('expected_retirement_date', 'asc')
            ->get();

        // 4. Critical retirements in the next 3 months
        $retirementDue3m = Staff::with(['department', 'designation', 'gradeLevel'])
            ->whereBetween('expected_retirement_date', [$today, $in3Months])
            ->orderBy('expected_retirement_date', 'asc')
            ->get();

        // 5. Overdue retirements (service period or age elapsed)
        $overdueRetirement = Staff::with(['department', 'designation', 'gradeLevel'])
            ->where('expected_retirement_date', '<', $today)
            ->orderBy('expected_retirement_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'counts' => [
                    'confirmation_due' => $confirmationDue->count(),
                    'retirements_12m' => $retirementDue12m->count(),
                    'retirements_6m' => $retirementDue6m->count(),
                    'retirements_3m' => $retirementDue3m->count(),
                    'overdue' => $overdueRetirement->count(),
                ],
                'confirmation_due' => $confirmationDue,
                'retirements_12m' => $retirementDue12m,
                'retirements_6m' => $retirementDue6m,
                'retirements_3m' => $retirementDue3m,
                'overdue' => $overdueRetirement,
            ]
        ]);
    }

    public function generateNoticeLetter($staffId): JsonResponse
    {
        $staff = Staff::with(['department', 'unit', 'designation', 'gradeLevel'])->findOrFail($staffId);

        $now = Carbon::now();
        $dofaDiff = Carbon::parse($staff->date_of_first_appointment)->diff($now);
        $dobDiff = Carbon::parse($staff->date_of_birth)->diff($now);

        $yearsInServiceFormatted = "{$dofaDiff->y} " . ($dofaDiff->y === 1 ? 'Year' : 'Years') .
            ($dofaDiff->m > 0 ? ", {$dofaDiff->m} " . ($dofaDiff->m === 1 ? 'Month' : 'Months') : '');

        $ageFormatted = "{$dobDiff->y} " . ($dobDiff->y === 1 ? 'Year' : 'Years') .
            ($dobDiff->m > 0 ? ", {$dobDiff->m} " . ($dobDiff->m === 1 ? 'Month' : 'Months') : '');

        return response()->json([
            'success' => true,
            'data' => [
                'reference_number' => "OG/BIT/RET/" . date('Y') . "/" . str_pad($staff->id, 4, '0', STR_PAD_LEFT),
                'date' => date('d F, Y'),
                'staff' => $staff,
                'statutory_rules' => [
                    'rule' => 'Public Service Rule 020810 (60 Years of Age or 35 Years of Pensionable Service)',
                    'years_in_service' => $yearsInServiceFormatted,
                    'age' => $ageFormatted,
                    'years_count' => $dofaDiff->y,
                    'months_count' => $dofaDiff->m,
                    'age_years_count' => $dobDiff->y,
                    'age_months_count' => $dobDiff->m,
                ],
                'signatory' => [
                    'title' => 'Director, Administration & Supplies',
                    'for' => 'Special Adviser / Director-General',
                    'agency' => 'Bureau of Information Technology',
                    'state' => 'Ogun State Government, Nigeria'
                ]
            ]
        ]);
    }
}
