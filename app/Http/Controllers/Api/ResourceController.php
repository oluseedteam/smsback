<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Resource::with(['subject', 'teacher', 'admin', 'schoolClass']);

        if ($user->role === 'student') {
            $classIds = $user->classes->pluck('id');
            $query->where(function($q) use ($classIds) {
                $q->whereIn('school_class_id', $classIds)
                  ->orWhereNull('school_class_id'); // Global resources
            });
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        
        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->school_class_id);
        }

        return $query->latest()->paginate($request->input('per_page', 50));
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_path' => 'nullable|string',
            'file_type' => 'nullable|string', // pdf, doc, link
            'url' => 'nullable|string',
            'subject_id' => 'nullable|exists:subjects,id',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        if ($user->role === 'teacher') {
            $validated['teacher_id'] = $user->id;
        } elseif ($user->role === 'admin') {
            $validated['admin_id'] = $user->id;
        }

        $resource = Resource::create($validated);

        return response()->json([
            'message' => 'Resource uploaded successfully.',
            'resource' => $resource
        ], 201);
    }

    public function show(Resource $resource)
    {
        return $resource->load(['subject', 'teacher', 'admin', 'schoolClass']);
    }

    public function update(Request $request, Resource $resource)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'file_path' => 'nullable|string',
            'file_type' => 'nullable|string',
            'url' => 'nullable|string',
            'subject_id' => 'nullable|exists:subjects,id',
            'school_class_id' => 'nullable|exists:school_classes,id',
        ]);

        $resource->update($validated);
        return response()->json(['message' => 'Resource updated successfully.', 'resource' => $resource]);
    }

    public function destroy(Resource $resource)
    {
        $resource->delete();
        return response()->json(['message' => 'Resource deleted successfully.']);
    }
}
