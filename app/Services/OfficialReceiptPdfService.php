<?php

namespace App\Services;

use App\Models\FeeStructure;
use App\Models\Payment;
use App\Models\SchoolSetting;
use Barryvdh\DomPDF\Facade\Pdf;

class OfficialReceiptPdfService
{
    public function filename(Payment $payment): string
    {
        $receiptNo = preg_replace('/[^A-Za-z0-9_-]/', '_', $payment->official_receipt_number ?: ('PAYMENT_'.$payment->id));
        return "OFFICIAL_RECEIPT_{$receiptNo}.pdf";
    }

    public function buildReceiptPayload(Payment $payment): array
    {
        $payment->loadMissing(['student.classes', 'feeStructure', 'academicSession', 'schoolClass', 'verifiedByAdmin']);

        $settings = SchoolSetting::getSettings();
        $student = $payment->student;
        $studentClass = $payment->schoolClass ?: $student?->classes()->first();

        // Calculate student financial summary up to this payment
        $session = $payment->academicSession ?: \App\Models\AcademicSession::where('is_current', true)->first();
        $sessionId = $session?->id;
        $term = $payment->term ?: ($session?->current_term ?: '1st Term');

        $className = $studentClass?->name;
        $totalFees = FeeStructure::query()
            ->where('class_name', $className)
            ->where(function ($q) use ($sessionId) {
                if ($sessionId) {
                    $q->where('academic_session_id', $sessionId)
                      ->orWhereNull('academic_session_id');
                }
            })
            ->where(function ($q) use ($term) {
                if ($term) {
                    $q->where('term', $term);
                }
            })
            ->sum('amount');

        $confirmedPaid = Payment::where('student_id', $payment->student_id)
            ->whereIn('status', [Payment::STATUS_CONFIRMED, 'successful'])
            ->where(function ($q) use ($sessionId) {
                if ($sessionId) {
                    $q->where('academic_session_id', $sessionId)
                      ->orWhereNull('academic_session_id');
                }
            })
            ->where(function ($q) use ($term) {
                if ($term) {
                    $q->where('term', $term);
                }
            })
            ->sum('amount');

        $balance = max(0, (float) $totalFees - (float) $confirmedPaid);

        return [
            'school' => [
                'name' => $settings->school_name ?: config('app.name', 'School Portal'),
                'motto' => $settings->motto,
                'address' => $settings->address,
                'phone' => $settings->phone,
                'email' => $settings->email,
                'logo_url' => $settings->logo_url,
            ],
            'receipt' => [
                'receipt_number' => $payment->official_receipt_number ?: 'EYS/'.date('Y').'/'.str_pad((string)$payment->id, 6, '0', STR_PAD_LEFT),
                'issued_at' => $payment->official_receipt_issued_at ? $payment->official_receipt_issued_at->format('d M Y, h:i A') : now()->format('d M Y, h:i A'),
            ],
            'student' => [
                'full_name' => $student?->full_name ?: 'N/A',
                'student_id' => $student?->student_id ?: 'N/A',
                'class_name' => $className,
            ],
            'payment' => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'academic_session' => $session?->name ?: 'N/A',
                'term' => $term,
                'payment_date' => $payment->payment_date ? \Carbon\Carbon::parse($payment->payment_date)->format('d M Y') : $payment->created_at->format('d M Y'),
                'payment_method' => $payment->payment_method ?: 'BANK_TRANSFER',
                'bank_used' => $payment->bank_used,
                'sender_name' => $payment->sender_account_name,
                'transaction_reference' => $payment->transaction_reference ?: $payment->reference,
                'fee_type' => $payment->feeStructure?->fee_type ?: ($payment->feeStructure?->title ?: 'School Fees'),
                'description' => $payment->description ?: $payment->student_note,
                'verified_at' => $payment->verified_at ? $payment->verified_at->format('d M Y, h:i A') : 'N/A',
                'verified_by' => $payment->verifiedByAdmin?->full_name ?: 'Administrator',
            ],
            'finance' => [
                'total_fee' => (float) $totalFees,
                'total_paid' => (float) $confirmedPaid,
                'balance' => $balance,
            ],
        ];
    }

    public function render(Payment $payment): string
    {
        $payload = $this->buildReceiptPayload($payment);

        return Pdf::loadView('receipts.official-receipt-pdf', $payload)
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', false)
            ->setOption('isHtml5ParserEnabled', true)
            ->output();
    }
}
