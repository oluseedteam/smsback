<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ReleaseReportCardJob;
use App\Models\AcademicSession;
use App\Models\AffectiveAssessment;
use App\Models\AuditLog;
use App\Models\CourseRegistration;
use App\Models\EmailEvent;
use App\Models\FeeStructure;
use App\Models\Payment;
use App\Models\PsychomotorAssessment;
use App\Models\ReportCard;
use App\Models\ReportCardAccessToken;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\SubjectResult;
use App\Services\ReportCardCalculationService;
use App\Services\ReportCardEmailService;
use App\Services\ReportCardPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportCardController extends Controller
{
    public function __construct(
        protected ReportCardCalculationService $calculator,
        protected ReportCardEmailService $emailService,
        protected ReportCardPdfService $pdfService
    ) {}

    /**
     * Admin: List report cards with filtering and payment status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ReportCard::with([
            'student:id,full_name,student_id,email,parent_email,parent_name',
            'schoolClass:id,name,grade_level',
            'academicSession:id,name',
            'emailEvents',
        ]);

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->integer('academic_session_id'));
        }

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->integer('school_class_id'));
        }

        if ($request->filled('academic_section_id')) {
            $sectionId = $request->integer('academic_section_id');
            $query->where(function ($sectionQuery) use ($sectionId): void {
                $sectionQuery->where('academic_section_id', $sectionId)
                    ->orWhereHas('schoolClass', fn ($classQuery) => $classQuery->where('academic_section_id', $sectionId));
            });
        }

        if ($request->filled('subject_id')) {
            $subjectId = $request->integer('subject_id');
            $query->whereExists(function ($resultQuery) use ($subjectId): void {
                $resultQuery->selectRaw('1')
                    ->from('subject_results')
                    ->whereColumn('subject_results.student_id', 'report_cards.student_id')
                    ->whereColumn('subject_results.school_class_id', 'report_cards.school_class_id')
                    ->whereColumn('subject_results.academic_session_id', 'report_cards.academic_session_id')
                    ->whereColumn('subject_results.term', 'report_cards.term')
                    ->where('subject_results.subject_id', $subjectId);
            });
        }

        if ($request->filled('teacher_id')) {
            $teacherId = $request->integer('teacher_id');
            $query->whereExists(function ($resultQuery) use ($teacherId): void {
                $resultQuery->selectRaw('1')
                    ->from('subject_results')
                    ->whereColumn('subject_results.student_id', 'report_cards.student_id')
                    ->whereColumn('subject_results.school_class_id', 'report_cards.school_class_id')
                    ->whereColumn('subject_results.academic_session_id', 'report_cards.academic_session_id')
                    ->whereColumn('subject_results.term', 'report_cards.term')
                    ->where('subject_results.teacher_id', $teacherId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $reportCards = $query->latest('updated_at')->paginate(50);

        // Compute payment status for each student
        $reportCards->getCollection()->transform(function ($rc) {
            $paymentInfo = $this->resolveStudentPaymentStatus($rc->student_id, $rc->academic_session_id, $rc->term);
            $rc->payment_status = $paymentInfo['status'];
            $rc->balance_due = $paymentInfo['balance'];

            // Email event status
            $studentEvent = $rc->emailEvents->where('recipient_type', 'student')->sortByDesc('created_at')->first();
            $parentEvent = $rc->emailEvents->where('recipient_type', 'parent')->sortByDesc('created_at')->first();

            $rc->student_email_status = $studentEvent ? $studentEvent->status : ($rc->student?->email ? 'not_sent' : 'not_available');
            $rc->parent_email_status = $parentEvent ? $parentEvent->status : ($rc->student?->parent_email ? 'not_sent' : 'not_available');
            $rc->validation_errors = $this->calculator->validateResultCompleteness($rc);
            $rc->is_complete = $rc->validation_errors === [];

            return $rc;
        });

        // Filter by payment status if requested
        if ($request->filled('payment_status')) {
            $statusFilter = strtoupper($request->input('payment_status'));
            $filtered = $reportCards->getCollection()->filter(fn($rc) => $rc->payment_status === $statusFilter)->values();
            $reportCards->setCollection($filtered);
        }

        return response()->json($reportCards);
    }

    /**
     * Class-teacher queue, scoped to classes explicitly assigned to the teacher.
     */
    public function teacherReviewQueue(Request $request): JsonResponse
    {
        $teacher = $request->user();
        $classIds = SchoolClass::query()
            ->where('teacher_id', $teacher->id)
            ->when($teacher->class_teacher_of, fn ($query, $classId) => $query->orWhere('id', $classId))
            ->pluck('id');

        $reportCards = ReportCard::query()
            ->with([
                'student:id,full_name,student_id',
                'schoolClass:id,name,teacher_id',
                'academicSession:id,name',
            ])
            ->whereIn('school_class_id', $classIds)
            ->when($request->filled('academic_session_id'), fn ($query) => $query->where('academic_session_id', $request->integer('academic_session_id')))
            ->when($request->filled('term'), fn ($query) => $query->where('term', $request->input('term')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')),
                fn ($query) => $query->whereIn('status', ['submitted', 'class_teacher_reviewed', 'returned']))
            ->latest('updated_at')
            ->paginate(50);

        $reportCards->getCollection()->transform(function (ReportCard $reportCard): ReportCard {
            $reportCard->validation_errors = $this->calculator->validateResultCompleteness($reportCard);
            $reportCard->is_complete = $reportCard->validation_errors === [];

            return $reportCard;
        });

        return response()->json($reportCards);
    }

    /**
     * Show full authoritative report card record.
     */
    public function show(int $id): JsonResponse
    {
        $reportCard = ReportCard::with([
            'student',
            'schoolClass',
            'academicSession',
            'destinationClass:id,name',
            'approver:id,name,email',
            'releaser:id,name,email',
            'emailEvents',
        ])->findOrFail($id);

        $payload = $this->buildReportCardPayload($reportCard);

        return response()->json($payload);
    }

    /**
     * Generate or recalculate draft report cards for all students in a class.
     */
    public function generateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term' => 'required|string',
        ]);

        $class = SchoolClass::with('students')->findOrFail($validated['school_class_id']);
        $session = AcademicSession::findOrFail($validated['academic_session_id']);
        $term = $validated['term'];

        $count = 0;
        foreach ($class->students as $student) {
            $this->calculator->generateReportCard($student, $class, $session, $term);
            $count++;
        }

        $this->calculator->updateClassPositions($class->id, $session->id, $term);

        return response()->json([
            'message' => "Successfully generated {$count} report card(s) for {$class->name}.",
            'count' => $count,
        ]);
    }

    /**
     * Optional class-teacher review step before admin approval.
     */
    public function classTeacherReview(Request $request, int $id): JsonResponse
    {
        $reportCard = ReportCard::with('schoolClass')->findOrFail($id);
        $user = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'sub_admin'], true);
        $isClassTeacher = $user->role === 'teacher'
            && ((int) $reportCard->schoolClass?->teacher_id === (int) $user->id
                || (int) ($user->class_teacher_of ?? 0) === (int) $reportCard->school_class_id);

        if (!$isAdmin && !$isClassTeacher) {
            return response()->json(['message' => 'Only the assigned class teacher may review this result.'], 403);
        }
        if ($reportCard->status !== 'submitted') {
            return response()->json(['message' => 'Only teacher-submitted results can be reviewed.'], 422);
        }

        $errors = $this->calculator->validateResultCompleteness($reportCard);
        if ($errors !== []) {
            return response()->json(['message' => 'This result is incomplete.', 'errors' => $errors], 422);
        }

        DB::transaction(function () use ($reportCard): void {
            $reportCard->update(['status' => 'class_teacher_reviewed']);
            $this->subjectResultsFor($reportCard)
                ->where('status', 'submitted')
                ->update(['status' => 'class_teacher_reviewed']);
        });

        AuditLog::record('RESULT_CLASS_TEACHER_REVIEWED', $reportCard->student_id, $reportCard->academic_session_id, $reportCard->term, [
            'report_card_id' => $reportCard->id,
            'reviewed_by' => $user->name ?? $user->full_name,
        ]);

        return response()->json(['message' => 'Result reviewed by class teacher.', 'report_card' => $reportCard->fresh()]);
    }

    /**
     * Admin: Approve a report card.
     */
    public function approve(Request $request, ?int $id = null): JsonResponse
    {
        $id ??= $request->integer('report_card_id') ?: null;
        if (!$id) {
            return response()->json(['message' => 'report_card_id is required.'], 422);
        }
        $reportCard = ReportCard::findOrFail($id);
        $user = $request->user();

        if ($reportCard->status === 'released') {
            return response()->json(['message' => 'Released report cards are locked and cannot be re-approved.'], 422);
        }

        $settings = SchoolSetting::getSettings();
        if ($settings->require_class_teacher_review && $reportCard->status !== 'class_teacher_reviewed') {
            return response()->json(['message' => 'Class-teacher review is required before admin approval.'], 422);
        }

        $reportCard = $this->calculator->generateReportCard(
            $reportCard->student,
            $reportCard->schoolClass,
            $reportCard->academicSession,
            $reportCard->term
        );
        $completenessErrors = $this->calculator->validateResultCompleteness($reportCard);
        if ($completenessErrors !== []) {
            return response()->json([
                'message' => 'This result is incomplete and cannot be approved.',
                'errors' => $completenessErrors,
            ], 422);
        }

        DB::transaction(function () use ($reportCard, $user): void {
            $reportCard->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'withheld_reason' => null,
            ]);

            SubjectResult::where('student_id', $reportCard->student_id)
                ->where('school_class_id', $reportCard->school_class_id)
                ->where('academic_session_id', $reportCard->academic_session_id)
                ->where('term', $reportCard->term)
                ->whereIn('status', ['submitted', 'class_teacher_reviewed'])
                ->update(['status' => 'approved', 'locked_at' => now()]);
        });

        AuditLog::record(
            'RESULT_APPROVED',
            $reportCard->student_id,
            $reportCard->academic_session_id,
            $reportCard->term,
            ['report_card_id' => $reportCard->id, 'approved_by' => $user->name ?? $user->full_name]
        );

        return response()->json([
            'message' => 'Report card approved successfully.',
            'report_card' => $reportCard->fresh(),
        ]);
    }

    /**
     * Admin: Release a single report card.
     */
    public function release(Request $request, ?int $id = null): JsonResponse
    {
        $id ??= $request->integer('report_card_id') ?: null;
        if (!$id) {
            return response()->json(['message' => 'report_card_id is required.'], 422);
        }
        $reportCard = ReportCard::with(['student', 'schoolClass.academicSection', 'academicSession'])->findOrFail($id);
        $user = $request->user();
        $settings = SchoolSetting::getSettings();

        if ($reportCard->status === 'released') {
            return response()->json([
                'message' => 'Report card was already released; no duplicate email was queued.',
                'report_card' => $reportCard,
                'email_delivery' => ['student' => ['status' => 'already_released'], 'parent' => ['status' => 'already_released']],
            ]);
        }

        if ($reportCard->status !== 'approved') {
            return response()->json([
                'message' => 'Report card must be approved before it can be released.',
            ], 422);
        }

        // 2. Check payment condition if enabled
        if ($settings->require_fee_payment_for_release) {
            $paymentInfo = $this->resolveStudentPaymentStatus($reportCard->student_id, $reportCard->academic_session_id, $reportCard->term, $reportCard->school_class_id);
            $minPercentage = $settings->minimum_result_payment_percentage ?? 100;
            $allowedStatuses = $settings->allowed_payment_statuses_for_release ?: ['PAID'];

            $meetsPercentage = $paymentInfo['percentage_paid'] >= $minPercentage;
            $meetsStatus = in_array($paymentInfo['status'], $allowedStatuses);

            if (!$meetsPercentage && !$meetsStatus) {
                return response()->json([
                    'message' => "Cannot release report card: School fee status is {$paymentInfo['status']} ({$paymentInfo['percentage_paid']}% paid). School policy requires confirmed payment (minimum {$minPercentage}%).",
                    'payment_status' => $paymentInfo['status'],
                    'percentage_paid' => $paymentInfo['percentage_paid'],
                    'balance_due' => $paymentInfo['balance'],
                ], 403);
            }
        }

        $completenessErrors = $this->calculator->validateResultCompleteness($reportCard);
        if ($completenessErrors !== []) {
            return response()->json([
                'message' => 'This result is incomplete and cannot be released.',
                'errors' => $completenessErrors,
            ], 422);
        }

        DB::transaction(function () use (&$reportCard, $user): void {
            $reportCard = ReportCard::whereKey($reportCard->id)->lockForUpdate()->firstOrFail();
            if ($reportCard->status !== 'approved') {
                return;
            }

            $payload = $this->buildReportCardPayload($reportCard->load(['student', 'schoolClass.academicSection', 'academicSession']));
            $this->pdfService->store($reportCard, $payload);
            $reportCard->update([
                'status' => 'released',
                'released_by' => $user->id,
                'released_at' => now(),
                'withheld_reason' => null,
            ]);

            StudentNotification::firstOrCreate(
                [
                    'user_id' => $reportCard->student_id,
                    'user_type' => 'student',
                    'type' => 'report_card_released',
                    'link' => "/student/report-card?id={$reportCard->id}",
                ],
                [
                    'title' => $this->isThirdTerm($reportCard->term) ? 'Annual Report Card Released' : 'Report Card Released',
                    'message' => $this->isThirdTerm($reportCard->term)
                        ? "Your {$reportCard->academicSession?->name} Annual Report Card has been released."
                        : "Your {$reportCard->term} {$reportCard->academicSession?->name} report card has been released.",
                ]
            );

            AuditLog::record(
                'REPORT_CARD_RELEASED',
                $reportCard->student_id,
                $reportCard->academic_session_id,
                $reportCard->term,
                ['report_card_id' => $reportCard->id, 'released_by' => $user->name ?? $user->full_name]
            );
        });

        $reportCard->refresh()->load(['student', 'schoolClass', 'academicSession']);
        if ($reportCard->status !== 'released') {
            return response()->json([
                'message' => 'Report card state changed before release could be completed.',
            ], 409);
        }

        $emailDelivery = $settings->automatic_report_card_email
            ? $this->emailService->sendReleaseEmails($reportCard)
            : ['student' => ['status' => 'disabled'], 'parent' => ['status' => 'disabled']];

        return response()->json([
            'message' => 'Report card released successfully.',
            'report_card' => $reportCard->fresh(),
            'email_delivery' => $emailDelivery,
        ]);
    }

    /**
     * Admin: Batch release all approved report cards in a class/session/term.
     */
    public function releaseBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term' => 'required|string',
            'report_card_ids' => 'nullable|array',
            'report_card_ids.*' => 'integer|exists:report_cards,id',
        ]);

        $reportCards = ReportCard::where('school_class_id', $validated['school_class_id'])
            ->where('academic_session_id', $validated['academic_session_id'])
            ->where('term', $validated['term'])
            ->where('status', 'approved')
            ->when($validated['report_card_ids'] ?? null, fn ($query, $ids) => $query->whereIn('id', $ids))
            ->get();

        $actorId = (int) $request->user()->id;
        foreach ($reportCards as $reportCard) {
            ReleaseReportCardJob::dispatch($reportCard->id, $actorId);
        }

        AuditLog::record('REPORT_CARD_BATCH_RELEASE_QUEUED', null, $validated['academic_session_id'], $validated['term'], [
            'school_class_id' => $validated['school_class_id'],
            'report_card_ids' => $reportCards->pluck('id')->all(),
            'queued_by' => $request->user()->name ?? $request->user()->full_name,
        ]);

        return response()->json([
            'message' => "Queued {$reportCards->count()} report card(s) for release.",
            'queued_count' => $reportCards->count(),
            'report_card_ids' => $reportCards->pluck('id')->all(),
        ], 202);
    }

    /**
     * Admin: Withhold a report card with a reason.
     */
    public function withhold(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $reportCard = ReportCard::findOrFail($id);
        $user = $request->user();

        $reportCard->update([
            'status' => 'withheld',
            'withheld_reason' => $validated['reason'],
        ]);

        AuditLog::record(
            'REPORT_CARD_WITHHELD',
            $reportCard->student_id,
            $reportCard->academic_session_id,
            $reportCard->term,
            ['reason' => $validated['reason'], 'withheld_by' => $user->name ?? $user->full_name]
        );

        return response()->json([
            'message' => 'Report card withheld.',
            'report_card' => $reportCard->fresh(),
        ]);
    }

    public function returnToTeacher(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['reason' => 'required|string|max:500']);
        $reportCard = ReportCard::findOrFail($id);
        if ($reportCard->status === 'released') {
            return response()->json(['message' => 'Revoke a released report before returning it for correction.'], 422);
        }
        $previousStatus = $reportCard->status;

        DB::transaction(function () use ($reportCard, $validated): void {
            $reportCard->update(['status' => 'returned', 'withheld_reason' => $validated['reason']]);
            $this->subjectResultsFor($reportCard)->update(['status' => 'returned', 'locked_at' => null]);
        });
        $this->auditTransition($request, $reportCard, 'RESULT_RETURNED_TO_TEACHER', $validated['reason'], $previousStatus);

        return response()->json(['message' => 'Result returned to the teacher for correction.', 'report_card' => $reportCard->fresh()]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['reason' => 'required|string|max:500']);
        $reportCard = ReportCard::findOrFail($id);
        if ($reportCard->status === 'released') {
            return response()->json(['message' => 'Revoke a released report before rejecting it.'], 422);
        }
        $previousStatus = $reportCard->status;

        DB::transaction(function () use ($reportCard, $validated): void {
            $reportCard->update(['status' => 'rejected', 'withheld_reason' => $validated['reason']]);
            $this->subjectResultsFor($reportCard)->update(['status' => 'rejected', 'locked_at' => null]);
        });
        $this->auditTransition($request, $reportCard, 'RESULT_REJECTED', $validated['reason'], $previousStatus);

        return response()->json(['message' => 'Result rejected.', 'report_card' => $reportCard->fresh()]);
    }

    public function lock(Request $request, int $id): JsonResponse
    {
        $reportCard = ReportCard::findOrFail($id);
        if ($reportCard->status === 'released') {
            return response()->json(['message' => 'Released results are already immutable.'], 422);
        }
        $previousStatus = $reportCard->status;

        DB::transaction(function () use ($reportCard): void {
            $reportCard->update(['status' => 'locked']);
            $this->subjectResultsFor($reportCard)->update(['status' => 'locked', 'locked_at' => now()]);
        });
        $this->auditTransition($request, $reportCard, 'RESULT_LOCKED', null, $previousStatus);

        return response()->json(['message' => 'Result locked.', 'report_card' => $reportCard->fresh()]);
    }

    public function reopen(Request $request, int $id): JsonResponse
    {
        $reportCard = ReportCard::findOrFail($id);
        if ($reportCard->status === 'released') {
            return response()->json(['message' => 'Revoke a released result before reopening it.'], 422);
        }
        $previousStatus = $reportCard->status;

        DB::transaction(function () use ($reportCard): void {
            $reportCard->update([
                'status' => 'draft',
                'approved_by' => null,
                'approved_at' => null,
                'withheld_reason' => null,
            ]);
            $this->subjectResultsFor($reportCard)->update(['status' => 'draft', 'locked_at' => null]);
        });
        $this->auditTransition($request, $reportCard, 'RESULT_REOPENED', null, $previousStatus);

        return response()->json(['message' => 'Result reopened for editing.', 'report_card' => $reportCard->fresh()]);
    }

    public function revoke(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['reason' => 'required|string|max:500']);
        $reportCard = ReportCard::findOrFail($id);
        if ($reportCard->status !== 'released') {
            return response()->json(['message' => 'Only released results can be revoked.'], 422);
        }
        $previousStatus = $reportCard->status;

        DB::transaction(function () use ($reportCard, $validated): void {
            $reportCard->update(['status' => 'revoked', 'withheld_reason' => $validated['reason']]);
            $reportCard->accessTokens()->update(['is_revoked' => true]);
        });
        $this->auditTransition($request, $reportCard, 'RESULT_RELEASE_REVOKED', $validated['reason'], $previousStatus);

        return response()->json(['message' => 'Released result revoked.', 'report_card' => $reportCard->fresh()]);
    }

    /**
     * Admin: Resend email to student and/or parent.
     */
    public function resendEmail(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'recipient_type' => 'required|in:student,parent,both',
        ]);

        $reportCard = ReportCard::with(['student', 'schoolClass', 'academicSession'])->findOrFail($id);
        if ($reportCard->status !== 'released') {
            return response()->json(['message' => 'Only released report cards can be emailed.'], 422);
        }
        $student = $reportCard->student;
        $results = [];

        if (in_array($validated['recipient_type'], ['student', 'both'])) {
            $results['student'] = $this->emailService->sendToRecipient($reportCard, 'student', (string) $student->email, true);
        }

        if (in_array($validated['recipient_type'], ['parent', 'both'])) {
            $results['parent'] = $this->emailService->sendToRecipient($reportCard, 'parent', (string) $student->parent_email, true);
        }

        AuditLog::record(
            'REPORT_CARD_EMAIL_RESENT',
            $reportCard->student_id,
            $reportCard->academic_session_id,
            $reportCard->term,
            ['recipient_type' => $validated['recipient_type'], 'results' => $results]
        );

        return response()->json([
            'message' => 'Email dispatch attempted.',
            'delivery' => $results,
        ]);
    }

    /**
     * Admin: Preview email HTML without sending.
     */
    public function previewEmail(Request $request, int $id): JsonResponse
    {
        $recipientType = $request->input('recipient_type', 'student');
        $reportCard = ReportCard::findOrFail($id);

        $preview = $this->emailService->previewEmail($reportCard, $recipientType);

        return response()->json($preview);
    }

    /**
     * Student Portal: Fetch student's own released report cards with filters.
     */
    public function studentReportCards(Request $request): JsonResponse
    {
        $student = $request->user();

        $query = ReportCard::where('student_id', $student->id)
            ->where('status', 'released')
            ->with(['schoolClass:id,name,grade_level,academic_section_id', 'academicSession:id,name']);

        if ($request->filled('academic_session_id') || $request->filled('sessionId')) {
            $query->where('academic_session_id', $request->integer('academic_session_id') ?: $request->integer('sessionId'));
        }

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        if ($request->filled('school_class_id') || $request->filled('classId')) {
            $query->where('school_class_id', $request->integer('school_class_id') ?: $request->integer('classId'));
        }

        if ($request->filled('academic_section_id') || $request->filled('academicSectionId')) {
            $query->where('academic_section_id', $request->integer('academic_section_id') ?: $request->integer('academicSectionId'));
        }

        $reportCards = $query->latest('released_at')->get();

        return response()->json($reportCards);
    }

    /**
     * Student Portal: Get full history of released report cards categorized by session.
     */
    public function studentReportCardHistory(Request $request): JsonResponse
    {
        $student = $request->user();

        $query = ReportCard::where('student_id', $student->id)
            ->where('status', 'released')
            ->with(['schoolClass:id,name,grade_level,academic_section_id', 'schoolClass.academicSection:id,name', 'academicSession:id,name']);

        if ($request->filled('academic_session_id') || $request->filled('sessionId')) {
            $query->where('academic_session_id', $request->integer('academic_session_id') ?: $request->integer('sessionId'));
        }
        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }
        if ($request->filled('school_class_id') || $request->filled('classId')) {
            $query->where('school_class_id', $request->integer('school_class_id') ?: $request->integer('classId'));
        }
        if ($request->filled('academic_section_id') || $request->filled('academicSectionId')) {
            $query->where('academic_section_id', $request->integer('academic_section_id') ?: $request->integer('academicSectionId'));
        }

        $reportCards = $query
            ->orderBy('academic_session_id', 'desc')
            ->orderBy('term')
            ->get();

        // Group by session
        $sessions = AcademicSession::whereIn('id', $reportCards->pluck('academic_session_id')->unique())
            ->orderBy('name', 'desc')
            ->get();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'student_id' => $student->student_id,
            ],
            'sessions' => $sessions,
            'report_cards' => $reportCards,
            'total_released' => $reportCards->count(),
        ]);
    }

    /**
     * Student Portal: View single released report card by ID.
     */
    public function showStudentReportCard(Request $request, int $id): JsonResponse
    {
        $student = $request->user();

        $reportCard = ReportCard::where('id', $id)
            ->where('student_id', $student->id)
            ->with(['student', 'schoolClass', 'academicSession'])
            ->first();

        if (!$reportCard) {
            return response()->json(['message' => 'Report card not found or access unauthorized.'], 404);
        }

        if ($reportCard->status !== 'released') {
            return response()->json([
                'message' => 'This report card is not released yet.',
                'status' => $reportCard->status,
            ], 403);
        }

        $payload = $this->buildReportCardPayload($reportCard);

        return response()->json($payload);
    }

    /**
     * Student Portal: View single released report card.
     */
    public function studentViewReportCard(Request $request): JsonResponse
    {
        $student = $request->user();
        $sessionId = $request->input('academic_session_id') ?? $request->input('sessionId');
        $term = $request->input('term');

        $query = ReportCard::where('student_id', $student->id)
            ->with(['student', 'schoolClass', 'academicSession']);

        if ($sessionId) {
            $query->where('academic_session_id', $sessionId);
        }
        if ($term) {
            $query->where('term', $term);
        }

        $reportCard = $query->latest('released_at')->first();

        if (!$reportCard) {
            return response()->json(['message' => 'No report card found for the selected session and term.'], 404);
        }

        if ($reportCard->status !== 'released') {
            return response()->json([
                'message' => 'Your report card has not been released yet by the school administration.',
                'status' => $reportCard->status,
            ], 403);
        }

        $payload = $this->buildReportCardPayload($reportCard);

        return response()->json($payload);
    }

    /**
     * Download or stream printable PDF / HTML document for a report card.
     */
    public function downloadPdf(Request $request, int $id)
    {
        $user = $request->user();
        $reportCard = ReportCard::with(['student', 'schoolClass', 'academicSession'])->findOrFail($id);

        // Security check: if student, must be own released report card
        if ($user && $user->role === 'student') {
            if ($reportCard->student_id !== $user->id || $reportCard->status !== 'released') {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } elseif ($user && $user->role === 'teacher') {
            $authorized = $reportCard->schoolClass?->teacher_id === $user->id
                || DB::table('class_subject')
                    ->where('school_class_id', $reportCard->school_class_id)
                    ->where('teacher_id', $user->id)
                    ->exists();
            if (!$authorized) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $payload = $this->buildReportCardPayload($reportCard);
        $filename = $this->pdfService->filename($reportCard);
        $pdf = $this->pdfService->contents($reportCard, $payload);

        return response($pdf, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->header('Cache-Control', 'private, no-store, max-age=0');
    }

    /**
     * Admin: Report card email logs index with filtering.
     */
    public function emailLogsIndex(Request $request): JsonResponse
    {
        $query = EmailEvent::with(['student:id,full_name,student_id,email,parent_email', 'reportCard:id,term,academic_session_id', 'academicSession:id,name'])
            ->latest();

        if ($request->filled('academic_session_id')) {
            $query->where('session_id', $request->integer('academic_session_id'));
        }
        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }
        if ($request->filled('recipient_type')) {
            $query->where('recipient_type', $request->input('recipient_type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Admin: Retry a specific failed email delivery log.
     */
    public function retryEmailLog(Request $request, int $id): JsonResponse
    {
        $event = EmailEvent::findOrFail($id);
        $reportCard = ReportCard::with(['student', 'schoolClass', 'academicSession'])->findOrFail($event->report_card_id);

        $res = $this->emailService->retryEvent($event);

        return response()->json([
            'message' => 'Retry attempted.',
            'result' => $res,
        ]);
    }

    /**
     * Public / Parent: View report card via secure signed access token.
     */
    public function verifyPublicToken(string $token): JsonResponse
    {
        $tokenRecord = ReportCardAccessToken::verifyToken($token);

        if (!$tokenRecord || !$tokenRecord->reportCard) {
            return response()->json([
                'message' => 'This report card access link is invalid, expired, or has been revoked.',
            ], 401);
        }

        $reportCard = $tokenRecord->reportCard;
        if ($reportCard->status !== 'released') {
            return response()->json([
                'message' => 'This report card is currently not in released status.',
            ], 403);
        }

        $payload = $this->buildReportCardPayload($reportCard);
        $payload['access_token'] = [
            'recipient_type' => $tokenRecord->recipient_type,
            'expires_at' => $tokenRecord->expires_at,
        ];

        return response()->json($payload);
    }

    /**
     * Helper to assemble complete authoritative report card JSON.
     */
    private function buildReportCardPayload(ReportCard $reportCard): array
    {
        $reportCard->loadMissing(['student', 'schoolClass.academicSection', 'academicSession']);
        $settings = SchoolSetting::getSettings();
        $student = $reportCard->student;
        $class = $reportCard->schoolClass;
        $session = $reportCard->academicSession;

        $isThirdTerm = in_array(strtolower(str_replace(' ', '', $reportCard->term)), ['3rdterm', 'thirdterm', 'third_term']);

        if (is_array($reportCard->subject_results_snapshot) && $reportCard->subject_results_snapshot !== []) {
            $subjectResults = $reportCard->subject_results_snapshot;
        } elseif ($isThirdTerm) {
            // Retrieve full multi-term cumulative subject results breakdown
            $subjectResults = $this->calculator->getThirdTermCumulativeSubjectBreakdown($student, $class, $session);
        } else {
            // 1. Registered Subjects results only for 1st or 2nd Term
            $registeredSubjectIds = CourseRegistration::where('student_id', $student->id)
                ->where('school_class_id', $class->id)
                ->where('academic_session_id', $session->id)
                ->where('term', $reportCard->term)
                ->pluck('subject_id');

            $subjectResults = SubjectResult::where('student_id', $student->id)
                ->where('academic_session_id', $session->id)
                ->where('term', $reportCard->term)
                ->whereIn('subject_id', $registeredSubjectIds)
                ->with(['subject', 'cbtSubmission'])
                ->get()
                ->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'subject_id' => $r->subject_id,
                        'subject_name' => $r->subject?->name ?? 'Subject',
                        'subject_code' => $r->subject?->code ?? '',
                        'ca1_score' => $r->ca1_score !== null ? (float) $r->ca1_score : null,
                        'ca2_score' => $r->ca2_score !== null ? (float) $r->ca2_score : null,
                        'assessment_scores' => $r->assessment_scores ?: [],
                        'exam_score' => $r->exam_score !== null ? (float) $r->exam_score : null,
                        'exam_method' => $r->exam_method,
                        'is_cbt' => $r->exam_method === 'cbt',
                        'cbt_pending' => $r->exam_method === 'cbt' && $r->exam_score === null,
                        'total_score' => (float) $r->total_score,
                        'percentage' => (float) $r->percentage,
                        'grade' => $r->grade,
                        'remark' => $r->remark,
                    ];
                })
                ->toArray();
        }

        // 2. Class & Session Grading Scale
        $gradingScales = $reportCard->grading_configuration_snapshot
            ?: $this->calculator->getGradingScaleForClassAndSession($class->id, $session->id)->values()->toArray();

        // 3. Affective Domain Assessment
        $affective = AffectiveAssessment::where('student_id', $student->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $reportCard->term)
            ->first();

        // 4. Psychomotor Domain Assessment
        $psychomotor = PsychomotorAssessment::where('student_id', $student->id)
            ->where('academic_session_id', $session->id)
            ->where('term', $reportCard->term)
            ->first();

        $schoolSnapshot = $reportCard->school_snapshot ?: [
            'name' => $settings->school_name,
            'motto' => $settings->motto,
            'address' => $settings->address,
            'phone' => $settings->phone,
            'email' => $settings->email,
            'website' => $settings->website,
            'logo_url' => $settings->logo_url,
            'principal_name' => $settings->principal_name,
            'principal_signature_url' => $settings->principal_signature_url,
            'school_stamp_url' => $settings->school_stamp_url,
            'report_card_theme' => $settings->report_card_theme,
            'show_student_photo' => $settings->show_student_photo,
            'show_grade_point' => $settings->show_grade_point,
            'show_attendance' => $settings->show_attendance,
            'show_teacher_signature' => $settings->show_teacher_signature,
            'show_principal_signature' => $settings->show_principal_signature,
            'show_school_stamp' => $settings->show_school_stamp,
            'show_watermark' => $settings->show_watermark,
            'show_promotion' => $settings->show_promotion,
            'show_annual_summary' => $settings->show_annual_summary,
            'show_position' => $settings->show_position,
            'report_card_footer_text' => $settings->report_card_footer_text,
        ];
        $studentSnapshot = $reportCard->student_snapshot ?: [
            'id' => $student->id,
            'full_name' => $student->full_name,
            'student_id' => $student->student_id,
            'admission_number' => $student->student_id,
            'gender' => $student->gender,
            'profile_picture' => $student->profile_picture,
            'department' => $student->department,
            'parent_name' => $student->parent_name,
            'parent_phone' => $student->parent_phone,
            'parent_email' => $student->parent_email,
        ];
        $assessmentConfigurations = $reportCard->assessment_configuration_snapshot ?: [];
        $assessmentComponents = collect($assessmentConfigurations)
            ->flatMap(fn ($configuration) => $configuration['components'] ?? [])
            ->unique('key')
            ->values()
            ->all();
        if (!$isThirdTerm && $assessmentComponents === []) {
            $assessmentComponents = collect($subjectResults)
                ->flatMap(function (array $result): array {
                    $scores = $result['assessment_scores'] ?? [];
                    if ($scores !== []) {
                        return collect($scores)->keys()->map(fn (string $key) => [
                            'key' => $key,
                            'label' => str($key)->replace('_', ' ')->title()->toString(),
                            'max_score' => null,
                        ])->all();
                    }

                    return [
                        ['key' => 'ca1', 'label' => 'CA 1', 'max_score' => null],
                        ['key' => 'ca2', 'label' => 'CA 2', 'max_score' => null],
                        ['key' => 'written_exam', 'label' => 'Written Exam', 'max_score' => null],
                    ];
                })
                ->unique('key')
                ->values()
                ->all();
        }

        return [
            'id' => $reportCard->id,
            'is_third_term' => $isThirdTerm,
            'school' => $schoolSnapshot,
            'template' => [
                'theme' => $schoolSnapshot['report_card_theme'] ?? 'classic',
                'show_student_photo' => (bool) ($schoolSnapshot['show_student_photo'] ?? true),
                'show_grade_point' => (bool) ($schoolSnapshot['show_grade_point'] ?? false),
                'show_attendance' => (bool) ($schoolSnapshot['show_attendance'] ?? true),
                'show_teacher_signature' => (bool) ($schoolSnapshot['show_teacher_signature'] ?? true),
                'show_principal_signature' => (bool) ($schoolSnapshot['show_principal_signature'] ?? true),
                'show_school_stamp' => (bool) ($schoolSnapshot['show_school_stamp'] ?? true),
                'show_watermark' => (bool) ($schoolSnapshot['show_watermark'] ?? false),
                'show_promotion' => (bool) ($schoolSnapshot['show_promotion'] ?? true),
                'show_annual_summary' => (bool) ($schoolSnapshot['show_annual_summary'] ?? true),
                'show_position' => (bool) ($schoolSnapshot['show_position'] ?? true),
            ],
            'student' => $studentSnapshot,
            'academic' => [
                'class_id' => $class->id,
                'class_name' => $reportCard->class_name ?: $class->name,
                'class_arm' => $reportCard->class_arm,
                'academic_section_id' => $reportCard->academic_section_id ?: $class->academic_section_id,
                'academic_section_name' => $reportCard->academic_section_name ?: $class->academicSection?->name,
                'grade_level' => $class->grade_level,
                'session_id' => $session->id,
                'session_name' => $session->name,
                'term' => $reportCard->term,
            ],
            'summary' => [
                'total_score' => (float) $reportCard->total_score,
                'total_obtainable' => (float) $reportCard->total_obtainable,
                'average_score' => (float) $reportCard->average_score,
                'total_subjects' => $reportCard->total_subjects,
                'position' => $reportCard->position,
                'total_students_in_class' => $reportCard->total_students_in_class,
                'overall_grade' => $reportCard->overall_grade,
                'attendance_present' => $reportCard->attendance_present,
                'attendance_total' => $reportCard->attendance_total,
            ],
            'cumulative' => $isThirdTerm ? [
                'term1_average' => $reportCard->term1_average !== null ? (float) $reportCard->term1_average : null,
                'term2_average' => $reportCard->term2_average !== null ? (float) $reportCard->term2_average : null,
                'term3_average' => $reportCard->term3_average !== null ? (float) $reportCard->term3_average : null,
                'cumulative_average' => $reportCard->cumulative_average !== null ? (float) $reportCard->cumulative_average : null,
                'promotion_status' => $reportCard->promotion_status,
                'destination_class' => $reportCard->destination_class_name,
            ] : null,
            'results' => $subjectResults,
            'assessment_components' => $assessmentComponents,
            'grading_scale' => $gradingScales,
            'affective' => [
                'traits' => $settings->affective_traits ?: ['Punctuality', 'Neatness', 'Honesty', 'Cooperation', 'Responsibility', 'Attitude'],
                'ratings' => $reportCard->affective_snapshot ?: ($affective?->ratings ?: []),
            ],
            'psychomotor' => [
                'traits' => $settings->psychomotor_traits ?: ['Handwriting', 'Drawing', 'Sports', 'Practical Skills', 'Coordination'],
                'ratings' => $reportCard->psychomotor_snapshot ?: ($psychomotor?->ratings ?: []),
            ],
            'comments' => [
                'class_teacher_comment' => $reportCard->class_teacher_comment,
                'principal_comment' => $reportCard->principal_comment,
            ],
            'status' => $reportCard->status,
            'released_at' => $reportCard->released_at,
            'approved_at' => $reportCard->approved_at,
        ];
    }

    /**
     * Generate standalone, beautifully styled printable A4 HTML view.
     */
    private function generatePrintableHtml(array $card, string $title): string
    {
        $school = $card['school'];
        $student = $card['student'];
        $academic = $card['academic'];
        $summary = $card['summary'];
        $cumulative = $card['cumulative'];
        $results = $card['results'];
        $isThirdTerm = $card['is_third_term'] ?? false;
        $comments = $card['comments'];

        $rowsHtml = '';
        if ($isThirdTerm) {
            foreach ($results as $r) {
                $t1 = $r['term1_score'] !== null ? $r['term1_score'] : '-';
                $t2 = $r['term2_score'] !== null ? $r['term2_score'] : '-';
                $t3 = $r['term3_score'] !== null ? $r['term3_score'] : '-';
                $avg = $r['annual_average'] !== null ? $r['annual_average'] : '-';
                $grade = $r['annual_grade'] ?? '-';
                $remark = $r['annual_remark'] ?? '-';

                $rowsHtml .= "
                <tr>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;'>{$r['subject_name']}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$t1}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$t2}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$t3}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #047857;'>{$avg}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;'>{$grade}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$remark}</td>
                </tr>";
            }
        } else {
            foreach ($results as $r) {
                $ca1 = $r['ca1_score'] !== null ? $r['ca1_score'] : '-';
                $ca2 = $r['ca2_score'] !== null ? $r['ca2_score'] : '-';
                $exam = $r['exam_score'] !== null ? $r['exam_score'] : ($r['cbt_pending'] ? 'CBT Pending' : '-');
                $total = $r['total_score'];
                $grade = $r['grade'] ?? '-';
                $remark = $r['remark'] ?? '-';

                $rowsHtml .= "
                <tr>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;'>{$r['subject_name']}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$ca1}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$ca2}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$exam}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800;'>{$total}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;'>{$grade}</td>
                    <td style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>{$remark}</td>
                </tr>";
            }
        }

        $tableHeaders = $isThirdTerm
            ? "<th style='padding: 8px; border: 1px solid #1e3a8a;'>Subject</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>1st Term</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>2nd Term</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>3rd Term</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 85px;'>Annual Avg</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 60px;'>Grade</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 110px;'>Remark</th>"
            : "<th style='padding: 8px; border: 1px solid #1e3a8a;'>Subject</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>1st CA</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>2nd CA</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>Exam</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 70px;'>Total</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 60px;'>Grade</th>
               <th style='padding: 8px; border: 1px solid #1e3a8a; width: 110px;'>Remark</th>";

        $annualBoxHtml = ($isThirdTerm && $cumulative) ? "
        <div style='margin-bottom: 20px; padding: 14px; background-color: #fffbeb; border: 2px solid #fde68a; border-radius: 10px;'>
            <div style='font-size: 11px; font-weight: 800; text-transform: uppercase; color: #92400e; margin-bottom: 8px;'>🏆 Annual Performance & Promotion Status</div>
            <table style='width: 100%; border-collapse: collapse; font-size: 12px;'>
                <tr>
                    <td style='padding: 4px;'><strong>1st Term Avg:</strong> " . ($cumulative['term1_average'] !== null ? $cumulative['term1_average'].'%' : 'N/A') . "</td>
                    <td style='padding: 4px;'><strong>2nd Term Avg:</strong> " . ($cumulative['term2_average'] !== null ? $cumulative['term2_average'].'%' : 'N/A') . "</td>
                    <td style='padding: 4px;'><strong>3rd Term Avg:</strong> " . ($cumulative['term3_average'] !== null ? $cumulative['term3_average'].'%' : 'N/A') . "</td>
                    <td style='padding: 4px;'><strong>Annual Average:</strong> <span style='font-weight: 900; color: #047857;'>" . ($cumulative['cumulative_average'] !== null ? $cumulative['cumulative_average'].'%' : 'N/A') . "</span></td>
                </tr>
                <tr>
                    <td colspan='2' style='padding: 4px;'><strong>Promotion Status:</strong> <span style='font-weight: 900; color: #b45309;'>" . ($cumulative['promotion_status'] ?: 'Pending Decision') . "</span></td>
                    <td colspan='2' style='padding: 4px;'><strong>Next Class:</strong> " . ($cumulative['destination_class'] ?: 'N/A') . "</td>
                </tr>
            </table>
        </div>" : "";

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{$title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
        .page { max-width: 800px; margin: 0 auto; }
        .header-table td { vertical-align: middle; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
            @page { size: A4 portrait; margin: 10mm; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
    </div>
    <div class="page">
        <!-- School Header -->
        <table class="header-table" style="margin-bottom: 16px; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px;">
            <tr>
                <td style="width: 80px;">
                    <div style="font-size: 32px; text-align: center;">🎓</div>
                </td>
                <td>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #1e3a8a;">{$school['name']}</h1>
                    <div style="font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 1px;">{$school['motto']}</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">{$school['address']} | Phone: {$school['phone']} | Email: {$school['email']}</div>
                </td>
                <td style="text-align: right; width: 180px;">
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px;">
                        <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">Official Report Card</div>
                        <div style="font-size: 13px; font-weight: 900; color: #0f172a;">{$academic['term']}</div>
                        <div style="font-size: 11px; color: #64748b;">{$academic['session_name']} Session</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Student Info -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 16px; font-size: 12px;">
            <table style="width: 100%;">
                <tr>
                    <td><strong>Student Name:</strong> {$student['full_name']}</td>
                    <td><strong>Student ID:</strong> {$student['student_id']}</td>
                    <td><strong>Class:</strong> {$academic['class_name']}</td>
                    <td><strong>Gender:</strong> {$student['gender']}</td>
                </tr>
            </table>
        </div>

        <!-- Academic Table -->
        <table style="margin-bottom: 16px;">
            <thead>
                <tr style="background: #1e3a8a; color: #ffffff; text-align: center;">
                    {$tableHeaders}
                </tr>
            </thead>
            <tbody>
                {$rowsHtml}
            </tbody>
        </table>

        <!-- Summary Boxes -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; text-align: center;">
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9px; font-weight: bold; color: #065f46; text-transform: uppercase;">Total Score</div>
                <div style="font-size: 16px; font-weight: 900; color: #047857; margin-top: 2px;">{$summary['total_score']}</div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9px; font-weight: bold; color: #065f46; text-transform: uppercase;">Average</div>
                <div style="font-size: 16px; font-weight: 900; color: #047857; margin-top: 2px;">{$summary['average_score']}%</div>
            </div>
            <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9px; font-weight: bold; color: #854d0e; text-transform: uppercase;">Grade</div>
                <div style="font-size: 16px; font-weight: 900; color: #ca8a04; margin-top: 2px;">{$summary['overall_grade']}</div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px;">
                <div style="font-size: 9px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Position</div>
                <div style="font-size: 16px; font-weight: 900; color: #2563eb; margin-top: 2px;">{$summary['position']} / {$summary['total_students_in_class']}</div>
            </div>
        </div>

        {$annualBoxHtml}

        <!-- Comments & Signatures -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 20px; font-size: 12px;">
            <div style="margin-bottom: 8px;"><strong>Class Teacher's Remark:</strong> <em>"{$comments['class_teacher_comment']}"</em></div>
            <div style="margin-bottom: 16px;"><strong>Principal's Remark:</strong> <em>"{$comments['principal_comment']}"</em></div>
            <table style="width: 100%; margin-top: 24px; text-align: center;">
                <tr>
                    <td style="width: 50%; border-top: 1px solid #94a3b8; padding-top: 4px;">Class Teacher Signature</td>
                    <td style="width: 50%; border-top: 1px solid #94a3b8; padding-top: 4px;">{$school['principal_name']}<br><span style="font-size: 10px; color: #64748b;">Principal's Stamp & Signature</span></td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            Official {$school['name']} Academic Record
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Compute actual payment status for a student in a session & term.
     */
    private function resolveStudentPaymentStatus(int $studentId, ?int $sessionId, string $term, ?int $schoolClassId = null): array
    {
        $student = \App\Models\Student::find($studentId);
        $studentClass = $schoolClassId ? \App\Models\SchoolClass::find($schoolClassId) : $student?->classes()->first();
        $className = $studentClass?->name;
        $department = $student?->department;

        $feesQuery = FeeStructure::query()->where('is_active', true);
        if ($className) {
            $feesQuery->where('class_name', $className);
        }
        if ($sessionId) {
            $feesQuery->where(function ($q) use ($sessionId) {
                $q->where('academic_session_id', $sessionId)
                  ->orWhereNull('academic_session_id');
            });
        }
        $feesQuery->where(function ($q) use ($term) {
            $q->where('term', $term)
              ->orWhereNull('term');
        });
        if ($department) {
            $feesQuery->where(function ($q) use ($department) {
                $q->whereNull('department')
                  ->orWhere('department', '')
                  ->orWhere('department', $department);
            });
        }

        $fees = (float) $feesQuery->sum('amount');

        // Only CONFIRMED payments count toward paid school fees
        $payments = (float) Payment::where('student_id', $studentId)
            ->whereIn('status', [Payment::STATUS_CONFIRMED, 'successful'])
            ->where(function ($q) use ($sessionId) {
                if ($sessionId) {
                    $q->where('academic_session_id', $sessionId)->orWhereNull('academic_session_id');
                }
            })
            ->where(function ($q) use ($term) {
                $q->where('term', $term)->orWhereNull('term');
            })
            ->sum('amount');

        // Pending payments (for visibility only, NOT counted as paid!)
        $pending = (float) Payment::where('student_id', $studentId)
            ->whereIn('status', [Payment::STATUS_PENDING_VERIFICATION, 'pending'])
            ->where(function ($q) use ($sessionId) {
                if ($sessionId) {
                    $q->where('academic_session_id', $sessionId)->orWhereNull('academic_session_id');
                }
            })
            ->where(function ($q) use ($term) {
                $q->where('term', $term)->orWhereNull('term');
            })
            ->sum('amount');

        $balance = max(0, $fees - $payments);
        $percentagePaid = $fees > 0 ? min(100, round(($payments / $fees) * 100, 2)) : 100;

        if ($fees == 0 || $payments >= $fees) {
            $status = 'PAID';
        } elseif ($payments > 0) {
            $status = 'PARTIALLY_PAID';
        } else {
            $status = 'UNPAID';
        }

        return [
            'status' => $status,
            'total_fee' => $fees,
            'total_paid' => $payments,
            'pending_amount' => $pending,
            'balance' => $balance,
            'percentage_paid' => $percentagePaid,
        ];
    }

    private function subjectResultsFor(ReportCard $reportCard)
    {
        return SubjectResult::where('student_id', $reportCard->student_id)
            ->where('school_class_id', $reportCard->school_class_id)
            ->where('academic_session_id', $reportCard->academic_session_id)
            ->where('term', $reportCard->term);
    }

    private function auditTransition(
        Request $request,
        ReportCard $reportCard,
        string $action,
        ?string $reason = null,
        ?string $previousStatus = null
    ): void {
        AuditLog::record($action, $reportCard->student_id, $reportCard->academic_session_id, $reportCard->term, [
            'report_card_id' => $reportCard->id,
            'actor' => $request->user()?->name ?? $request->user()?->full_name,
            'previous_status' => $previousStatus,
            'new_status' => $reportCard->fresh()->status,
            'reason' => $reason,
        ]);
    }

    private function isThirdTerm(string $term): bool
    {
        return in_array(strtolower(str_replace([' ', '-'], '_', $term)), ['3rd_term', 'third_term'], true);
    }
}
