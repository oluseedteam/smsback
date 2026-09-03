<?php

namespace App\Services;

use App\Jobs\SendReportCardEmail;
use App\Models\AuditLog;
use App\Models\EmailEvent;
use App\Models\ReportCard;
use App\Models\ReportCardAccessToken;
use App\Models\SchoolSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportCardEmailService
{
    /**
     * Send released report card email to student and/or parent.
     */
    public function sendReleaseEmails(ReportCard $reportCard, bool $forceResend = false): array
    {
        $reportCard->load(['student', 'schoolClass', 'academicSession']);
        $student = $reportCard->student;

        return [
            'student' => $this->queueRecipient($reportCard, 'student', trim($student->email ?? ''), $forceResend),
            'parent' => $this->queueRecipient($reportCard, 'parent', trim($student->parent_email ?? ''), $forceResend),
        ];
    }

    /**
     * Send email to a single recipient (student or parent).
     */
    public function sendToRecipient(ReportCard $reportCard, string $recipientType, string $email, bool $forceResend = false): array
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->queueRecipient($reportCard, $recipientType, $email, $forceResend);
        }

        if (!$forceResend) {
            $existing = EmailEvent::where('report_card_id', $reportCard->id)
                ->where('recipient', $email)
                ->where('recipient_type', $recipientType)
                ->where('email_type', 'report_card_released')
                ->whereIn('status', ['queued', 'sending', 'delivered', 'sent'])
                ->first();

            if ($existing) {
                return [
                    'status' => $existing->status === 'delivered' || $existing->status === 'sent' ? 'already_delivered' : 'already_queued',
                    'message' => "A release email for this {$recipientType} recipient already exists.",
                    'event_id' => $existing->id,
                ];
            }
        }

        $settings = SchoolSetting::getSettings();
        $student = $reportCard->student;
        $session = $reportCard->academicSession;
        $class = $reportCard->schoolClass;
        $isThirdTerm = in_array(strtolower(str_replace(' ', '', $reportCard->term)), ['3rdterm', 'thirdterm', 'third_term']);

        if ($isThirdTerm) {
            $subject = $recipientType === 'student'
                ? "{$settings->school_name} — Your {$session?->name} Annual Report Card Is Ready"
                : "{$settings->school_name} — {$student->full_name}'s {$session?->name} Annual Report Card & Promotion Result";
        } else {
            $subject = $recipientType === 'student'
                ? "{$settings->school_name} — Your {$reportCard->term} Report Card Is Ready ({$session?->name})"
                : "{$settings->school_name} — {$student->full_name}'s {$reportCard->term} Report Card ({$session?->name})";
        }

        $baseIdempotencyKey = hash('sha256', implode('|', [$reportCard->id, $recipientType, strtolower($email), 'release-v1']));
        $idempotencyKey = $forceResend
            ? hash('sha256', $baseIdempotencyKey.'|manual-resend|'.Str::uuid())
            : $baseIdempotencyKey;

        $event = EmailEvent::create([
            'school_id' => $class?->school_id,
            'student_id' => $student->id,
            'report_card_id' => $reportCard->id,
            'idempotency_key' => $idempotencyKey,
            'session_id' => $session?->id,
            'term' => $reportCard->term,
            'recipient' => $email,
            'recipient_type' => $recipientType,
            'email_subject' => $subject,
            'email_type' => 'report_card_released',
            'status' => 'queued',
            'retry_count' => $forceResend ? 1 : 0,
            'triggered_by' => auth()->user()?->full_name ?? 'System',
        ]);

        SendReportCardEmail::dispatch($event->id);
        $event->refresh();

        return [
            'status' => $event->status,
            'message' => $event->status === 'delivered' ? "Email delivered to {$email}." : "Email queued for {$email}.",
            'event_id' => $event->id,
        ];
    }

    public function retryEvent(EmailEvent $event): array
    {
        if (!filter_var($event->recipient, FILTER_VALIDATE_EMAIL)) {
            $event->update(['status' => 'missing_recipient', 'failure_reason' => 'A valid recipient email is required.']);
            return ['status' => 'missing_recipient', 'event_id' => $event->id];
        }

        $event->update([
            'status' => 'queued',
            'failure_reason' => null,
            'failed_at' => null,
            'retry_count' => $event->retry_count + 1,
            'triggered_by' => auth()->user()?->full_name ?? 'System',
        ]);
        SendReportCardEmail::dispatch($event->id);
        $event->refresh();

        return ['status' => $event->status, 'event_id' => $event->id];
    }

    public function deliverEvent(EmailEvent $event): void
    {
        $reportCard = ReportCard::with(['student', 'schoolClass', 'academicSession'])->findOrFail($event->report_card_id);
        if ($reportCard->status !== 'released') {
            $event->update(['status' => 'failed', 'failure_reason' => 'Report card is not released.']);
            return;
        }

        $settings = SchoolSetting::getSettings();
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $actionUrl = $event->recipient_type === 'parent'
            ? $frontendUrl.'/report-card/view/'.ReportCardAccessToken::generateToken($reportCard, 'parent', 30)
            : $frontendUrl.'/student/report-card?id='.$reportCard->id;
        $html = $this->generateHtmlTemplate($reportCard, $event->recipient_type, $actionUrl, $settings);

        $event->update(['status' => 'sending']);

        try {
            Mail::html($html, function ($message) use ($event, $settings, $reportCard): void {
                $message->to($event->recipient)
                    ->from(config('mail.from.address'), config('mail.from.name') ?: $settings->school_name)
                    ->subject($event->email_subject);

                if ($settings->attach_pdf_to_email && $reportCard->pdf_path && Storage::disk('local')->exists($reportCard->pdf_path)) {
                    $message->attach(Storage::disk('local')->path($reportCard->pdf_path), [
                        'as' => basename($reportCard->pdf_path),
                        'mime' => 'application/pdf',
                    ]);
                }
            });

            $event->update(['status' => 'delivered', 'sent_at' => now(), 'failure_reason' => null]);
            AuditLog::record(
                $event->recipient_type === 'student' ? 'REPORT_CARD_STUDENT_EMAIL_SENT' : 'REPORT_CARD_PARENT_EMAIL_SENT',
                $event->student_id,
                $event->session_id,
                $event->term,
                ['recipient' => $event->recipient, 'recipient_type' => $event->recipient_type, 'report_card_id' => $event->report_card_id]
            );
        } catch (\Throwable $exception) {
            Log::error('Report card email delivery failed.', ['event_id' => $event->id, 'exception' => $exception]);
            $event->update([
                'status' => 'failed',
                'failed_at' => now(),
                'failure_reason' => $this->safeFailureReason($exception),
            ]);
            AuditLog::record('REPORT_CARD_EMAIL_FAILED', $event->student_id, $event->session_id, $event->term, [
                'recipient' => $event->recipient,
                'recipient_type' => $event->recipient_type,
                'report_card_id' => $event->report_card_id,
                'error' => $event->failure_reason,
            ]);
        }
    }

    private function queueRecipient(ReportCard $reportCard, string $recipientType, string $email, bool $forceResend): array
    {
        if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendToRecipient($reportCard, $recipientType, $email, $forceResend);
        }

        $idempotencyKey = hash('sha256', implode('|', [$reportCard->id, $recipientType, 'missing', 'release-v1']));
        $event = EmailEvent::firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'school_id' => $reportCard->schoolClass?->school_id,
                'student_id' => $reportCard->student_id,
                'report_card_id' => $reportCard->id,
                'session_id' => $reportCard->academic_session_id,
                'term' => $reportCard->term,
                'recipient' => $email ?: 'NO_EMAIL_CONFIGURED',
                'recipient_type' => $recipientType,
                'email_subject' => "{$reportCard->term} Report Card",
                'email_type' => 'report_card_released',
                'status' => 'missing_recipient',
                'failure_reason' => ucfirst($recipientType).' profile has no valid email address.',
                'triggered_by' => auth()->user()?->full_name ?? 'System',
            ]
        );

        return ['status' => 'missing_recipient', 'message' => $event->failure_reason, 'event_id' => $event->id];
    }

    private function safeFailureReason(\Throwable $exception): string
    {
        $message = strtolower($exception->getMessage());
        if (str_contains($message, 'connection refused') || str_contains($message, 'could not connect')) {
            return 'SMTP server connection unavailable.';
        }
        if (str_contains($message, 'authentication failed')) {
            return 'SMTP authentication failed.';
        }

        return 'Email service temporarily unavailable. Check the configured mail provider.';
    }

    /**
     * Preview Email HTML without dispatching.
     */
    public function previewEmail(ReportCard $reportCard, string $recipientType = 'student'): array
    {
        $reportCard->load(['student', 'schoolClass', 'academicSession']);
        $settings = SchoolSetting::getSettings();
        $student = $reportCard->student;

        $subject = $recipientType === 'student'
            ? "{$settings->school_name} — Your {$reportCard->term} Report Card Is Ready"
            : "{$settings->school_name} — {$student->full_name}'s {$reportCard->term} Report Card";

        $tokenLink = rtrim(config('app.frontend_url', config('app.url')), '/').'/student/report-card';
        $html = $this->generateHtmlTemplate($reportCard, $recipientType, $tokenLink, $settings);

        return [
            'subject' => $subject,
            'recipient' => $recipientType === 'student' ? ($student->email ?: 'No student email configured') : ($student->parent_email ?: 'No parent email configured'),
            'recipient_type' => $recipientType,
            'html' => $html,
        ];
    }

    /**
     * Format ordinal numbers (1st, 2nd, 3rd, 4th...).
     */
    private function formatOrdinal(?int $number): string
    {
        if (!$number) return 'N/A';
        $ends = ['th','st','nd','rd','th','th','th','th','th','th'];
        if ((($number % 100) >= 11) && (($number % 100) <= 13)) {
            return $number . 'th';
        }
        return $number . $ends[$number % 10];
    }

    /**
     * Generate a responsive, school-branded, email-client safe HTML template.
     */
    public function generateHtmlTemplate(ReportCard $reportCard, string $recipientType, string $actionUrl, SchoolSetting $settings): string
    {
        $student = $reportCard->student;
        $class = $reportCard->schoolClass;
        $session = $reportCard->academicSession;

        $accentColor = $settings->email_accent_color ?: '#047857'; // Emerald green
        $goldAccent = '#d97706'; // Amber / Gold
        $isThirdTerm = in_array(strtolower(str_replace(' ', '', $reportCard->term)), ['3rdterm', 'thirdterm', 'third_term']);

        $firstName = explode(' ', trim($student->full_name ?? 'Student'))[0];
        $parentGreeting = $student->parent_name ? "Dear {$student->parent_name}," : "Dear Parent/Guardian,";
        $greeting = $recipientType === 'student' ? "Hello {$firstName}," : $parentGreeting;

        $positionStr = $settings->show_position && $reportCard->position ? $this->formatOrdinal($reportCard->position) : null;
        $averageStr = number_format((float) $reportCard->average_score, 1) . '%';
        $gradeStr = $reportCard->overall_grade ?: 'N/A';
        $subjectCount = $reportCard->total_subjects ?: 0;

        $bodyIntro = $recipientType === 'student'
            ? "Your academic performance report for <strong>{$reportCard->term}</strong> ({$session?->name}) has been officially released."
            : "The academic performance report for your child/ward, <strong>{$student->full_name}</strong> (ID: {$student->student_id}), in <strong>{$class?->name}</strong> for <strong>{$reportCard->term}</strong> ({$session?->name}) has been officially released.";

        $teacherCommentHtml = '';
        if ($recipientType === 'parent' && $reportCard->class_teacher_comment) {
            $teacherCommentHtml = "
            <tr>
              <td style=\"padding: 12px 16px; background-color: #f8fafc; border-left: 4px solid {$accentColor}; border-radius: 6px; font-size: 13px; color: #334155; margin-top: 15px;\">
                <strong style=\"color: {$accentColor};\">Class Teacher Comment:</strong><br>
                <em>\"" . htmlspecialchars($reportCard->class_teacher_comment) . "\"</em>
              </td>
            </tr>
            <tr><td height=\"12\"></td></tr>";
        }

        $principalCommentHtml = '';
        if ($recipientType === 'parent' && $reportCard->principal_comment) {
            $principalCommentHtml = "
            <tr>
              <td style=\"padding: 12px 16px; background-color: #f8fafc; border-left: 4px solid {$goldAccent}; border-radius: 6px; font-size: 13px; color: #334155;\">
                <strong style=\"color: {$goldAccent};\">Principal's Remark:</strong><br>
                <em>\"" . htmlspecialchars($reportCard->principal_comment) . "\"</em>
              </td>
            </tr>
            <tr><td height=\"16\"></td></tr>";
        }

        $footerMsg = $settings->email_footer_message ?: "Thank you for partnering with {$settings->school_name} in providing excellence in education.";

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$settings->school_name} - Report Card</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; width: 100% !important; height: 100% !important; color: #1e293b; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .stack-column { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .summary-box { margin-bottom: 8px !important; }
    }
  </style>
</head>
<body style="background-color: #f1f5f9; padding: 24px 0;">
  <center style="width: 100%; background-color: #f1f5f9;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;" class="email-container">
      <!-- HEADER BANNER -->
      <tr>
        <td style="background: linear-gradient(135deg, #065f46 0%, {$accentColor} 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <div style="display: inline-block; background-color: #ffffff; padding: 8px; border-radius: 12px; margin-bottom: 12px; border: 2px solid #fef3c7;">
                  <span style="font-size: 24px; font-weight: bold; color: {$accentColor}; letter-spacing: 1px;">🎓</span>
                </div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; font-family: 'Segoe UI', Arial, sans-serif;">
                  {$settings->school_name}
                </h1>
                <div style="margin-top: 4px; color: #fde68a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px;">
                  {$settings->motto}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- GOLD ACCENT BAR -->
      <tr>
        <td height="4" style="background-color: {$goldAccent}; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>

      <!-- BODY CARD -->
      <tr>
        <td style="background-color: #ffffff; padding: 32px 28px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <!-- GREETING -->
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #0f172a;">
                {$greeting}
              </td>
            </tr>
            <tr><td height="12"></td></tr>

            <!-- INTRO TEXT -->
            <tr>
              <td style="font-size: 14px; line-height: 22px; color: #475569;">
                {$bodyIntro}
              </td>
            </tr>
            <tr><td height="24"></td></tr>

            <!-- STUDENT DETAILS SUMMARY PILL -->
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px;">
                  <tr>
                    <td style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; width: 48%;">
                      Student Name:<br>
                      <strong style="font-size: 14px; color: #0f172a; text-transform: none;">{$student->full_name}</strong>
                    </td>
                    <td style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; width: 48%; text-align: right;">
                      Student ID:<br>
                      <strong style="font-size: 14px; color: #0f172a; text-transform: none;">{$student->student_id}</strong>
                    </td>
                  </tr>
                  <tr><td height="10" colspan="2"></td></tr>
                  <tr>
                    <td style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">
                      Class & Section:<br>
                      <strong style="font-size: 13px; color: #0f172a; text-transform: none;">{$class?->name}</strong>
                    </td>
                    <td style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; text-align: right;">
                      Session / Term:<br>
                      <strong style="font-size: 13px; color: #0f172a; text-transform: none;">{$session?->name} • {$reportCard->term}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="24"></td></tr>

            <!-- PERFORMANCE SUMMARY SECTION -->
            <tr>
              <td>
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: {$accentColor}; margin-bottom: 12px;">
                  ⭐ " . ($isThirdTerm ? "ANNUAL ACADEMIC PERFORMANCE SUMMARY" : "ACADEMIC PERFORMANCE SUMMARY") . "
                </div>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <!-- Average -->
                    <td class="stack-column summary-box" width="31%" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 10px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 800; color: #065f46; text-transform: uppercase;">" . ($isThirdTerm ? "ANNUAL AVG" : "AVERAGE") . "</div>
                      <div style="font-size: 20px; font-weight: 900; color: #047857; margin-top: 4px;">" . ($isThirdTerm && $reportCard->cumulative_average !== null ? number_format((float) $reportCard->cumulative_average, 1) . '%' : $averageStr) . "</div>
                    </td>
                    <td width="3%"></td>
                    <!-- Overall Grade -->
                    <td class="stack-column summary-box" width="31%" style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 14px 10px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 800; color: #854d0e; text-transform: uppercase;">GRADE</div>
                      <div style="font-size: 20px; font-weight: 900; color: #ca8a04; margin-top: 4px;">{$gradeStr}</div>
                    </td>
                    <td width="3%"></td>
                    <!-- Subjects / Position -->
                    <td class="stack-column summary-box" width="31%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 10px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 800; color: #1e40af; text-transform: uppercase;">
                        " . ($positionStr ? "POSITION" : "SUBJECTS") . "
                      </div>
                      <div style="font-size: 20px; font-weight: 900; color: #2563eb; margin-top: 4px;">
                        " . ($positionStr ?: $subjectCount) . "
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height=\"16\"></td></tr>" .
            ($isThirdTerm ? "
            <!-- ANNUAL PROMOTION BOX -->
            <tr>
              <td>
                <table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: #fffbeb; border: 2px solid #fde68a; border-radius: 12px; padding: 16px;\">
                  <tr>
                    <td style=\"font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1px;\">
                      🏆 PROMOTION & ANNUAL SESSION SUMMARY
                    </td>
                  </tr>
                  <tr><td height=\"8\"></td></tr>
                  <tr>
                    <td style=\"font-size: 13px; color: #78350f; line-height: 20px;\">
                      <strong>Promotion Status:</strong> <span style=\"font-size: 14px; font-weight: 800; color: #b45309;\">" . ($reportCard->promotion_status ?: 'Pending Decision') . "</span><br>" .
                      ($reportCard->destination_class_name ? "<strong>Next Class:</strong> <span style=\"font-weight: 700; color: #047857;\">" . htmlspecialchars($reportCard->destination_class_name) . "</span><br>" : "") . "
                      <span style=\"font-size: 12px; color: #92400e;\">1st Term: " . ($reportCard->term1_average !== null ? $reportCard->term1_average . '%' : 'N/A') . " | 2nd Term: " . ($reportCard->term2_average !== null ? $reportCard->term2_average . '%' : 'N/A') . " | 3rd Term: " . ($reportCard->term3_average !== null ? $reportCard->term3_average . '%' : $averageStr) . "</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height=\"20\"></td></tr>" : "") . "

            <!-- TEACHER / PRINCIPAL COMMENTS (FOR PARENTS) -->
            {$teacherCommentHtml}
            {$principalCommentHtml}

            <!-- CTA BUTTON -->
            <tr>
              <td align="center" style="padding: 10px 0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(4, 120, 87, 0.3);">
                      <a href="{$actionUrl}" target="_blank" style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; text-decoration: none; padding: 16px 36px; display: inline-block; border-radius: 12px;">
                        📄 VIEW OFFICIAL REPORT CARD
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="20"></td></tr>

            <!-- ENCOURAGEMENT MESSAGE -->
            <tr>
              <td align="center" style="font-size: 13px; color: #64748b; font-style: italic; border-top: 1px dashed #e2e8f0; padding-top: 18px;">
                "Keep working hard and continue striving for excellence."
              </td>
            </tr>
            <tr><td height="20"></td></tr>

            <!-- FOOTER INFO -->
            <tr>
              <td style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 18px;">
                <strong style="color: #475569;">{$settings->school_name}</strong> • {$settings->motto}<br>
                {$settings->address}<br>
                Phone: {$settings->phone} | Email: {$settings->email}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER COPYRIGHT -->
      <tr>
        <td style="padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
          {$footerMsg}<br>
          © 2026 {$settings->school_name}. All rights reserved.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
HTML;
    }
}
