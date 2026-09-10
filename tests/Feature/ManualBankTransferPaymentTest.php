<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\CourseRegistration;
use App\Models\FeeStructure;
use App\Models\FeeType;
use App\Models\Payment;
use App\Models\ReportCard;
use App\Models\SchoolBankAccount;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Models\Subject;
use App\Models\SubjectResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ManualBankTransferPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Student $student;
    protected Student $studentB;
    protected SchoolClass $class;
    protected AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        SchoolSetting::getSettings();

        $this->session = AcademicSession::create([
            'name' => '2026/2027',
            'is_current' => true,
            'terms' => ['1st Term', '2nd Term', '3rd Term'],
            'current_term' => '1st Term',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
        ]);

        $this->admin = Admin::create([
            'email' => 'admin_test@example.com',
            'full_name' => 'Principal Administrator',
            'password' => Hash::make('password123'),
        ]);

        $this->class = SchoolClass::create([
            'name' => 'JSS 1',
            'grade_level' => 'JSS 1',
            'academic_year' => '2026/2027',
            'status' => 'active',
        ]);

        $this->student = Student::create([
            'student_id' => 'EYS/2026/001',
            'full_name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'password' => Hash::make('student123'),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
        $this->student->classes()->attach($this->class->id);

        $this->studentB = Student::create([
            'student_id' => 'EYS/2026/002',
            'full_name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'password' => Hash::make('student123'),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
        $this->studentB->classes()->attach($this->class->id);
    }

    public function test_admin_can_update_and_get_school_bank_account_details_and_audit_log_is_created(): void
    {
        // 1. Admin enters bank details
        $payload = [
            'bank_name' => 'GTBank',
            'account_name' => 'Example International School',
            'account_number' => '0123456789',
            'branch_name' => 'Victoria Island',
            'payment_instructions' => 'Transfer exact amount and upload receipt for verification.',
            'support_phone' => '08012345678',
            'support_email' => 'accounts@school.com',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/payment-settings/bank-account', $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('bank_account.bank_name', 'GTBank');
        $response->assertJsonPath('bank_account.account_number', '0123456789');

        $this->assertDatabaseHas('school_bank_accounts', [
            'bank_name' => 'GTBank',
            'account_number' => '0123456789',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'school_bank_account_updated',
        ]);

        // 2. Student can retrieve the bank details
        $getRes = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/payment-settings/bank-account');

        $getRes->assertStatus(200);
        $getRes->assertJsonPath('bank_account.bank_name', 'GTBank');
        $getRes->assertJsonPath('bank_account.account_number', '0123456789');
    }

    public function test_non_admin_cannot_update_bank_account_details(): void
    {
        $payload = [
            'bank_name' => 'Malicious Bank',
            'account_name' => 'Hacker Name',
            'account_number' => '9999999999',
        ];

        $response = $this->actingAs($this->student, 'sanctum')
            ->putJson('/api/payment-settings/bank-account', $payload);

        $response->assertStatus(403);
    }

    public function test_admin_can_configure_multiple_fee_items_and_custom_fee_types_for_class(): void
    {
        // Add custom fee type
        $feeTypeRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/fee-types', [
                'name' => 'Excursion Fee',
                'description' => 'Annual educational tour',
            ]);
        $feeTypeRes->assertStatus(201);

        // Add multiple fee items for JSS 1 in First Term
        $fee1 = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/fees', [
                'class_name' => 'JSS 1',
                'term' => '1st Term',
                'academic_session_id' => $this->session->id,
                'fee_type' => 'School Fees',
                'amount' => 150000,
                'due_date' => '2026-10-31',
            ]);
        $fee1->assertStatus(201);

        $fee2 = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/fees', [
                'class_name' => 'JSS 1',
                'term' => '1st Term',
                'academic_session_id' => $this->session->id,
                'fee_type' => 'PTA Fee',
                'amount' => 10000,
            ]);
        $fee2->assertStatus(201);

        $fee3 = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/fees', [
                'class_name' => 'JSS 1',
                'term' => '1st Term',
                'academic_session_id' => $this->session->id,
                'fee_type' => 'Development Levy',
                'amount' => 20000,
            ]);
        $fee3->assertStatus(201);

        $this->assertEquals(3, FeeStructure::where('class_name', 'JSS 1')->count());
        $this->assertEquals(180000, (float) FeeStructure::where('class_name', 'JSS 1')->sum('amount'));
    }

    public function test_student_can_fetch_fee_breakdown_and_financial_summary(): void
    {
        FeeStructure::create([
            'class_name' => 'JSS 1',
            'term' => '1st Term',
            'academic_session_id' => $this->session->id,
            'fee_type' => 'School Fees',
            'amount' => 150000,
            'is_active' => true,
        ]);

        FeeStructure::create([
            'class_name' => 'JSS 1',
            'term' => '1st Term',
            'academic_session_id' => $this->session->id,
            'fee_type' => 'PTA Fee',
            'amount' => 10000,
            'is_active' => true,
        ]);

        $res = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/finance');

        $res->assertStatus(200);
        $res->assertJsonPath('totals.total_fee', 160000);
        $res->assertJsonPath('totals.amount_confirmed', 0);
        $res->assertJsonPath('totals.outstanding_balance', 160000);
        $res->assertJsonPath('totals.status', 'NOT_PAID');
        $this->assertCount(2, $res->json('fees'));
    }

    public function test_student_upload_payment_receipt_sets_pending_verification_without_marking_paid(): void
    {
        FeeStructure::create([
            'class_name' => 'JSS 1',
            'term' => '1st Term',
            'academic_session_id' => $this->session->id,
            'fee_type' => 'School Fees',
            'amount' => 150000,
            'is_active' => true,
        ]);

        $file = UploadedFile::fake()->create('transfer_receipt.jpg', 400, 'image/jpeg');

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 50000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'Zenith Bank',
                'sender_account_name' => 'Mr John Doe Senior',
                'sender_account_last4' => '4321',
                'transaction_reference' => 'ZENITH-TX-998877',
                'student_note' => 'Part payment of school fee',
                'receipt' => $file,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('payment.status', Payment::STATUS_PENDING_VERIFICATION);
        $response->assertJsonPath('payment.amount', '50000.00');

        // CRITICAL CHECK: Student paid balance must NOT change yet!
        $financeRes = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/finance');

        $financeRes->assertJsonPath('totals.total_fee', 150000);
        $financeRes->assertJsonPath('totals.amount_confirmed', 0); // Not paid!
        $financeRes->assertJsonPath('totals.amount_pending', 50000); // Displayed as pending
        $financeRes->assertJsonPath('totals.outstanding_balance', 150000); // Still 150,000!
        $financeRes->assertJsonPath('totals.status', 'NOT_PAID');

        // Notification created
        $this->assertDatabaseHas('student_notifications', [
            'user_id' => $this->student->id,
            'title' => 'Payment Submitted',
        ]);
    }

    public function test_duplicate_transaction_reference_is_prevented(): void
    {
        $file = UploadedFile::fake()->create('receipt1.png', 300, 'image/png');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 20000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'Access Bank',
                'sender_account_name' => 'John Doe',
                'transaction_reference' => 'UNIQUE-REF-12345',
                'receipt' => $file,
            ])->assertStatus(201);

        // Attempt second submission with exact same reference
        $file2 = UploadedFile::fake()->create('receipt2.png', 300, 'image/png');
        $duplicateRes = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 20000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'Access Bank',
                'sender_account_name' => 'John Doe',
                'transaction_reference' => 'UNIQUE-REF-12345',
                'receipt' => $file2,
            ]);

        $duplicateRes->assertStatus(422);
        $duplicateRes->assertJsonPath('error', 'duplicate_reference');
    }

    public function test_invalid_file_format_is_rejected(): void
    {
        $badFile = UploadedFile::fake()->create('malicious.exe', 100, 'application/x-msdownload');

        $res = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 10000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'GTBank',
                'sender_account_name' => 'John Doe',
                'transaction_reference' => 'REF-FAIL-1',
                'receipt' => $badFile,
            ]);

        $res->assertStatus(422);
    }

    public function test_admin_confirm_payment_updates_balance_and_generates_official_receipt(): void
    {
        FeeStructure::create([
            'class_name' => 'JSS 1',
            'term' => '1st Term',
            'academic_session_id' => $this->session->id,
            'fee_type' => 'School Fees',
            'amount' => 150000,
            'is_active' => true,
        ]);

        $file = UploadedFile::fake()->create('receipt.pdf', 300, 'application/pdf');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 50000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'GTBank',
                'sender_account_name' => 'John Doe Senior',
                'transaction_reference' => 'GTB-VALID-001',
                'receipt' => $file,
            ]);

        $payment = Payment::where('transaction_reference', 'GTB-VALID-001')->first();
        $this->assertNotNull($payment);

        // Admin confirms payment
        $confirmRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/payments/{$payment->id}/confirm", [
                'admin_note' => 'Confirmed with GTBank bank statement',
            ]);

        $confirmRes->assertStatus(200);
        $confirmRes->assertJsonPath('payment.status', Payment::STATUS_CONFIRMED);
        $this->assertNotNull($confirmRes->json('receipt_number'));
        $this->assertStringStartsWith('EYS/', $confirmRes->json('receipt_number'));

        // Student's paid balance now reflects confirmed amount!
        $financeRes = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/finance');

        $financeRes->assertJsonPath('totals.total_fee', 150000);
        $financeRes->assertJsonPath('totals.amount_confirmed', 50000); // 50,000 paid
        $financeRes->assertJsonPath('totals.outstanding_balance', 100000); // 100,000 remaining
        $financeRes->assertJsonPath('totals.status', 'PARTIALLY_PAID');

        // Confirming a second time must NOT double-credit
        $secondConfirm = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/payments/{$payment->id}/confirm");

        $secondConfirm->assertStatus(400);

        // Balance remains 50,000 confirmed, NOT 100,000
        $financeCheck = $this->actingAs($this->student, 'sanctum')->getJson('/api/student/finance');
        $financeCheck->assertJsonPath('totals.amount_confirmed', 50000);
        $financeCheck->assertJsonPath('totals.outstanding_balance', 100000);
    }

    public function test_admin_reject_payment_records_reason_and_leaves_balance_unchanged(): void
    {
        FeeStructure::create([
            'class_name' => 'JSS 1',
            'term' => '1st Term',
            'academic_session_id' => $this->session->id,
            'fee_type' => 'School Fees',
            'amount' => 100000,
            'is_active' => true,
        ]);

        $file = UploadedFile::fake()->create('receipt.jpg', 200, 'image/jpeg');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 40000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'Kuda Bank',
                'sender_account_name' => 'Fake Sender',
                'transaction_reference' => 'KUDA-REJECT-001',
                'receipt' => $file,
            ]);

        $payment = Payment::where('transaction_reference', 'KUDA-REJECT-001')->first();

        // Admin rejects payment
        $rejectRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/payments/{$payment->id}/reject", [
                'rejection_reason' => 'Receipt unclear, amount not reflected in school bank account.',
            ]);

        $rejectRes->assertStatus(200);
        $rejectRes->assertJsonPath('payment.status', Payment::STATUS_REJECTED);
        $rejectRes->assertJsonPath('payment.rejection_reason', 'Receipt unclear, amount not reflected in school bank account.');

        // Balance remains unchanged
        $financeRes = $this->actingAs($this->student, 'sanctum')->getJson('/api/student/finance');
        $financeRes->assertJsonPath('totals.amount_confirmed', 0);
        $financeRes->assertJsonPath('totals.outstanding_balance', 100000);

        // Student receives rejection notification
        $this->assertDatabaseHas('student_notifications', [
            'user_id' => $this->student->id,
            'title' => 'Payment Rejected',
        ]);
    }

    public function test_student_a_cannot_access_student_b_receipt_document(): void
    {
        $file = UploadedFile::fake()->create('receipt_a.jpg', 200, 'image/jpeg');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 30000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'GTBank',
                'sender_account_name' => 'Student A',
                'transaction_reference' => 'REF-PRIVACY-001',
                'receipt' => $file,
            ]);

        $paymentA = Payment::where('transaction_reference', 'REF-PRIVACY-001')->first();

        // Student A can access their receipt
        $ownerRes = $this->actingAs($this->student, 'sanctum')
            ->get("/api/payments/{$paymentA->id}/receipt");
        $ownerRes->assertStatus(200);

        // Admin can access Student A's receipt
        $adminRes = $this->actingAs($this->admin, 'sanctum')
            ->get("/api/payments/{$paymentA->id}/receipt");
        $adminRes->assertStatus(200);

        // Student B MUST NOT access Student A's receipt!
        $intruderRes = $this->actingAs($this->studentB, 'sanctum')
            ->get("/api/payments/{$paymentA->id}/receipt");
        $intruderRes->assertStatus(403);
    }

    public function test_result_release_blocks_when_full_payment_required_and_receipt_is_only_pending(): void
    {
        // Require full fee payment
        $settings = SchoolSetting::getSettings();
        $settings->update([
            'require_fee_payment_for_release' => true,
            'minimum_result_payment_percentage' => 100,
            'allowed_payment_statuses_for_release' => ['PAID'],
        ]);

        FeeStructure::create([
            'class_name' => 'JSS 1',
            'term' => '1st Term',
            'academic_session_id' => $this->session->id,
            'fee_type' => 'School Fees',
            'amount' => 100000,
            'is_active' => true,
        ]);

        // Student submits payment of full 100,000, but it is PENDING
        $file = UploadedFile::fake()->create('proof.pdf', 300, 'application/pdf');
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/payments', [
                'amount' => 100000,
                'payment_date' => '2026-09-04',
                'bank_used' => 'First Bank',
                'sender_account_name' => 'John Senior',
                'transaction_reference' => 'PENDING-UNLOCK-001',
                'receipt' => $file,
            ]);

        // Setup approved report card
        $subject = Subject::create(['name' => 'Mathematics', 'code' => 'MTH']);
        $this->class->subjects()->attach($subject->id);
        CourseRegistration::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'status' => 'approved',
        ]);
        SubjectResult::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'assessment_scores' => [
                'ca1' => 20,
                'ca2' => 20,
                'written' => 40,
            ],
            'ca1_score' => 20,
            'ca2_score' => 20,
            'exam_score' => 40,
            'total_score' => 80,
            'grade' => 'A',
            'status' => 'approved',
        ]);

        $reportCard = ReportCard::create([
            'student_id' => $this->student->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'term' => '1st Term',
            'status' => 'approved',
            'total_score' => 80,
            'average_score' => 80,
        ]);

        // Attempt to release report card: MUST FAIL because payment is only pending!
        $releaseRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$reportCard->id}/release");

        $releaseRes->assertStatus(403);

        // Now Admin CONFIRMS payment
        $payment = Payment::where('transaction_reference', 'PENDING-UNLOCK-001')->first();
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/payments/{$payment->id}/confirm");

        // Now release succeeds!
        $releaseSuccess = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/report-cards/{$reportCard->id}/release");

        $releaseSuccess->assertStatus(200);
        $this->assertEquals('released', $reportCard->fresh()->status);
    }
}
