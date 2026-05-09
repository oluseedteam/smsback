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
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::middleware('throttle:auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'authenticate']);
        Route::post('/register', [AuthController::class, 'register']);
    });

    Route::middleware('throttle:password-reset')->post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::middleware('throttle:password-reset')->post('/reset-password', [PasswordResetController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
    Route::middleware('auth:sanctum')->patch('/profile', [AuthController::class, 'updateProfile']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Read-only access to classes and subjects for all authenticated users
    Route::get('/classes', [SchoolClassController::class, 'index']);
    Route::get('/classes/{class}', [SchoolClassController::class, 'show']);
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{subject}', [SubjectController::class, 'show']);

    // ─── Admin Routes ───────────────────────────────────────
    Route::middleware('role:admin')->group(function (): void {
        Route::get('/logs', [\App\Http\Controllers\Api\AdminLogController::class, 'index']);
        Route::delete('/logs', [\App\Http\Controllers\Api\AdminLogController::class, 'clear']);

        Route::get('/users', [UserManagementController::class, 'index']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::get('/users/{role}/{id}', [UserManagementController::class, 'show']);
        Route::patch('/users/{role}/{id}', [UserManagementController::class, 'update']);
        Route::delete('/users/{role}/{id}', [UserManagementController::class, 'destroy']);

        // Write operations for classes and subjects remain admin-only
        Route::post('/classes', [SchoolClassController::class, 'store']);
        Route::put('/classes/{class}', [SchoolClassController::class, 'update']);
        Route::delete('/classes/{class}', [SchoolClassController::class, 'destroy']);
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);

        // Finance - Admin
        Route::get('/admin/fees', [FinanceController::class, 'feeIndex']);
        Route::post('/admin/fees', [FinanceController::class, 'feeStore']);
        Route::put('/admin/fees/{fee}', [FinanceController::class, 'feeUpdate']);
        Route::delete('/admin/fees/{fee}', [FinanceController::class, 'feeDestroy']);
        Route::get('/admin/payments', [FinanceController::class, 'allPayments']);
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
    });

    // ─── Teacher Routes ─────────────────────────────────────
    Route::middleware('role:teacher')->group(function (): void {
        // Teacher creating students
        Route::get('/teacher/my-students', [TeacherStudentController::class, 'index']);
        Route::post('/teacher/create-student', [TeacherStudentController::class, 'store']);

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
    });

    // ─── Student Routes ─────────────────────────────────────
    Route::middleware('role:student')->group(function (): void {
        Route::get('/my/attendance', [AttendanceController::class, 'index']);
        Route::get('/my/results', [ResultController::class, 'index']);
        Route::get('/my/classes', [\App\Http\Controllers\Api\StudentClassController::class, 'index']);

        // Finance - Student
        Route::get('/student/finance', [FinanceController::class, 'studentFinance']);
        Route::post('/student/payment/initialize', [FinanceController::class, 'initializePayment']);
        Route::post('/student/payment/verify', [FinanceController::class, 'verifyPayment']);
        Route::post('/student/payment/pay-from-wallet', [FinanceController::class, 'payFeeFromWallet']);

        // CBT - Student
        Route::get('/student/cbt-tests', [CbtController::class, 'index']);
        Route::post('/student/cbt-tests/{cbtTest}/start', [CbtController::class, 'startExam']);
        Route::post('/student/cbt-tests/{cbtTest}/submit', [CbtController::class, 'submitExam']);
        Route::get('/student/cbt-tests/{cbtTest}/result', [CbtController::class, 'myResult']);
        Route::get('/student/cbt-counts', [CbtController::class, 'classCounts']);
    });

    // Shared / Role-specific routes for new models
    Route::apiResource('assignments', AssignmentController::class);
    Route::apiResource('messages', MessageController::class);
    Route::apiResource('resources', ResourceController::class);
    Route::apiResource('calendar-events', CalendarEventController::class);
    Route::apiResource('teacher-classes', \App\Http\Controllers\TeacherClassController::class);
});
