<?php

namespace App\Jobs;

use App\Http\Controllers\Api\ReportCardController;
use App\Models\Admin;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;

class ReleaseReportCardJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public int $uniqueFor = 600;

    public function __construct(
        public readonly int $reportCardId,
        public readonly int $actorId,
    ) {
        $this->onQueue('report-card-releases');
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return (string) $this->reportCardId;
    }

    public function handle(ReportCardController $controller): void
    {
        $actor = Admin::findOrFail($this->actorId);
        $request = Request::create("/api/admin/report-cards/{$this->reportCardId}/release", 'POST');
        $request->setUserResolver(fn () => $actor);

        $response = $controller->release($request, $this->reportCardId);
        if ($response->getStatusCode() >= 400) {
            $payload = $response->getData(true);
            throw new RuntimeException($payload['message'] ?? 'Queued report-card release failed.');
        }
    }
}
