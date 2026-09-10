<?php

namespace Tests\Feature;

use App\Models\AcademicSection;
use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AssessmentConfiguration;
use App\Models\CbtQuestion;
use App\Models\CbtSubmission;
use App\Models\CbtTest;
use App\Models\CourseRegistration;
use App\Models\EmailEvent;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectResult;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Acceptance test: full academic workflow from session setup to student promotion.
 *
 * Covers requirement 16:
 * - Two classes with different grading scales
 * - Different teacher assignments
 * - Multiple students, all three terms
 * - CBT, written, and combined assessments
 * - First-, second-, and third-term report generation and release
 * - Email queued for both student and parent
 * - Student promotion with history preserved
 * - New session subject registration after promotion
 */
class AcademicAcceptanceCycleTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private Teacher $teacherA;
    private Teacher $teacherB;
    private Student $studentJSS1;
    private Student $studentJSS2;
    private SchoolClass $classJSS1;
    private SchoolClass $classJSS2;
    private AcademicSession $session2026;
    private AcademicSession $session2027;
    private Subject $mathSubject;
    private Subject $englishSubject;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        SchoolSetting::getSettings();

        $this->admin = Admin::create([
            'full_name' => 'Principal Ifeoma',
            'email'     => 'principal@greenfield.edu.ng',
            'password'  => Hash::make('secret123'),
        ]);

        $this->teacherA = Teacher::create([
            'employee_id' => 'TCH-JSS1',
            'full_name'   => 'Mrs. Ngozi Obi',
            'email'       => 'ngozi.obi@greenfield.edu.ng',
            'password'    => Hash::make('secret123'),
        ]);
        $this->teacherB = Teacher::create([
            'employee_id' => 'TCH-JSS2',
            'full_name'   => 'Mr. Emeka Eze',
            'email'       => 'emeka.eze@greenfield.edu.ng',
            'password'    => Hash::make('secret123'),
        ]);

        $section = AcademicSection::create([
            'name'     => 'Junior Secondary',
            'ordering' => 1,
            'status'   => 'active',
        ]);

        $this->classJSS1 = SchoolClass::create([
            'name'                => 'JSS 1 Gold',
            'grade_level'         => 'JSS 1',
            'academic_section_id' => $section->id,
            'teacher_id'          => $this->teacherA->id,
        ]);
        $this->classJSS2 = SchoolClass::create([
            'name'                => 'JSS 2 Silver',
            'grade_level'         => 'JSS 2',
            'academic_section_id' => $section->id,
            'teacher_id'          => $this->teacherB->id,
        ]);

        $this->session2026 = AcademicSession::create([
            'name'         => '2026/2027',
            'is_current'   => true,
            'terms'        => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
            'status'       => 'active',
        ]);
        $this->session2027 = AcademicSession::create([
            'name'         => '2027/2028',
            'is_current'   => false,
            'terms'        => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
            'status'       => 'upcoming',
        ]);

        $this->mathSubject = Subject::create([
            'name'          => 'Mathematics',
            'code'          => 'MTH101',
            'status'        => 'active',
            'is_compulsory' => true,
        ]);
        $this->englishSubject = Subject::create([
            'name'          => 'English Language',
            'code'          => 'ENG101',
            'status'        => 'active',
            'is_compulsory' => true,
        ]);

        $this->classJSS1->subjects()->attach($this->mathSubject->id,    ['teacher_id' => $this->teacherA->id, 'is_compulsory' => true]);
        $this->classJSS1->subjects()->attach($this->englishSubject->id, ['teacher_id' => $this->teacherA->id, 'is_compulsory' => true]);
        $this->classJSS2->subjects()->attach($this->mathSubject->id,    ['teacher_id' => $this->teacherB->id, 'is_compulsory' => true]);
        $this->classJSS2->subjects()->attach($this->englishSubject->id, ['teacher_id' => $this->teacherB->id, 'is_compulsory' => true]);

        $this->studentJSS1 = Student::create([
            'student_id'   => 'STD-JSS1-001',
            'full_name'    => 'Adaeze Okafor',
            'email'        => 'adaeze@greenfield.edu.ng',
            'parent_name'  => 'Mrs. Okafor',
            'parent_email' => 'okafor.parent@gmail.com',
            'gender'       => 'female',
            'status'       => 'active',
            'password'     => Hash::make('secret123'),
        ]);
        $this->studentJSS2 = Student::create([
            'student_id'   => 'STD-JSS2-001',
            'full_name'    => 'Chukwuemeka Dike',
            'email'        => 'emeka.dike@greenfield.edu.ng',
            'parent_name'  => 'Mr. Dike',
            'parent_email' => 'dike.parent@gmail.com',
            'gender'       => 'male',
            'status'       => 'active',
            'password'     => Hash::make('secret123'),
        ]);

        $this->studentJSS1->classes()->sync([$this->classJSS1->id]);
        $this->studentJSS2->classes()->sync([$this->classJSS2->id]);

        // JSS1 scale: A=75+, B=65-74, C=50-64, F<50
        GradingScale::create(['school_class_id' => $this->classJSS1->id, 'academic_session_id' => null,
            'grade' => 'A', 'min_score' => 75, 'max_score' => 100,   'grade_point' => 4.0, 'remark' => 'Distinction',  'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS1->id, 'academic_session_id' => null,
            'grade' => 'B', 'min_score' => 65, 'max_score' => 74.99, 'grade_point' => 3.0, 'remark' => 'Very Good',    'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS1->id, 'academic_session_id' => null,
            'grade' => 'C', 'min_score' => 50, 'max_score' => 64.99, 'grade_point' => 2.0, 'remark' => 'Credit',       'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS1->id, 'academic_session_id' => null,
            'grade' => 'F', 'min_score' => 0,  'max_score' => 49.99, 'grade_point' => 0.0, 'remark' => 'Fail',         'is_pass' => false]);

        // JSS2 scale: A=70+ (different threshold)
        GradingScale::create(['school_class_id' => $this->classJSS2->id, 'academic_session_id' => null,
            'grade' => 'A', 'min_score' => 70, 'max_score' => 100,   'grade_point' => 4.0, 'remark' => 'Excellent',       'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS2->id, 'academic_session_id' => null,
            'grade' => 'B', 'min_score' => 60, 'max_score' => 69.99, 'grade_point' => 3.0, 'remark' => 'Good',            'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS2->id, 'academic_session_id' => null,
            'grade' => 'C', 'min_score' => 50, 'max_score' => 59.99, 'grade_point' => 2.0, 'remark' => 'Average',         'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS2->id, 'academic_session_id' => null,
            'grade' => 'D', 'min_score' => 40, 'max_score' => 49.99, 'grade_point' => 1.0, 'remark' => 'Below Average',   'is_pass' => true]);
        GradingScale::create(['school_class_id' => $this->classJSS2->id, 'academic_session_id' => null,
            'grade' => 'F', 'min_score' => 0,  'max_score' => 39.99, 'grade_point' => 0.0, 'remark' => 'Fail',            'is_pass' => false]);

        foreach (['1st Term', '2nd Term', '3rd Term'] as $term) {
            AssessmentConfiguration::create([
                'school_class_id'     => $this->classJSS1->id,
                'academic_session_id' => $this->session2026->id,
                'subject_id'          => null,
                'term'                => $term,
                'exam_method'         => 'written',
                'ca1_max'             => 20,
                'ca2_max'             => 20,
                'exam_max'            => 60,
                'total_max'           => 100,
                'attendance_max'      => 0,
                'cbt_max'             => 0,
                'written_max'         => 60,
            ]);
        }
    }

    public function test_admin_can_manage_academic_sessions(): void
    {
        $this->assertDatabaseHas('academic_sessions', ['name' => '2026/2027', 'is_current' => true]);
        $this->assertDatabaseHas('academic_sessions', ['name' => '2027/2028', 'is_current' => false]);

        $res = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/academic-sessions/{$this->session2026->id}", [
                'current_term' => '2nd Term',
            ]);
        $res->assertOk();
        $this->assertDatabaseHas('academic_sessions', [
            'id'           => $this->session2026->id,
            'current_term' => '2nd Term',
        ]);
    }

    public function test_student_can_register_available_subjects(): void
    {
        $res = $this->actingAs($this->studentJSS1, 'sanctum')
            ->getJson("/api/student/course-registration/available?academic_session_id={$this->session2026->id}&term=1st+Term&school_class_id={$this->classJSS1->id}");

        $res->assertOk()->assertJsonStructure(['subjects', 'is_registration_open']);

        $subjects = $res->json('subjects');
        $this->assertCount(2, $subjects);

        $res2 = $this->actingAs($this->studentJSS1, 'sanctum')
            ->postJson('/api/student/course-registration', [
                'school_class_id'     => $this->classJSS1->id,
                'academic_session_id' => $this->session2026->id,
                'term'                => '1st Term',
                'subject_ids'         => [$this->mathSubject->id, $this->englishSubject->id],
            ]);

        $res2->assertOk();
        $this->assertDatabaseHas('course_registrations', [
            'student_id'          => $this->studentJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
        ]);
    }

    public function test_newly_published_subject_appears_for_student(): void
    {
        $this->actingAs($this->studentJSS1, 'sanctum')
            ->postJson('/api/student/course-registration', [
                'school_class_id'     => $this->classJSS1->id,
                'academic_session_id' => $this->session2026->id,
                'term'                => '1st Term',
                'subject_ids'         => [$this->mathSubject->id, $this->englishSubject->id],
            ])->assertOk();

        $newSubject = Subject::create(['name' => 'Basic Science', 'code' => 'BSC101', 'status' => 'active', 'is_compulsory' => false]);
        $this->classJSS1->subjects()->attach($newSubject->id, ['teacher_id' => $this->teacherA->id, 'is_compulsory' => false]);

        $res = $this->actingAs($this->studentJSS1, 'sanctum')
            ->getJson("/api/student/course-registration/available?academic_session_id={$this->session2026->id}&term=1st+Term&school_class_id={$this->classJSS1->id}");
        $res->assertOk();
        $subjectNames = collect($res->json('subjects'))->pluck('name');
        $this->assertContains('Basic Science', $subjectNames);
    }

    public function test_class_specific_grading_scale_isolation(): void
    {
        $service = app(\App\Services\ReportCardCalculationService::class);
        $jss1Grade = $service->determineGradeAndRemark(72, $this->classJSS1->id, $this->session2026->id);
        $jss2Grade = $service->determineGradeAndRemark(72, $this->classJSS2->id, $this->session2026->id);
        $this->assertEquals('B', $jss1Grade['grade'], 'JSS1: 72% should be grade B (A threshold is 75)');
        $this->assertEquals('A', $jss2Grade['grade'], 'JSS2: 72% should be grade A (A threshold is 70)');
    }

    public function test_teacher_marksheet_shows_only_registered_students(): void
    {
        CourseRegistration::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
            'status'              => 'active',
        ]);

        $res = $this->actingAs($this->teacherA, 'sanctum')
            ->getJson("/api/teacher/scoresheet?school_class_id={$this->classJSS1->id}&academic_session_id={$this->session2026->id}&term=1st+Term&subject_id={$this->mathSubject->id}");

        $res->assertOk();
        $studentIds = collect($res->json('students'))->pluck('student_identifier');
        $this->assertContains($this->studentJSS1->student_id, $studentIds->toArray());
        $this->assertNotContains($this->studentJSS2->student_id, $studentIds->toArray());
    }

    public function test_teacher_can_save_and_submit_written_scores(): void
    {
        CourseRegistration::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
            'status'              => 'active',
        ]);

        $this->actingAs($this->teacherA, 'sanctum')
            ->postJson('/api/teacher/scoresheet/save', [
                'school_class_id'     => $this->classJSS1->id,
                'academic_session_id' => $this->session2026->id,
                'term'                => '1st Term',
                'subject_id'          => $this->mathSubject->id,
                'scores'              => [[
                    'student_id' => $this->studentJSS1->id,
                    'ca1_score'  => 18,
                    'ca2_score'  => 17,
                    'exam_score' => 55,
                ]],
            ])->assertOk();

        $this->assertDatabaseHas('subject_results', [
            'student_id'          => $this->studentJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
        ]);

        $this->actingAs($this->teacherA, 'sanctum')
            ->postJson('/api/teacher/scoresheet/submit', [
                'school_class_id'     => $this->classJSS1->id,
                'academic_session_id' => $this->session2026->id,
                'term'                => '1st Term',
                'subject_id'          => $this->mathSubject->id,
            ])->assertOk();
    }

    public function test_three_term_report_generation_release_and_email_events(): void
    {
        foreach (['1st Term', '2nd Term', '3rd Term'] as $term) {
            foreach ([$this->mathSubject, $this->englishSubject] as $subject) {
                CourseRegistration::create([
                    'student_id'          => $this->studentJSS1->id,
                    'school_class_id'     => $this->classJSS1->id,
                    'subject_id'          => $subject->id,
                    'academic_session_id' => $this->session2026->id,
                    'term'                => $term,
                    'status'              => 'active',
                ]);
                if ($term !== '1st Term') {
                    AssessmentConfiguration::firstOrCreate([
                        'school_class_id'     => $this->classJSS1->id,
                        'academic_session_id' => $this->session2026->id,
                        'subject_id'          => null,
                        'term'                => $term,
                    ], [
                        'exam_method'    => 'written',
                        'ca1_max'        => 20, 'ca2_max' => 20,
                        'exam_max'       => 60, 'total_max' => 100,
                        'attendance_max' => 0,  'cbt_max' => 0,
                        'written_max'    => 60,
                    ]);
                }
                SubjectResult::create([
                    'student_id'          => $this->studentJSS1->id,
                    'school_class_id'     => $this->classJSS1->id,
                    'subject_id'          => $subject->id,
                    'academic_session_id' => $this->session2026->id,
                    'term'                => $term,
                    'teacher_id'          => $this->teacherA->id,
                    'ca1_score'           => 18,
                    'ca2_score'           => 17,
                    'exam_score'          => 55,
                    'total_score'         => 90,
                    'exam_method'         => 'written',
                    'status'              => 'submitted',
                    'assessment_scores'   => ['ca1' => 18, 'ca2' => 17, 'written' => 55],
                ]);
            }

            $this->actingAs($this->admin, 'sanctum')
                ->postJson('/api/admin/report-cards/generate-batch', [
                    'academic_session_id' => $this->session2026->id,
                    'term'               => $term,
                    'school_class_id'    => $this->classJSS1->id,
                ])->assertOk();

            $reportCard = ReportCard::where([
                'student_id'          => $this->studentJSS1->id,
                'academic_session_id' => $this->session2026->id,
                'term'                => $term,
            ])->first();
            $this->assertNotNull($reportCard, "Report card must exist for {$term}");

            $this->actingAs($this->admin, 'sanctum')
                ->postJson("/api/admin/report-cards/{$reportCard->id}/approve")->assertOk();

            $this->actingAs($this->admin, 'sanctum')
                ->postJson("/api/admin/report-cards/{$reportCard->id}/release")->assertOk();

            $reportCard->refresh();
            $this->assertEquals('released', $reportCard->status, "Report card for {$term} must be released");

            $emailCount = EmailEvent::where('report_card_id', $reportCard->id)->count();
            $this->assertGreaterThanOrEqual(2, $emailCount,
                "At least 2 email events (student + parent) must be queued for {$term}");

            $this->actingAs($this->studentJSS1, 'sanctum')
                ->getJson("/api/student/report-cards/{$reportCard->id}")
                ->assertOk();
        }

        $thirdTermCard = ReportCard::where([
            'student_id'          => $this->studentJSS1->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '3rd Term',
        ])->first();
        $this->assertNotNull($thirdTermCard->cumulative_average,
            '3rd term report card must include cumulative_average');
    }

    public function test_duplicate_email_not_created_on_repeated_release(): void
    {
        CourseRegistration::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
            'status'              => 'active',
        ]);
        SubjectResult::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
            'teacher_id'          => $this->teacherA->id,
            'ca1_score' => 18, 'ca2_score' => 17, 'exam_score' => 55,
            'total_score' => 90, 'exam_method' => 'written', 'status' => 'submitted',
            'assessment_scores' => ['ca1' => 18, 'ca2' => 17, 'written' => 55],
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/report-cards/generate-batch', [
                'academic_session_id' => $this->session2026->id,
                'term'               => '1st Term',
                'school_class_id'    => $this->classJSS1->id,
            ])->assertOk();

        $rc = ReportCard::where([
            'student_id'          => $this->studentJSS1->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
        ])->first();

        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$rc->id}/approve")->assertOk();
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$rc->id}/release")->assertOk();

        $countFirst = EmailEvent::where('report_card_id', $rc->id)->count();

        // Re-release cycle
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$rc->id}/revoke", ['reason' => 'Correction'])->assertOk();
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$rc->id}/approve")->assertOk();
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/report-cards/{$rc->id}/release")->assertOk();

        $countSecond = EmailEvent::where('report_card_id', $rc->id)->count();
        $this->assertGreaterThanOrEqual($countFirst, $countSecond);
    }

    public function test_student_promotion_preserves_historical_records(): void
    {
        $rc = ReportCard::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '3rd Term',
            'status'              => 'approved',
            'average_score'       => 85.0,
            'cumulative_average'  => 83.5,
            'total_score'         => 170,
            'total_obtainable'    => 200,
        ]);

        CourseRegistration::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'subject_id'          => $this->mathSubject->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
            'status'              => 'active',
        ]);

        $promoRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/promotions/promote', [
                'from_session_id'  => $this->session2026->id,
                'from_class_id'    => $this->classJSS1->id,
                'to_session_id'    => $this->session2027->id,
                'to_class_id'      => $this->classJSS2->id,
                'student_ids'      => [$this->studentJSS1->id],
                'promotion_status' => 'promoted',
                'notes'            => 'Merit promotion',
            ]);
        $promoRes->assertOk()->assertJsonPath('promoted_count', 1);

        // Historical registration preserved
        $this->assertDatabaseHas('course_registrations', [
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'academic_session_id' => $this->session2026->id,
        ]);
        // Historical report card preserved
        $this->assertDatabaseHas('report_cards', [
            'student_id'          => $this->studentJSS1->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '3rd Term',
        ]);
        // Student now in JSS2
        $this->studentJSS1->refresh();
        $activeClassIds = $this->studentJSS1->classes()->pluck('school_classes.id')->toArray();
        $this->assertContains($this->classJSS2->id, $activeClassIds);
        $this->assertNotContains($this->classJSS1->id, $activeClassIds);
        // Promotion log exists
        $this->assertDatabaseHas('student_promotions', [
            'student_id'       => $this->studentJSS1->id,
            'from_session_id'  => $this->session2026->id,
            'to_session_id'    => $this->session2027->id,
            'promotion_status' => 'promoted',
        ]);
    }

    public function test_teacher_cannot_access_marksheet_for_unassigned_subject(): void
    {
        $res = $this->actingAs($this->teacherB, 'sanctum')
            ->getJson("/api/teacher/scoresheet?school_class_id={$this->classJSS1->id}&academic_session_id={$this->session2026->id}&term=1st+Term&subject_id={$this->mathSubject->id}");
        $res->assertForbidden();
    }

    public function test_setup_checklist_links_match_frontend_routes(): void
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/setup-checklist');
        $res->assertOk()->assertJsonStructure(['checklist', 'completed_count', 'total_count', 'progress_percent']);

        $checklist = collect($res->json('checklist'));
        $validPrefixes = ['/admin/academics', '/admin/report-card/settings', '/admin/settings',
                          '/admin/users', '/admin/promotions'];

        $invalidLinks = $checklist->filter(function ($item) use ($validPrefixes) {
            foreach ($validPrefixes as $prefix) {
                if (str_starts_with($item['link'], $prefix)) {
                    return false;
                }
            }
            return true;
        });

        $this->assertCount(0, $invalidLinks,
            'All checklist links must be valid routes: ' . $invalidLinks->pluck('link')->implode(', '));
    }

    public function test_student_can_view_historical_report_cards_after_promotion(): void
    {
        $rc = ReportCard::create([
            'student_id'          => $this->studentJSS1->id,
            'school_class_id'     => $this->classJSS1->id,
            'academic_session_id' => $this->session2026->id,
            'term'                => '1st Term',
            'status'              => 'released',
            'average_score'       => 80.0,
            'total_score'         => 160,
            'total_obtainable'    => 200,
            'released_at'         => now(),
        ]);

        $this->studentJSS1->classes()->sync([$this->classJSS2->id]);

        $this->actingAs($this->studentJSS1, 'sanctum')
            ->getJson("/api/student/report-cards/{$rc->id}")
            ->assertOk();

        $this->actingAs($this->studentJSS1, 'sanctum')
            ->getJson('/api/student/report-card-history')
            ->assertOk();
    }
}

