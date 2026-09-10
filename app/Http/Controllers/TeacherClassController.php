<?php

namespace App\Http\Controllers;

use App\Models\TeacherClass;
use Illuminate\Http\Request;

class TeacherClassController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'teacher') {
            return TeacherClass::where('teacher_id', $user->id)->get();
        }
        return TeacherClass::all();
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'title' => 'required|string',
            'grade' => 'required|string',
            'time' => 'required|string',
            'location' => 'nullable|string',
            'teacher_id' => [$user->role === 'admin' ? 'required' : 'nullable', 'exists:teachers,id'],
        ]);

        if ($user->role === 'teacher') {
            $validated['teacher_id'] = $user->id;
        }

        $class = TeacherClass::create($validated);
        return response()->json($class, 201);
    }

    public function show(Request $request, TeacherClass $teacherClass)
    {
        $this->authorizeManagement($request, $teacherClass);

        return response()->json($teacherClass);
    }

    public function update(Request $request, TeacherClass $teacherClass)
    {
        $this->authorizeManagement($request, $teacherClass);

        $validated = $request->validate([
            'title' => 'sometimes|required|string',
            'grade' => 'sometimes|required|string',
            'time' => 'sometimes|required|string',
            'location' => 'nullable|string',
        ]);

        $teacherClass->update($validated);
        return response()->json($teacherClass);
    }

    public function destroy(Request $request, TeacherClass $teacherClass)
    {
        $this->authorizeManagement($request, $teacherClass);

        $teacherClass->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    private function authorizeManagement(Request $request, TeacherClass $teacherClass): void
    {
        $user = $request->user();
        $allowed = $user->role === 'admin'
            || ($user->role === 'teacher' && (int) $teacherClass->teacher_id === (int) $user->id);

        abort_unless($allowed, 403, 'You cannot modify this class entry.');
    }
}
