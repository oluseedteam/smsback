<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AuditLog;
use App\Models\FeeStructure;
use App\Models\FeeType;
use App\Models\Payment;
use App\Models\SchoolBankAccount;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentNotification;
use App\Services\OfficialReceiptPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    public function __construct(
        protected OfficialReceiptPdfService $receiptPdfService
    ) {}

    // ─── 1. School Bank Account Settings ────────────────────────

    public function getBankAccount(): JsonResponse
    {
        $account = SchoolBankAccount::getActiveAccount();

        return response()->json([
            'bank_account' => $account,
        ]);
    }

    public function updateBankAccount(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_name' => 'required|string|max:150',
            'account_number' => 'required|string|max:30',
            'branch_name' => 'nullable|string|max:100',
            'payment_instructions' => 'nullable|string|max:1000',
            'support_phone' => 'nullable|string|max:50',
            'support_email' => 'nullable|email|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $previous = SchoolBankAccount::getActiveAccount();

        $account = SchoolBankAccount::updateOrCreate(
            ['school_id' => 1, 'id' => $previous?->id ?? 1],
            array_merge($validated, [
                'school_id' => 1,
                'updated_by' => $admin->id,
                'created_by' => $previous?->created_by ?? $admin->id,
                'is_active' => $validated['is_active'] ?? true,
            ])
        );

        AuditLog::record(
            'school_bank_account_updated',
            null,
            null,
            null,
            [
                'admin_id' => $admin->id,
                'admin_name' => $admin->full_name,
                'previous' => $previous ? $previous->only(['bank_name', 'account_name', 'account_number', 'branch_name']) : null,
                'new' => $account->only(['bank_name', 'account_name', 'account_number', 'branch_name']),
            ],
            $admin
        );

        return response()->json([
            'message' => 'School bank account details updated successfully.',
            'bank_account' => $account->fresh(),
        ]);
    }

    // ─── 2. Fee Types (Admin) ───────────────────────────────────

    public function feeTypeIndex(): JsonResponse
    {
        $types = FeeType::where('school_id', 1)->orderBy('name')->get();
        return response()->json($types);
    }

    public function feeTypeStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        $type = FeeType::firstOrCreate(
            ['school_id' => 1, 'name' => trim($validated['name'])],
            ['description' => $validated['description'] ?? null, 'is_system' => false]
        );

        return response()->json($type, 201);
    }

    // ─── Fee Structures (Admin) ─────────────────────────────

    public function feeIndex(Request $request): JsonResponse
    {
        $query = FeeStructure::with(['schoolClass:id,name', 'academicSession:id,name'])
            ->orderBy('class_name')
            ->orderBy('fee_type');

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }
        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->input('academic_year'));
        }
        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->input('academic_session_id'));
        }
        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->input('school_class_id'));
        }
        if ($request->filled('class_name')) {
            $query->where('class_name', $request->input('class_name'));
        }
        if ($request->filled('fee_type')) {
            $query->where('fee_type', $request->input('fee_type'));
        }

        return response()->json($query->get());
    }

    public function feeStore(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'class_name' => 'required|string|max:100',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'department' => 'nullable|string|max:100',
            'term' => 'required|in:1st Term,2nd Term,3rd Term',
            'academic_year' => 'nullable|string|max:20',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'academic_section_id' => 'nullable|exists:academic_sections,id',
            'fee_type' => 'required|string|max:100',
            'title' => 'nullable|string|max:150',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string|max:500',
        ]);

        if (empty($validated['school_class_id'])) {
            $class = SchoolClass::where('name', $validated['class_name'])->first();
            $validated['school_class_id'] = $class?->id;
        }

        if (empty($validated['academic_session_id'])) {
            $currentSession = AcademicSession::where('is_current', true)->first();
            $validated['academic_session_id'] = $currentSession?->id;
            if (empty($validated['academic_year'])) {
                $validated['academic_year'] = $currentSession?->name;
            }
        }

        $fee = FeeStructure::create(array_merge($validated, [
            'school_id' => 1,
            'is_active' => true,
        ]));

        AuditLog::record(
            'fee_structure_created',
            null,
            $fee->academic_session_id,
            $fee->term,
            [
                'fee_id' => $fee->id,
                'class_name' => $fee->class_name,
                'fee_type' => $fee->fee_type,
                'amount' => (float) $fee->amount,
                'admin' => $admin?->full_name,
            ],
            $admin
        );

        return response()->json($fee->load(['schoolClass:id,name', 'academicSession:id,name']), 201);
    }

    public function feeUpdate(Request $request, FeeStructure $fee): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'class_name' => 'sometimes|string|max:100',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'department' => 'nullable|string|max:100',
            'term' => 'sometimes|in:1st Term,2nd Term,3rd Term',
            'academic_year' => 'nullable|string|max:20',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'academic_section_id' => 'nullable|exists:academic_sections,id',
            'fee_type' => 'sometimes|string|max:100',
            'title' => 'nullable|string|max:150',
            'amount' => 'sometimes|numeric|min:0',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string|max:500',
            'is_active' => 'sometimes|boolean',
        ]);

        $fee->update($validated);

        AuditLog::record(
            'fee_structure_updated',
            null,
            $fee->academic_session_id,
            $fee->term,
            [
                'fee_id' => $fee->id,
                'class_name' => $fee->class_name,
                'fee_type' => $fee->fee_type,
                'amount' => (float) $fee->amount,
                'admin' => $admin?->full_name,
            ],
            $admin
        );

        return response()->json($fee->load(['schoolClass:id,name', 'academicSession:id,name']));
    }

    public function feeDestroy(FeeStructure $fee): JsonResponse
    {
        $admin = request()->user();

        AuditLog::record(
            'fee_structure_deleted',
            null,
            $fee->academic_session_id,
            $fee->term,
            [
                'fee_id' => $fee->id,
                'class_name' => $fee->class_name,
                'fee_type' => $fee->fee_type,
                'amount' => (float) $fee->amount,
                'admin' => $admin?->full_name,
            ],
            $admin
        );

        $fee->delete();
        return response()->json(['message' => 'Fee structure deleted.']);
    }

    // ─── 4. Student School Fees & Finance View ──────────────────

    public function studentFinance(Request $request): JsonResponse
    {
        $student = $request->user();

        // 1. Get current student class & department
        $studentClass = $student->classes()->first();
        $className = $studentClass ? $studentClass->name : null;
        $department = $student->department;

        // 2. Resolve session & term
        $session = AcademicSession::where('is_current', true)->first() ?: AcademicSession::latest()->first();
        $sessionId = $session?->id;
        $term = $session?->current_term ?: '1st Term';

        // 3. Get all applicable fee items for student's class
        $fees = collect();
        if ($className) {
            $fees = FeeStructure::where('class_name', $className)
                ->where('is_active', true)
                ->where(function ($q) use ($department) {
                    $q->whereNull('department')
                      ->orWhere('department', '')
                      ->orWhere('department', $department);
                })
                ->where(function ($q) use ($sessionId) {
                    if ($sessionId) {
                        $q->where('academic_session_id', $sessionId)
                          ->orWhereNull('academic_session_id');
                    }
                })
                ->where(function ($q) use ($term) {
                    $q->where('term', $term)
                      ->orWhereNull('term');
                })
                ->get();
        }

        $totalFee = (float) $fees->sum('amount');

        // 4. Get student payment records
        $payments = Payment::where('student_id', $student->id)
            ->with(['feeStructure', 'verifiedByAdmin:id,full_name'])
            ->orderBy('created_at', 'desc')
            ->get();

        // 5. Calculate confirmed & pending amounts
        $confirmedPayments = $payments->filter(fn($p) => $p->isConfirmed());
        $pendingPayments = $payments->filter(fn($p) => $p->isPending());

        $amountConfirmed = (float) $confirmedPayments->where('term', $term)->sum('amount');
        $amountPending = (float) $pendingPayments->where('term', $term)->sum('amount');

        if ($amountConfirmed === 0.0 && $confirmedPayments->count() > 0) {
            $amountConfirmed = (float) $confirmedPayments->sum('amount');
        }
        if ($amountPending === 0.0 && $pendingPayments->count() > 0) {
            $amountPending = (float) $pendingPayments->sum('amount');
        }

        $outstandingBalance = max(0, $totalFee - $amountConfirmed);

        // Status calculation
        if ($totalFee == 0) {
            $status = $amountConfirmed > 0 ? 'PAID' : 'NOT_PAID';
        } elseif ($amountConfirmed >= $totalFee) {
            $status = $amountConfirmed > $totalFee ? 'OVERPAID' : 'PAID';
        } elseif ($amountConfirmed > 0) {
            $status = 'PARTIALLY_PAID';
        } else {
            $status = 'NOT_PAID';
        }

        // Active school bank account
        $bankAccount = SchoolBankAccount::getActiveAccount();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'full_name' => $student->full_name,
                'class_name' => $className,
                'department' => $department,
            ],
            'session' => [
                'id' => $sessionId,
                'name' => $session?->name,
                'term' => $term,
            ],
            'totals' => [
                'total_fee' => $totalFee,
                'amount_confirmed' => $amountConfirmed,
                'amount_pending' => $amountPending,
                'outstanding_balance' => $outstandingBalance,
                'status' => $status,
            ],
            'fees' => $fees,
            'bank_account' => $bankAccount,
            'payments' => $payments,
        ]);
    }

    // ─── 5. Student Payment Submission (Manual Bank Transfer) ───

    public function submitStudentPayment(Request $request): JsonResponse
    {
        $student = $request->user();

        if ($student->role !== 'student') {
            return response()->json(['message' => 'Only authenticated students can submit fee payments.'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:100',
            'payment_date' => 'required|date|before_or_equal:today',
            'bank_used' => 'required|string|max:100',
            'sender_account_name' => 'required|string|max:150',
            'sender_account_last4' => 'nullable|string|max:10',
            'transaction_reference' => 'required|string|max:100',
            'fee_structure_id' => 'nullable|exists:fee_structures,id',
            'student_note' => 'nullable|string|max:500',
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $reference = trim($validated['transaction_reference']);

        // Duplicate Reference Check
        $existingReference = Payment::where('transaction_reference', $reference)
            ->whereNotIn('status', [Payment::STATUS_REJECTED, Payment::STATUS_CANCELLED])
            ->first();

        if ($existingReference) {
            return response()->json([
                'message' => 'A payment with this transaction reference has already been submitted and is currently being processed or confirmed.',
                'error' => 'duplicate_reference',
            ], 422);
        }

        // Student active class, session, and term
        $studentClass = $student->classes()->first();
        $session = AcademicSession::where('is_current', true)->first() ?: AcademicSession::latest()->first();
        $sessionId = $session?->id;
        $term = $session?->current_term ?: '1st Term';

        // Check overpayment policy
        $settings = SchoolSetting::getSettings();
        if (!$settings->allow_overpayment) {
            $totalFee = (float) FeeStructure::where('class_name', $studentClass?->name)
                ->where('is_active', true)
                ->where(function ($q) use ($sessionId) {
                    if ($sessionId) {
                        $q->where('academic_session_id', $sessionId)->orWhereNull('academic_session_id');
                    }
                })
                ->where('term', $term)
                ->sum('amount');

            $confirmedPaid = (float) Payment::where('student_id', $student->id)
                ->whereIn('status', [Payment::STATUS_CONFIRMED, 'successful'])
                ->where('term', $term)
                ->sum('amount');

            $balance = max(0, $totalFee - $confirmedPaid);

            if ($totalFee > 0 && (float) $validated['amount'] > $balance) {
                return response()->json([
                    'message' => "Payment amount (₦" . number_format($validated['amount'], 2) . ") exceeds your current outstanding fee balance (₦" . number_format($balance, 2) . "). The school does not permit overpayments.",
                ], 422);
            }
        }

        // Store receipt file securely
        $file = $request->file('receipt');
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'pdf'], true)) {
            return response()->json(['message' => 'Invalid file format. Only JPG, PNG, and PDF receipts are allowed.'], 422);
        }

        $filename = 'receipt_' . Str::random(24) . '_' . time() . '.' . $extension;
        $storedPath = $file->storeAs('receipts', $filename, 'public');

        // Create Payment record with PENDING_VERIFICATION (Balance does NOT update!)
        $payment = Payment::create([
            'school_id' => 1,
            'student_id' => $student->id,
            'academic_session_id' => $sessionId,
            'term' => $term,
            'school_class_id' => $studentClass?->id,
            'fee_structure_id' => $validated['fee_structure_id'] ?? null,
            'amount' => $validated['amount'],
            'payment_method' => 'BANK_TRANSFER',
            'bank_used' => $validated['bank_used'],
            'sender_account_name' => $validated['sender_account_name'],
            'sender_account_last4' => $validated['sender_account_last4'] ?? null,
            'transaction_reference' => $reference,
            'payment_date' => $validated['payment_date'],
            'receipt_path' => $storedPath,
            'receipt_url' => '/storage/' . $storedPath,
            'receipt_file_type' => $mimeType,
            'student_note' => $validated['student_note'] ?? null,
            'status' => Payment::STATUS_PENDING_VERIFICATION,
            'submitted_at' => now(),
            'type' => 'fee_payment',
            'reference' => 'SMS-BT-' . strtoupper(Str::random(10)),
            'description' => "Bank Transfer for {$term}" . (!empty($validated['fee_structure_id']) ? " (Fee Item #{$validated['fee_structure_id']})" : ''),
        ]);

        // In-App Notification to Student
        StudentNotification::notifyStudent(
            $student->id,
            'Payment Submitted',
            "Your ₦" . number_format($payment->amount, 2) . " payment has been submitted and is awaiting verification.",
            '/student/finance',
            'fee_payment_submitted'
        );

        // Audit Log
        AuditLog::record(
            'payment_submitted',
            $student->id,
            $sessionId,
            $term,
            [
                'payment_id' => $payment->id,
                'amount' => (float) $payment->amount,
                'reference' => $reference,
                'bank_used' => $payment->bank_used,
            ],
            $student
        );

        return response()->json([
            'message' => 'Your payment receipt has been submitted successfully and is awaiting administrator verification.',
            'payment' => $payment->fresh(),
        ], 201);
    }

    // ─── 6. Admin Payment Verification Hub ──────────────────────

    public function adminPayments(Request $request): JsonResponse
    {
        $query = Payment::with([
            'student:id,full_name,student_id,email',
            'schoolClass:id,name',
            'academicSession:id,name',
            'feeStructure',
            'verifiedByAdmin:id,full_name',
        ])->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'pending') {
                $query->whereIn('status', [Payment::STATUS_PENDING_VERIFICATION, 'pending']);
            } elseif ($status === 'confirmed') {
                $query->whereIn('status', [Payment::STATUS_CONFIRMED, 'successful']);
            } elseif ($status === 'rejected') {
                $query->whereIn('status', [Payment::STATUS_REJECTED, 'failed']);
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('session_id')) {
            $query->where('academic_session_id', $request->input('session_id'));
        }
        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }
        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->input('school_class_id'));
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_reference', 'like', "%{$search}%")
                  ->orWhere('sender_account_name', 'like', "%{$search}%")
                  ->orWhere('bank_used', 'like', "%{$search}%")
                  ->orWhere('official_receipt_number', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($sq) use ($search) {
                      $sq->where('full_name', 'like', "%{$search}%")
                         ->orWhere('student_id', 'like', "%{$search}%");
                  });
            });
        }
        if ($request->filled('date')) {
            $query->whereDate('payment_date', $request->input('date'));
        }

        $payments = $query->paginate($request->input('per_page', 50));

        // Annotate possible duplicates
        $references = collect($payments->items())->pluck('transaction_reference')->filter();
        $duplicateRefs = Payment::whereIn('transaction_reference', $references)
            ->groupBy('transaction_reference')
            ->havingRaw('count(*) > 1')
            ->pluck('transaction_reference')
            ->toArray();

        $payments->getCollection()->transform(function ($p) use ($duplicateRefs) {
            $p->is_possible_duplicate = in_array($p->transaction_reference, $duplicateRefs, true);
            return $p;
        });

        return response()->json($payments);
    }

    public function adminPaymentDetail(Payment $payment): JsonResponse
    {
        $payment->loadMissing([
            'student.classes',
            'schoolClass',
            'academicSession',
            'feeStructure',
            'verifiedByAdmin:id,full_name',
        ]);

        $duplicateCount = Payment::where('transaction_reference', $payment->transaction_reference)
            ->where('id', '!=', $payment->id)
            ->count();

        return response()->json([
            'payment' => $payment,
            'is_duplicate' => $duplicateCount > 0,
            'duplicate_count' => $duplicateCount,
        ]);
    }

    public function adminConfirmPayment(Request $request, Payment $payment): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($payment, $admin, $validated) {
            $payment = Payment::where('id', $payment->id)->lockForUpdate()->first();

            if ($payment->isConfirmed()) {
                return response()->json([
                    'message' => 'This payment is already confirmed. Confirmation cannot be duplicated.',
                    'payment' => $payment,
                ], 400);
            }

            // Generate unique official receipt number: EYS/YYYY/000001
            $year = date('Y');
            $count = Payment::whereNotNull('official_receipt_number')
                ->where('official_receipt_number', 'like', "EYS/{$year}/%")
                ->count() + 1;
            $receiptNumber = sprintf('EYS/%s/%06d', $year, $count);

            while (Payment::where('official_receipt_number', $receiptNumber)->exists()) {
                $count++;
                $receiptNumber = sprintf('EYS/%s/%06d', $year, $count);
            }

            $payment->update([
                'status' => Payment::STATUS_CONFIRMED,
                'verified_by' => $admin->id,
                'verified_at' => now(),
                'official_receipt_number' => $receiptNumber,
                'official_receipt_issued_at' => now(),
                'admin_note' => $validated['admin_note'] ?? $payment->admin_note,
            ]);

            StudentNotification::notifyStudent(
                $payment->student_id,
                'Payment Confirmed',
                "Your ₦" . number_format($payment->amount, 2) . " school fee payment has been confirmed. Receipt #" . $receiptNumber,
                '/student/finance',
                'fee_payment_confirmed'
            );

            AuditLog::record(
                'payment_confirmed',
                $payment->student_id,
                $payment->academic_session_id,
                $payment->term,
                [
                    'payment_id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'reference' => $payment->transaction_reference,
                    'official_receipt_number' => $receiptNumber,
                    'verified_by_admin' => $admin->full_name,
                ],
                $admin
            );

            return response()->json([
                'message' => 'Payment confirmed successfully. Official receipt generated.',
                'payment' => $payment->fresh(['student', 'feeStructure', 'verifiedByAdmin']),
                'receipt_number' => $receiptNumber,
            ]);
        });
    }

    public function adminRejectPayment(Request $request, Payment $payment): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
            'admin_note' => 'nullable|string|max:500',
        ]);

        if ($payment->isConfirmed()) {
            return response()->json([
                'message' => 'Cannot reject a payment that has already been confirmed. Please initiate a formal administrative reversal.',
            ], 400);
        }

        $payment->update([
            'status' => Payment::STATUS_REJECTED,
            'rejection_reason' => $validated['rejection_reason'],
            'admin_note' => $validated['admin_note'] ?? null,
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        StudentNotification::notifyStudent(
            $payment->student_id,
            'Payment Rejected',
            "Your payment proof was rejected. Reason: {$validated['rejection_reason']}",
            '/student/finance',
            'fee_payment_rejected'
        );

        AuditLog::record(
            'payment_rejected',
            $payment->student_id,
            $payment->academic_session_id,
            $payment->term,
            [
                'payment_id' => $payment->id,
                'amount' => (float) $payment->amount,
                'rejection_reason' => $validated['rejection_reason'],
                'verified_by_admin' => $admin->full_name,
            ],
            $admin
        );

        return response()->json([
            'message' => 'Payment rejected. Student has been notified.',
            'payment' => $payment->fresh(),
        ]);
    }

    // ─── 7. Receipt Security & Official Receipt Downloads ───────

    public function downloadReceiptFile(Request $request, Payment $payment)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $user->id !== $payment->student_id) {
            return response()->json(['message' => 'Unauthorized to access this receipt file.'], 403);
        }

        if (!$payment->receipt_path || !Storage::disk('public')->exists($payment->receipt_path)) {
            return response()->json(['message' => 'Receipt file not found on disk.'], 404);
        }

        $filePath = Storage::disk('public')->path($payment->receipt_path);
        return response()->file($filePath);
    }

    public function getOfficialReceipt(Payment $payment): JsonResponse
    {
        if (!$payment->isConfirmed()) {
            return response()->json(['message' => 'Official receipts are only issued for confirmed payments.'], 400);
        }

        $payload = $this->receiptPdfService->buildReceiptPayload($payment);
        return response()->json($payload);
    }

    public function downloadOfficialReceiptPdf(Payment $payment)
    {
        if (!$payment->isConfirmed()) {
            return response()->json(['message' => 'Official receipts are only available for confirmed payments.'], 400);
        }

        $filename = $this->receiptPdfService->filename($payment);
        $pdf = $this->receiptPdfService->render($payment);

        return response($pdf, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    // ─── 8. Admin Finance Overview & Student Payment Profile ─────

    public function financeOverview(Request $request): JsonResponse
    {
        $session = AcademicSession::where('is_current', true)->first();
        $sessionId = $request->input('session_id', $session?->id);
        $term = $request->input('term', $session?->current_term ?: '1st Term');

        $studentsQuery = Student::query();
        if ($request->filled('school_class_id')) {
            $studentsQuery->whereHas('classes', fn($q) => $q->where('school_classes.id', $request->input('school_class_id')));
        }

        $students = $studentsQuery->with('classes')->get();

        $totalExpected = 0;
        $totalConfirmed = 0;
        $totalPending = 0;
        $paidCount = 0;
        $partialCount = 0;
        $unpaidCount = 0;

        foreach ($students as $st) {
            $className = $st->classes->first()?->name;
            $applicableFee = (float) FeeStructure::where('class_name', $className)
                ->where('is_active', true)
                ->where('term', $term)
                ->sum('amount');

            $confirmed = (float) Payment::where('student_id', $st->id)
                ->whereIn('status', [Payment::STATUS_CONFIRMED, 'successful'])
                ->where('term', $term)
                ->sum('amount');

            $pending = (float) Payment::where('student_id', $st->id)
                ->whereIn('status', [Payment::STATUS_PENDING_VERIFICATION, 'pending'])
                ->where('term', $term)
                ->sum('amount');

            $totalExpected += $applicableFee;
            $totalConfirmed += $confirmed;
            $totalPending += $pending;

            if ($applicableFee == 0) {
                if ($confirmed > 0) $paidCount++;
                else $unpaidCount++;
            } elseif ($confirmed >= $applicableFee) {
                $paidCount++;
            } elseif ($confirmed > 0) {
                $partialCount++;
            } else {
                $unpaidCount++;
            }
        }

        $outstanding = max(0, $totalExpected - $totalConfirmed);
        $pendingSubmissionsCount = Payment::whereIn('status', [Payment::STATUS_PENDING_VERIFICATION, 'pending'])->count();

        return response()->json([
            'total_fees_expected' => $totalExpected,
            'total_confirmed_payments' => $totalConfirmed,
            'outstanding_fees' => $outstanding,
            'pending_verification_amount' => $totalPending,
            'paid_students_count' => $paidCount,
            'partially_paid_students_count' => $partialCount,
            'unpaid_students_count' => $unpaidCount,
            'pending_submissions_count' => $pendingSubmissionsCount,
        ]);
    }

    public function studentPaymentProfile(Student $student): JsonResponse
    {
        $studentClass = $student->classes()->first();
        $className = $studentClass?->name;

        $session = AcademicSession::where('is_current', true)->first();
        $term = $session?->current_term ?: '1st Term';

        $totalFee = (float) FeeStructure::where('class_name', $className)
            ->where('is_active', true)
            ->where('term', $term)
            ->sum('amount');

        $payments = Payment::where('student_id', $student->id)
            ->with(['feeStructure', 'verifiedByAdmin:id,full_name'])
            ->orderBy('created_at', 'desc')
            ->get();

        $confirmed = (float) $payments->filter(fn($p) => $p->isConfirmed())->sum('amount');
        $pending = (float) $payments->filter(fn($p) => $p->isPending())->sum('amount');
        $outstanding = max(0, $totalFee - $confirmed);

        return response()->json([
            'student' => $student->load('classes'),
            'total_fee' => $totalFee,
            'confirmed' => $confirmed,
            'pending' => $pending,
            'outstanding' => $outstanding,
            'payments' => $payments,
        ]);
    }

    // ─── Legacy / Backward-Compatible Method ───────────────────

    public function allPayments(Request $request): JsonResponse
    {
        return $this->adminPayments($request);
    }
}
