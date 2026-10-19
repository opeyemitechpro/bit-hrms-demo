<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\StaffDocument;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class StaffDocumentController extends Controller
{
    public function index($staffId): JsonResponse
    {
        $staff = Staff::findOrFail($staffId);
        $documents = $staff->documents()->with('uploader:id,name,username')->get();

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    public function store(Request $request, $staffId): JsonResponse
    {
        $staff = Staff::findOrFail($staffId);

        $validated = $request->validate([
            'title' => 'required|string|max:190',
            'document_type' => 'required|in:APPOINTMENT_LETTER,CONFIRMATION_GAZETTE,DEGREE_CERTIFICATE,NYSC_DISCHARGE,PASSPORT_PHOTO,PROMOTION_LETTER,OTHER',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240', // 10MB limit
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $file->getClientOriginalName());
        $filePath = $file->storeAs("staff_documents/{$staff->id}", $fileName, 'public');

        $doc = $staff->documents()->create([
            'document_type' => $validated['document_type'],
            'title' => $validated['title'],
            'file_path' => "/storage/" . $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getClientMimeType(),
            'uploaded_by' => $request->user()?->id,
        ]);

        // If it's a passport photo, update staff photo_path
        if ($validated['document_type'] === 'PASSPORT_PHOTO') {
            $staff->update(['photo_path' => "/storage/" . $filePath]);
        }

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'username' => $request->user()?->username ?? 'system',
            'action' => 'UPLOAD_DOCUMENT',
            'auditable_type' => Staff::class,
            'auditable_id' => $staff->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'new_values' => [
                'document_id' => $doc->id,
                'title' => $doc->title,
                'type' => $doc->document_type,
                'file_name' => $doc->file_name,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded and archived to digital personnel folder.',
            'data' => $doc->load('uploader:id,name,username'),
        ], 201);
    }

    public function destroy(Request $request, $staffId, $documentId): JsonResponse
    {
        $staff = Staff::findOrFail($staffId);
        $doc = $staff->documents()->findOrFail($documentId);

        // Delete underlying file
        $storagePath = str_replace('/storage/', '', $doc->file_path);
        Storage::disk('public')->delete($storagePath);

        $docData = ['title' => $doc->title, 'file_name' => $doc->file_name];
        $doc->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'username' => $request->user()?->username ?? 'system',
            'action' => 'DELETE_DOCUMENT',
            'auditable_type' => Staff::class,
            'auditable_id' => $staff->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'previous_values' => $docData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document deleted from personnel folder successfully.',
        ]);
    }
}
