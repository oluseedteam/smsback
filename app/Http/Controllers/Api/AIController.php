<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\SchoolSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    /**
     * Role-Scoped AI Assistant Query Endpoint.
     */
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string|max:2000',
            'conversation_history' => 'nullable|array',
            'conversation_history.*.role' => 'required_with:conversation_history|in:user,assistant,system',
            'conversation_history.*.content' => 'required_with:conversation_history|string',
        ]);

        $user = $request->user();
        $role = $user->role ?? 'student';
        $prompt = $validated['prompt'];
        $settings = SchoolSetting::getSettings();
        $currentSession = AcademicSession::where('is_current', true)->first();

        // 1. Build Role-Scoped Context (RBAC Enforced)
        $systemContext = "You are the official Eyitayo Schools AI Assistant for {$settings->school_name} (Motto: {$settings->motto}). ";
        $systemContext .= "Current academic session: " . ($currentSession?->name ?? '2026/2027') . " (" . ($currentSession?->current_term ?? '1st Term') . ").\n";

        if ($role === 'student') {
            $classNames = $user->classes->pluck('name')->join(', ');
            $registeredSubjects = \App\Models\CourseRegistration::where('student_id', $user->id)
                ->with('subject:id,name')
                ->get()
                ->pluck('subject.name')
                ->unique()
                ->join(', ');

            $systemContext .= "You are assisting a Student: {$user->full_name} (ID: {$user->student_id}).\n";
            $systemContext .= "Student's enrolled class: " . ($classNames ?: 'Not assigned') . ".\n";
            $systemContext .= "Registered subjects: " . ($registeredSubjects ?: 'General curriculum') . ".\n";
            $systemContext .= "Instructions: Provide helpful, encouraging academic guidance, study tips, assignment explanations, and digital library navigation. Never disclose internal administrative logs, teacher ratings, or other students' private information.";
        } elseif ($role === 'teacher') {
            $assignedClass = $user->assignedClass?->name;
            $teachingSubjects = $user->subjects->pluck('name')->unique()->join(', ');

            $systemContext .= "You are assisting a Faculty Member / Teacher: {$user->full_name} (Employee ID: {$user->employee_id}).\n";
            $systemContext .= "Class Teacher of: " . ($assignedClass ?: 'None') . ".\n";
            $systemContext .= "Teaching subjects: " . ($teachingSubjects ?: 'General curriculum') . ".\n";
            $systemContext .= "Instructions: Provide curriculum lesson planning support, grading and rubric suggestions, pedagogical strategies, classroom management advice, and CBT question authoring assistance.";
        } elseif ($role === 'admin' || $role === 'sub_admin') {
            $systemContext .= "You are assisting an Administrator: {$user->full_name} ({$user->email}).\n";
            $systemContext .= "Instructions: Provide administrative insights, timetable optimization advice, report-card release procedure guidance, educational governance best practices, and statistical summaries.";
        } else {
            $systemContext .= "You are assisting a School Staff Member: {$user->full_name}.\n";
            $systemContext .= "Instructions: Provide facility maintenance, administrative workflow, and operational support.";
        }

        // 2. Query Gemini / LLM API if key exists, otherwise fallback to intelligent rule-based knowledge engine
        $apiKey = env('GEMINI_API_KEY') ?: env('OPENAI_API_KEY');

        if ($apiKey && env('GEMINI_API_KEY')) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                ['text' => "SYSTEM INSTRUCTIONS: {$systemContext}\n\nUSER PROMPT: {$prompt}"]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 800,
                    ]
                ]);

                if ($response->successful()) {
                    $aiText = $response->json('candidates.0.content.parts.0.text');
                    if ($aiText) {
                        return response()->json([
                            'reply' => $aiText,
                            'role' => $role,
                            'provider' => 'gemini'
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Gemini AI API call failed, falling back to local assistant: " . $e->getMessage());
            }
        }

        // 3. Robust In-House Knowledge Engine Fallback
        $reply = $this->generateLocalAssistantReply($prompt, $role, $user, $settings, $currentSession);

        return response()->json([
            'reply' => $reply,
            'role' => $role,
            'provider' => 'eyitayo_ai_engine'
        ]);
    }

    private function generateLocalAssistantReply(string $prompt, string $role, $user, $settings, $session): string
    {
        $p = strtolower($prompt);
        $schoolName = $settings->school_name;
        $motto = $settings->motto;
        $sessionName = $session?->name ?? '2026/2027';
        $termName = $session?->current_term ?? '1st Term';

        if (str_contains($p, 'motto') || str_contains($p, 'about school') || str_contains($p, 'eyitayo')) {
            return "Welcome to **{$schoolName}**!\nOur motto is *\"{$motto}\"*.\nWe are currently operating in the **{$sessionName} Academic Session ({$termName})**.";
        }

        if ($role === 'student') {
            if (str_contains($p, 'grade') || str_contains($p, 'result') || str_contains($p, 'report card')) {
                return "Hello {$user->full_name}! You can view your terminal results and download official report cards under **Report Card & Grades** in your student sidebar. Note that report cards only appear after they have been officially approved and released by the administration.";
            }
            if (str_contains($p, 'cbt') || str_contains($p, 'exam') || str_contains($p, 'test')) {
                return "To access CBT examinations, navigate to **CBT Exams** in your dashboard. Ensure you have a stable internet connection before clicking 'Start Exam'. Your score is automatically calculated upon submission.";
            }
            if (str_contains($p, 'course') || str_contains($p, 'subject') || str_contains($p, 'registration')) {
                return "You can register your curriculum subjects under **Course Registration**. Please ensure you register all compulsory and elective subjects for the {$termName}.";
            }
            if (str_contains($p, 'library') || str_contains($p, 'book')) {
                return "Our Digital Library gives you 24/7 access to uploaded course materials, Open Library textbooks, and Google Books. Check the **Library** tab in your navigation menu.";
            }
            return "Hello {$user->full_name}! I am your Eyitayo AI Study Assistant. I can help explain complex academic concepts, organize your study timetable for {$termName}, guide you through course registrations, and help you find digital textbooks in our library. How can I assist your studies today?";
        }

        if ($role === 'teacher') {
            if (str_contains($p, 'scoresheet') || str_contains($p, 'grade') || str_contains($p, 'ca')) {
                return "To enter grades, open **Gradebook**, select your Academic Session, Term, Class, and Subject. Only students who completed course registration for your subject will appear on your score sheet. Enter 1st CA, 2nd CA, and Written Exam scores (if configured for CBT, exam scores are automatically synchronized).";
            }
            if (str_contains($p, 'cbt') || str_contains($p, 'question')) {
                return "You can author questions in **CBT Exams**. Questions are saved in draft status and can be submitted for administrative approval before publishing exams.";
            }
            if (str_contains($p, 'timetable') || str_contains($p, 'schedule')) {
                return "You can inspect your class schedules in **Calendar / Timetable**. If you require a period swap or schedule adjustment, click on the specific entry to submit a Timetable Change Request to the administration.";
            }
            return "Greetings {$user->full_name}! As a faculty member at {$schoolName}, I can assist you with lesson plan templates, WAEC/NECO/BECE curriculum guides, scoring rubrics, affective domain evaluation criteria, and CBT question authoring.";
        }

        return "Greetings Administrator {$user->full_name}! I am your institutional management assistant for {$schoolName}. I can assist with academic session transitions, grading scale calibrations, fee release criteria, timetable conflict resolution, and examination management.";
    }
}
