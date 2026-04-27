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
        ]);

        $validated['teacher_id'] = $user->role === 'teacher' ? $user->id : 1; 

        $class = TeacherClass::create($validated);
        return response()->json($class, 201);
    }

    public function update(Request $request, TeacherClass $teacherClass)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string',
            'grade' => 'sometimes|required|string',
            'time' => 'sometimes|required|string',
            'location' => 'nullable|string',
        ]);

        $teacherClass->update($validated);
        return response()->json($teacherClass);
    }

    public function destroy(TeacherClass $teacherClass)
    {
        $teacherClass->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
