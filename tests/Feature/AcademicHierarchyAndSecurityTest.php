<?php

namespace Tests\Feature;

use App\Models\AcademicSection;
use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AssessmentConfiguration;
use App\Models\CbtQuestion;
use App\Models\CbtTest;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectResult;
use App\Models\Teacher;
use App\Services\ReportCardCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AcademicHierarchyAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Teacher $teacherA;
    protected Teacher $teacherB;
    protected Student $student;
    protected AcademicSection $sectionJunior;
    protected AcademicSection $sectionSenior;
    protected SchoolClass $classJss1;
    protected SchoolClass $classSs1;
    protected Subject $math;
    protected Subject $english;
    protected AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'full_name' => 'Admin Officer',
            'email' => 'admin@school.test',
            'password' => Hash::make('secret123'),
        ]);

        $this->teacherA = Teacher::create([
            'full_name' => 'Teacher Alpha',
            'email' => 'teacher.a@school.test',
            'employee_id' => 'TCH-001',
            'password' => Hash::make('secret123'),
        ]);

        $this->teacherB = Teacher::create([
            'full_name' => 'Teacher Beta',
            'email' => 'teacher.b@school.test',
            'employee_id' => 'TCH-002',
            'password' => Hash::make('secret123'),
        ]);

        $this->student = Student::create([
            'full_name' => 'Amara Okafor',
            'email' => 'amara@school.test',
            'student_id' => 'STD-2026-001',
            'gender' => 'female',
            'password' => Hash::make('secret123'),
        ]);

        $this->sectionJunior = AcademicSection::create([
            'name' => 'Junior Secondary',
            'description' => 'JSS 1 to JSS 3',
            'ordering' => 3,
            'status' => 'active',
        ]);

        $this->sectionSenior = AcademicSection::create([
            'name' => 'Senior Secondary',
            'description' => 'SS 1 to SS 3',
            'ordering' => 4,
            'status' => 'active',
        ]);

        $this->classJss1 = SchoolClass::create([
            'name' => 'JSS 1 Gold',
            'grade_level' => 'JSS 1',
            'academic_section_id' => $this->sectionJunior->id,
            'arm' => 'Gold',
            'academic_year' => '2026/2027',
            'teacher_id' => $this->teacherA->id,
        ]);

        $this->classSs1 = SchoolClass::create([
            'name' => 'SS 1 Science',
            'grade_level' => 'SS 1',
            'academic_section_id' => $this->sectionSenior->id,
            'arm' => 'Science',
            'academic_year' => '2026/2027',
            'teacher_id' => $this->teacherB->id,
        ]);

        $this->student->classes()->sync([$this->classJss1->id]);

        $this->math = Subject::create([
            'name' => 'Mathematics',
            'code' => 'MTH101',
            'academic_section_id' => $this->sectionJunior->id,
        ]);

        $this->english = Subject::create([
            'name' => 'English Language',
            'code' => 'ENG101',
            'academic_section_id' => $this->sectionJunior->id,
        ]);

        $this->classJss1->subjects()->attach($this->math->id, ['teacher_id' => $this->teacherA->id]);
        $this->classJss1->subjects()->attach($this->english->id, ['teacher_id' => $this->teacherB->id]);

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

    public function test_academic_sections_crud_and_class_bindings(): void
    {
        // 1. Admin creates section
        $res = $this->actingAs($this->admin, 'sanctum')->postJson('/api/academic-sections', [
            'name' => 'Primary Section',
            'description' => 'Basic 1 to Basic 6',
            'ordering' => 2,
            'status' => 'active',
        ]);
        $res->assertStatus(201);
        $this->assertDatabaseHas('academic_sections', ['name' => 'Primary Section']);

        // 2. Fetch sections
        $listRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/academic-sections');
        $listRes->assertStatus(200);
        $this->assertCount(3, $listRes->json());

        // 3. Class has section relation
        $this->assertEquals($this->sectionJunior->id, $this->classJss1->academicSection->id);
        $this->assertEquals('Gold', $this->classJss1->arm);
    }

    public function test_strict_teacher_subject_authorization_on_scoresheet(): void
    {
        // Student registers for both Math and English
        $this->actingAs($this->student, 'sanctum')->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->math->id, $this->english->id],
        ]);

        // Teacher B tries to access Math scoresheet (assigned to Teacher A)
        $this->actingAs($this->teacherB, 'sanctum');
        $unauthRes = $this->getJson("/api/teacher/scoresheet?school_class_id={$this->classJss1->id}&academic_session_id={$this->session->id}&term=1st Term&subject_id={$this->math->id}");
        $unauthRes->assertStatus(403);

        // Teacher B tries to save scores for Math -> 403 Forbidden
        $saveUnauth = $this->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->math->id,
            'scores' => [
                ['student_id' => $this->student->id, 'ca1_score' => 20, 'ca2_score' => 20, 'exam_score' => 60],
            ],
        ]);
        $saveUnauth->assertStatus(403);

        // Teacher B accesses English scoresheet (assigned to Teacher B) -> 200 OK
        $authRes = $this->getJson("/api/teacher/scoresheet?school_class_id={$this->classJss1->id}&academic_session_id={$this->session->id}&term=1st Term&subject_id={$this->english->id}");
        $authRes->assertStatus(200);

        // Teacher B saves scores for English -> 200 OK
        $saveAuth = $this->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->english->id,
            'scores' => [
                ['student_id' => $this->student->id, 'ca1_score' => 19, 'ca2_score' => 18, 'exam_score' => 54],
            ],
        ]);
        $saveAuth->assertStatus(200);

        $this->assertDatabaseHas('subject_results', [
            'student_id' => $this->student->id,
            'subject_id' => $this->english->id,
            'ca1_score' => 19,
            'ca2_score' => 18,
            'exam_score' => 54,
            'total_score' => 91,
        ]);
    }

    public function test_score_locking_prevents_modifications_after_release(): void
    {
        // 1. Student registers for English
        $this->actingAs($this->student, 'sanctum')->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->english->id],
        ]);

        // 2. Teacher B saves and submits
        $this->actingAs($this->teacherB, 'sanctum')->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->english->id,
            'scores' => [
                ['student_id' => $this->student->id, 'ca1_score' => 15, 'ca2_score' => 15, 'exam_score' => 50],
            ],
        ]);
        $this->postJson('/api/teacher/scoresheet/submit', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->english->id,
        ])->assertOk();

        // 3. Admin generates, approves and releases report card
        $this->actingAs($this->admin, 'sanctum');
        $batchRes = $this->postJson('/api/admin/report-cards/generate-batch', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
        ]);
        $batchRes->assertStatus(200);

        $card = ReportCard::first();
        $this->postJson("/api/admin/report-cards/{$card->id}/approve")->assertStatus(200);
        $this->postJson("/api/admin/report-cards/{$card->id}/release")->assertStatus(200);

        // 4. Teacher B tries to edit scores on released results -> 422 Unprocessable Entity
        $this->actingAs($this->teacherB, 'sanctum');
        $blockedSave = $this->postJson('/api/teacher/scoresheet/save', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_id' => $this->english->id,
            'scores' => [
                ['student_id' => $this->student->id, 'ca1_score' => 20, 'ca2_score' => 20, 'exam_score' => 60],
            ],
        ]);
        $blockedSave->assertStatus(422);
        $this->assertStringContainsString('approved or released', $blockedSave->json('message'));
    }

    public function test_cbt_exam_window_and_submission_sync_to_marksheet(): void
    {
        // 1. Student registers for Math
        $this->actingAs($this->student, 'sanctum')->postJson('/api/student/course-registration', [
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->math->id],
        ]);

        // 2. Configure Assessment for CBT
        AssessmentConfiguration::create([
            'school_class_id' => $this->classJss1->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->math->id,
            'term' => '1st Term',
            'ca1_max' => 20,
            'ca2_max' => 20,
            'exam_max' => 60,
            'total_max' => 100,
            'exam_method' => 'cbt',
        ]);

        // 3. Create CBT Test with questions
        $test = CbtTest::create([
            'title' => 'JSS 1 Math 1st Term CBT Exam',
            'school_class_id' => $this->classJss1->id,
            'subject_id' => $this->math->id,
            'teacher_id' => $this->teacherA->id,
            'academic_session_id' => $this->session->id,
            'academic_section_id' => $this->sectionJunior->id,
            'term' => '1st Term',
            'duration_minutes' => 30,
            'total_marks' => 20,
            'pass_percentage' => 50,
            'is_published' => true,
            'attempt_limit' => 1,
            'start_time' => now()->subHours(1),
            'end_time' => now()->addHours(2),
        ]);

        $q1 = CbtQuestion::create([
            'cbt_test_id' => $test->id,
            'question' => 'What is 15 + 25?',
            'option_a' => '30',
            'option_b' => '40',
            'option_c' => '50',
            'option_d' => '60',
            'correct_answer' => 'B',
            'points' => 10,
        ]);

        $q2 = CbtQuestion::create([
            'cbt_test_id' => $test->id,
            'question' => 'What is 12 x 5?',
            'option_a' => '50',
            'option_b' => '55',
            'option_c' => '60',
            'option_d' => '65',
            'correct_answer' => 'C',
            'points' => 10,
        ]);

        // 4. Student takes CBT test
        $this->actingAs($this->student, 'sanctum');
        $startRes = $this->postJson("/api/student/cbt-tests/{$test->id}/start");
        $startRes->assertStatus(200);

        // Submit 1 correct, 1 wrong (50%)
        $submitRes = $this->postJson("/api/student/cbt-tests/{$test->id}/submit", [
            'answers' => [
                ['question_id' => $q1->id, 'selected_answer' => 'B'], // Correct (10 points)
                ['question_id' => $q2->id, 'selected_answer' => 'A'], // Wrong (0 points)
            ],
        ]);
        $submitRes->assertStatus(200);
        $this->assertEquals(50.0, (float) $submitRes->json('score'));

        // 5. Verify SubjectResult has scaled CBT exam score (50% of 60 max = 30.0)
        $subResult = SubjectResult::where('student_id', $this->student->id)
            ->where('subject_id', $this->math->id)
            ->first();

        $this->assertNotNull($subResult);
        $this->assertEquals(30.0, (float) $subResult->exam_score);
    }
}
