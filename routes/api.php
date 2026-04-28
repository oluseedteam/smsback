<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SubjectController;
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
    });

    Route::middleware('role:admin,teacher')->group(function (): void {
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::post('/attendance/bulk', [AttendanceController::class, 'storeBulk']);
        Route::patch('/attendance/{attendance}', [AttendanceController::class, 'update']);

        Route::get('/results', [ResultController::class, 'index']);
        Route::post('/results', [ResultController::class, 'store']);
        Route::patch('/results/{result}', [ResultController::class, 'update']);
        Route::delete('/results/{result}', [ResultController::class, 'destroy']);
    });

    Route::middleware('role:student')->group(function (): void {
        Route::get('/my/attendance', [AttendanceController::class, 'index']);
        Route::get('/my/results', [ResultController::class, 'index']);
        Route::get('/my/classes', [\App\Http\Controllers\Api\StudentClassController::class, 'index']);
    });

    // Shared / Role-specific routes for new models
    Route::apiResource('assignments', AssignmentController::class);
    Route::apiResource('messages', MessageController::class);
    Route::apiResource('resources', ResourceController::class);
    Route::apiResource('calendar-events', CalendarEventController::class);
    Route::apiResource('teacher-classes', \App\Http\Controllers\TeacherClassController::class);
});
