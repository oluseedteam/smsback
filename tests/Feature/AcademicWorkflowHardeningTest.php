<?php

namespace Tests\Feature;

use App\Jobs\ReleaseReportCardJob;
use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AssessmentConfiguration;
use App\Models\CbtQuestion;
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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AcademicWorkflowHardeningTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private Teacher $teacher;
    private Teacher $otherTeacher;
    private Student $student;
    private Student $secondStudent;
    private SchoolClass $class;
    private SchoolClass $otherClass;
    private Subject $subject;
    private AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Queue::fake();
        Storage::fake('local');

        SchoolSetting::getSettings()->update([
            'school_name' => 'Original Academy',
            'require_class_teacher_review' => false,
            'missing_term_policy' => 'average_available',
        ]);

        $this->admin = Admin::create([
            'full_name' => 'Academic Administrator',
            'email' => 'academic-admin@example.test',
            'password' => Hash::make('password123'),
        ]);
        $this->teacher = Teacher::create([
            'full_name' => 'Assigned Class Teacher',
            'email' => 'assigned-teacher@example.test',
            'employee_id' => 'TCH-100',
            'password' => Hash::make('password123'),
        ]);
        $this->otherTeacher = Teacher::create([
            'full_name' => 'Unassigned Teacher',
            'email' => 'other-teacher@example.test',
            'employee_id' => 'TCH-200',
            'password' => Hash::make('password123'),
        ]);
        $this->student = Student::create([
            'full_name' => 'First Learner',
            'email' => 'first-learner@example.test',
            'student_id' => 'STU-100',
            'status' => 'active',
            'password' => Hash::make('password123'),
        ]);
        $this->secondStudent = Student::create([
            'full_name' => 'Second Learner',
            'email' => 'second-learner@example.test',
            'student_id' => 'STU-200',
            'status' => 'active',
            'password' => Hash::make('password123'),
        ]);
        $this->class = SchoolClass::create([
            'name' => 'JSS 2 A',
            'grade_level' => 'JSS 2',
            'teacher_id' => $this->teacher->id,
        ]);
        $this->otherClass = SchoolClass::create([
            'name' => 'JSS 3 B',
            'grade_level' => 'JSS 3',
            'teacher_id' => $this->otherTeacher->id,
        ]);
        $this->teacher->update(['class_teacher_of' => $this->class->id]);
        $this->student->classes()->sync([$this->class->id]);
        $this->secondStudent->classes()->sync([$this->class->id]);

        $this->subject = Subject::create(['name' => 'Mathematics', 'code' => 'MTH-02']);
        $this->class->subjects()->attach($this->subject->id, ['teacher_id' => $this->teacher->id]);
        $this->session = AcademicSession::create([
            'name' => '2026/2027',
            'is_current' => true,
            'terms' => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
        ]);

        foreach (ReportCardCalculationService::getDefaultGradingScale() as $scale) {
            GradingScale::create($scale);
        }

        $this->createAssessmentConfiguration('1st Term');
    }

    public function test_overlapping_grading_ranges_are_rejected_within_the_same_scope(): void
    {
        GradingScale::create([
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'grade' => 'A',
            'min_score' => 80,
            'max_score' => 100,
            'remark' => 'Excellent',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/grading-scales', [
                'school_class_id' => $this->class->id,
                'academic_session_id' => $this->session->id,
                'grade' => 'B',
                'min_score' => 70,
                'max_score' => 85,
                'remark' => 'Very Good',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('min_score');
    }

    public function test_cbt_hides_answers_and_scores_omissions_against_the_full_denominator(): void
    {
        $this->registerSubject($this->student, '1st Term');
        $test = CbtTest::create([
            'title' => 'Secure Mathematics CBT',
            'teacher_id' => $this->teacher->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->subject->id,
            'term' => '1st Term',
            'duration_minutes' => 30,
            'total_marks' => 60,
            'max_score' => 60,
            'attempt_limit' => 1,
            'status' => 'PUBLISHED',
            'is_published' => true,
            'start_time' => now()->subMinute(),
            'end_time' => now()->addHour(),
        ]);
        $firstQuestion = CbtQuestion::create([
            'cbt_test_id' => $test->id,
            'question' => 'Two plus two?',
            'option_a' => '4',
            'option_b' => '5',
            'option_c' => '6',
            'option_d' => '7',
            'correct_answer' => 'A',
            'points' => 1,
            'order' => 1,
            'status' => 'approved',
        ]);
        CbtQuestion::create([
            'cbt_test_id' => $test->id,
            'question' => 'Three plus three?',
            'option_a' => '5',
            'option_b' => '6',
            'option_c' => '7',
            'option_d' => '8',
            'correct_answer' => 'B',
            'points' => 1,
            'order' => 2,
            'status' => 'approved',
        ]);

        $this->actingAs($this->student, 'sanctum');
        $start = $this->postJson("/api/student/cbt-tests/{$test->id}/start")
            ->assertOk()
            ->json();
        foreach ($start['questions'] as $question) {
            $this->assertArrayNotHasKey('correct_answer', $question);
        }

        $this->postJson("/api/student/cbt-tests/{$test->id}/submit", [
            'answers' => [['question_id' => $firstQuestion->id, 'selected_answer' => 'A']],
        ])->assertOk()
            ->assertJsonPath('score', 50)
            ->assertJsonPath('correct', 1)
            ->assertJsonPath('wrong', 1);

        $this->postJson("/api/student/cbt-tests/{$test->id}/start")
            ->assertStatus(400);
    }

    public function test_required_class_teacher_review_is_scoped_and_enforced(): void
    {
        SchoolSetting::getSettings()->update(['require_class_teacher_review' => true]);
        $reportCard = $this->makeSubmittedReportCard($this->student, '1st Term');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$reportCard->id}/approve")
            ->assertStatus(422);

        $this->actingAs($this->otherTeacher, 'sanctum')
            ->postJson("/api/teacher/report-cards/{$reportCard->id}/review")
            ->assertForbidden();

        $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/teacher/report-cards/{$reportCard->id}/review")
            ->assertOk();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$reportCard->id}/approve")
            ->assertOk();
        $this->assertSame('approved', $reportCard->fresh()->status);
    }

    public function test_require_all_terms_blocks_incomplete_annual_results_and_never_auto_promotes(): void
    {
        SchoolSetting::getSettings()->update(['missing_term_policy' => 'require_all']);
        $this->createAssessmentConfiguration('3rd Term');
        $reportCard = $this->makeSubmittedReportCard($this->student, '3rd Term');
        $errors = app(ReportCardCalculationService::class)->validateResultCompleteness($reportCard);

        $this->assertNull($reportCard->cumulative_average);
        $this->assertNull($reportCard->promotion_status);
        $this->assertContains('Annual results require complete First, Second, and Third Term records.', $errors);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$reportCard->id}/approve")
            ->assertStatus(422);
    }

    public function test_released_snapshot_and_pdf_remain_immutable_after_live_configuration_changes(): void
    {
        $reportCard = $this->makeSubmittedReportCard($this->student, '1st Term');
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$reportCard->id}/approve")
            ->assertOk();
        $this->postJson("/api/admin/report-cards/{$reportCard->id}/release")
            ->assertOk();

        $released = $reportCard->fresh();
        $this->assertSame('released', $released->status);
        Storage::disk('local')->assertExists($released->pdf_path);
        $this->assertSame('%PDF', substr(Storage::disk('local')->get($released->pdf_path), 0, 4));

        SchoolSetting::getSettings()->update(['school_name' => 'Renamed Live School']);
        SubjectResult::where('student_id', $this->student->id)->update(['grade' => 'F', 'percentage' => 1]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/student/report-cards/{$released->id}")
            ->assertOk();
        $response->assertJsonPath('school.name', 'Original Academy');
        $response->assertJsonPath('results.0.grade', 'A');
    }

    public function test_batch_release_dispatches_one_non_blocking_job_per_approved_card(): void
    {
        $first = $this->makeSubmittedReportCard($this->student, '1st Term');
        $second = $this->makeSubmittedReportCard($this->secondStudent, '1st Term');

        $this->actingAs($this->admin, 'sanctum');
        $this->postJson("/api/admin/report-cards/{$first->id}/approve")->assertOk();
        $this->postJson("/api/admin/report-cards/{$second->id}/approve")->assertOk();

        $this->postJson('/api/admin/report-cards/release-batch', [
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
        ])->assertStatus(202)
            ->assertJsonPath('queued_count', 2);

        Queue::assertPushed(ReleaseReportCardJob::class, 2);
    }

    private function makeSubmittedReportCard(Student $student, string $term): ReportCard
    {
        $this->registerSubject($student, $term);
        $result = app(ReportCardCalculationService::class)->calculateSubjectResult(
            $student,
            $this->class,
            $this->subject,
            $this->session,
            $term,
            18,
            17,
            50,
            $this->teacher->id,
        );
        $result->update(['status' => 'submitted']);
        $reportCard = app(ReportCardCalculationService::class)->generateReportCard($student, $this->class, $this->session, $term);
        $reportCard->update(['status' => 'submitted']);

        return $reportCard->fresh();
    }

    private function registerSubject(Student $student, string $term): void
    {
        CourseRegistration::firstOrCreate([
            'student_id' => $student->id,
            'school_class_id' => $this->class->id,
            'subject_id' => $this->subject->id,
            'academic_session_id' => $this->session->id,
            'term' => $term,
        ], ['status' => 'registered']);
    }

    private function createAssessmentConfiguration(string $term): void
    {
        AssessmentConfiguration::firstOrCreate([
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'subject_id' => $this->subject->id,
            'term' => $term,
        ], [
            'ca1_max' => 20,
            'ca2_max' => 20,
            'exam_max' => 60,
            'total_max' => 100,
            'exam_method' => 'written',
        ]);
    }
}
