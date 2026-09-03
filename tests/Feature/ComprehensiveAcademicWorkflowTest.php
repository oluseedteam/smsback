<?php

namespace Tests\Feature;

use App\Models\AcademicSection;
use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AssessmentConfiguration;
use App\Models\CbtQuestion;
use App\Models\CbtTest;
use App\Models\CourseRegistration;
use App\Models\EmailEvent;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\SubjectResult;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ComprehensiveAcademicWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private Teacher $teacher;
    private Student $student;
    private SchoolClass $class;
    private AcademicSession $session;
    private Subject $math;
    private Subject $english;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        SchoolSetting::getSettings();

        // 1. School Admin
        $this->admin = Admin::create([
            'full_name' => 'System Admin',
            'email' => 'admin@school.edu.ng',
            'password' => Hash::make('secret123'),
        ]);

        // 2. Teacher Assignment
        $this->teacher = Teacher::create([
            'employee_id' => 'TCH001',
            'full_name' => 'Mr. Adewale',
            'email' => 'teacher@school.edu.ng',
            'password' => Hash::make('secret123'),
        ]);

        // 3. Academic Section & Class
        $section = AcademicSection::create([
            'name' => 'Secondary Section',
            'code' => 'SEC',
            'order' => 1,
            'is_active' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => 'JSS 1 Gold',
            'grade_level' => 'JSS 1',
            'academic_section_id' => $section->id,
            'capacity' => 40,
            'teacher_id' => $this->teacher->id,
        ]);

        // 4. Academic Session
        $this->session = AcademicSession::create([
            'name' => '2026/2027',
            'is_current' => true,
            'terms' => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
        ]);

        // 5. Subjects & Teacher Assignment
        $this->math = Subject::create(['name' => 'Mathematics', 'code' => 'MTH101']);
        $this->english = Subject::create(['name' => 'English Language', 'code' => 'ENG101']);

        $this->class->subjects()->attach($this->math->id, ['teacher_id' => $this->teacher->id]);
        $this->class->subjects()->attach($this->english->id, ['teacher_id' => $this->teacher->id]);

        // 6. Student
        $this->student = Student::create([
            'student_id' => 'STD2026001',
            'full_name' => 'Boluwatife Adeleke',
            'email' => 'student@school.edu.ng',
            'parent_name' => 'Chief Adeleke',
            'parent_email' => 'parent@adeleke.com',
            'parent_phone' => '08012345678',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'status' => 'active',
            'password' => Hash::make('secret123'),
        ]);
        $this->student->classes()->sync([$this->class->id]);

        // Default grading scales
        foreach (\App\Services\ReportCardCalculationService::getDefaultGradingScale() as $scale) {
            GradingScale::create($scale);
        }

        // 7. Course Registrations (Authoritative source of truth)
        foreach (['1st Term', '2nd Term', '3rd Term'] as $t) {
            CourseRegistration::create([
                'student_id' => $this->student->id,
                'school_class_id' => $this->class->id,
                'academic_session_id' => $this->session->id,
                'subject_id' => $this->math->id,
                'term' => $t,
                'status' => 'approved',
            ]);
            CourseRegistration::create([
                'student_id' => $this->student->id,
                'school_class_id' => $this->class->id,
                'academic_session_id' => $this->session->id,
                'subject_id' => $this->english->id,
                'term' => $t,
                'status' => 'approved',
            ]);
        }

        // 8. Assessment Configurations (CA1: 20, CA2: 20, Exam: 60)
        AssessmentConfiguration::create([
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '1st Term',
            'ca1_max' => 20,
            'ca2_max' => 20,
            'exam_max' => 60,
            'total_max' => 100,
            'exam_method' => 'written',
        ]);
    }

    /**
     * Test 1: Full 1st Term Academic Workflow from Teacher Entry to Email Delivery and Student Portal.
     */
    public function test_first_term_workflow_and_dual_email_delivery(): void
    {
        // Step 1: Teacher retrieves marksheet
        $sheetResponse = $this->actingAs($this->teacher, 'sanctum')->getJson("/api/teacher/scoresheet?school_class_id={$this->class->id}&academic_session_id={$this->session->id}&subject_id={$this->math->id}&term=1st Term");
        $sheetResponse->assertStatus(200);
        $sheetData = $sheetResponse->json();
        $this->assertCount(1, $sheetData['students']);
        $this->assertEquals($this->student->id, $sheetData['students'][0]['student_id']);

        // Step 2: Teacher saves and submits marksheet (CA1: 18, CA2: 17, Exam: 54 -> Total: 89)
        $saveResponse = $this->actingAs($this->teacher, 'sanctum')->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '1st Term',
            'scores' => [
                [
                    'student_id' => $this->student->id,
                    'ca1_score' => 18,
                    'ca2_score' => 17,
                    'exam_score' => 54,
                ]
            ]
        ]);
        $saveResponse->assertStatus(200);

        $submitResponse = $this->actingAs($this->teacher, 'sanctum')->postJson('/api/teacher/scoresheet/submit', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '1st Term',
        ]);
        $submitResponse->assertStatus(200);

        // Step 3: English score recorded
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->english->id,
            'term' => '1st Term',
            'ca1_score' => 16,
            'ca2_score' => 16,
            'exam_score' => 48,
            'assessment_scores' => ['ca1' => 16, 'ca2' => 16, 'written' => 48],
            'total_score' => 80,
            'total_obtainable' => 100,
            'percentage' => 80,
            'grade' => 'A',
            'remark' => 'Excellent',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        // Step 4: Admin generates batch report cards
        $batchResponse = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/report-cards/generate-batch', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
        ]);
        $batchResponse->assertStatus(200);

        $reportCard = ReportCard::where('student_id', $this->student->id)
            ->where('academic_session_id', $this->session->id)
            ->where('term', '1st Term')
            ->firstOrFail();

        $this->assertEquals(84.5, $reportCard->average_score); // (89 + 80)/2
        $this->assertEquals('A', $reportCard->overall_grade);

        // Step 5: Admin approves report card
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$reportCard->id}/approve")->assertStatus(200);
        $this->assertEquals('approved', $reportCard->fresh()->status);

        // Step 6: Admin releases report card -> triggers student notification & dual email
        $releaseResponse = $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$reportCard->id}/release");
        $releaseResponse->assertStatus(200);
        $this->assertEquals('released', $reportCard->fresh()->status);

        // Verify In-App Student Notification created
        $this->assertDatabaseHas('student_notifications', [
            'user_id' => $this->student->id,
            'user_type' => 'student',
            'type' => 'report_card_released',
        ]);

        // Verify Email Events logged for both Student and Parent
        $this->assertDatabaseHas('email_events', [
            'report_card_id' => $reportCard->id,
            'recipient' => 'student@school.edu.ng',
            'recipient_type' => 'student',
        ]);
        $this->assertDatabaseHas('email_events', [
            'report_card_id' => $reportCard->id,
            'recipient' => 'parent@adeleke.com',
            'recipient_type' => 'parent',
        ]);

        // Step 7: Student accesses released 1st Term report card via Student Portal
        $studentView = $this->actingAs($this->student, 'sanctum')->getJson("/api/student/report-card/view?academic_session_id={$this->session->id}&term=1st Term");
        $studentView->assertStatus(200);
        $payload = $studentView->json();

        $this->assertEquals('1st Term', $payload['academic']['term']);
        $this->assertEquals(84.5, $payload['summary']['average_score']);
        $this->assertFalse($payload['is_third_term']);
        // Verify 1st Term strictly does NOT show cumulative / annual promotion fields
        $this->assertNull($payload['cumulative']);

        // Step 8: Student downloads the generated PDF document
        $pdfResponse = $this->actingAs($this->student, 'sanctum')->get("/api/student/report-cards/{$reportCard->id}/pdf");
        $pdfResponse->assertStatus(200);
        $pdfResponse->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString('REPORT_CARD', $pdfResponse->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF-', $pdfResponse->getContent());
    }

    /**
     * Test 2: CBT Auto-Grading & Marksheet Synchronization.
     */
    public function test_cbt_test_flow_auto_grading_and_marksheet_sync(): void
    {
        // 1. Configure assessment for CBT in 2nd term
        AssessmentConfiguration::create([
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->english->id,
            'term' => '2nd Term',
            'ca1_max' => 20,
            'ca2_max' => 20,
            'exam_max' => 60,
            'total_max' => 100,
            'exam_method' => 'cbt',
        ]);

        // 2. Create CBT Test for English in 2nd Term
        $cbtTest = CbtTest::create([
            'teacher_id' => $this->teacher->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->english->id,
            'term' => '2nd Term',
            'title' => 'English Grammar & Comprehension CBT Exam',
            'duration_minutes' => 30,
            'total_marks' => 20,
            'pass_percentage' => 50,
            'is_published' => true,
            'start_time' => now()->subHour(),
            'end_time' => now()->addHours(2),
        ]);

        $q1 = CbtQuestion::create([
            'cbt_test_id' => $cbtTest->id,
            'question' => 'What is the plural of child?',
            'option_a' => 'Childs',
            'option_b' => 'Children',
            'option_c' => 'Childrens',
            'option_d' => 'Childes',
            'correct_answer' => 'B',
            'points' => 10,
        ]);

        $q2 = CbtQuestion::create([
            'cbt_test_id' => $cbtTest->id,
            'question' => 'Identify the verb in: "The cat runs swiftly."',
            'option_a' => 'cat',
            'option_b' => 'swiftly',
            'option_c' => 'runs',
            'option_d' => 'The',
            'correct_answer' => 'C',
            'points' => 10,
        ]);

        // 3. Student starts exam — verify correct answers are NEVER leaked to student
        $startResponse = $this->actingAs($this->student, 'sanctum')->postJson("/api/student/cbt-tests/{$cbtTest->id}/start");
        $startResponse->assertStatus(200);
        $questions = $startResponse->json('questions');
        $this->assertCount(2, $questions);
        $this->assertArrayNotHasKey('correct_answer', $questions[0]);
        $this->assertArrayNotHasKey('correct_answer', $questions[1]);

        // 4. Student submits exam with answers (Q1: B -> correct (10pts), Q2: C -> correct (10pts)) -> 100% -> 60/60 scaled
        $submitResponse = $this->actingAs($this->student, 'sanctum')->postJson("/api/student/cbt-tests/{$cbtTest->id}/submit", [
            'answers' => [
                ['question_id' => $q1->id, 'selected_answer' => 'B'],
                ['question_id' => $q2->id, 'selected_answer' => 'C'],
            ]
        ]);
        $submitResponse->assertStatus(200);
        $this->assertEquals(100.0, (float) $submitResponse->json('score'));

        // 5. Verify score automatically synced to SubjectResult for 2nd Term (60.0 exam score)
        $this->assertDatabaseHas('subject_results', [
            'student_id' => $this->student->id,
            'subject_id' => $this->english->id,
            'academic_session_id' => $this->session->id,
            'term' => '2nd Term',
            'exam_score' => 60.0,
            'exam_method' => 'cbt',
        ]);
    }

    /**
     * Test 3: Third Term Cumulative Annual Report Card & Multi-Term Performance Breakdown.
     */
    public function test_third_term_cumulative_annual_report_card(): void
    {
        // Setup 1st Term results: Math = 80, English = 70 (Avg = 75.0)
        ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'total_score' => 150,
            'average_score' => 75.0,
            'total_subjects' => 2,
            'overall_grade' => 'A',
            'status' => 'released',
        ]);
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '1st Term',
            'total_score' => 80,
            'percentage' => 80,
            'grade' => 'A',
        ]);
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->english->id,
            'term' => '1st Term',
            'total_score' => 70,
            'percentage' => 70,
            'grade' => 'B',
        ]);

        // Setup 2nd Term results: Math = 86, English = 84 (Avg = 85.0)
        ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '2nd Term',
            'total_score' => 170,
            'average_score' => 85.0,
            'total_subjects' => 2,
            'overall_grade' => 'A',
            'status' => 'released',
        ]);
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '2nd Term',
            'total_score' => 86,
            'percentage' => 86,
            'grade' => 'A',
        ]);
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->english->id,
            'term' => '2nd Term',
            'total_score' => 84,
            'percentage' => 84,
            'grade' => 'A',
        ]);

        // Setup 3rd Term results: Math = 92, English = 88 (Avg = 90.0)
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '3rd Term',
            'ca1_score' => 19,
            'ca2_score' => 19,
            'exam_score' => 54,
            'assessment_scores' => ['ca1' => 19, 'ca2' => 19, 'written' => 54],
            'total_score' => 92,
            'total_obtainable' => 100,
            'percentage' => 92,
            'grade' => 'A',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->english->id,
            'term' => '3rd Term',
            'ca1_score' => 18,
            'ca2_score' => 18,
            'exam_score' => 52,
            'assessment_scores' => ['ca1' => 18, 'ca2' => 18, 'written' => 52],
            'total_score' => 88,
            'total_obtainable' => 100,
            'percentage' => 88,
            'grade' => 'A',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        // Generate 3rd Term report card
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/report-cards/generate-batch', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '3rd Term',
        ])->assertStatus(200);

        $rc3 = ReportCard::where('student_id', $this->student->id)
            ->where('academic_session_id', $this->session->id)
            ->where('term', '3rd Term')
            ->firstOrFail();

        // Verify calculations: 3rd term avg = 90.0, Cumulative avg = (75 + 85 + 90)/3 = 83.33
        $this->assertEquals(90.0, $rc3->average_score);
        $this->assertEquals(75.0, $rc3->term1_average);
        $this->assertEquals(85.0, $rc3->term2_average);
        $this->assertEquals(90.0, $rc3->term3_average);
        $this->assertEquals(83.33, $rc3->cumulative_average);
        $this->assertNull($rc3->promotion_status);

        // Approve and release 3rd Term
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$rc3->id}/approve")->assertStatus(200);
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$rc3->id}/release")->assertStatus(200);

        // Student views 3rd Term Report Card
        $response = $this->actingAs($this->student, 'sanctum')->getJson("/api/student/report-card/view?academic_session_id={$this->session->id}&term=3rd Term");
        $response->assertStatus(200);
        $payload = $response->json();

        $this->assertTrue($payload['is_third_term']);
        $this->assertNotNull($payload['cumulative']);
        $this->assertEquals(83.33, $payload['cumulative']['cumulative_average']);
        $this->assertNull($payload['cumulative']['promotion_status']);

        // Verify per-subject multi-term breakdown in results table
        $mathResult = collect($payload['results'])->firstWhere('subject_name', 'Mathematics');
        $this->assertNotNull($mathResult);
        $this->assertEquals(80.0, $mathResult['term1_score']);
        $this->assertEquals(86.0, $mathResult['term2_score']);
        $this->assertEquals(92.0, $mathResult['term3_score']);
        $this->assertEquals(86.0, $mathResult['annual_average']); // (80+86+92)/3 = 86.0
        $this->assertEquals('A', $mathResult['annual_grade']);

        // Verify Student Academic History archive endpoint
        $historyResponse = $this->actingAs($this->student, 'sanctum')->getJson('/api/student/report-card-history');
        $historyResponse->assertStatus(200);
        $this->assertCount(1, $historyResponse->json('sessions'));
        $this->assertGreaterThanOrEqual(1, $historyResponse->json('total_released'));
    }

    /**
     * Test 4: Security and Negative Authorization Checks.
     */
    public function test_security_and_unauthorized_access_preventions(): void
    {
        // 1. Unauthorized teacher cannot submit scores for unassigned subject
        $otherTeacher = Teacher::create([
            'employee_id' => 'TCH999',
            'full_name' => 'Unauthorized Teacher',
            'email' => 'unauth@school.edu.ng',
            'password' => Hash::make('secret123'),
        ]);

        $unauthScoreResponse = $this->actingAs($otherTeacher, 'sanctum')->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '1st Term',
            'scores' => [
                ['student_id' => $this->student->id, 'ca1_score' => 20]
            ]
        ]);
        $unauthScoreResponse->assertStatus(403);

        // 2. Student cannot view unreleased report cards
        $unreleasedCard = ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'total_score' => 100,
            'average_score' => 50,
            'total_subjects' => 2,
            'status' => 'draft',
        ]);

        $unreleasedView = $this->actingAs($this->student, 'sanctum')->getJson("/api/student/report-card/view?academic_session_id={$this->session->id}&term=1st Term");
        $unreleasedView->assertStatus(403);

        // 3. Student cannot view another student's report card
        $otherStudent = Student::create([
            'student_id' => 'STD999',
            'full_name' => 'Other Student',
            'email' => 'otherstudent@school.edu.ng',
            'gender' => 'female',
            'class_id' => $this->class->id,
            'status' => 'active',
            'password' => Hash::make('secret123'),
        ]);
        $otherCard = ReportCard::create([
            'student_id' => $otherStudent->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'total_score' => 100,
            'average_score' => 50,
            'total_subjects' => 2,
            'status' => 'released',
        ]);

        $otherAccess = $this->actingAs($this->student, 'sanctum')->getJson("/api/student/report-cards/{$otherCard->id}");
        $otherAccess->assertStatus(404);
    }
}
