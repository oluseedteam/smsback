<?php

namespace Database\Seeders;

use App\Models\AcademicSession;
use App\Models\Admin;
use App\Models\GradingScale;
use App\Models\SchoolSetting;
use App\Services\ReportCardCalculationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super Admin
        Admin::query()->firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name' => 'System Admin',
                'password' => Hash::make('admin123'),
            ]
        );

        // 2. School Settings for Eyitayo Schools
        SchoolSetting::getSettings();

        // 3. Current Academic Session
        $session = AcademicSession::query()->firstOrCreate(
            ['name' => '2026/2027'],
            [
                'is_current' => true,
                'terms' => ['1st Term', '2nd Term', '3rd Term'],
                'current_term' => '1st Term',
                'start_date' => '2026-09-01',
                'end_date' => '2027-07-31',
            ]
        );

        // 4. Default Global Grading Scales
        if (GradingScale::whereNull('school_class_id')->whereNull('academic_session_id')->count() === 0) {
            foreach (ReportCardCalculationService::getDefaultGradingScale() as $scale) {
                GradingScale::create($scale);
            }
        }
    }
}
