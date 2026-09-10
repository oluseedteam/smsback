<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AssessmentConfiguration;
use App\Models\GradingScale;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Subject;
use App\Services\ReportCardCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReportCardSettingsController extends Controller
{
    /**
     * Get combined settings payload for Admin Settings page.
     */
    public function getSettings(): JsonResponse
    {
        $settings = SchoolSetting::getSettings();
        $sessions = AcademicSession::orderBy('name', 'desc')->get();
        $classes = SchoolClass::orderBy('name')->get();
        $subjects = Subject::orderBy('name')->get();
        $gradingScales = GradingScale::with(['schoolClass:id,name', 'academicSession:id,name'])->get();
        $assessmentConfigs = AssessmentConfiguration::with(['schoolClass:id,name', 'academicSession:id,name', 'subject:id,name'])->get();

        return response()->json([
            'settings' => $settings,
            'sessions' => $sessions,
            'classes' => $classes,
            'subjects' => $subjects,
            'grading_scales' => $gradingScales,
            'assessment_configurations' => $assessmentConfigs,
        ]);
    }

    /**
     * Update School Settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $settings = SchoolSetting::getSettings();

        $validated = $request->validate([
            'school_name' => 'sometimes|string|max:255',
            'motto' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'logo_url' => 'nullable|string',
            'principal_name' => 'nullable|string|max:255',
            'principal_signature_url' => 'nullable|string',
            'school_stamp_url' => 'nullable|string',
            'report_card_theme' => 'sometimes|string|max:50',
            'show_student_photo' => 'sometimes|boolean',
            'show_grade_point' => 'sometimes|boolean',
            'show_attendance' => 'sometimes|boolean',
            'show_teacher_signature' => 'sometimes|boolean',
            'show_principal_signature' => 'sometimes|boolean',
            'show_school_stamp' => 'sometimes|boolean',
            'show_watermark' => 'sometimes|boolean',
            'show_promotion' => 'sometimes|boolean',
            'show_annual_summary' => 'sometimes|boolean',
            'require_class_teacher_review' => 'sometimes|boolean',
            'report_card_footer_text' => 'nullable|string|max:1000',
            'email_accent_color' => 'nullable|string|max:50',
            'email_footer_message' => 'nullable|string',
            'result_release_email_message' => 'nullable|string',
            'attach_pdf_to_email' => 'sometimes|boolean',
            'require_fee_payment_for_release' => 'sometimes|boolean',
            'allowed_payment_statuses_for_release' => 'nullable|array',
            'affective_traits' => 'nullable|array',
            'psychomotor_traits' => 'nullable|array',
            'max_rating_scale' => 'sometimes|integer|min:1|max:10',
            'show_position' => 'sometimes|boolean',
            'show_cumulative_on_third_term' => 'sometimes|boolean',
            'cbt_enabled' => 'sometimes|boolean',
            'annual_calculation_method' => 'sometimes|string|in:equal,weighted,third_term_only',
            'annual_term_weights' => 'nullable|array',
            'annual_term_weights.*' => 'numeric|min:0|max:100',
            'missing_term_policy' => 'sometimes|string|in:average_available,require_all',
            'automatic_report_card_email' => 'sometimes|boolean',
        ]);

        if (($validated['annual_calculation_method'] ?? $settings->annual_calculation_method) === 'weighted') {
            $weights = $validated['annual_term_weights'] ?? $settings->annual_term_weights;
            if (!is_array($weights) || count($weights) !== 3 || abs(array_sum($weights) - 100) > 0.01) {
                throw ValidationException::withMessages([
                    'annual_term_weights' => 'Weighted annual-result percentages must contain three values that total 100%.',
                ]);
            }
        }

        $settings->update($validated);

        return response()->json([
            'message' => 'School settings updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }

    // ─── Academic Sessions CRUD ──────────────────────────────

    public function sessionsIndex(): JsonResponse
    {
        return response()->json(AcademicSession::orderBy('name', 'desc')->get());
    }

    public function sessionsStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:academic_sessions,name',
            'is_current' => 'nullable|boolean',
            'terms' => 'nullable|array',
            'current_term' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'registration_deadline' => 'nullable|date',
            'registration_reopened' => 'nullable|boolean',
            'status' => 'nullable|in:upcoming,active,closed,ended',
        ]);

        if (!empty($validated['is_current'])) {
            AcademicSession::where('is_current', true)->update(['is_current' => false]);
        }

        $session = AcademicSession::create([
            'name' => $validated['name'],
            'is_current' => $validated['is_current'] ?? false,
            'terms' => $validated['terms'] ?? ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => $validated['current_term'] ?? '1st Term',
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'registration_deadline' => $validated['registration_deadline'] ?? null,
            'registration_reopened' => $validated['registration_reopened'] ?? false,
            'status' => $validated['status'] ?? (!empty($validated['is_current']) ? 'active' : 'upcoming'),
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Academic session created successfully.',
            'session' => $session,
        ], 201);
    }

    public function sessionsUpdate(Request $request, int $id): JsonResponse
    {
        $session = AcademicSession::findOrFail($id);

        $validated = $request->validate([
            'name' => "sometimes|string|max:100|unique:academic_sessions,name,{$id}",
            'is_current' => 'sometimes|boolean',
            'terms' => 'nullable|array',
            'current_term' => 'sometimes|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'registration_deadline' => 'nullable|date',
            'registration_reopened' => 'nullable|boolean',
            'status' => 'sometimes|in:upcoming,active,closed,ended',
        ]);

        if (!empty($validated['is_current'])) {
            AcademicSession::where('id', '!=', $id)->update(['is_current' => false]);
        }

        $session->update($validated);

        return response()->json([
            'message' => 'Academic session updated.',
            'session' => $session->fresh(),
        ]);
    }

    public function sessionsDestroy(int $id): JsonResponse
    {
        $session = AcademicSession::findOrFail($id);
        if ($session->is_current || $session->courseRegistrations()->exists() || $session->subjectResults()->exists() || $session->reportCards()->exists()) {
            return response()->json([
                'message' => 'Current or historically referenced academic sessions cannot be deleted. Close or end the session instead.',
            ], 409);
        }
        $session->delete();

        return response()->json(['message' => 'Academic session deleted.']);
    }

    // ─── Grading Scales CRUD ─────────────────────────────────

    public function gradingScalesIndex(Request $request): JsonResponse
    {
        $classId = $request->input('school_class_id');
        $sessionId = $request->input('academic_session_id');

        $scales = GradingScale::query()
            ->when($classId, fn($q) => $q->where('school_class_id', $classId))
            ->when($sessionId, fn($q) => $q->where('academic_session_id', $sessionId))
            ->with(['schoolClass:id,name', 'academicSession:id,name'])
            ->orderBy('min_score', 'desc')
            ->get();

        return response()->json($scales);
    }

    public function gradingScalesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => 'nullable|exists:school_classes,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'grade' => 'required|string|max:10',
            'min_score' => 'required|numeric|min:0|max:100',
            'max_score' => 'required|numeric|min:0|max:100|gte:min_score',
            'grade_point' => 'nullable|numeric|min:0',
            'remark' => 'required|string|max:100',
            'is_pass' => 'sometimes|boolean',
        ]);

        $this->assertNoOverlappingGradeRange($validated);

        $scale = GradingScale::create($validated);

        return response()->json([
            'message' => 'Grading scale rule added.',
            'scale' => $scale->load(['schoolClass:id,name', 'academicSession:id,name']),
        ], 201);
    }

    public function gradingScalesUpdate(Request $request, int $id): JsonResponse
    {
        $scale = GradingScale::findOrFail($id);

        $validated = $request->validate([
            'school_class_id' => 'nullable|exists:school_classes,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'grade' => 'sometimes|string|max:10',
            'min_score' => 'sometimes|numeric|min:0|max:100',
            'max_score' => 'sometimes|numeric|min:0|max:100|gte:min_score',
            'grade_point' => 'nullable|numeric|min:0',
            'remark' => 'sometimes|string|max:100',
            'is_pass' => 'sometimes|boolean',
        ]);

        $this->assertNoOverlappingGradeRange(array_merge($scale->toArray(), $validated), $scale->id);

        $scale->update($validated);

        return response()->json([
            'message' => 'Grading scale updated.',
            'scale' => $scale->fresh()->load(['schoolClass:id,name', 'academicSession:id,name']),
        ]);
    }

    public function gradingScalesDestroy(int $id): JsonResponse
    {
        $scale = GradingScale::findOrFail($id);
        $scale->delete();

        return response()->json(['message' => 'Grading scale rule removed.']);
    }

    public function gradingScalesResetDefaults(Request $request): JsonResponse
    {
        $classId = $request->input('school_class_id');
        $sessionId = $request->input('academic_session_id');

        // Delete existing for this scope
        GradingScale::where('school_class_id', $classId)
            ->where('academic_session_id', $sessionId)
            ->delete();

        $defaults = ReportCardCalculationService::getDefaultGradingScale();
        foreach ($defaults as $d) {
            GradingScale::create(array_merge($d, [
                'school_class_id' => $classId,
                'academic_session_id' => $sessionId,
            ]));
        }

        return response()->json([
            'message' => 'Grading scales reset to default standards.',
            'scales' => GradingScale::where('school_class_id', $classId)->where('academic_session_id', $sessionId)->get(),
        ]);
    }

    // ─── Assessment Configurations CRUD ─────────────────────

    public function assessmentConfigsIndex(Request $request): JsonResponse
    {
        $query = AssessmentConfiguration::with(['schoolClass:id,name', 'academicSession:id,name', 'subject:id,name,code']);

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->integer('school_class_id'));
        }
        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->integer('academic_session_id'));
        }

        return response()->json($query->get());
    }

    public function assessmentConfigsStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => 'nullable|exists:school_classes,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'term' => 'required|string',
            'ca1_max' => 'required|numeric|min:0',
            'ca2_max' => 'required|numeric|min:0',
            'exam_max' => 'required|numeric|min:0',
            'assignment_max' => 'nullable|numeric|min:0',
            'test_max' => 'nullable|numeric|min:0',
            'project_max' => 'nullable|numeric|min:0',
            'attendance_max' => 'nullable|numeric|min:0',
            'cbt_max' => 'nullable|numeric|min:0',
            'written_max' => 'nullable|numeric|min:0',
            'components' => 'nullable|array|min:1',
            'components.*.key' => 'required_with:components|string|max:50|distinct',
            'components.*.label' => 'required_with:components|string|max:100',
            'components.*.type' => 'required_with:components|in:continuous_assessment,assignment,test,project,attendance,cbt,written,combined',
            'components.*.max_score' => 'required_with:components|numeric|min:0.01',
            'total_max' => 'required|numeric|min:1',
            'exam_method' => 'required|in:written,cbt,combined',
        ]);

        if (!empty($validated['components'])) {
            $configuredTotal = collect($validated['components'])->sum(fn ($component) => (float) $component['max_score']);
        } else {
            $configuredTotal = collect([
                $validated['ca1_max'],
                $validated['ca2_max'],
                $validated['assignment_max'] ?? 0,
                $validated['test_max'] ?? 0,
                $validated['project_max'] ?? 0,
                $validated['attendance_max'] ?? 0,
                ($validated['cbt_max'] ?? 0) + ($validated['written_max'] ?? 0) > 0
                    ? ($validated['cbt_max'] ?? 0) + ($validated['written_max'] ?? 0)
                    : $validated['exam_max'],
            ])->sum();
        }

        if (abs($configuredTotal - (float) $validated['total_max']) > 0.01) {
            throw ValidationException::withMessages([
                'total_max' => "Assessment component maximums total {$configuredTotal}, but total_max is {$validated['total_max']}.",
            ]);
        }

        $config = AssessmentConfiguration::updateOrCreate(
            [
                'school_class_id' => $validated['school_class_id'] ?? null,
                'academic_session_id' => $validated['academic_session_id'] ?? null,
                'subject_id' => $validated['subject_id'] ?? null,
                'term' => $validated['term'],
            ],
            $validated
        );

        return response()->json([
            'message' => 'Assessment configuration saved.',
            'config' => $config->load(['schoolClass:id,name', 'academicSession:id,name', 'subject:id,name']),
        ]);
    }

    private function assertNoOverlappingGradeRange(array $data, ?int $ignoreId = null): void
    {
        $query = GradingScale::query()
            ->where(function ($scope) use ($data): void {
                isset($data['school_class_id']) && $data['school_class_id'] !== null
                    ? $scope->where('school_class_id', $data['school_class_id'])
                    : $scope->whereNull('school_class_id');
            })
            ->where(function ($scope) use ($data): void {
                isset($data['academic_session_id']) && $data['academic_session_id'] !== null
                    ? $scope->where('academic_session_id', $data['academic_session_id'])
                    : $scope->whereNull('academic_session_id');
            })
            ->where('min_score', '<=', (float) $data['max_score'])
            ->where('max_score', '>=', (float) $data['min_score']);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'min_score' => 'This grade range overlaps an existing rule in the same class/session scope.',
            ]);
        }
    }
}
