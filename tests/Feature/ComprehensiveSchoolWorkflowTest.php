<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\CbtQuestion;
use App\Models\CbtTest;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timetable;
use App\Models\TimetableChangeRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComprehensiveSchoolWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        SchoolSetting::getSettings();
    }

    public function test_teacher_creates_student_pending_approval_and_admin_approves(): void
    {
        $session = AcademicSession::create(['name' => '2026/2027', 'is_current' => true, 'current_term' => '1st Term']);
        $class = SchoolClass::create(['name' => 'JSS 1 Gold', 'grade_level' => 'JSS 1']);

        $teacher = Teacher::create([
            'full_name' => 'Mr. Eyitayo Ade',
            'employee_id' => 'EYI-TCH-001',
            'email' => 'teacher@eyitayoschools.edu.ng',
            'password' => bcrypt('Password123!'),
            'can_create_students' => true,
            'class_teacher_of' => $class->id,
        ]);

        $admin = Admin::create([
            'full_name' => 'Admin Eyitayo',
            'email' => 'admin@eyitayoschools.edu.ng',
            'password' => bcrypt('Password123!'),
            'role' => 'admin',
        ]);

        // 1. Teacher creates student
        $createRes = $this->actingAs($teacher, 'sanctum')->postJson('/api/teacher/create-student', [
            'full_name' => 'Boluwatife Adeleke',
            'email' => 'bolu@student.ng',
            'password' => 'Password123!',
            'student_id' => 'EYI-STU-101',
            'gender' => 'male',
            'section' => 'A',
            'class_id' => $class->id,
        ]);

        $createRes->assertStatus(201);
        $studentId = $createRes->json('student.id');

        $student = Student::find($studentId);
        $this->assertEquals('pending_approval', $student->status);
        $this->assertEquals($teacher->id, $student->created_by_teacher_id);

        // 2. Pending student cannot log in
        $loginRes = $this->postJson('/api/auth/login', [
            'login' => 'bolu@student.ng',
            'password' => 'Password123!',
            'role' => 'student',
        ]);
        $loginRes->assertStatus(401);

        // 3. Teacher cannot approve student
        $teacherApproveRes = $this->actingAs($teacher, 'sanctum')->patchJson("/api/users/students/{$studentId}/approve");
        $teacherApproveRes->assertStatus(403);

        // 4. Admin approves student
        $adminApproveRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/users/students/{$studentId}/approve");
        $adminApproveRes->assertStatus(200);

        $this->assertEquals('active', $student->fresh()->status);

        // 5. Student can now log in
        $studentLoginRes = $this->postJson('/api/auth/login', [
            'login' => 'bolu@student.ng',
            'password' => 'Password123!',
            'role' => 'student',
        ]);
        $studentLoginRes->assertStatus(200);
        $studentLoginRes->assertJsonStructure(['token', 'user', 'school']);
    }

    public function test_timetable_matrix_and_teacher_change_request_workflow(): void
    {
        $session = AcademicSession::create(['name' => '2026/2027', 'is_current' => true, 'current_term' => '1st Term']);
        $classA = SchoolClass::create(['name' => 'JSS 1A', 'grade_level' => 'JSS 1']);
        $classB = SchoolClass::create(['name' => 'JSS 1B', 'grade_level' => 'JSS 1']);
        $subject = Subject::create(['name' => 'Mathematics', 'code' => 'MTH101']);

        $teacher = Teacher::create([
            'full_name' => 'Math Teacher',
            'employee_id' => 'EYI-TCH-002',
            'email' => 'math@eyitayoschools.edu.ng',
            'password' => bcrypt('Password123!'),
        ]);

        $admin = Admin::create([
            'full_name' => 'Principal Eyitayo',
            'email' => 'principal@eyitayoschools.edu.ng',
            'password' => bcrypt('Password123!'),
        ]);

        // 1. Admin creates timetable entry for JSS 1A (Monday Period 1)
        $entryRes = $this->actingAs($admin, 'sanctum')->postJson('/api/timetables', [
            'academic_session_id' => $session->id,
            'term' => '1st Term',
            'school_class_id' => $classA->id,
            'day_of_week' => 'Monday',
            'period_number' => 1,
            'period_name' => 'Period 1',
            'start_time' => '08:00',
            'end_time' => '08:45',
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
        ]);
        $entryRes->assertStatus(200);
        $timetableId = $entryRes->json('entry.id');

        // 2. Conflict test: Assigning same teacher to JSS 1B at same Monday Period 1 should be rejected
        $conflictRes = $this->actingAs($admin, 'sanctum')->postJson('/api/timetables', [
            'academic_session_id' => $session->id,
            'term' => '1st Term',
            'school_class_id' => $classB->id,
            'day_of_week' => 'Monday',
            'period_number' => 1,
            'period_name' => 'Period 1',
            'start_time' => '08:00',
            'end_time' => '08:45',
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
        ]);
        $conflictRes->assertStatus(422);

        // 3. Teacher submits change request for Monday Period 1 -> Tuesday Period 2
        $reqRes = $this->actingAs($teacher, 'sanctum')->postJson('/api/teacher/timetable-change-request', [
            'timetable_id' => $timetableId,
            'requested_day' => 'Tuesday',
            'requested_period_number' => 2,
            'requested_start_time' => '08:45',
            'requested_end_time' => '09:30',
            'reason' => 'Laboratory equipment availability',
        ]);
        $reqRes->assertStatus(201);
        $changeRequestId = $reqRes->json('request.id');

        // 4. Admin approves change request
        $approveRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/timetable/change-requests/{$changeRequestId}/approve", [
            'admin_notes' => 'Approved as requested',
        ]);
        $approveRes->assertStatus(200);

        // Verify timetable updated to Tuesday Period 2
        $updatedTimetable = Timetable::find($timetableId);
        $this->assertEquals('Tuesday', $updatedTimetable->day_of_week);
        $this->assertEquals(2, $updatedTimetable->period_number);
    }

    public function test_student_promotion_and_class_history_workflow(): void
    {
        $session1 = AcademicSession::create(['name' => '2025/2026', 'is_current' => false, 'current_term' => '3rd Term']);
        $session2 = AcademicSession::create(['name' => '2026/2027', 'is_current' => true, 'current_term' => '1st Term']);

        $classJss1 = SchoolClass::create(['name' => 'JSS 1', 'grade_level' => 'JSS 1']);
        $classJss2 = SchoolClass::create(['name' => 'JSS 2', 'grade_level' => 'JSS 2']);

        $student = Student::create([
            'full_name' => 'Samuel Peterson',
            'email' => 'samuel@student.ng',
            'password' => bcrypt('Password123!'),
            'student_id' => 'EYI-STU-202',
            'status' => 'active',
            'section' => 'A',
            'academic_session_id' => $session1->id,
        ]);
        $student->classes()->sync([$classJss1->id]);

        $admin = Admin::create([
            'full_name' => 'Admin Eyitayo',
            'email' => 'admin2@eyitayoschools.edu.ng',
            'password' => bcrypt('Password123!'),
        ]);

        ReportCard::create([
            'student_id' => $student->id,
            'school_class_id' => $classJss1->id,
            'academic_session_id' => $session1->id,
            'term' => '3rd Term',
            'total_score' => 78,
            'total_obtainable' => 100,
            'average_score' => 78,
            'cumulative_average' => 78,
            'total_subjects' => 1,
            'overall_grade' => 'A',
            'status' => 'approved',
        ]);

        // Promote student from JSS 1 -> JSS 2
        $promoteRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/promotions/promote', [
            'from_session_id' => $session1->id,
            'from_class_id' => $classJss1->id,
            'from_section' => 'A',
            'to_session_id' => $session2->id,
            'to_class_id' => $classJss2->id,
            'to_section' => 'A',
            'student_ids' => [$student->id],
            'promotion_status' => 'promoted',
        ]);
        $promoteRes->assertStatus(200);

        // Verify class changed and history recorded
        $student = $student->fresh();
        $this->assertEquals($classJss2->id, $student->classes->first()->id);
        $this->assertEquals($session2->id, $student->academic_session_id);

        $history = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/promotions/history?student_id=' . $student->id);
        $history->assertStatus(200);
        $this->assertEquals(1, $history->json('total'));
    }

    public function test_qr_id_card_and_authorized_lookup(): void
    {
        $class = SchoolClass::create(['name' => 'SS 3 Science', 'grade_level' => 'SS 3']);
        $student = Student::create([
            'full_name' => 'Chiamaka Okafor',
            'email' => 'chiamaka@student.ng',
            'password' => bcrypt('Password123!'),
            'student_id' => 'EYI-STU-303',
            'qr_code_identifier' => 'EYI-STU-ABC12345',
            'status' => 'active',
        ]);
        $student->classes()->sync([$class->id]);

        $admin = Admin::create([
            'full_name' => 'Admin Eyitayo',
            'email' => 'admin3@eyitayoschools.edu.ng',
            'password' => bcrypt('Password123!'),
        ]);

        // 1. Get ID Card data
        $idCardRes = $this->actingAs($student, 'sanctum')->getJson("/api/users/student/{$student->id}/id-card");
        $idCardRes->assertStatus(200);
        $idCardRes->assertJsonPath('school.name', config('app.name'));
        $idCardRes->assertJsonPath('user.identifier', 'EYI-STU-303');

        // 2. Admin lookup by QR identifier
        $lookupRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/qr/lookup', [
            'query' => 'EYI-STU-ABC12345',
        ]);
        $lookupRes->assertStatus(200);
        $lookupRes->assertJsonPath('found', true);
        $lookupRes->assertJsonPath('user.full_name', 'Chiamaka Okafor');
    }

    public function test_role_scoped_ai_assistant_query(): void
    {
        $class = SchoolClass::create(['name' => 'JSS 2 Blue', 'grade_level' => 'JSS 2']);
        $student = Student::create([
            'full_name' => 'David Ojo',
            'email' => 'david@student.ng',
            'password' => bcrypt('Password123!'),
            'student_id' => 'EYI-STU-404',
            'status' => 'active',
        ]);
        $student->classes()->sync([$class->id]);

        $aiRes = $this->actingAs($student, 'sanctum')->postJson('/api/ai/query', [
            'prompt' => 'What is the school motto and how do I view my results?',
        ]);

        $aiRes->assertStatus(200);
        $aiRes->assertJsonStructure(['reply', 'role', 'provider']);
        $this->assertStringContainsString(strtoupper(config('app.name')), strtoupper($aiRes->json('reply')));
    }
}
