<?php

namespace App\Services;

use App\Models\ReportCard;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReportCardPdfService
{
    public function filename(ReportCard $reportCard): string
    {
        $studentId = preg_replace('/[^A-Za-z0-9_-]/', '_', $reportCard->student?->student_id ?: (string) $reportCard->student_id);
        $session = preg_replace('/[^A-Za-z0-9_-]/', '-', str_replace('/', '-', $reportCard->academicSession?->name ?: 'session'));

        if ($this->isThirdTerm($reportCard->term)) {
            return "ANNUAL_REPORT_{$studentId}_{$session}.pdf";
        }

        $term = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '_', $reportCard->term));

        return "REPORT_CARD_{$studentId}_{$session}_{$term}.pdf";
    }

    public function render(array $payload): string
    {
        return Pdf::loadView('report-cards.pdf', ['card' => $payload])
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', false)
            ->setOption('isHtml5ParserEnabled', true)
            ->output();
    }

    public function store(ReportCard $reportCard, array $payload): string
    {
        $reportCard->loadMissing(['student', 'academicSession']);
        $path = 'report-cards/'.$reportCard->academic_session_id.'/'.$reportCard->student_id.'/'.$this->filename($reportCard);
        Storage::disk('local')->put($path, $this->render($payload));

        $reportCard->forceFill([
            'pdf_path' => $path,
            'pdf_generated_at' => now(),
        ])->saveQuietly();

        return $path;
    }

    public function contents(ReportCard $reportCard, array $payload): string
    {
        if (!$reportCard->pdf_path || !Storage::disk('local')->exists($reportCard->pdf_path)) {
            $this->store($reportCard, $payload);
            $reportCard->refresh();
        }

        return Storage::disk('local')->get($reportCard->pdf_path);
    }

    private function isThirdTerm(string $term): bool
    {
        return in_array(strtolower(str_replace([' ', '-'], '_', $term)), ['3rd_term', 'third_term'], true);
    }
}
