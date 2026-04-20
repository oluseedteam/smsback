<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $query = Resource::with(['subject', 'teacher']);

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        return $query->paginate($request->input('per_page', 20));
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_path' => 'nullable|string',
            'file_type' => 'nullable|string',
            'url' => 'nullable|url',
            'subject_id' => 'nullable|exists:subjects,id',
            'teacher_id' => [$user->role === 'admin' ? 'required' : 'nullable', 'exists:teachers,id'],
        ]);

        if ($user->role === 'teacher') {
            $validated['teacher_id'] = $user->id;
        }

        $resource = Resource::create($validated);

        return response()->json($resource, 201);
    }

    public function show(Resource $resource)
    {
        return $resource->load(['subject', 'teacher']);
    }

    public function destroy(Resource $resource)
    {
        $resource->delete();
        return response()->json(null, 204);
    }
}
