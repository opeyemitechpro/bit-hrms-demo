<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\Department;
use App\Models\Unit;
use App\Models\Designation;
use App\Models\GradeLevel;
use App\Models\EmploymentStatus;
use App\Services\StaffService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StaffController extends Controller
{
    protected StaffService $staffService;

    public function __construct(StaffService $staffService)
    {
        $this->staffService = $staffService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Staff::with(['department', 'unit', 'designation', 'gradeLevel', 'status']);

        if ($search = trim($request->input('search', ''))) {
            $field = $request->input('search_field', 'all');
            $query->where(function ($q) use ($search, $field) {
                if ($field === 'ogun_no') {
                    $q->whereLike('staff_number', "%{$search}%")
                        ->orWhereLike('ogun_employee_number', "%{$search}%");
                    return;
                }
                if ($field === 'name') {
                    foreach (preg_split('/\s+/', $search) as $part) {
                        $q->where(function ($names) use ($part) {
                            $names->whereLike('surname', "%{$part}%")
                                ->orWhereLike('first_name', "%{$part}%")
                                ->orWhereLike('middle_name', "%{$part}%");
                        });
                    }
                    return;
                }
                if ($field === 'station') {
                    $q->whereLike('current_station', "%{$search}%");
                    return;
                }
                if ($field === 'cadre') {
                    $q->whereHas('designation', function ($designation) use ($search) {
                        $designation->whereLike('name', "%{$search}%")
                            ->orWhereLike('cadre_name', "%{$search}%");
                    });
                    return;
                }
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

        if ($dept = $request->input('department_id')) {
            $query->where('department_id', $dept);
        }

        if ($grade = $request->input('grade_level_id')) {
            $query->where('grade_level_id', $grade);
        }

        if ($gender = $request->input('gender')) {
            $query->where('gender', $gender);
        }

        if ($status = $request->input('status')) {
            $query->whereHas('status', fn($statusQuery) => $statusQuery->where('code', $status));
        }

        $quickFilter = $request->input('quick_filter', 'ALL');
        if (in_array($quickFilter, ['ACTIVE', 'POSTED'], true)) {
            $query->whereHas('status', fn($statusQuery) => $statusQuery->where('code', $quickFilter));
        } elseif ($quickFilter === 'SPECIAL_APPOINTEES') {
            $query->where(function ($special) {
                $special->whereHas('designation', fn($designation) => $designation->where('cadre_name', 'LIKE', '%Special%'))
                    ->orWhereHas('gradeLevel', fn($grade) => $grade->where('name', 'CON'));
            });
        } else {
            $cadres = [
                'PROGRAM_ANALYST' => 'Programme Analyst Officer Cadre',
                'DATA_PROCESSING' => 'Data Processing Officer Cadre',
                'ADMIN_OFFICER' => 'Administrative Officer Cadre',
                'EXECUTIVE_GD' => 'Executive Officer (GD) Cadre',
                'ACCOUNTANT' => 'Accountant Officer Cadre',
                'EXECUTIVE_AC' => 'Executive Officer (A/C) Cadre',
                'CONFIDENTIAL_SEC' => 'Confidential Secretary Officer Cadre',
            ];
            if (isset($cadres[$quickFilter])) {
                $query->whereHas('designation', fn($designation) => $designation->where('cadre_name', $cadres[$quickFilter]));
            }
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 25)));
        $staff = $query->orderBy('grade_level_id', 'desc')->orderBy('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $staff->items(),
            'meta' => [
                'current_page' => $staff->currentPage(),
                'last_page' => $staff->lastPage(),
                'total' => $staff->total(),
                'per_page' => $staff->perPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_number' => 'required|string|max:50|unique:staff,staff_number',
            'ogun_employee_number' => 'nullable|string|max:50|unique:staff,ogun_employee_number',
            'file_number' => 'nullable|string|max:50',
            'ippis_number' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:20',
            'surname' => 'required|string|max:100',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'gender' => 'required|in:Male,Female',
            'date_of_birth' => 'required|date',
            'official_email' => 'required|email|max:150|unique:staff,official_email',
            'phone_number' => 'nullable|string|max:30',
            'department_id' => 'required|exists:departments,id',
            'unit_id' => 'required|exists:units,id',
            'designation_id' => 'required|exists:designations,id',
            'grade_level_id' => 'required|exists:grade_levels,id',
            'step' => 'required|integer|min:1|max:15',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'current_station' => 'nullable|string|max:150',
            'date_of_first_appointment' => 'required|date',
            'date_of_present_appointment' => 'required|date',
            'date_of_confirmation' => 'nullable|date',
            'lga_of_origin' => 'nullable|string|max:100',
            'state_of_origin' => 'nullable|string|max:100',
            'qualification' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:500',
        ]);

        $staff = $this->staffService->createStaff($validated);

        return response()->json([
            'success' => true,
            'message' => 'Staff record created successfully.',
            'data' => $staff->load(['department', 'unit', 'designation', 'gradeLevel', 'status'])
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $staff = Staff::with(['department', 'unit', 'designation', 'gradeLevel', 'status'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $staff
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $validated = $request->validate([
            'staff_number' => "required|string|max:50|unique:staff,staff_number,{$id}",
            'ogun_employee_number' => "nullable|string|max:50|unique:staff,ogun_employee_number,{$id}",
            'file_number' => 'nullable|string|max:50',
            'ippis_number' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:20',
            'surname' => 'required|string|max:100',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'gender' => 'required|in:Male,Female',
            'date_of_birth' => 'required|date',
            'official_email' => "required|email|max:150|unique:staff,official_email,{$id}",
            'phone_number' => 'nullable|string|max:30',
            'department_id' => 'required|exists:departments,id',
            'unit_id' => 'required|exists:units,id',
            'designation_id' => 'required|exists:designations,id',
            'grade_level_id' => 'required|exists:grade_levels,id',
            'step' => 'required|integer|min:1|max:15',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'current_station' => 'nullable|string|max:150',
            'date_of_first_appointment' => 'required|date',
            'date_of_present_appointment' => 'required|date',
            'date_of_confirmation' => 'nullable|date',
            'lga_of_origin' => 'nullable|string|max:100',
            'state_of_origin' => 'nullable|string|max:100',
            'qualification' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:500',
        ]);

        $updated = $this->staffService->updateStaff($staff, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Staff record updated successfully.',
            'data' => $updated->load(['department', 'unit', 'designation', 'gradeLevel', 'status'])
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $staff = Staff::findOrFail($id);
        $this->staffService->archiveStaff($staff, request('reason', 'Administrative Archival'));

        return response()->json([
            'success' => true,
            'message' => 'Staff record archived successfully.'
        ]);
    }

    /**
     * Unified Lookups endpoint for all controlled form dropdowns
     */
    public function lookups(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'departments' => Department::with('units')->where('is_active', true)->get(),
                'units' => Unit::where('is_active', true)->get(),
                'designations' => Designation::all(),
                'grade_levels' => GradeLevel::where('is_active', true)->orderBy('level_number', 'asc')->get(),
                'statuses' => EmploymentStatus::all(),
            ]
        ]);
    }

    /**
     * Export Nominal Roll as CSV
     */
    public function export(Request $request): StreamedResponse
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
        if ($dept = $request->input('department_id')) {
            $query->where('department_id', $dept);
        }
        if ($grade = $request->input('grade_level_id')) {
            $query->where('grade_level_id', $grade);
        }

        $staff = $query->orderBy('grade_level_id', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="BIT_Nominal_Roll_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($staff) {
            $handle = fopen('php://output', 'w');

            // Add UTF-8 BOM for Microsoft Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header row
            fputcsv($handle, [
                'S/N',
                'Staff Number',
                'OG Number',
                'File Number',
                'Title',
                'Surname',
                'First Name',
                'Middle Name',
                'Gender',
                'Date of Birth',
                'Official Email',
                'Department',
                'Unit',
                'Cadre',
                'Designation',
                'Grade Level',
                'Step',
                'Date of 1st Appointment',
                'Date of Confirmation',
                'Date of Present Appointment',
                'Expected Retirement Date',
                'LGA of Origin',
                'Qualification',
                'Current Station',
                'Status',
                'Remarks'
            ]);

            foreach ($staff as $index => $s) {
                fputcsv($handle, [
                    $index + 1,
                    $s->staff_number,
                    $s->ogun_employee_number ?? '',
                    $s->file_number ?? '',
                    $s->title ?? 'Mr.',
                    strtoupper($s->surname),
                    $s->first_name,
                    $s->middle_name ?? '',
                    $s->gender,
                    $s->date_of_birth ? $s->date_of_birth->format('Y-m-d') : '',
                    $s->official_email,
                    $s->department?->name ?? '',
                    $s->unit?->name ?? '',
                    $s->designation?->cadre_name ?? '',
                    $s->designation?->name ?? '',
                    $s->gradeLevel?->name ?? '',
                    $s->step,
                    $s->date_of_first_appointment ? $s->date_of_first_appointment->format('Y-m-d') : '',
                    $s->date_of_confirmation ? $s->date_of_confirmation->format('Y-m-d') : '',
                    $s->date_of_present_appointment ? $s->date_of_present_appointment->format('Y-m-d') : '',
                    $s->expected_retirement_date ? $s->expected_retirement_date->format('Y-m-d') : '',
                    $s->lga_of_origin ?? '',
                    $s->qualification ?? '',
                    $s->current_station ?? 'BIT Headquarters, Abeokuta',
                    $s->status?->name ?? 'Active',
                    $s->remarks ?? ''
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Download CSV Template for Data Import
     */
    public function template(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="BIT_Nominal_Roll_Template.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, [
                'staff_number',
                'surname',
                'first_name',
                'middle_name',
                'title',
                'gender',
                'date_of_birth',
                'official_email',
                'department_code',
                'unit_code',
                'designation',
                'grade_level',
                'step',
                'date_of_first_appointment',
                'date_of_confirmation',
                'date_of_present_appointment',
                'file_number',
                'ogun_employee_number',
                'lga_of_origin',
                'qualification',
                'current_station',
                'status',
                'remarks'
            ]);

            // Sample reference row
            fputcsv($handle, [
                'BIT/EMP/0010',
                'Solanke',
                'Ayodele',
                'Samuel',
                'Mr.',
                'Male',
                '1992-05-18',
                'a.solanke@bit.ogunstate.gov.ng',
                'BIT-INF',
                'BIT-INF-SWE',
                'Program Analyst II',
                'GL 08',
                '1',
                '2018-09-01',
                '2020-09-01',
                '2022-01-15',
                'BIT/PF/089',
                'OG/EMP/2018/089',
                'Abeokuta South',
                'B.Sc',
                'BIT Headquarters, Abeokuta',
                'Active in Bureau',
                'Civil Service Regular'
            ]);

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Process CSV Import
     */
    public function import(Request $request): JsonResponse
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->getRealPath();

            $rows = [];
            if (($handle = fopen($path, 'r')) !== false) {
                $header = fgetcsv($handle);
                // Strip UTF-8 BOM if present
                if ($header && isset($header[0])) {
                    $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);
                }

                while (($data = fgetcsv($handle)) !== false) {
                    if (count($header) === count($data)) {
                        $rows[] = array_combine($header, $data);
                    }
                }
                fclose($handle);
            }
        } elseif ($request->has('rows')) {
            $rows = $request->input('rows');
        } else {
            return response()->json([
                'success' => false,
                'message' => 'No CSV file or rows provided for import.'
            ], 422);
        }

        $result = $this->staffService->importFromRows($rows);

        return response()->json($result);
    }
}
