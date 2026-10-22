<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\StaffPosting;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StaffPostingController extends Controller
{
    public function index($staffId): JsonResponse
    {
        $staff = Staff::findOrFail($staffId);
        $postings = $staff->postings()->with('creator:id,name,username')->get();

        return response()->json([
            'success' => true,
            'data' => $postings,
        ]);
    }

    public function store(Request $request, $staffId): JsonResponse
    {
        $staff = Staff::findOrFail($staffId);

        $validated = $request->validate([
            'station_name' => 'required|string|max:190',
            'mda_name' => 'nullable|string|max:190',
            'deployment_type' => 'required|in:HEADQUARTERS,POSTED,SECONDED,RECALLED,INTERNAL_TRANSFER',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:effective_date',
            'circular_reference' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:500',
        ]);

        $posting = DB::transaction(function () use ($staff, $validated, $request) {
            // Set all existing postings to not current
            $staff->postings()->update(['is_current' => false]);

            $newPosting = $staff->postings()->create([
                'station_name' => $validated['station_name'],
                'mda_name' => $validated['mda_name'] ?? null,
                'deployment_type' => $validated['deployment_type'],
                'effective_date' => $validated['effective_date'],
                'end_date' => $validated['end_date'] ?? null,
                'is_current' => true,
                'circular_reference' => $validated['circular_reference'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            // Update staff's current station
            $oldStation = $staff->current_station;
            $formattedStation = $validated['deployment_type'] === 'HEADQUARTERS'
                ? 'Bureau of Information Technology HQ, Ogun Tech Hub, Kobape Road, Kobape, Abeokuta'
                : ($validated['station_name'] ?: "Posted: " . ($validated['mda_name'] ?? 'External MDA'));

            $staff->update([
                'current_station' => $formattedStation,
                'date_of_last_deployment' => $validated['effective_date'],
            ]);

            // Audit Log
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'username' => $request->user()?->username ?? 'system',
                'action' => 'DEPLOY_STAFF',
                'module' => 'STAFF_POSTINGS',
                'record_type' => Staff::class,
                'record_id' => $staff->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
                'previous_values' => ['current_station' => $oldStation],
                'new_values' => [
                    'current_station' => $formattedStation,
                    'posting_id' => $newPosting->id,
                    'deployment_type' => $validated['deployment_type'],
                    'effective_date' => $validated['effective_date'],
                ],
            ]);

            return $newPosting;
        });

        return response()->json([
            'success' => true,
            'message' => 'Staff deployment logged and current station updated successfully.',
            'data' => $posting->load('creator:id,name,username'),
        ], 201);
    }
}
