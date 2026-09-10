<?php

namespace Tests\Feature;

use App\Models\AcademicSection;
use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AssessmentConfiguration;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\CbtQuestion;
use App\Models\CbtSubmission;
use App\Models\CbtTest;
use App\Models\CourseRegistration;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectResult;
use App\Models\Teacher;
use App\Services\ReportCardCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CompleteEndToEndAcademicCycleTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Teacher $classTeacher;
    protected Teacher $otherTeacher;
    protected Student $student;
    protected SchoolClass $classPrimary;
    protected SchoolClass $classNext;
    protected AcademicSession $session;
    protected Subject $compulsorySubject;
    protected Subject $electiveSubject;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'full_name' => 'Principal Administrator',
            'email' => 'principal@school.test',
            'password' => Hash::make('secret123'),
        ]);

        $this->classTeacher = Teacher::create([
            'full_name' => 'Mrs. Grace Okon',
            'email' => 'grace.okon@school.test',
            'employee_id' => 'EMP-101',
            'password' => Hash::make('secret123'),
        ]);

        $this->otherTeacher = Teacher::create([
            'full_name' => 'Mr. Samuel Peter',
            'email' => 'samuel.peter@school.test',
            'employee_id' => 'EMP-102',
            'password' => Hash::make('secret123'),
        ]);

        $this->student = Student::create([
            'full_name' => 'Chinedu Eze',
            'email' => 'chinedu.eze@school.test',
            'student_id' => 'STD-2026-999',
            'gender' => 'male',
            'parent_name' => 'Mr. Eze',
            'parent_email' => 'parent.eze@school.test',
            'password' => Hash::make('secret123'),
        ]);

        $section = AcademicSection::create([
            'name' => 'Senior Secondary',
            'ordering' => 1,
            'status' => 'active',
        ]);

        $this->classPrimary = SchoolClass::create([
            'name' => 'SS 1 Diamond',
            'grade_level' => 'SS 1',
            'academic_section_id' => $section->id,
            'teacher_id' => $this->classTeacher->id,
            'academic_year' => '2026/2027',
        ]);

        $this->classNext = SchoolClass::create([
            'name' => 'SS 2 Diamond',
            'grade_level' => 'SS 2',
            'academic_section_id' => $section->id,
            'teacher_id' => $this->classTeacher->id,
            'academic_year' => '2027/2028',
        ]);

        $this->student->classes()->sync([$this->classPrimary->id]);

        $this->compulsorySubject = Subject::create([
            'name' => 'English Language',
            'code' => 'ENG101',
            'is_compulsory' => true,
        ]);

        $this->electiveSubject = Subject::create([
            'name' => 'Visual Arts',
            'code' => 'ART101',
            'is_compulsory' => false,
        ]);

        $this->classPrimary->subjects()->attach($this->compulsorySubject->id, [
            'teacher_id' => $this->classTeacher->id,
            'is_compulsory' => true,
        ]);

        $this->classPrimary->subjects()->attach($this->electiveSubject->id, [
            'teacher_id' => $this->otherTeacher->id,
            'is_compulsory' => false,
        ]);

        $this->session = AcademicSession::create([
            'name' => '2026/2027',
            'is_current' => true,
            'terms' => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
        ]);

        foreach (ReportCardCalculationService::getDefaultGradingScale() as $scale) {
            GradingScale::create($scale);
        }
    }

    public function test_compulsory_subjects_enforced_and_registration_deadline_respected(): void
    {
        $this->actingAs($this->student, 'sanctum');

        // 1. Available subjects returns compulsory flag and teacher info
        $availRes = $this->getJson('/api/student/course-registration/available');
        $availRes->assertOk();
        $availRes->assertJsonFragment(['name' => 'English Language', 'is_compulsory' => true]);
        $availRes->assertJsonFragment(['name' => 'Visual Arts', 'is_compulsory' => false]);

        // 2. Registering only elective should fail because English is compulsory
        $failRes = $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->electiveSubject->id],
        ]);
        $failRes->assertStatus(422);
        $failRes->assertJsonFragment(['message' => 'All compulsory subjects must be registered. Missing: English Language.']);

        // 3. Registering both should succeed
        $successRes = $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->compulsorySubject->id, $this->electiveSubject->id],
        ]);
        $successRes->assertOk();
        $this->assertDatabaseHas('course_registrations', [
            'student_id' => $this->student->id,
            'subject_id' => $this->compulsorySubject->id,
            'status' => 'active',
        ]);

        // 4. Test deadline enforcement
        $this->session->update([
            'registration_deadline' => now()->subDay(),
            'registration_reopened' => false,
        ]);

        $deadlineRes = $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->compulsorySubject->id],
        ]);
        $deadlineRes->assertStatus(422);
        $deadlineRes->assertJsonFragment(['message' => 'Course registration is closed for this academic session.']);

        // 5. Reopen registration
        $this->session->update(['registration_reopened' => true]);
        $reopenRes = $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->compulsorySubject->id, $this->electiveSubject->id],
        ]);
        $reopenRes->assertOk();
    }

    public function test_dropping_course_with_existing_scores_transitions_to_withdrawn(): void
    {
        $this->actingAs($this->student, 'sanctum');

        // 1. Register for both subjects
        $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->compulsorySubject->id, $this->electiveSubject->id],
        ])->assertOk();

        // 2. Record a subject result for Visual Arts
        SubjectResult::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->electiveSubject->id,
            'term' => '1st Term',
            'ca1_score' => 15,
            'total_score' => 15,
            'total_obtainable' => 100,
            'percentage' => 15,
            'grade' => 'F',
            'status' => 'draft',
        ]);

        // 3. Student drops Visual Arts by only submitting English
        $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->compulsorySubject->id],
        ])->assertOk();

        // 4. Visual Arts course registration must NOT be deleted, but transitioned to 'withdrawn'
        $this->assertDatabaseHas('course_registrations', [
            'student_id' => $this->student->id,
            'subject_id' => $this->electiveSubject->id,
            'status' => CourseRegistration::STATUS_WITHDRAWN,
        ]);
    }

    public function test_attendance_permission_restricted_to_class_teacher_or_admin(): void
    {
        // 1. Non-class teacher cannot mark general attendance
        $this->actingAs($this->otherTeacher, 'sanctum');
        $forbiddenRes = $this->postJson('/api/attendance/bulk', [
            'attendance_date' => now()->toDateString(),
            'school_class_id' => $this->classPrimary->id,
            'term' => '1st Term',
            'records' => [
                ['student_id' => $this->student->id, 'status' => 'present'],
            ],
        ]);
        $forbiddenRes->assertStatus(403);

        // 2. Designated class teacher can mark attendance
        $this->actingAs($this->classTeacher, 'sanctum');
        $successRes = $this->postJson('/api/attendance/bulk', [
            'attendance_date' => now()->toDateString(),
            'school_class_id' => $this->classPrimary->id,
            'term' => '1st Term',
            'records' => [
                ['student_id' => $this->student->id, 'status' => 'present'],
            ],
        ]);
        $successRes->assertOk();

        $this->assertDatabaseHas('attendance_records', [
            'student_id' => $this->student->id,
            'school_class_id' => $this->classPrimary->id,
            'status' => 'present',
            'marked_by_teacher_id' => $this->classTeacher->id,
        ]);

        // 3. Admin can also mark attendance
        $this->actingAs($this->admin, 'sanctum');
        $adminRes = $this->postJson('/api/attendance/bulk', [
            'attendance_date' => now()->toDateString(),
            'school_class_id' => $this->classPrimary->id,
            'term' => '1st Term',
            'records' => [
                ['student_id' => $this->student->id, 'status' => 'late'],
            ],
        ]);
        $adminRes->assertOk();
    }

    public function test_cbt_autosave_recovery_and_combined_assessment_sync(): void
    {
        // 1. Setup CBT test for English
        $cbtTest = CbtTest::create([
            'title' => 'English Combined Mid-Term',
            'school_class_id' => $this->classPrimary->id,
            'subject_id' => $this->compulsorySubject->id,
            'teacher_id' => $this->classTeacher->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'duration_minutes' => 45,
            'total_marks' => 30,
            'is_published' => true,
            'status' => 'ACTIVE',
        ]);

        $q1 = CbtQuestion::create([
            'cbt_test_id' => $cbtTest->id,
            'question' => 'Select noun in sentence',
            'option_a' => 'Quickly',
            'option_b' => 'River',
            'option_c' => 'Blue',
            'option_d' => 'Very',
            'correct_answer' => 'B',
            'points' => 15,
            'status' => 'approved',
        ]);

        $q2 = CbtQuestion::create([
            'cbt_test_id' => $cbtTest->id,
            'question' => 'Antonym of ancient',
            'option_a' => 'Modern',
            'option_b' => 'Old',
            'option_c' => 'Past',
            'option_d' => 'Historic',
            'correct_answer' => 'A',
            'points' => 15,
            'status' => 'approved',
        ]);

        // Register student for English
        CourseRegistration::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->classPrimary->id,
            'subject_id' => $this->compulsorySubject->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'status' => 'active',
        ]);

        // Configure Combined assessment (CA1=20, CA2=20, CBT=30, Written=30 -> Total 100)
        AssessmentConfiguration::create([
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->compulsorySubject->id,
            'term' => '1st Term',
            'ca1_max' => 20,
            'ca2_max' => 20,
            'exam_max' => 60,
            'cbt_max' => 30,
            'written_max' => 30,
            'total_max' => 100,
            'exam_method' => 'combined',
            'components' => [
                ['key' => 'ca1', 'label' => 'CA 1', 'type' => 'continuous_assessment', 'max_score' => 20],
                ['key' => 'ca2', 'label' => 'CA 2', 'type' => 'continuous_assessment', 'max_score' => 20],
                ['key' => 'cbt', 'label' => 'CBT Component', 'type' => 'cbt', 'max_score' => 30],
                ['key' => 'written', 'label' => 'Written Component', 'type' => 'written', 'max_score' => 30],
            ],
        ]);

        $this->actingAs($this->student, 'sanctum');

        // 2. Start exam
        $startRes = $this->postJson("/api/student/cbt-tests/{$cbtTest->id}/start");
        $startRes->assertOk();
        $startRes->assertJsonStructure(['submission_id', 'questions', 'duration_minutes', 'remaining_seconds']);

        // 3. Test Autosave individual question
        $saveRes = $this->postJson("/api/student/cbt-tests/{$cbtTest->id}/save-answer", [
            'question_id' => $q1->id,
            'selected_answer' => 'B',
            'time_spent_seconds' => 120,
        ]);
        $saveRes->assertOk();
        $saveRes->assertJsonFragment(['saved' => true, 'selected_answer' => 'B']);

        // 4. Test reload recovery: re-calling startExam returns saved answers
        $reloadRes = $this->postJson("/api/student/cbt-tests/{$cbtTest->id}/start");
        $reloadRes->assertOk();
        $this->assertEquals('B', $reloadRes->json("saved_answers.{$q1->id}"));

        // 5. Submit exam with answer for q2
        $submitRes = $this->postJson("/api/student/cbt-tests/{$cbtTest->id}/submit", [
            'answers' => [
                ['question_id' => $q2->id, 'selected_answer' => 'A'],
            ],
        ]);
        $submitRes->assertOk();
        $submitRes->assertJsonFragment(['score' => 100, 'correct' => 2]);

        // 6. Teacher inspects scoresheet: CBT is auto-imported (30/30)
        $this->actingAs($this->classTeacher, 'sanctum');
        $sheetRes = $this->getJson("/api/teacher/scoresheet?school_class_id={$this->classPrimary->id}&academic_session_id={$this->session->id}&term=1st Term&subject_id={$this->compulsorySubject->id}");
        $sheetRes->assertOk();
        $studentRow = collect($sheetRes->json('students'))->firstWhere('student_id', $this->student->id);
        $this->assertEquals(30, $studentRow['assessment_scores']['cbt']);

        // 7. Teacher inputs CA1=18, CA2=17, and written=25
        $saveSheetRes = $this->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->classPrimary->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->compulsorySubject->id,
            'scores' => [
                [
                    'student_id' => $this->student->id,
                    'ca1_score' => 18,
                    'ca2_score' => 17,
                    'assessment_scores' => [
                        'ca1' => 18,
                        'ca2' => 17,
                        'written' => 25,
                    ],
                ],
            ],
        ]);
        $saveSheetRes->assertOk();

        // 8. Result record in DB contains both CBT (30) and written (25), combined exam_score = 55, total = 90
        $result = SubjectResult::where('student_id', $this->student->id)
            ->where('subject_id', $this->compulsorySubject->id)
            ->first();

        $this->assertNotNull($result);
        $this->assertEquals('combined', $result->exam_method);
        $this->assertEquals(30, $result->assessment_scores['cbt']);
        $this->assertEquals(25, $result->assessment_scores['written']);
        $this->assertEquals(55, $result->exam_score);
        $this->assertEquals(90, $result->total_score);
        $this->assertEquals('A', $result->grade);
    }

    public function test_promotion_authorized_override_and_audit_continuity(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        // 1. Attempting promotion without approved 3rd term report card must fail without override
        $failRes = $this->postJson('/api/admin/promotions/promote', [
            'from_session_id' => $this->session->id,
            'from_class_id' => $this->classPrimary->id,
            'to_session_id' => $this->session->id,
            'to_class_id' => $this->classNext->id,
            'student_ids' => [$this->student->id],
            'promotion_status' => 'promoted',
            'allow_override' => false,
        ]);
        $failRes->assertStatus(422);

        // 2. Promoting with authorized override succeeds
        $overrideRes = $this->postJson('/api/admin/promotions/promote', [
            'from_session_id' => $this->session->id,
            'from_class_id' => $this->classPrimary->id,
            'to_session_id' => $this->session->id,
            'to_class_id' => $this->classNext->id,
            'student_ids' => [$this->student->id],
            'promotion_status' => 'promoted',
            'allow_override' => true,
            'override_reason' => 'Administrative transfer approved by Academic Council',
            'notes' => 'Advanced placement decision',
        ]);
        $overrideRes->assertOk();
        $overrideRes->assertJsonFragment(['promoted_count' => 1]);

        // 3. Check student is now in destination class
        $this->assertTrue($this->student->fresh()->classes->contains($this->classNext->id));

        // 4. Check audit log recorded the override
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'PROMOTION_OVERRIDE',
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_academic_setup_checklist_and_onboarding_tour_endpoints(): void
    {
        // 1. Admin setup checklist endpoint
        $this->actingAs($this->admin, 'sanctum');
        $checklistRes = $this->getJson('/api/admin/setup-checklist');
        $checklistRes->assertOk();
        $checklistRes->assertJsonStructure([
            'checklist',
            'completed_count',
            'total_count',
            'progress_percent',
            'is_fully_ready',
        ]);
        $this->assertGreaterThan(0, $checklistRes->json('completed_count'));

        // 2. Onboarding tour status GET and POST
        $tourGetRes = $this->getJson('/api/auth/onboarding-tour');
        $tourGetRes->assertOk();
        $this->assertFalse($tourGetRes->json('completed'));

        $tourPostRes = $this->postJson('/api/auth/onboarding-tour', [
            'completed' => true,
            'step' => 5,
        ]);
        $tourPostRes->assertOk();
        $this->assertTrue($tourPostRes->json('onboarding_tour.completed'));

        // Verify status persisted
        $this->assertTrue($this->admin->fresh()->onboarding_tour['completed']);
    }
}
