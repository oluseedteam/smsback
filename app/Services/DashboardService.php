<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;

class DashboardService
{
    public function buildSummaryFor(object $user): array
    {
        return match ($user->role) {
            'admin' => $this->adminSummary(),
            'teacher' => $this->teacherSummary($user->id),
            default => $this->studentSummary($user->id),
        };
    }

    private function adminSummary(): array
    {
        $attendanceHistory = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $dayName = now()->subDays($i)->format('l');
            $count = AttendanceRecord::query()
                ->whereDate('attendance_date', $date)
                ->whereIn('status', ['present', 'late', 'excused'])
                ->count();
            
            $attendanceHistory[] = [
                'day' => strtoupper($dayName),
                'val' => $count,
                'date' => $date
            ];
        }

        return [
            'total_students' => Student::query()->count(),
            'total_teachers' => Teacher::query()->count(),
            'total_workers' => \App\Models\Worker::query()->count(),
            'total_prefects' => Student::query()->where('is_prefect', true)->count(),
            'total_classes' => SchoolClass::query()->count(),
            'total_subjects' => Subject::query()->count(),
            'attendance_today' => AttendanceRecord::query()
                ->whereDate('attendance_date', now()->toDateString())
                ->count(),
            'attendance_history' => $attendanceHistory,
        ];
    }

    private function teacherSummary(int $teacherId): array
    {
        $classIds = SchoolClass::query()->where('teacher_id', $teacherId)->pluck('id');

        return [
            'my_classes' => $classIds->count(),
            'my_students' => Student::query()
                ->whereHas('classes', fn ($query) => $query->whereIn('school_classes.id', $classIds))
                ->count(),
            'attendance_today' => AttendanceRecord::query()
                ->whereIn('school_class_id', $classIds)
                ->whereDate('attendance_date', now()->toDateString())
                ->count(),
            'results_entered' => Result::query()->where('teacher_id', $teacherId)->count(),
        ];
    }

    private function studentSummary(int $studentId): array
    {
        $averageScore = Result::query()
            ->where('student_id', $studentId)
            ->selectRaw('AVG((score / NULLIF(max_score, 0)) * 100) as avg_score')
            ->value('avg_score');

        // Star Student: student with the highest average score
        $starStudent = null;
        $topStudents = Student::query()
            ->whereHas('results')
            ->get()
            ->map(function ($student) {
                $avg = Result::query()
                    ->where('student_id', $student->id)
                    ->selectRaw('AVG((score / NULLIF(max_score, 0)) * 100) as avg_score')
                    ->value('avg_score');
                return [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'profile_picture' => $student->profile_picture,
                    'avg_score' => round((float)($avg ?? 0), 2),
                ];
            })
            ->sortByDesc('avg_score')
            ->first();
        if ($topStudents) {
            $starStudent = $topStudents;
        }

        // Achievement points: sum of science homework scores for this student
        $scienceSubjectId = \App\Models\Subject::query()
            ->where('name', 'like', '%science%')
            ->orWhere('name', 'like', '%Science%')
            ->value('id');
        $achievementPoints = 0;
        if ($scienceSubjectId) {
            $achievementPoints = (int) Result::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $scienceSubjectId)
                ->where('assessment_type', 'homework')
                ->sum('score');
        }

        // Upcoming events
        $events = \App\Models\CalendarEvent::query()
            ->where('start_time', '>=', now())
            ->orderBy('start_time')
            ->limit(5)
            ->get(['id', 'title', 'start_time', 'end_time', 'description']);

        return [
            'my_classes' => SchoolClass::query()
                ->whereHas('students', fn ($query) => $query->where('students.id', $studentId))
                ->count(),
            'attendance_rate' => $this->attendanceRate($studentId),
            'average_score_percent' => round((float) ($averageScore ?? 0), 2),
            'subjects_tracked' => Subject::query()
                ->whereHas('results', fn ($query) => $query->where('student_id', $studentId))
                ->count(),
            'star_student' => $starStudent,
            'achievement_points' => $achievementPoints,
            'upcoming_events' => $events,
        ];
    }

    private function attendanceRate(int $studentId): float
    {
        $total = AttendanceRecord::query()->where('student_id', $studentId)->count();

        if ($total === 0) {
            return 0.0;
        }

        $presentLike = AttendanceRecord::query()
            ->where('student_id', $studentId)
            ->whereIn('status', ['present', 'late', 'excused'])
            ->count();

        return round(($presentLike / $total) * 100, 2);
    }
}
