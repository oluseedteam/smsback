<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicSectionController extends Controller
{
    /**
     * List all academic sections with associated classes and subjects counts.
     */
    public function index(): JsonResponse
    {
        $sections = AcademicSection::withCount(["classes", "subjects"])
            ->orderBy("ordering")
            ->orderBy("name")
            ->get();

        return response()->json($sections);
    }

    /**
     * Create a new academic section.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "name" => "required|string|max:255|unique:academic_sections,name",
            "description" => "nullable|string",
            "ordering" => "nullable|integer",
            "status" => "nullable|in:active,inactive",
        ]);

        $section = AcademicSection::create($validated);

        return response()->json($section, 201);
    }

    /**
     * Show an academic section with its classes and subjects.
     */
    public function show(AcademicSection $academicSection): JsonResponse
    {
        return response()->json($academicSection->load(["classes:id,name,grade_level,arm", "subjects:id,name,code"]));
    }

    /**
     * Update an academic section.
     */
    public function update(Request $request, AcademicSection $academicSection): JsonResponse
    {
        $validated = $request->validate([
            "name" => "sometimes|required|string|max:255|unique:academic_sections,name,{$academicSection->id}",
            "description" => "nullable|string",
            "ordering" => "nullable|integer",
            "status" => "nullable|in:active,inactive",
        ]);

        $academicSection->update($validated);

        return response()->json($academicSection);
    }

    /**
     * Delete an academic section.
     */
    public function destroy(AcademicSection $academicSection): JsonResponse
    {
        if ($academicSection->classes()->exists() || $academicSection->subjects()->exists()) {
            return response()->json([
                'message' => 'Only unused academic sections can be deleted. Move or remove their classes and subjects first.',
            ], 409);
        }

        $academicSection->delete();

        return response()->json(["message" => "Academic section deleted successfully."]);
    }
}
