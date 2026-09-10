<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService)
    {
    }

    /**
     * Get a dashboard summary tailored to the authenticated user's role.
     */
    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'role' => $request->user()->role,
            'summary' => $this->dashboardService->buildSummaryFor($request->user()),
        ]);
    }

    /**
     * Admin: Get comprehensive academic setup readiness checklist.
     */
    public function setupChecklist(Request $request): JsonResponse
    {
        $currentSession = \App\Models\AcademicSession::where('is_current', true)->first();
        $hasClasses = \App\Models\SchoolClass::exists();
        $hasSubjects = \App\Models\Subject::where('status', 'active')->exists();
        $hasTeacherAssignments = \Illuminate\Support\Facades\DB::table('class_subject')
            ->whereNotNull('teacher_id')
            ->exists();
        $hasCourseRegistration = \App\Models\CourseRegistration::exists();
        $hasGradingScales = \App\Models\GradingScale::exists();
        $hasAssessmentConfigs = \App\Models\AssessmentConfiguration::exists();
        $settings = \App\Models\SchoolSetting::getSettings();
        $cbtEnabled = (bool) ($settings->cbt_enabled ?? true);
        $hasSchoolIdentity = !empty($settings->school_name);
        $hasMultipleClasses = \App\Models\SchoolClass::count() >= 2;

        $items = [
            [
                'id' => 'academic_session',
                'title' => 'Active Academic Session & Terms',
                'description' => $currentSession ? "Current active session: {$currentSession->name} ({$currentSession->current_term})" : 'No active academic session configured.',
                'completed' => (bool) $currentSession,
                'link' => '/admin/report-card/settings',
                'action_label' => $currentSession ? 'View Sessions' : 'Set Active Session',
            ],
            [
                'id' => 'sections_classes',
                'title' => 'Academic Sections & Classes',
                'description' => $hasClasses ? 'Classes and sections created.' : 'No classes found in the system.',
                'completed' => $hasClasses,
                'link' => '/admin/academics',
                'action_label' => $hasClasses ? 'Manage Classes' : 'Create Classes',
            ],
            [
                'id' => 'subjects',
                'title' => 'Curriculum Subjects Created',
                'description' => $hasSubjects ? 'Subjects with compulsory/elective flags configured.' : 'No active subjects found.',
                'completed' => $hasSubjects,
                'link' => '/admin/academics',
                'action_label' => $hasSubjects ? 'Manage Subjects' : 'Create Subjects',
            ],
            [
                'id' => 'teacher_assignments',
                'title' => 'Teacher Subject & Class Allocations',
                'description' => $hasTeacherAssignments ? 'Teachers assigned to subject classes.' : 'No teachers assigned to teach subjects yet.',
                'completed' => $hasTeacherAssignments,
                'link' => '/admin/academics',
                'action_label' => 'Assign Teachers',
            ],
            [
                'id' => 'course_registration',
                'title' => 'Student Course Registrations',
                'description' => $hasCourseRegistration ? 'Students have registered courses for eligibility.' : 'No course registration records found.',
                'completed' => $hasCourseRegistration,
                'link' => '/admin/users',
                'action_label' => 'Review Registration',
            ],
            [
                'id' => 'grading_scales',
                'title' => 'Grading Scale & Pass Criteria',
                'description' => $hasGradingScales ? 'Custom or standard grading scale rules active.' : 'No grading scales configured.',
                'completed' => $hasGradingScales,
                'link' => '/admin/report-card/settings',
                'action_label' => 'Configure Grading',
            ],
            [
                'id' => 'assessment_configs',
                'title' => 'Assessment Weighting & Exam Components',
                'description' => $hasAssessmentConfigs ? 'Continuous assessments, written, or CBT methods configured.' : 'No assessment configuration found.',
                'completed' => $hasAssessmentConfigs,
                'link' => '/admin/report-card/settings',
                'action_label' => 'Configure Assessments',
            ],
            [
                'id' => 'cbt_toggle',
                'title' => 'CBT Portal Visibility & System Switch',
                'description' => $cbtEnabled ? 'CBT Examination portal is currently enabled.' : 'CBT Examination portal is currently closed by Administration.',
                'completed' => true,
                'status_flag' => $cbtEnabled,
                'link' => '/admin/settings',
                'action_label' => $cbtEnabled ? 'Disable CBT' : 'Enable CBT',
            ],
            [
                'id' => 'school_identity',
                'title' => 'School Identity, Credentials & Stamp',
                'description' => $hasSchoolIdentity ? "Configured for {$settings->school_name}." : 'School profile, principal signature, and stamp pending setup.',
                'completed' => $hasSchoolIdentity,
                'link' => '/admin/settings',
                'action_label' => 'Update Settings',
            ],
            [
                'id' => 'promotion_classes',
                'title' => 'Promotion Destination Classes Prepared',
                'description' => $hasMultipleClasses ? 'Multiple academic levels available for progression.' : 'At least two classes required for student promotion.',
                'completed' => $hasMultipleClasses,
                'link' => '/admin/promotions',
                'action_label' => 'Configure Promotion',
            ],
        ];

        $completedCount = collect($items)->where('completed', true)->count();
        $totalCount = count($items);
        $progress = round(($completedCount / $totalCount) * 100);

        return response()->json([
            'checklist' => $items,
            'completed_count' => $completedCount,
            'total_count' => $totalCount,
            'progress_percent' => $progress,
            'is_fully_ready' => $completedCount === $totalCount,
        ]);
    }
}
