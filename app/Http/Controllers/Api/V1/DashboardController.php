<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function statistics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'active_staff' => Staff::count(),
                    'departments_count' => Department::count(),
                    'retirements_next_12m' => Staff::whereBetween('expected_retirement_date', [now(), now()->addYear()])->count(),
                ],
                'by_gender' => Staff::select('gender', DB::raw('count(*) as count'))->groupBy('gender')->pluck('count', 'gender'),
            ]
        ]);
    }
}