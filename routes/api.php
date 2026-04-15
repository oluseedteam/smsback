<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::middleware('throttle:auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'authenticate']);
    });

    Route::middleware('throttle:password-reset')->post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::middleware('throttle:password-reset')->post('/reset-password', [PasswordResetController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::middleware('role:admin')->group(function (): void {
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::get('/users/{role}/{id}', [UserManagementController::class, 'show']);
        Route::patch('/users/{role}/{id}', [UserManagementController::class, 'update']);
        Route::delete('/users/{role}/{id}', [UserManagementController::class, 'destroy']);

        Route::apiResource('classes', SchoolClassController::class)->parameters(['classes' => 'class']);
        Route::apiResource('subjects', SubjectController::class);
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
    });
});
