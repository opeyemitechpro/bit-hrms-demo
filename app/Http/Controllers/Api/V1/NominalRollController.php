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
                $q->whereLike('staff_number', "%{$search}%")
                    ->orWhereLike('ogun_employee_number', "%{$search}%")
                    ->orWhereLike('file_number', "%{$search}%")
                    ->orWhereLike('ippis_number', "%{$search}%")
                    ->orWhereLike('surname', "%{$search}%")
                    ->orWhereLike('first_name', "%{$search}%")
                    ->orWhereLike('middle_name', "%{$search}%")
                    ->orWhereLike('official_email', "%{$search}%")
                    ->orWhereLike('phone_number', "%{$search}%")
                    ->orWhereLike('qualification', "%{$search}%")
                    ->orWhereLike('lga_of_origin', "%{$search}%")
                    ->orWhereLike('state_of_origin', "%{$search}%")
                    ->orWhereLike('current_station', "%{$search}%")
                    ->orWhereLike('remarks', "%{$search}%")
                    ->orWhereHas('designation', function ($sub) use ($search) {
                        $sub->whereLike('name', "%{$search}%")
                            ->orWhereLike('code', "%{$search}%")
                            ->orWhereLike('cadre_name', "%{$search}%");
                    })
                    ->orWhereHas('department', function ($sub) use ($search) {
                        $sub->whereLike('name', "%{$search}%")
                            ->orWhereLike('code', "%{$search}%");
                    })
                    ->orWhereHas('gradeLevel', function ($sub) use ($search) {
                        $sub->whereLike('name', "%{$search}%");
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
