<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NominalRollController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Staff::with(['department', 'unit', 'designation', 'gradeLevel', 'status']);

        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('staff_number', 'LIKE', "%{$search}%")
                    ->orWhere('ogun_employee_number', 'LIKE', "%{$search}%")
                    ->orWhere('file_number', 'LIKE', "%{$search}%")
                    ->orWhere('ippis_number', 'LIKE', "%{$search}%")
                    ->orWhere('surname', 'LIKE', "%{$search}%")
                    ->orWhere('first_name', 'LIKE', "%{$search}%")
                    ->orWhere('middle_name', 'LIKE', "%{$search}%")
                    ->orWhere('official_email', 'LIKE', "%{$search}%")
                    ->orWhere('phone_number', 'LIKE', "%{$search}%")
                    ->orWhere('qualification', 'LIKE', "%{$search}%")
                    ->orWhere('lga_of_origin', 'LIKE', "%{$search}%")
                    ->orWhere('state_of_origin', 'LIKE', "%{$search}%")
                    ->orWhere('current_station', 'LIKE', "%{$search}%")
                    ->orWhere('remarks', 'LIKE', "%{$search}%")
                    ->orWhereHas('designation', function ($sub) use ($search) {
                        $sub->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('code', 'LIKE', "%{$search}%")
                            ->orWhere('cadre_name', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('department', function ($sub) use ($search) {
                        $sub->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('code', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('gradeLevel', function ($sub) use ($search) {
                        $sub->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        $perPage = $request->input('per_page', 100);
        $staff = $query->orderBy('grade_level_id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $staff->items(),
            'meta' => ['current_page' => $staff->currentPage(), 'last_page' => $staff->lastPage(), 'total' => $staff->total()]
        ]);
    }
}
