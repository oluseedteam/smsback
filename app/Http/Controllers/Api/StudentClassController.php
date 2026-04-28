<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\TeacherClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentClassController extends Controller
{
    /**
     * Get all classes for the currently logged-in student.
     *
     * Returns school classes (with teacher, subjects) plus teacher-scheduled classes
     * that belong to the same school class.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        // Get school classes this student is enrolled in
        $schoolClasses = $student->classes()
            ->with(['teacher:id,full_name', 'subjects:id,name,code'])
            ->get();

        // Get teacher-created scheduled classes
        $teacherClasses = TeacherClass::query()->get();

        // Get student's results grouped by subject for rewards/stars
        $subjectScores = Result::query()
            ->where('student_id', $student->id)
            ->selectRaw('subject_id, AVG((score / NULLIF(max_score, 0)) * 100) as avg_score, COUNT(*) as total_assessments')
            ->groupBy('subject_id')
            ->get()
            ->keyBy('subject_id');

        // Build the response: merge school class subjects with teacher-scheduled classes
        $classes = [];

        // From school classes — each subject becomes a "class card"
        foreach ($schoolClasses as $schoolClass) {
            foreach ($schoolClass->subjects as $subject) {
                $score = $subjectScores->get($subject->id);
                $classes[] = [
                    'id' => $subject->id,
                    'title' => $subject->name,
                    'code' => $subject->code,
                    'teacher' => $schoolClass->teacher?->full_name ?? 'TBA',
                    'room' => $schoolClass->room ?? $schoolClass->name,
                    'school_class' => $schoolClass->name,
                    'grade_level' => $schoolClass->grade_level,
                    'avg_score' => round((float) ($score?->avg_score ?? 0), 1),
                    'total_assessments' => (int) ($score?->total_assessments ?? 0),
                    'source' => 'school_class',
                ];
            }
        }

        // From teacher-created classes (these are the ones teachers upload/schedule)
        foreach ($teacherClasses as $tc) {
            // Avoid duplicates if already captured via school class subjects
            $alreadyExists = collect($classes)->contains(function ($c) use ($tc) {
                return strtolower($c['title']) === strtolower($tc->title);
            });

            if (!$alreadyExists) {
                $classes[] = [
                    'id' => 'tc-' . $tc->id,
                    'title' => $tc->title,
                    'code' => null,
                    'teacher' => 'Assigned Teacher',
                    'room' => $tc->location ?? 'TBA',
                    'schedule' => $tc->time,
                    'grade_level' => $tc->grade,
                    'avg_score' => 0,
                    'total_assessments' => 0,
                    'source' => 'teacher_class',
                ];
            }
        }

        return response()->json([
            'classes' => $classes,
            'school_classes' => $schoolClasses,
            'subject_scores' => $subjectScores->values(),
        ]);
    }
}
