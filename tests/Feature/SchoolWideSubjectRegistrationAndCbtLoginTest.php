<?php

namespace Tests\Feature;

use App\Models\AcademicSection;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SchoolWideSubjectRegistrationAndCbtLoginTest extends TestCase
{
    use RefreshDatabase;

    protected Student $student;
    protected SchoolClass $schoolClass;
    protected AcademicSession $session;
    protected Subject $subjectCompulsory;
    protected Subject $subjectSchoolWide;
    protected Subject $subjectInactive;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = Student::create([
            'full_name' => 'Amara Okafor',
            'email' => 'amara.okafor@school.test',
            'student_id' => 'GHRA-STU-888',
            'gender' => 'female',
            'password' => Hash::make('cbtPasscode123'),
            'status' => 'active',
        ]);

        $section = AcademicSection::create([
            'name' => 'Senior Secondary',
            'ordering' => 1,
            'status' => 'active',
        ]);

        $teacher = Teacher::create([
            'full_name' => 'Mr. Victor Cole',
            'email' => 'victor.cole@school.test',
            'employee_id' => 'TCH-VC-01',
            'password' => Hash::make('secret123'),
        ]);

        $this->schoolClass = SchoolClass::create([
            'name' => 'SS 2 Science',
            'grade_level' => 'SS 2',
            'academic_section_id' => $section->id,
            'teacher_id' => $teacher->id,
            'status' => 'active',
        ]);

        $this->student->classes()->attach($this->schoolClass->id);

        $this->session = AcademicSession::create([
            'name' => '2026/2027',
            'is_current' => true,
            'terms' => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
            'status' => 'active',
        ]);

        // 1. Compulsory subject attached to class
        $this->subjectCompulsory = Subject::create([
            'name' => 'Mathematics',
            'code' => 'MTH201',
            'is_compulsory' => true,
            'status' => 'active',
        ]);
        $this->schoolClass->subjects()->attach($this->subjectCompulsory->id, [
            'teacher_id' => $teacher->id,
            'is_compulsory' => true,
        ]);

        // 2. School-wide active subject NOT initially attached to class
        $this->subjectSchoolWide = Subject::create([
            'name' => 'Further Mathematics',
            'code' => 'FMTH201',
            'is_compulsory' => false,
            'status' => 'active',
        ]);

        // 3. Inactive subject
        $this->subjectInactive = Subject::create([
            'name' => 'Ancient Greek',
            'code' => 'GRK999',
            'is_compulsory' => false,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test course registration returns all active school subjects, even if not pre-linked to class.
     */
    public function test_student_course_registration_fetches_all_school_subjects(): void
    {
        $this->actingAs($this->student, 'sanctum');

        $res = $this->getJson('/api/student/course-registration/available');
        $res->assertOk();

        // Must include both compulsory Mathematics and unattached Further Mathematics
        $res->assertJsonFragment(['name' => 'Mathematics', 'is_compulsory' => true]);
        $res->assertJsonFragment(['name' => 'Further Mathematics', 'is_compulsory' => false]);

        // Inactive subjects must not be offered
        $res->assertJsonMissing(['name' => 'Ancient Greek']);
    }

    /**
     * Test registering school-wide subject dynamically links it to class_subject pivot table.
     */
    public function test_registering_school_wide_subject_attaches_to_class_subject(): void
    {
        $this->actingAs($this->student, 'sanctum');

        // Confirm Further Mathematics is not yet attached to class
        $this->assertDatabaseMissing('class_subject', [
            'school_class_id' => $this->schoolClass->id,
            'subject_id' => $this->subjectSchoolWide->id,
        ]);

        // Register both Mathematics and Further Mathematics
        $res = $this->postJson('/api/student/course-registration', [
            'school_class_id' => $this->schoolClass->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'subject_ids' => [$this->subjectCompulsory->id, $this->subjectSchoolWide->id],
        ]);

        $res->assertOk();

        // Verified in course_registrations table
        $this->assertDatabaseHas('course_registrations', [
            'student_id' => $this->student->id,
            'subject_id' => $this->subjectSchoolWide->id,
            'school_class_id' => $this->schoolClass->id,
            'status' => 'active',
        ]);

        // Verified that Further Mathematics was dynamically attached to class_subject
        $this->assertDatabaseHas('class_subject', [
            'school_class_id' => $this->schoolClass->id,
            'subject_id' => $this->subjectSchoolWide->id,
        ]);
    }

    /**
     * Test candidate login using student ID or email for CBT portal entry.
     */
    public function test_cbt_candidate_login_with_student_id_and_email(): void
    {
        // 1. Candidate login with Student ID
        $res1 = $this->postJson('/api/auth/login', [
            'login' => 'GHRA-STU-888',
            'password' => 'cbtPasscode123',
            'role' => 'student',
        ]);
        $res1->assertOk();
        $res1->assertJsonStructure(['token', 'user' => ['id', 'full_name', 'role']]);
        $this->assertEquals('student', $res1->json('user.role'));

        // 2. Candidate login with Email
        $res2 = $this->postJson('/api/auth/login', [
            'login' => 'amara.okafor@school.test',
            'password' => 'cbtPasscode123',
            'role' => 'student',
        ]);
        $res2->assertOk();

        // 3. Invalid credentials rejected
        $res3 = $this->postJson('/api/auth/login', [
            'login' => 'GHRA-STU-888',
            'password' => 'wrongPasscode',
            'role' => 'student',
        ]);
        $res3->assertStatus(401);
    }
}
