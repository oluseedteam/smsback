<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AssessmentConfiguration;
use App\Models\AuditLog;
use App\Models\CbtSubmission;
use App\Models\CbtTest;
use App\Models\CourseRegistration;
use App\Models\EmailEvent;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\ReportCardAccessToken;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\SubjectResult;
use App\Models\Teacher;
use App\Services\ReportCardCalculationService;
use App\Services\ReportCardEmailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ReportCardWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Teacher $teacher;
    protected Student $student;
    protected SchoolClass $class;
    protected Subject $subjectMath;
    protected Subject $subjectEng;
    protected AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        // 1. Seed School Settings
        SchoolSetting::getSettings();

        // 2. Admin & Teacher & Student
        $this->admin = Admin::create([
            'full_name' => 'System Admin',
            'email' => 'admin@ghraschools.edu.ng',
            'password' => Hash::make('secret123'),
        ]);

        $this->teacher = Teacher::create([
            'full_name' => 'Mr. Adeyemi Teacher',
            'email' => 'teacher@ghraschools.edu.ng',
            'employee_id' => 'EMP-001',
            'password' => Hash::make('secret123'),
        ]);

        $this->student = Student::create([
            'full_name' => 'Tunde Bakare',
            'email' => 'tunde@ghraschools.edu.ng',
            'student_id' => 'GHRA-2026-001',
            'gender' => 'male',
            'parent_name' => 'Chief Bakare',
            'parent_email' => 'parent.bakare@example.com',
            'parent_phone' => '+2348012345678',
            'password' => Hash::make('secret123'),
        ]);

        $this->class = SchoolClass::create([
            'name' => 'SS 2 Science',
            'grade_level' => 'SS 2',
            'academic_year' => '2026/2027',
            'teacher_id' => $this->teacher->id,
        ]);

        $this->student->classes()->sync([$this->class->id]);

        $this->subjectMath = Subject::create(['name' => 'Mathematics', 'code' => 'MTH201']);
        $this->subjectEng = Subject::create(['name' => 'English Language', 'code' => 'ENG201']);

        $this->class->subjects()->attach($this->subjectMath->id, ['teacher_id' => $this->teacher->id]);
        $this->class->subjects()->attach($this->subjectEng->id, ['teacher_id' => $this->teacher->id]);

        // 4. Academic Session
        $this->session = AcademicSession::create([
            'name' => '2026/2027',
            'is_current' => true,
            'terms' => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
        ]);

        // 5. Default Grading Scales
        foreach (ReportCardCalculationService::getDefaultGradingScale() as $scale) {
            GradingScale::create($scale);
        }
    }

    /**
     * Test 1: Full Written Assessment End-to-End Workflow.
     */
    public function test_full_written_assessment_and_release_workflow(): void
    {
        // Step 1: Student registers for Mathematics
        $this->actingAs($this->student, 'sanctum');
        $regResponse = $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->subjectMath->id],
        ]);
        $regResponse->assertStatus(200);
        $this->assertDatabaseHas('course_registrations', [
            'student_id' => $this->student->id,
            'subject_id' => $this->subjectMath->id,
            'term' => '1st Term',
        ]);

        // Step 2: Teacher opens score sheet
        $this->actingAs($this->teacher, 'sanctum');
        $sheetResponse = $this->getJson("/api/teacher/scoresheet?school_class_id={$this->class->id}&academic_session_id={$this->session->id}&term=1st Term&subject_id={$this->subjectMath->id}");
        $sheetResponse->assertStatus(200);
        $sheetResponse->assertJsonFragment(['student_name' => 'Tunde Bakare']);

        // Step 3: Teacher enters CA1 (18), CA2 (17), Written Exam (52)
        $saveResponse = $this->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->subjectMath->id,
            'scores' => [
                [
                    'student_id' => $this->student->id,
                    'ca1_score' => 18,
                    'ca2_score' => 17,
                    'exam_score' => 52,
                ]
            ],
        ]);
        $saveResponse->assertStatus(200);

        // Verify backend calculation: 18 + 17 + 52 = 87.00 => Grade A, Excellent
        $this->assertDatabaseHas('subject_results', [
            'student_id' => $this->student->id,
            'subject_id' => $this->subjectMath->id,
            'total_score' => 87.00,
            'percentage' => 87.00,
            'grade' => 'A',
            'remark' => 'Excellent',
        ]);

        // Step 4: Teacher submits score sheet
        $submitResponse = $this->postJson('/api/teacher/scoresheet/submit', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->subjectMath->id,
        ]);
        $submitResponse->assertStatus(200);

        // Step 5: Admin reviews & approves
        $reportCard = ReportCard::where('student_id', $this->student->id)
            ->where('academic_session_id', $this->session->id)
            ->where('term', '1st Term')
            ->firstOrFail();

        $this->actingAs($this->admin, 'sanctum');
        $approveResponse = $this->postJson("/api/admin/report-cards/{$reportCard->id}/approve");
        $approveResponse->assertStatus(200);
        $this->assertEquals('approved', $reportCard->fresh()->status);

        // Step 6: Admin releases report card
        $releaseResponse = $this->postJson("/api/admin/report-cards/{$reportCard->id}/release");
        $releaseResponse->assertStatus(200);
        $this->assertEquals('released', $reportCard->fresh()->status);

        // Verify in-app notification
        $this->assertDatabaseHas('student_notifications', [
            'user_id' => $this->student->id,
            'user_type' => 'student',
            'type' => 'report_card_released',
        ]);

        // Verify email events
        $this->assertDatabaseHas('email_events', [
            'student_id' => $this->student->id,
            'report_card_id' => $reportCard->id,
            'recipient_type' => 'student',
        ]);
        $this->assertDatabaseHas('email_events', [
            'student_id' => $this->student->id,
            'report_card_id' => $reportCard->id,
            'recipient_type' => 'parent',
        ]);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'student_id' => $this->student->id,
            'action' => 'REPORT_CARD_RELEASED',
        ]);

        // Verify released_at timestamp set on release
        $fresh = $reportCard->fresh();
        $this->assertNotNull($fresh->released_at,
            'released_at must be populated when a report card is released');

        // Verify email idempotency keys are unique (no duplicate sends possible)
        $emailEvents = EmailEvent::where('report_card_id', $reportCard->id)->get();
        $idempotencyKeys = $emailEvents->pluck('idempotency_key');
        $this->assertEquals(
            $idempotencyKeys->count(),
            $idempotencyKeys->unique()->count(),
            'All email_events must have unique idempotency_keys to prevent duplicate sends'
        );

        // Student portal: released report card is accessible
        $studentRes = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/student/report-cards/{$reportCard->id}");
        $studentRes->assertOk();
    }

    /**
     * Test 2: CBT Integration and Score Sheet Auto-Derivation.
     */
    public function test_cbt_score_derivation_in_scoresheet(): void
    {
        // 1. Configure subject for CBT
        AssessmentConfiguration::create([
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->subjectMath->id,
            'term' => '1st Term',
            'ca1_max' => 20,
            'ca2_max' => 20,
            'exam_max' => 60,
            'total_max' => 100,
            'exam_method' => 'cbt',
        ]);

        // 2. Student registers course
        CourseRegistration::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'subject_id' => $this->subjectMath->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
        ]);

        // 3. Create CBT test and completed submission with 80% score
        $cbtTest = CbtTest::create([
            'title' => 'Math Term Exam',
            'teacher_id' => $this->teacher->id,
            'school_class_id' => $this->class->id,
            'subject_id' => $this->subjectMath->id,
            'term' => '1st Term',
            'duration_minutes' => 60,
            'is_published' => true,
        ]);

        CbtSubmission::create([
            'cbt_test_id' => $cbtTest->id,
            'student_id' => $this->student->id,
            'score' => 80, // 80%
            'submitted_at' => now(),
            'result_released' => true,
        ]);

        // 4. Teacher score sheet query
        $calcService = app(ReportCardCalculationService::class);
        $result = $calcService->calculateSubjectResult(
            $this->student,
            $this->class,
            $this->subjectMath,
            $this->session,
            '1st Term',
            15, // CA1
            15, // CA2
            null, // Written ignored in CBT mode
            $this->teacher->id
        );

        // CBT exam score should be (80 / 100) * 60 = 48.00
        // Total = 15 + 15 + 48 = 78.00 => Grade A
        $this->assertEquals(48.00, $result->exam_score);
        $this->assertEquals(78.00, $result->total_score);
        $this->assertEquals('A', $result->grade);
    }

    /**
     * Test 3: Class-Specific Grading Scale Isolation.
     */
    public function test_class_specific_grading_scale_isolation(): void
    {
        $classStrict = SchoolClass::create([
            'name' => 'JSS 1 Honours',
            'grade_level' => 'JSS 1',
        ]);

        // Custom strict scale for JSS 1 Honours: A is 85-100, B is 70-84.99
        GradingScale::create([
            'school_class_id' => $classStrict->id,
            'academic_session_id' => $this->session->id,
            'grade' => 'A',
            'min_score' => 85.00,
            'max_score' => 100.00,
            'remark' => 'Distinction',
        ]);
        GradingScale::create([
            'school_class_id' => $classStrict->id,
            'academic_session_id' => $this->session->id,
            'grade' => 'B',
            'min_score' => 70.00,
            'max_score' => 84.99,
            'remark' => 'Very Good',
        ]);

        $calcService = app(ReportCardCalculationService::class);

        // Score of 78% in strict class should get B
        $strictGrade = $calcService->determineGradeAndRemark(78.0, $classStrict->id, $this->session->id);
        $this->assertEquals('B', $strictGrade['grade']);

        // Score of 78% in standard class should get A (default scale has A at 75-100)
        $standardGrade = $calcService->determineGradeAndRemark(78.0, $this->class->id, $this->session->id);
        $this->assertEquals('A', $standardGrade['grade']);
    }

    /**
     * Test 4: Term Independence & 3rd Term Cumulative Annual Average.
     */
    public function test_third_term_cumulative_calculation(): void
    {
        // 1st Term Report Card: 70.00%
        ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'average_score' => 70.00,
            'total_score' => 70.00,
            'status' => 'released',
        ]);

        // 2nd Term Report Card: 80.00%
        ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '2nd Term',
            'average_score' => 80.00,
            'total_score' => 80.00,
            'status' => 'released',
        ]);

        // 3rd Term Course Registration & Subject Result: 90.00%
        CourseRegistration::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'subject_id' => $this->subjectMath->id,
            'academic_session_id' => $this->session->id,
            'term' => '3rd Term',
        ]);

        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'subject_id' => $this->subjectMath->id,
            'academic_session_id' => $this->session->id,
            'term' => '3rd Term',
            'total_score' => 90.00,
            'percentage' => 90.00,
            'grade' => 'A',
            'remark' => 'Excellent',
        ]);

        $calcService = app(ReportCardCalculationService::class);
        $thirdTermCard = $calcService->generateReportCard($this->student, $this->class, $this->session, '3rd Term');

        // Cumulative should be (70 + 80 + 90) / 3 = 80.00%
        $this->assertEquals(70.00, $thirdTermCard->term1_average);
        $this->assertEquals(80.00, $thirdTermCard->term2_average);
        $this->assertEquals(90.00, $thirdTermCard->term3_average);
        $this->assertEquals(80.00, $thirdTermCard->cumulative_average);
        // Calculation never invents a promotion decision; an administrator records it explicitly.
        $this->assertNull($thirdTermCard->promotion_status);
    }

    /**
     * Test 5: Privacy Enforcement & Parent Token Verification.
     */
    public function test_parent_access_token_generation_and_verification(): void
    {
        $reportCard = ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'status' => 'released',
            'total_score' => 85.0,
            'average_score' => 85.0,
        ]);

        $rawToken = ReportCardAccessToken::generateToken($reportCard, 'parent', 30);

        // Verification via API
        $verifyResponse = $this->getJson("/api/public/report-card/verify/{$rawToken}");
        $verifyResponse->assertStatus(200);
        $verifyResponse->assertJsonFragment(['student_id' => 'GHRA-2026-001']);

        // Invalid token
        $badResponse = $this->getJson('/api/public/report-card/verify/invalid-token-12345');
        $badResponse->assertStatus(401);
    }

    /**
     * Test 6: Duplicate Email Prevention.
     */
    public function test_duplicate_email_prevention(): void
    {
        $reportCard = ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'status' => 'released',
            'total_score' => 85.0,
            'average_score' => 85.0,
        ]);

        $emailService = app(ReportCardEmailService::class);

        // First send
        $res1 = $emailService->sendReleaseEmails($reportCard);
        $this->assertEquals('delivered', $res1['student']['status']);

        // Second send without force should report already_sent
        $res2 = $emailService->sendReleaseEmails($reportCard);
        $this->assertEquals('already_delivered', $res2['student']['status']);
    }
}
