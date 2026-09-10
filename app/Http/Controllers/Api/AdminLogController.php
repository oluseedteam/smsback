<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;

class AdminLogController extends Controller
{
    /**
     * Retrieve application and audit logs for the admin dashboard.
     */
    public function index(): JsonResponse
    {
        $allLogs = [];

        // 1. Fetch real application audit logs from the database
        try {
            $auditLogs = AuditLog::with(['student', 'academicSession'])
                ->latest('created_at')
                ->take(75)
                ->get();

            foreach ($auditLogs as $audit) {
                $allLogs[] = $this->formatAuditLog($audit);
            }
        } catch (\Throwable $e) {
            // Gracefully continue if audit_logs table is unavailable
        }

        // 2. Fetch and clean system error logs from laravel.log
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            try {
                $logContent = File::get($logPath);
                $systemLogs = $this->parseLogs($logContent);
                foreach ($systemLogs as $sysLog) {
                    $allLogs[] = $sysLog;
                }
            } catch (\Throwable $e) {
                // Ignore file read issues
            }
        }

        // 3. Sort all logs newest-first by timestamp
        usort($allLogs, function ($a, $b) {
            $timeA = strtotime($a['timestamp'] ?? $a['created_at'] ?? '1970-01-01');
            $timeB = strtotime($b['timestamp'] ?? $b['created_at'] ?? '1970-01-01');
            return $timeB <=> $timeA;
        });

        return response()->json([
            'logs' => array_slice($allLogs, 0, 100),
            'total' => count($allLogs),
        ]);
    }

    /**
     * Clear application and system logs.
     */
    public function clear(): JsonResponse
    {
        $logPath = storage_path('logs/laravel.log');

        if (File::exists($logPath)) {
            try {
                File::put($logPath, '');
            } catch (\Throwable $e) {
                // Continue
            }
        }

        return response()->json([
            'message' => 'System logs cleared successfully.'
        ]);
    }

    private function parseLogs(string $content): array
    {
        $pattern = '/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+\.\w+): (.*)/';
        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

        $logs = [];
        $timezone = config('app.timezone', 'UTC');

        foreach ($matches as $match) {
            $rawDate = $match[1];
            $carbonDate = Carbon::parse($rawDate, $timezone);
            $isoTimestamp = $carbonDate->toIso8601String();
            $level = strtoupper(explode('.', $match[2])[1] ?? 'INFO');
            $rawMessage = trim($match[3]);

            $cleaned = $this->cleanLogMessage($rawMessage);

            $logs[] = [
                'id' => 'sys-' . md5($rawDate . $rawMessage),
                'type' => 'system',
                'title' => $cleaned['title'],
                'message' => $cleaned['message'],
                'technical_details' => $cleaned['technical_details'],
                'timestamp' => $isoTimestamp,
                'created_at' => $isoTimestamp,
                'env' => explode('.', $match[2])[0],
                'level' => $level,
                'user' => [
                    'name' => 'System Engine',
                    'role' => 'system',
                ],
            ];
        }

        return array_slice(array_reverse($logs), 0, 40);
    }

    private function formatAuditLog(AuditLog $audit): array
    {
        $action = $audit->action;
        $studentName = $audit->student?->full_name ?? 'Student';
        $sessionName = $audit->academicSession?->name ?? '';
        $term = $audit->term ?? '';
        $details = is_array($audit->details) ? $audit->details : [];

        $title = match ($action) {
            'REPORT_CARD_RELEASED' => 'Report Card Released',
            'REPORT_CARD_APPROVED' => 'Report Card Approved',
            'REPORT_CARD_WITHHELD' => 'Report Card Withheld',
            'REPORT_CARD_REVOKED' => 'Report Card Revoked',
            'REPORT_CARD_BATCH_RELEASE_QUEUED' => 'Report Cards Batch Released',
            'RESULT_CLASS_TEACHER_REVIEWED' => 'Teacher Result Review Completed',
            'SCORE_SHEET_SUBMITTED' => 'Subject Scores Submitted',
            'CBT_TEST_PUBLISHED' => 'CBT Examination Published',
            'CBT_SUBMITTED' => 'CBT Exam Submitted',
            'STUDENT_PROMOTED' => 'Student Promotion',
            'PROMOTION_CHANGED' => 'Promotion Status Updated',
            'FEES_CONFIGURED' => 'Fee Structure Configured',
            'PAYMENT_CONFIRMED' => 'Fee Payment Confirmed',
            'PAYMENT_REJECTED' => 'Fee Payment Rejected',
            'BANK_ACCOUNT_UPDATED' => 'School Bank Transfer Updated',
            'STUDENT_CREATED' => 'New Student Created',
            'TIMETABLE_SAVED' => 'Academic Timetable Updated',
            'TEACHER_CHANGE_REQUEST_SUBMITTED' => 'Teacher Timetable Request',
            'TEACHER_CHANGE_REQUEST_APPROVED' => 'Timetable Request Approved',
            'USER_LOGIN', 'LOGIN' => 'User Sign In',
            'LOGOUT' => 'User Sign Out',
            default => ucwords(strtolower(str_replace('_', ' ', $action))),
        };

        $message = match ($action) {
            'REPORT_CARD_RELEASED' => "Report card released for {$studentName}" . ($sessionName ? " ({$sessionName} • {$term})" : ""),
            'REPORT_CARD_APPROVED' => "Report card approved for {$studentName}" . ($term ? " • {$term}" : ""),
            'REPORT_CARD_WITHHELD' => "Report card withheld for {$studentName}" . (!empty($details['reason']) ? ": {$details['reason']}" : ""),
            'REPORT_CARD_REVOKED' => "Report card revoked for {$studentName}" . (!empty($details['reason']) ? ": {$details['reason']}" : ""),
            'REPORT_CARD_BATCH_RELEASE_QUEUED' => "Batch report card release initiated" . ($sessionName ? " for {$sessionName} {$term}" : ""),
            'RESULT_CLASS_TEACHER_REVIEWED' => "Class teacher reviewed academic performance results for {$studentName}",
            'SCORE_SHEET_SUBMITTED' => "Teacher scores submitted for subject marksheet review",
            'CBT_TEST_PUBLISHED' => "CBT examination paper published: " . ($details['title'] ?? 'Online Assessment'),
            'CBT_SUBMITTED' => "CBT exam submitted by {$studentName}",
            'STUDENT_PROMOTED' => "Student {$studentName} promoted to destination class",
            'PROMOTION_CHANGED' => "Promotion status recorded for student {$studentName}",
            'FEES_CONFIGURED' => "Fee structure created or modified" . (!empty($details['title']) ? ": {$details['title']}" : ""),
            'PAYMENT_CONFIRMED' => "Official school fee payment confirmed for {$studentName}" . (!empty($details['amount']) ? " (₦" . number_format($details['amount']) . ")" : ""),
            'PAYMENT_REJECTED' => "Payment proof rejected for {$studentName}" . (!empty($details['reason']) ? ": {$details['reason']}" : ""),
            'BANK_ACCOUNT_UPDATED' => "Official school bank transfer details were updated",
            'STUDENT_CREATED' => "New student profile registered: {$studentName}",
            'TIMETABLE_SAVED' => "Class timetable schedule was updated",
            'TEACHER_CHANGE_REQUEST_SUBMITTED' => "Teacher submitted a timetable period change request",
            'TEACHER_CHANGE_REQUEST_APPROVED' => "Timetable change request was approved by administration",
            default => !empty($details['message']) ? $details['message'] : "Activity recorded: " . strtolower(str_replace('_', ' ', $action)),
        };

        $isoTimestamp = $audit->created_at ? $audit->created_at->toIso8601String() : now()->toIso8601String();

        return [
            'id' => "audit-{$audit->id}",
            'type' => 'audit',
            'action' => $action,
            'title' => $title,
            'message' => $message,
            'timestamp' => $isoTimestamp,
            'created_at' => $isoTimestamp,
            'user' => [
                'name' => $audit->user_name ?: 'System',
                'role' => $audit->user_type ?: 'system',
            ],
            'level' => 'INFO',
            'details' => $details,
        ];
    }

    private function cleanLogMessage(string $rawMessage): array
    {
        $clean = $rawMessage;
        $title = 'System Notice';
        $technical = null;

        // Extract JSON context if present
        if (preg_match('/\{"userId".*$/s', $clean, $ctx)) {
            $technical = $ctx[0];
            $clean = preg_replace('/\{"userId".*$/s', '', $clean);
        }
        $clean = trim($clean);

        // Friendly rewrite for common technical exceptions
        if (str_contains($clean, 'no such column: onboarding_tour')) {
            $title = 'Database Migration Notice';
            $clean = "The 'onboarding_tour' column was not found in the users table. Database schema has been updated.";
        } elseif (preg_match('/no such column:\s*([a-zA-Z0-9_]+)/', $clean, $m)) {
            $title = 'Database Schema Notice';
            $clean = "Database column '{$m[1]}' was queried before migration was run. Please run database migrations.";
        } elseif (preg_match('/no such table:\s*([a-zA-Z0-9_]+)/', $clean, $m)) {
            $title = 'Database Table Missing';
            $clean = "Database table '{$m[1]}' does not exist. Please run database migrations.";
        } elseif (str_contains($clean, 'Duplicate entry') || str_contains($clean, 'UNIQUE constraint failed')) {
            $title = 'Data Integrity Notice';
            $clean = "A duplicate entry attempt was safely prevented by unique database constraints.";
        } elseif (str_contains($clean, 'SQLSTATE')) {
            $title = 'Database Notice';
            // Extract the readable part before SQL statement
            if (preg_match('/SQLSTATE\[\w+\]:\s*[^:]+:\s*\d+\s*(.+?)\s*\(/i', $clean, $sqlMatch)) {
                $clean = $sqlMatch[1];
            }
        }

        return [
            'title' => $title,
            'message' => $clean,
            'technical_details' => $technical,
        ];
    }
}

