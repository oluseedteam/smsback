<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Worker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QrIdCardController extends Controller
{
    /**
     * Get ID Card profile & safe QR metadata for a user.
     */
    public function getIdCard(Request $request, string $role, int $id): JsonResponse
    {
        $settings = SchoolSetting::getSettings();
        $user = null;

        if ($role === 'student') {
            $user = Student::with(['classes', 'academicSession'])->findOrFail($id);
            if (empty($user->qr_code_identifier)) {
                $user->update(['qr_code_identifier' => 'GHRA-STU-' . strtoupper(Str::random(10))]);
            }
        } elseif ($role === 'teacher') {
            $user = Teacher::with(['assignedClass', 'subjects'])->findOrFail($id);
            if (empty($user->qr_code_identifier)) {
                $user->update(['qr_code_identifier' => 'GHRA-TCH-' . strtoupper(Str::random(10))]);
            }
        } elseif ($role === 'admin') {
            $user = Admin::findOrFail($id);
            if (empty($user->qr_code_identifier)) {
                $user->update(['qr_code_identifier' => 'GHRA-ADM-' . strtoupper(Str::random(10))]);
            }
        } else {
            $user = Worker::findOrFail($id);
            if (empty($user->qr_code_identifier)) {
                $user->update(['qr_code_identifier' => 'GHRA-WRK-' . strtoupper(Str::random(10))]);
            }
        }

        $idNumber = $role === 'student' ? $user->student_id : ($user->employee_id ?? "ADM-{$user->id}");
        $className = $role === 'student' ? ($user->classes->first()?->name ?? 'General') : null;

        // Safe QR data (public verification token string - does NOT contain secrets or passwords)
        $qrContent = json_encode([
            'school' => 'GHRA',
            'qr_id' => $user->qr_code_identifier,
            'role' => $role,
            'id' => $idNumber,
            'name' => $user->full_name,
            'valid_session' => '2026/2027',
        ]);

        return response()->json([
            'school' => [
                'name' => $settings->school_name,
                'motto' => $settings->motto,
                'logo_url' => $settings->logo_url,
                'phone' => $settings->phone,
                'email' => $settings->email,
                'address' => $settings->address,
            ],
            'user' => [
                'id' => $user->id,
                'role' => $role,
                'full_name' => $user->full_name,
                'identifier' => $idNumber,
                'gender' => $user->gender,
                'profile_picture' => $user->profile_picture,
                'class_name' => $className,
                'section' => $user->section ?? null,
                'department' => $user->department ?? null,
                'emergency_contact_name' => $user->emergency_contact_name ?: 'School Front Desk',
                'emergency_contact_phone' => $user->emergency_contact_phone ?: $settings->phone,
                'qr_code_identifier' => $user->qr_code_identifier,
                'qr_data_string' => $qrContent,
                'status' => $user->status ?? 'active',
            ]
        ]);
    }

    /**
     * Admin: Look up user profile via QR Identifier or Student/Employee ID.
     */
    public function qrLookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:255',
        ]);

        $settings = SchoolSetting::getSettings();
        $q = trim($validated['query']);

        // Check if query is JSON formatted from scanner
        if (str_starts_with($q, '{') && str_ends_with($q, '}')) {
            $parsed = json_decode($q, true);
            if (!empty($parsed['qr_id'])) {
                $q = $parsed['qr_id'];
            } elseif (!empty($parsed['id'])) {
                $q = $parsed['id'];
            }
        }

        // 1. Search Students
        $student = Student::with(['classes', 'academicSession'])
            ->where('qr_code_identifier', $q)
            ->orWhere('student_id', $q)
            ->orWhere('email', $q)
            ->first();

        if ($student) {
            $emName = $student->emergency_contact_name ?: 'School Front Desk';
            $emPhone = $student->emergency_contact_phone ?: $settings->phone;
            return response()->json([
                'found' => true,
                'role' => 'student',
                'user' => [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'student_id' => $student->student_id,
                    'email' => $student->email,
                    'gender' => $student->gender,
                    'profile_picture' => $student->profile_picture,
                    'class' => $student->classes->first()?->name ?? 'Unassigned',
                    'section' => $student->section,
                    'parent_name' => $student->parent_name,
                    'parent_phone' => $student->parent_phone,
                    'emergency_contact' => "{$emName} ({$emPhone})",
                    'status' => $student->status ?? 'active',
                    'qr_code_identifier' => $student->qr_code_identifier,
                ]
            ]);
        }

        // 2. Search Teachers
        $teacher = Teacher::with(['assignedClass', 'subjects'])
            ->where('qr_code_identifier', $q)
            ->orWhere('employee_id', $q)
            ->orWhere('email', $q)
            ->first();

        if ($teacher) {
            $emName = $teacher->emergency_contact_name ?: 'School Front Desk';
            $emPhone = $teacher->emergency_contact_phone ?: $settings->phone;
            return response()->json([
                'found' => true,
                'role' => 'teacher',
                'user' => [
                    'id' => $teacher->id,
                    'full_name' => $teacher->full_name,
                    'employee_id' => $teacher->employee_id,
                    'email' => $teacher->email,
                    'gender' => $teacher->gender,
                    'profile_picture' => $teacher->profile_picture,
                    'class_teacher_of' => $teacher->assignedClass?->name,
                    'phone' => $teacher->phone,
                    'emergency_contact' => "{$emName} ({$emPhone})",
                    'status' => $teacher->status ?? 'active',
                    'qr_code_identifier' => $teacher->qr_code_identifier,
                ]
            ]);
        }

        // 3. Search Admins
        $admin = Admin::where('qr_code_identifier', $q)
            ->orWhere('email', $q)
            ->first();

        if ($admin) {
            return response()->json([
                'found' => true,
                'role' => 'admin',
                'user' => [
                    'id' => $admin->id,
                    'full_name' => $admin->full_name,
                    'email' => $admin->email,
                    'profile_picture' => $admin->profile_picture,
                    'role_type' => $admin->role ?? 'admin',
                    'status' => $admin->status ?? 'active',
                    'qr_code_identifier' => $admin->qr_code_identifier,
                ]
            ]);
        }

        return response()->json([
            'found' => false,
            'message' => 'No user found with the provided QR Identifier or ID.'
        ], 404);
    }
}
