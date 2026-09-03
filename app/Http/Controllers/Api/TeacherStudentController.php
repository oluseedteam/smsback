<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TeacherStudentController extends Controller
{
    /**
     * Teacher creates a student user for their assigned class.
     * Creation sets status = 'pending_approval' and notifies Admin for review.
     */
    public function store(Request $request): JsonResponse
    {
        $teacher = $request->user();

        // Check permission
        if (!$teacher->can_create_students) {
            return response()->json(['message' => 'You do not have permission to create students.'], 403);
        }

        if (!$teacher->class_teacher_of) {
            return response()->json(['message' => 'You are not assigned as a class teacher.'], 403);
        }

        $validated = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'other_name' => 'nullable|string|max:100',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8',
            'student_id' => 'required|string|max:50',
            'gender' => 'nullable|in:male,female',
            'section' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:100',
            'parent_name' => 'nullable|string|max:255',
            'parent_phone' => 'nullable|string|max:50',
            'parent_email' => 'nullable|email|max:255',
            'parent_address' => 'nullable|string|max:500',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'profile_picture' => 'nullable|string',
        ]);

        $fullName = trim($validated['full_name'] ?? '');
        if (empty($fullName)) {
            $fullName = trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? '') . ' ' . ($validated['other_name'] ?? ''));
        }
        if (empty($fullName)) {
            $fullName = 'Student ' . $validated['student_id'];
        }

        // Check email uniqueness across all user tables
        if (
            \App\Models\Admin::where('email', $validated['email'])->exists() ||
            \App\Models\Teacher::where('email', $validated['email'])->exists() ||
            Student::where('email', $validated['email'])->exists() ||
            \App\Models\Worker::where('email', $validated['email'])->exists()
        ) {
            return response()->json(['message' => 'The email has already been taken.'], 422);
        }

        if (Student::where('student_id', $validated['student_id'])->exists()) {
            return response()->json(['message' => 'Student ID is already taken.'], 422);
        }

        $classId = $request->input('class_id') ?? $teacher->class_teacher_of;
        $class = SchoolClass::find($classId);

        $student = Student::create([
            'full_name' => $fullName,
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'other_name' => $validated['other_name'] ?? null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'student_id' => $validated['student_id'],
            'gender' => $validated['gender'] ?? null,
            'section' => $validated['section'] ?? null,
            'department' => $validated['department'] ?? null,
            'parent_name' => $validated['parent_name'] ?? null,
            'parent_phone' => $validated['parent_phone'] ?? null,
            'parent_email' => $validated['parent_email'] ?? null,
            'parent_address' => $validated['parent_address'] ?? null,
            'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
            'profile_picture' => $validated['profile_picture'] ?? null,
            'qr_code_identifier' => 'EYI-STU-' . strtoupper(Str::random(10)),
            'status' => 'pending_approval',
            'created_by_teacher_id' => $teacher->id,
        ]);

        // Assign to class
        $student->classes()->sync([$classId]);

        // Audit Log
        AuditLog::create([
            'user_id' => $teacher->id,
            'user_type' => 'teacher',
            'user_name' => $teacher->full_name,
            'action' => 'STUDENT_CREATED',
            'student_id' => $student->id,
            'details' => [
                'student_id' => $student->student_id,
                'class_id' => $classId,
                'class_name' => $class?->name,
                'status' => 'pending_approval',
            ],
            'ip_address' => $request->ip(),
        ]);

        // Admin Notification
        StudentNotification::create([
            'user_id' => 1, // Admin notification
            'user_type' => 'admin',
            'title' => 'New Student Registration Pending Approval',
            'message' => "Teacher {$teacher->full_name} created student {$student->full_name} ({$student->student_id}) for {$class?->name}. Approval required.",
            'link' => '/admin/student',
            'type' => 'student_approval_request',
        ]);

        return response()->json([
            'message' => 'Student registration created and submitted to Administration for approval.',
            'student' => $student->load('classes'),
        ], 201);
    }

    /**
     * List students in teacher's assigned class.
     */
    public function index(Request $request): JsonResponse
    {
        $teacher = $request->user();

        if (!$teacher->class_teacher_of) {
            return response()->json(['message' => 'You are not assigned as a class teacher.', 'students' => []], 200);
        }

        $class = SchoolClass::with(['students' => function ($q) {
            $q->select('students.id', 'full_name', 'students.student_id', 'email', 'gender', 'department', 'section', 'status', 'profile_picture');
        }])->find($teacher->class_teacher_of);

        return response()->json([
            'class' => $class,
            'students' => $class ? $class->students : [],
        ]);
    }
}
