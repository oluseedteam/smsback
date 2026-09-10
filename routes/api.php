<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\CbtController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherStudentController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\CalendarEventController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ContactInquiryController;
use App\Http\Controllers\Api\ReportCardController;
use App\Http\Controllers\Api\ScoreSheetController;
use App\Http\Controllers\Api\CourseRegistrationController;
use App\Http\Controllers\Api\ReportCardSettingsController;
use App\Http\Controllers\Api\StudentNotificationController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\AcademicSectionController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\QrIdCardController;
use App\Http\Controllers\Api\DigitalLibraryController;
use App\Http\Controllers\Api\SchoolSettingsController;
use Illuminate\Support\Facades\Route;

// ─── Public School Settings (Contact, About, Identity, Experience) ──
Route::get('/public/school-settings', [SchoolSettingsController::class, 'getPublicSettings']);

// ─── Public Parent / Verification Report Card route ─────────────
Route::get('/public/report-card/verify/{token}', [ReportCardController::class, 'verifyPublicToken']);

// Public catalog lookup; all library mutations remain authenticated below.
Route::middleware('throttle:60,1')->get('/library/search', [DigitalLibraryController::class, 'search']);

// ─── Public Admissions & Applications routes ────────────────────
Route::post('/admissions/apply', [AdmissionController::class, 'apply']);
Route::get('/admissions/track/{identifier}', [AdmissionController::class, 'checkStatus']);

// ─── Public Contact Inquiries & Tour Bookings ───────────────────
Route::post('/contact/submit', [ContactInquiryController::class, 'store']);
Route::post('/contact', [ContactInquiryController::class, 'store']);

// ─── Public Feedback & Testimonials routes ──────────────────────
Route::post('/feedback', [FeedbackController::class, 'store']);
Route::get('/feedback/testimonials', [FeedbackController::class, 'publicTestimonials']);

// ─── Authentication Routes ──────────────────────────────────────
Route::prefix('auth')->group(function (): void {
    Route::middleware('throttle:auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'authenticate']);
        Route::post('/register', [AuthController::class, 'register']);
    });

    Route::middleware('throttle:password-reset')->post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::middleware('throttle:password-reset')->post('/reset-password', [PasswordResetController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
        Route::patch('/emergency-contact', [AuthController::class, 'updateEmergencyContact']);
        Route::get('/onboarding-tour', [AuthController::class, 'getOnboardingTourStatus']);
        Route::post('/onboarding-tour', [AuthController::class, 'updateOnboardingTourStatus']);
    });
});

// ─── Authenticated Application Routes ───────────────────────────
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Read-only access to classes and subjects for all authenticated users
    Route::get('/classes', [SchoolClassController::class, 'index']);
    Route::get('/classes/{class}', [SchoolClassController::class, 'show']);
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{subject}', [SubjectController::class, 'show']);

    // Timetable read access for all roles
    Route::get('/timetables', [TimetableController::class, 'index']);

    // AI Assistant (Role-Scoped Context)
    Route::post('/ai/query', [AIController::class, 'query']);
    Route::post('/ai/chat', [AIController::class, 'query']);
    Route::post('/nexora/ai/query', [AIController::class, 'query']); // backward compatibility

    // Digital Library Search (School resources + Open Library + Google Books)

    // User ID Card & Safe QR identifier
    Route::get('/users/{role}/{id}/id-card', [QrIdCardController::class, 'getIdCard']);

    // ─── Admin Routes ───────────────────────────────────────
    Route::middleware('role:admin')->group(function (): void {
        Route::get('/admin/setup-checklist', [DashboardController::class, 'setupChecklist']);
        Route::get('/logs', [\App\Http\Controllers\Api\AdminLogController::class, 'index']);
        Route::delete('/logs', [\App\Http\Controllers\Api\AdminLogController::class, 'clear']);

        // User Management
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::get('/users/{role}/{id}', [UserManagementController::class, 'show']);
        Route::patch('/users/{role}/{id}', [UserManagementController::class, 'update']);
        Route::delete('/users/{role}/{id}', [UserManagementController::class, 'destroy']);

        // Teacher-created Student Approval Workflow
        Route::patch('/users/students/{id}/approve', [UserManagementController::class, 'approveStudent']);
        Route::patch('/users/students/{id}/reject', [UserManagementController::class, 'rejectStudent']);

        // Admin QR Scanner / User Lookup
        Route::post('/admin/qr/lookup', [QrIdCardController::class, 'qrLookup']);

        // Timetable Management (Admin)
        Route::post('/timetables', [TimetableController::class, 'store']);
        Route::put('/timetables/{timetable}', [TimetableController::class, 'store']);
        Route::delete('/timetables/{timetable}', [TimetableController::class, 'destroy']);
        Route::patch('/timetable/change-requests/{id}/approve', [TimetableController::class, 'approveChangeRequest']);
        Route::patch('/timetable/change-requests/{id}/reject', [TimetableController::class, 'rejectChangeRequest']);

        // Promotion & Student Class History
        Route::get('/admin/promotions/eligible-students', [PromotionController::class, 'getEligibleStudents']);
        Route::post('/admin/promotions/promote', [PromotionController::class, 'promote']);
        Route::get('/admin/promotions/history', [PromotionController::class, 'history']);

        // CBT Question Approvals
        Route::patch('/admin/cbt-questions/{question}/approve', [CbtController::class, 'approveQuestion']);
        Route::patch('/admin/cbt-questions/{question}/reject', [CbtController::class, 'rejectQuestion']);

        // Academic Sections (Admin)
        Route::post('/academic-sections', [AcademicSectionController::class, 'store']);
        Route::put('/academic-sections/{academicSection}', [AcademicSectionController::class, 'update']);
        Route::delete('/academic-sections/{academicSection}', [AcademicSectionController::class, 'destroy']);

        // Write operations for classes and subjects remain admin-only
        Route::post('/classes', [SchoolClassController::class, 'store']);
        Route::put('/classes/{class}', [SchoolClassController::class, 'update']);
        Route::delete('/classes/{class}', [SchoolClassController::class, 'destroy']);
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);

        // Finance - Admin
        Route::get('/fees', [FinanceController::class, 'feeIndex']);
        Route::post('/fees', [FinanceController::class, 'feeStore']);
        Route::put('/fees/{fee}', [FinanceController::class, 'feeUpdate']);
        Route::patch('/fees/{fee}', [FinanceController::class, 'feeUpdate']);
        Route::delete('/fees/{fee}', [FinanceController::class, 'feeDestroy']);
        Route::get('/fee-types', [FinanceController::class, 'feeTypeIndex']);
        Route::post('/fee-types', [FinanceController::class, 'feeTypeStore']);

        // Bank Account Settings (Admin)
        Route::put('/payment-settings/bank-account', [FinanceController::class, 'updateBankAccount']);

        // Admin Payment Verification & Records
        Route::get('/payments', [FinanceController::class, 'adminPayments']);
        Route::get('/admin/payments', [FinanceController::class, 'adminPayments']);
        Route::get('/admin/payments/{payment}', [FinanceController::class, 'adminPaymentDetail']);
        Route::post('/admin/payments/{payment}/confirm', [FinanceController::class, 'adminConfirmPayment']);
        Route::post('/admin/payments/{payment}/reject', [FinanceController::class, 'adminRejectPayment']);
        Route::get('/admin/finance/overview', [FinanceController::class, 'financeOverview']);
        Route::get('/admin/students/{student}/finance', [FinanceController::class, 'studentPaymentProfile']);

        // Admin messaging - broadcast to all teachers or specific teacher
        Route::post('/admin/broadcast-message', [MessageController::class, 'adminBroadcast']);
        
        // CBT Results approval workflow
        Route::get('/cbt-submissions', [CbtController::class, 'allSubmissions']);
        Route::patch('/cbt-submissions/release-all', [CbtController::class, 'releaseAllPending']);
        Route::patch('/cbt-submissions/{submission}/release', [CbtController::class, 'releaseResult']);

        // Admissions & Applications Management
        Route::get('/admin/admissions', [AdmissionController::class, 'index']);
        Route::get('/admin/admissions/{id}', [AdmissionController::class, 'show']);
        Route::patch('/admin/admissions/{id}/status', [AdmissionController::class, 'updateStatus']);
        Route::delete('/admin/admissions/{id}', [AdmissionController::class, 'destroy']);

        // Feedback Management
        Route::get('/admin/feedbacks', [FeedbackController::class, 'index']);
        Route::patch('/admin/feedbacks/{feedback}', [FeedbackController::class, 'update']);
        Route::delete('/admin/feedbacks/{feedback}', [FeedbackController::class, 'destroy']);

        // Contact Inquiries Management
        Route::get('/admin/inquiries', [ContactInquiryController::class, 'index']);
        Route::delete('/admin/inquiries/clear-all', [ContactInquiryController::class, 'clearAll']);
        Route::get('/admin/inquiries/{inquiry}', [ContactInquiryController::class, 'show']);
        Route::patch('/admin/inquiries/{inquiry}', [ContactInquiryController::class, 'update']);
        Route::delete('/admin/inquiries/{inquiry}', [ContactInquiryController::class, 'destroy']);

        // Report Card Management (Admin)
        Route::get('/admin/report-cards', [ReportCardController::class, 'index']);
        Route::get('/admin/report-cards/{id}', [ReportCardController::class, 'show']);
        Route::post('/admin/report-cards/generate-batch', [ReportCardController::class, 'generateBatch']);
        Route::post('/admin/report-cards/{id}/approve', [ReportCardController::class, 'approve']);
        Route::post('/admin/report-cards/{id}/review', [ReportCardController::class, 'classTeacherReview']);
        Route::post('/admin/report-cards/{id}/release', [ReportCardController::class, 'release']);
        Route::post('/admin/report-cards/release-batch', [ReportCardController::class, 'releaseBatch']);
        Route::post('/admin/report-cards/{id}/withhold', [ReportCardController::class, 'withhold']);
        Route::post('/admin/report-cards/{id}/return', [ReportCardController::class, 'returnToTeacher']);
        Route::post('/admin/report-cards/{id}/reject', [ReportCardController::class, 'reject']);
        Route::post('/admin/report-cards/{id}/lock', [ReportCardController::class, 'lock']);
        Route::post('/admin/report-cards/{id}/reopen', [ReportCardController::class, 'reopen']);
        Route::post('/admin/report-cards/{id}/revoke', [ReportCardController::class, 'revoke']);
        Route::post('/admin/report-cards/{id}/resend-email', [ReportCardController::class, 'resendEmail']);
        Route::get('/admin/report-cards/{id}/preview-email', [ReportCardController::class, 'previewEmail']);
        Route::get('/admin/report-card-email-logs', [ReportCardController::class, 'emailLogsIndex']);
        Route::post('/admin/report-card-email-logs/{id}/retry', [ReportCardController::class, 'retryEmailLog']);
        Route::get('/report-card-email-logs', [ReportCardController::class, 'emailLogsIndex']);
        Route::post('/results/approval', [ReportCardController::class, 'approve']);
        Route::post('/results/release', [ReportCardController::class, 'release']);

        // School Identity, Contact, About & Experience Settings (Admin)
        Route::get('/admin/school-settings', [SchoolSettingsController::class, 'getAdminSettings']);
        Route::post('/admin/school-settings', [SchoolSettingsController::class, 'updateSchoolSettings']);

        // Report Card & Academic Settings (Admin)
        Route::post('/admin/report-card/settings', [ReportCardSettingsController::class, 'updateSettings']);
        Route::post('/admin/academic-sessions', [ReportCardSettingsController::class, 'sessionsStore']);
        Route::put('/admin/academic-sessions/{id}', [ReportCardSettingsController::class, 'sessionsUpdate']);
        Route::delete('/admin/academic-sessions/{id}', [ReportCardSettingsController::class, 'sessionsDestroy']);
        Route::post('/admin/grading-scales', [ReportCardSettingsController::class, 'gradingScalesStore']);
        Route::put('/admin/grading-scales/{id}', [ReportCardSettingsController::class, 'gradingScalesUpdate']);
        Route::delete('/admin/grading-scales/{id}', [ReportCardSettingsController::class, 'gradingScalesDestroy']);
        Route::post('/admin/grading-scales/reset-defaults', [ReportCardSettingsController::class, 'gradingScalesResetDefaults']);
        Route::get('/admin/assessment-configurations', [ReportCardSettingsController::class, 'assessmentConfigsIndex']);
        Route::post('/admin/assessment-configurations', [ReportCardSettingsController::class, 'assessmentConfigsStore']);
    });

    // ─── Teacher & Admin Routes ─────────────────────────────
    Route::middleware('role:admin,teacher')->group(function (): void {
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::post('/attendance/bulk', [AttendanceController::class, 'storeBulk']);
        Route::patch('/attendance/{attendance}', [AttendanceController::class, 'update']);

        Route::get('/results', [ResultController::class, 'index']);
        Route::post('/results', [ResultController::class, 'store']);
        Route::patch('/results/{result}', [ResultController::class, 'update']);
        Route::delete('/results/{result}', [ResultController::class, 'destroy']);

        Route::get('/timetable/change-requests', [TimetableController::class, 'listChangeRequests']);

        // Score Sheet & Marksheet (Admin & Teacher)
        Route::get('/teacher/scoresheet', [ScoreSheetController::class, 'getScoreSheet']);
        Route::post('/teacher/scoresheet/save', [ScoreSheetController::class, 'saveScoreSheet']);
        Route::post('/teacher/scoresheet/submit', [ScoreSheetController::class, 'submitScoreSheet']);
        Route::get('/marksheets', [ScoreSheetController::class, 'getScoreSheet']);
        Route::post('/marksheets/save', [ScoreSheetController::class, 'saveScoreSheet']);
        Route::post('/marksheets/submit', [ScoreSheetController::class, 'submitScoreSheet']);
        Route::get('/teacher/affective-psychomotor', [ScoreSheetController::class, 'getAffectiveAndPsychomotor']);
        Route::post('/teacher/affective-psychomotor/save', [ScoreSheetController::class, 'saveAffectiveAndPsychomotor']);
        Route::get('/teacher/course-registrations', [CourseRegistrationController::class, 'index']);
    });

    // ─── Teacher Routes ─────────────────────────────────────
    Route::middleware('role:teacher')->group(function (): void {
        // Teacher creating students
        Route::get('/teacher/my-students', [TeacherStudentController::class, 'index']);
        Route::post('/teacher/create-student', [TeacherStudentController::class, 'store']);

        // Timetable Change Request (Teacher)
        Route::post('/teacher/timetable-change-request', [TimetableController::class, 'requestChange']);

        // CBT - Teacher management
        Route::get('/cbt-tests', [CbtController::class, 'index']);
        Route::post('/cbt-tests', [CbtController::class, 'store']);
        Route::get('/cbt-tests/{cbtTest}', [CbtController::class, 'show']);
        Route::put('/cbt-tests/{cbtTest}', [CbtController::class, 'update']);
        Route::delete('/cbt-tests/{cbtTest}', [CbtController::class, 'destroy']);
        Route::post('/cbt-tests/{cbtTest}/questions', [CbtController::class, 'storeQuestion']);
        Route::post('/cbt-tests/{cbtTest}/questions/bulk', [CbtController::class, 'storeBulkQuestions']);
        Route::put('/cbt-questions/{question}', [CbtController::class, 'updateQuestion']);
        Route::delete('/cbt-questions/{question}', [CbtController::class, 'destroyQuestion']);
        Route::get('/cbt-tests/{cbtTest}/results', [CbtController::class, 'testResults']);
        Route::get('/teacher/report-cards', [ReportCardController::class, 'teacherReviewQueue']);
        Route::post('/teacher/report-cards/{id}/review', [ReportCardController::class, 'classTeacherReview']);
    });

    // ─── Student Routes ─────────────────────────────────────
    Route::middleware('role:student')->group(function (): void {
        Route::get('/my/attendance', [AttendanceController::class, 'index']);
        Route::get('/my/results', [ResultController::class, 'index']);
        Route::get('/my/classes', [\App\Http\Controllers\Api\StudentClassController::class, 'index']);
        Route::get('/my/teachers', [\App\Http\Controllers\Api\StudentClassController::class, 'myTeachers']);
        Route::get('/my/classmates', [\App\Http\Controllers\Api\StudentClassController::class, 'myClassmates']);

        // Report Card - Student Portal
        Route::get('/student/report-cards', [ReportCardController::class, 'studentReportCards']);
        Route::get('/student/report-card/view', [ReportCardController::class, 'studentViewReportCard']);
        Route::get('/student/report-card-history', [ReportCardController::class, 'studentReportCardHistory']);
        Route::get('/student/report-cards/{id}', [ReportCardController::class, 'showStudentReportCard']);
        Route::get('/student/report-cards/{id}/pdf', [ReportCardController::class, 'downloadPdf']);
        Route::get('/report-cards/me', [ReportCardController::class, 'studentReportCards']);
        Route::get('/report-cards/me/history', [ReportCardController::class, 'studentReportCardHistory']);
        Route::get('/report-cards/me/{id}', [ReportCardController::class, 'showStudentReportCard']);
        Route::get('/report-cards/me/{id}/pdf', [ReportCardController::class, 'downloadPdf']);

        // Course Registration - Student
        Route::get('/student/course-registration/available', [CourseRegistrationController::class, 'availableSubjects']);
        Route::post('/student/course-registration', [CourseRegistrationController::class, 'register']);
        Route::get('/student/course-registrations', [CourseRegistrationController::class, 'index']);

        // In-App Notifications - Student
        Route::get('/student/notifications', [StudentNotificationController::class, 'index']);
        Route::patch('/student/notifications/{id}/read', [StudentNotificationController::class, 'markAsRead']);
        Route::post('/student/notifications/read-all', [StudentNotificationController::class, 'markAllAsRead']);

        // Finance - Student
        Route::get('/student/finance', [FinanceController::class, 'studentFinance']);
        Route::get('/student/fees', [FinanceController::class, 'studentFinance']);
        Route::post('/student/payments', [FinanceController::class, 'submitStudentPayment']);
        Route::get('/student/payments', [FinanceController::class, 'studentFinance']);

        // CBT - Student
        Route::get('/student/cbt-tests', [CbtController::class, 'index']);
        Route::post('/student/cbt-tests/{cbtTest}/start', [CbtController::class, 'startExam']);
        Route::post('/student/cbt-tests/{cbtTest}/save-answer', [CbtController::class, 'saveAnswer']);
        Route::post('/student/cbt-tests/{cbtTest}/submit', [CbtController::class, 'submitExam']);
        Route::get('/student/cbt-tests/{cbtTest}/result', [CbtController::class, 'myResult']);
        Route::get('/student/cbt-counts', [CbtController::class, 'classCounts']);
    });

    // ─── Shared Authenticated Routes ─────────────────────────
    // Payment Bank Details & Secure Receipt Access
    Route::get('/payment-settings/bank-account', [FinanceController::class, 'getBankAccount']);
    Route::get('/payments/{payment}/receipt', [FinanceController::class, 'downloadReceiptFile']);
    Route::get('/payments/{payment}/official-receipt', [FinanceController::class, 'getOfficialReceipt']);
    Route::get('/payments/{payment}/official-receipt/pdf', [FinanceController::class, 'downloadOfficialReceiptPdf']);
    Route::get('/report-cards/{id}/pdf', [ReportCardController::class, 'downloadPdf']);
    Route::get('/terms', function() {
        return response()->json([
            ['id' => 'FIRST_TERM', 'value' => '1st Term', 'name' => 'First Term', 'report_type' => 'TERM'],
            ['id' => 'SECOND_TERM', 'value' => '2nd Term', 'name' => 'Second Term', 'report_type' => 'TERM'],
            ['id' => 'THIRD_TERM', 'value' => '3rd Term', 'name' => 'Third Term', 'report_type' => 'ANNUAL'],
        ]);
    });
    Route::get('/academic-sections', [AcademicSectionController::class, 'index']);
    Route::get('/academic-sections/{academicSection}', [AcademicSectionController::class, 'show']);
    Route::get('/report-card/settings', [ReportCardSettingsController::class, 'getSettings']);
    Route::get('/academic-sessions', [ReportCardSettingsController::class, 'sessionsIndex']);
    Route::get('/grading-scales', [ReportCardSettingsController::class, 'gradingScalesIndex']);
    Route::get('/assessment-configurations', [ReportCardSettingsController::class, 'assessmentConfigsIndex']);

    // Shared / role-specific routes for assignments and school resources.
    Route::middleware('role:admin,teacher,student')->group(function (): void {
        Route::apiResource('assignments', AssignmentController::class)->only(['index', 'show']);
    });
    Route::middleware('role:student')->group(function (): void {
        Route::post('/assignments/{assignment}/submit', [AssignmentController::class, 'submit']);
    });
    Route::middleware('role:admin,teacher')->group(function (): void {
        Route::apiResource('assignments', AssignmentController::class)->only(['store', 'update', 'destroy']);
        Route::get('/assignments/{assignment}/submissions', [AssignmentController::class, 'submissions']);
        Route::post('/submissions/{submission}/grade', [AssignmentController::class, 'grade']);
        Route::apiResource('resources', ResourceController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('calendar-events', CalendarEventController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('teacher-classes', \App\Http\Controllers\TeacherClassController::class);
    });
    Route::post('/messages/clear-chat', [MessageController::class, 'clearChat']);
    Route::delete('/admin/messages/wipe-all', [MessageController::class, 'clearAll']);
    Route::apiResource('messages', MessageController::class);
    Route::apiResource('resources', ResourceController::class)->only(['index', 'show']);
    Route::apiResource('calendar-events', CalendarEventController::class)->only(['index', 'show']);
    Route::get('/all-teachers', [\App\Http\Controllers\Api\StudentClassController::class, 'allTeachers']);

    // Disputes & Feedback (teachers, students, admins)
    Route::get('/disputes', [DisputeController::class, 'index']);
    Route::post('/disputes', [DisputeController::class, 'store']);
    Route::patch('/disputes/{dispute}', [DisputeController::class, 'update']);
    Route::delete('/disputes/clear-all', [DisputeController::class, 'clearAll']);
    Route::delete('/disputes/{dispute}', [DisputeController::class, 'destroy']);

    // Health Records
    Route::get('/health-records', [\App\Http\Controllers\Api\HealthRecordController::class, 'index']);
    Route::post('/health-records', [\App\Http\Controllers\Api\HealthRecordController::class, 'store']);
    Route::delete('/health-records/{id}', [\App\Http\Controllers\Api\HealthRecordController::class, 'destroy']);

    // Admin profile update
    Route::patch('/admin/profile', [AuthController::class, 'updateProfile']);
});
