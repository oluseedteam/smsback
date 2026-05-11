<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthProfile;
use App\Models\HealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = strtolower(class_basename($user));

        $records = HealthRecord::where('user_id', $user->id)
            ->where('user_role', $role)
            ->latest()
            ->get();

        $profile = HealthProfile::where('user_id', $user->id)
            ->where('user_role', $role)
            ->first();

        return response()->json([
            'data' => $records,
            'profile' => $profile
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = strtolower(class_basename($user));

        $payload = $request->validate([
            'condition' => ['nullable', 'string', 'max:255'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'genotype' => ['nullable', 'string', 'max:10'],
            'allergies' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'emergency_contact' => ['nullable', 'string'],
        ]);

        // Update or create profile
        HealthProfile::updateOrCreate(
            ['user_id' => $user->id, 'user_role' => $role],
            [
                'blood_group' => $payload['blood_group'] ?? null,
                'genotype' => $payload['genotype'] ?? null,
                'allergies' => $payload['allergies'] ?? null,
                'emergency_contact' => $payload['emergency_contact'] ?? null,
            ]
        );

        // Add a new record if condition is provided
        if (!empty($payload['condition'])) {
            HealthRecord::create([
                'user_id' => $user->id,
                'user_role' => $role,
                'condition' => $payload['condition'],
                'notes' => $payload['notes'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Health information updated successfully.']);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $role = strtolower(class_basename($user));

        $record = HealthRecord::where('id', $id)
            ->where('user_id', $user->id)
            ->where('user_role', $role)
            ->firstOrFail();

        $record->delete();

        return response()->json(['message' => 'Record deleted.']);
    }
}
