<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;

class AdminLogController extends Controller
{
    /**
     * Retrieve application logs for the admin dashboard.
     */
    public function index(): JsonResponse
    {
        $logPath = storage_path('logs/laravel.log');

        if (!File::exists($logPath)) {
            return response()->json([
                'logs' => [],
                'message' => 'No logs found.'
            ]);
        }

        try {
            $logContent = File::get($logPath);
            $parsedLogs = $this->parseLogs($logContent);

            return response()->json([
                'logs' => $parsedLogs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Unable to read logs. Check file permissions.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear the application logs.
     */
    public function clear(): JsonResponse
    {
        $logPath = storage_path('logs/laravel.log');

        if (File::exists($logPath)) {
            try {
                File::put($logPath, '');
                return response()->json([
                    'message' => 'Logs cleared successfully.'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Unable to clear logs. Check file permissions.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        return response()->json([
            'message' => 'No logs to clear.'
        ]);
    }

    private function parseLogs(string $content): array
    {
        // Simple parser to extract the latest logs
        $pattern = '/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+\.\w+): (.*)/';
        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

        $logs = [];
        foreach ($matches as $match) {
            $logs[] = [
                'timestamp' => $match[1],
                'env' => explode('.', $match[2])[0],
                'level' => explode('.', $match[2])[1],
                'message' => trim($match[3])
            ];
        }

        // Return latest 100 logs
        return array_slice(array_reverse($logs), 0, 100);
    }
}
