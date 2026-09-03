<?php

namespace App\Jobs;

use App\Models\EmailEvent;
use App\Services\ReportCardEmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendReportCardEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(public int $emailEventId)
    {
        $this->onQueue('report-card-emails');
        $this->afterCommit();
    }

    public function handle(ReportCardEmailService $service): void
    {
        $event = EmailEvent::find($this->emailEventId);
        if (!$event || $event->status === 'delivered') {
            return;
        }

        $service->deliverEvent($event);
    }
}
