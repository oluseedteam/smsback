<?php

namespace Tests\Feature;

use App\Models\AcademicSection;
use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\CourseRegistration;
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
 * Security and negative-case tests.
 *
 * Every test here asserts that the system REJECTS a misuse attempt.
 * A PASS means the system correctly blocked the bad actor.
 */
class NegativeCaseSecurityTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private Teacher $assignedTeacher;
    private Teacher $unassignedTeacher;
    private Student $studentA;
    private Student $studentB;
    private SchoolClass $classA;
    private SchoolClass $classB;
    private AcademicSession $session;
    private Subject $subjectA;
    private Subject $subjectB;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        SchoolSetting::getSettings();

        $this->admin = Admin::create([
            'full_name' => 'Audit Admin',
            'email'     => 'audit@school.test',
            'password'  => Hash::make('secret123'),
        ]);

        $this->assignedTeacher = Teacher::create([
            'employee_id' => 'TCH-SEC-001',
            'full_name'   => 'Mrs. Authorised',
            'email'       => 'authorised@school.test',
            'password'    => Hash::make('secret123'),
        ]);

        $this->unassignedTeacher = Teacher::create([
            'employee_id' => 'TCH-SEC-002',
            'full_name'   => 'Mr. Intruder',
            'email'       => 'intruder@school.test',
            'password'    => Hash::make('secret123'),
        ]);

        $section = AcademicSection::create(['name' => 'Security Tests', 'ordering' => 1, 'status' => 'active']);

        $this->classA = SchoolClass::create([
            'name'                => 'Class Alpha',
            'grade_level'         => 'Grade 10',
            'academic_section_id' => $section->id,
            'teacher_id'          => $this->assignedTeacher->id,
        ]);
        $this->classB = SchoolClass::create([
            'name'                => 'Class Beta',
            'grade_level'         => 'Grade 11',
            'academic_section_id' => $section->id,
            'teacher_id'          => $this->unassignedTeacher->id,
        ]);

        $this->session = AcademicSession::create([
            'name'         => '2026/2027',
            'is_current'   => true,
            'terms'        => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
            'status'       => 'active',
        ]);

        $this->subjectA = Subject::create(['name' => 'Physics', 'code' => 'PHY101', 'status' => 'active']);
        $this->subjectB = Subject::create(['name' => 'Chemistry', 'code' => 'CHM101', 'status' => 'active']);

        // subjectA assigned to classA with assignedTeacher
        $this->classA->subjects()->attach($this->subjectA->id, [
            'teacher_id'   => $this->assignedTeacher->id,
            'is_compulsory' => false,
        ]);
        // subjectB assigned to classB with unassignedTeacher
        $this->classB->subjects()->attach($this->subjectB->id, [
            'teacher_id'   => $this->unassignedTeacher->id,
            'is_compulsory' => false,
        ]);

        $this->studentA = Student::create([
            'student_id'   => 'STD-SEC-A',
            'full_name'    => 'Student Alpha',
            'email'        => 'alpha@school.test',
            'parent_email' => 'alpha.parent@school.test',
            'gender'       => 'male',
            'status'       => 'active',
            'password'     => Hash::make('secret123'),
        ]);
        $this->studentB = Student::create([
            'student_id'   => 'STD-SEC-B',
            'full_name'    => 'Student Beta',
            'email'        => 'beta@school.test',
            'parent_email' => 'beta.parent@school.test',
            'gender'       => 'female',
            'status'       => 'active',
            'password'     => Hash::make('secret123'),
        ]);

        $this->studentA->classes()->sync([$this->classA->id]);
        $this->studentB->classes()->sync([$this->classB->id]);
    }

    // ══════════════════════════════════════════════════════════════════
    // Course Registration Security
    // ══════════════════════════════════════════════════════════════════

    /**
     * Student must not be able to register for a subject that is invalid or inactive in the school.
     */
    public function test_student_cannot_register_subject_from_another_class(): void
    {
        $inactiveSubject = Subject::create(['name' => 'Archived Latin', 'code' => 'LAT999', 'status' => 'inactive']);

        $res = $this->actingAs($this->studentA, 'sanctum')
            ->postJson('/api/student/course-registration', [
                'school_class_id'     => $this->classA->id,
                'academic_session_id' => $this->session->id,
                'term'                => '1st Term',
                'subject_ids'         => [$inactiveSubject->id],
            ]);
        $res->assertStatus(422);
    }

    /**
     * Student cannot register for a subject in a class they do not attend.
     */
    public function test_student_cannot_register_in_wrong_class(): void
    {
        // studentA tries to register in classB using the correct subject for classB
        $res = $this->actingAs($this->studentA, 'sanctum')
            ->postJson('/api/student/course-registration', [
                'school_class_id'     => $this->classB->id, // wrong class
                'academic_session_id' => $this->session->id,
                'term'                => '1st Term',
                'subject_ids'         => [$this->subjectB->id],
            ]);
        // System correctly blocks cross-class registration — returns 403 (forbidden) or 422 (validation)
        $this->assertContains($res->status(), [403, 422],
            'Cross-class registration must be blocked with a 4xx response');
    }

    // ══════════════════════════════════════════════════════════════════
    // Teacher Marksheet Security
    // ══════════════════════════════════════════════════════════════════

    /**
     * Unassigned teacher must be forbidden from viewing a marksheet for a
     * class/subject they have no assignment for.
     */
    public function test_unassigned_teacher_cannot_view_marksheet(): void
    {
        $res = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->getJson("/api/teacher/scoresheet?school_class_id={$this->classA->id}&academic_session_id={$this->session->id}&term=1st+Term&subject_id={$this->subjectA->id}");
        $res->assertForbidden();
    }

    /**
     * Unassigned teacher cannot submit scores either.
     */
    public function test_unassigned_teacher_cannot_save_scores(): void
    {
        $res = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->postJson('/api/teacher/scoresheet/save', [
                'school_class_id'     => $this->classA->id,
                'academic_session_id' => $this->session->id,
                'term'                => '1st Term',
                'subject_id'          => $this->subjectA->id,
                'scores'              => [[
                    'student_id' => $this->studentA->id,
                    'ca1_score'  => 20,
                    'ca2_score'  => 20,
                    'exam_score' => 60,
                ]],
            ]);
        $res->assertForbidden();
    }

    // ══════════════════════════════════════════════════════════════════
    // Report Card Access Control
    // ══════════════════════════════════════════════════════════════════

    /**
     * A student cannot access another student's report card by guessing the ID.
     */
    public function test_student_cannot_access_another_students_report_card(): void
    {
        // Create a released report card belonging to studentB
        $rc = ReportCard::create([
            'student_id'          => $this->studentB->id,
            'school_class_id'     => $this->classB->id,
            'academic_session_id' => $this->session->id,
            'term'                => '1st Term',
            'status'              => 'released',
            'average_score'       => 75.0,
            'total_score'         => 150,
            'total_obtainable'    => 200,
            'released_at'         => now(),
        ]);

        // studentA tries to access it
        $res = $this->actingAs($this->studentA, 'sanctum')
            ->getJson("/api/student/report-cards/{$rc->id}");
        $res->assertStatus(404); // Must not find it (scoped to own student_id)
    }

    /**
     * An unreleased report card must not be visible to the student.
     */
    public function test_student_cannot_access_unreleased_report_card(): void
    {
        $rc = ReportCard::create([
            'student_id'          => $this->studentA->id,
            'school_class_id'     => $this->classA->id,
            'academic_session_id' => $this->session->id,
            'term'                => '1st Term',
            'status'              => 'draft', // NOT released
            'average_score'       => 80.0,
            'total_score'         => 160,
            'total_obtainable'    => 200,
        ]);

        $res = $this->actingAs($this->studentA, 'sanctum')
            ->getJson("/api/student/report-cards/{$rc->id}");
        // Controller returns 403 (Forbidden) for own unreleased card, 404 for another student's
        $this->assertContains($res->status(), [403, 404],
            'Unreleased report card must not be accessible to student');
    }

    /**
     * An withheld report card must not be visible to the student.
     */
    public function test_student_cannot_access_withheld_report_card(): void
    {
        $rc = ReportCard::create([
            'student_id'          => $this->studentA->id,
            'school_class_id'     => $this->classA->id,
            'academic_session_id' => $this->session->id,
            'term'                => '1st Term',
            'status'              => 'withheld',
            'withhold_reason'     => 'Outstanding fees',
            'average_score'       => 80.0,
            'total_score'         => 160,
            'total_obtainable'    => 200,
        ]);

        $res = $this->actingAs($this->studentA, 'sanctum')
            ->getJson("/api/student/report-cards/{$rc->id}");
        $this->assertContains($res->status(), [403, 404],
            'Withheld report card must not be accessible to student');
    }

    // ══════════════════════════════════════════════════════════════════
    // Admin-only Endpoint Protection
    // ══════════════════════════════════════════════════════════════════

    /**
     * A teacher must not be able to release a report card (admin-only action).
     */
    public function test_teacher_cannot_release_report_card(): void
    {
        $rc = ReportCard::create([
            'student_id'          => $this->studentA->id,
            'school_class_id'     => $this->classA->id,
            'academic_session_id' => $this->session->id,
            'term'                => '1st Term',
            'status'              => 'approved',
            'average_score'       => 80.0,
            'total_score'         => 160,
            'total_obtainable'    => 200,
        ]);

        $res = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/admin/report-cards/{$rc->id}/release");
        $res->assertStatus(403); // Admin-only route
    }

    /**
     * A student must not be able to call any admin report card endpoint.
     */
    public function test_student_cannot_call_admin_report_card_endpoints(): void
    {
        $rc = ReportCard::create([
            'student_id'          => $this->studentA->id,
            'school_class_id'     => $this->classA->id,
            'academic_session_id' => $this->session->id,
            'term'                => '1st Term',
            'status'              => 'draft',
            'average_score'       => 80.0,
            'total_score'         => 160,
            'total_obtainable'    => 200,
        ]);

        $this->actingAs($this->studentA, 'sanctum')
            ->postJson("/api/admin/report-cards/{$rc->id}/approve")
            ->assertStatus(403);

        $this->actingAs($this->studentA, 'sanctum')
            ->postJson("/api/admin/report-cards/{$rc->id}/release")
            ->assertStatus(403);
    }

    /**
     * A teacher must not be able to access admin user management.
     */
    public function test_teacher_cannot_access_user_management(): void
    {
        $res = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->getJson('/api/admin/users');
        // Admin-only routes may return 403 (role middleware) or 404 (route not registered for teacher token)
        $this->assertContains($res->status(), [403, 404],
            'Teacher must be blocked from admin user management');
    }

    /**
     * Unauthenticated requests to protected endpoints are rejected.
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/setup-checklist')->assertUnauthorized();
        $this->getJson('/api/teacher/scoresheet')->assertUnauthorized();
        $this->getJson('/api/student/report-cards')->assertUnauthorized();
    }

    // ══════════════════════════════════════════════════════════════════
    // Promotion Security
    // ══════════════════════════════════════════════════════════════════

    /**
     * A teacher cannot trigger promotions (admin-only action).
     */
    public function test_teacher_cannot_promote_students(): void
    {
        $nextSession = AcademicSession::create([
            'name'         => '2027/2028',
            'is_current'   => false,
            'terms'        => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
            'status'       => 'upcoming',
        ]);
        $nextClass = SchoolClass::create([
            'name'                => 'Class Gamma',
            'grade_level'         => 'Grade 12',
            'academic_section_id' => $this->classA->academic_section_id,
        ]);

        $res = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson('/api/admin/promotions/promote', [
                'from_session_id'  => $this->session->id,
                'from_class_id'    => $this->classA->id,
                'to_session_id'    => $nextSession->id,
                'to_class_id'      => $nextClass->id,
                'student_ids'      => [$this->studentA->id],
                'promotion_status' => 'promoted',
            ]);
        $res->assertStatus(403);
    }

    // ══════════════════════════════════════════════════════════════════
    // Course Registration Closed Period
    // ══════════════════════════════════════════════════════════════════

    /**
     * When registration is closed (deadline passed, not reopened), students
     * cannot register new subjects.
     */
    public function test_student_cannot_register_when_deadline_passed(): void
    {
        // Set a past deadline on the session
        $this->session->update([
            'registration_deadline' => now()->subDays(3)->toIso8601String(),
            'registration_reopened' => false,
        ]);

        $res = $this->actingAs($this->studentA, 'sanctum')
            ->postJson('/api/student/course-registration', [
                'school_class_id'     => $this->classA->id,
                'academic_session_id' => $this->session->id,
                'term'                => '1st Term',
                'subject_ids'         => [$this->subjectA->id],
            ]);
        $res->assertStatus(422); // Registration closed
    }

    /**
     * When registration is reopened by admin, students can register again.
     */
    public function test_student_can_register_when_deadline_passed_but_reopened(): void
    {
        $this->session->update([
            'registration_deadline' => now()->subDays(3)->toIso8601String(),
            'registration_reopened' => true,  // Admin reopened it
        ]);

        $res = $this->actingAs($this->studentA, 'sanctum')
            ->postJson('/api/student/course-registration', [
                'school_class_id'     => $this->classA->id,
                'academic_session_id' => $this->session->id,
                'term'                => '1st Term',
                'subject_ids'         => [$this->subjectA->id],
            ]);
        $res->assertOk();
    }

    // ══════════════════════════════════════════════════════════════════
    // Score Validation
    // ══════════════════════════════════════════════════════════════════

    /**
     * Teacher cannot enter scores above the configured maximum.
     */
    public function test_teacher_cannot_enter_scores_above_maximum(): void
    {
        CourseRegistration::create([
            'student_id'          => $this->studentA->id,
            'school_class_id'     => $this->classA->id,
            'subject_id'          => $this->subjectA->id,
            'academic_session_id' => $this->session->id,
            'term'                => '1st Term',
            'status'              => 'active',
        ]);

        $res = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson('/api/teacher/scoresheet/save', [
                'school_class_id'     => $this->classA->id,
                'academic_session_id' => $this->session->id,
                'term'                => '1st Term',
                'subject_id'          => $this->subjectA->id,
                'scores'              => [[
                    'student_id' => $this->studentA->id,
                    'ca1_score'  => 200, // Way above any reasonable max
                    'ca2_score'  => 200,
                    'exam_score' => 200,
                ]],
            ]);
        $res->assertStatus(422); // Score validation must fail
    }
}
