<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherStudentController extends Controller
{
    /**
     * Teacher creates a student user for their assigned class.
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
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8',
            'student_id' => 'required|string|max:50',
            'gender' => 'nullable|in:male,female',
            'department' => 'nullable|string|max:100',
        ]);

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

        $student = Student::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'student_id' => $validated['student_id'],
            'gender' => $validated['gender'] ?? null,
            'department' => $validated['department'] ?? null,
        ]);

        // Auto-assign to teacher's class
        $student->classes()->sync([$teacher->class_teacher_of]);

        return response()->json([
            'message' => 'Student created successfully.',
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
            $q->select('students.id', 'full_name', 'student_id', 'email', 'gender', 'department', 'profile_picture');
        }])->find($teacher->class_teacher_of);

        return response()->json([
            'class' => $class,
            'students' => $class ? $class->students : [],
        ]);
    }
}
