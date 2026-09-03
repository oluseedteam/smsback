<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add annual calculation settings to school_settings
        Schema::table('school_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('school_settings', 'annual_calculation_method')) {
                $table->string('annual_calculation_method')->default('equal'); // 'equal', 'weighted', 'third_term_only'
            }
            if (!Schema::hasColumn('school_settings', 'annual_term_weights')) {
                $table->json('annual_term_weights')->nullable(); // e.g. [30, 30, 40]
            }
            if (!Schema::hasColumn('school_settings', 'missing_term_policy')) {
                $table->string('missing_term_policy')->default('average_available'); // 'average_available', 'require_all'
            }
            if (!Schema::hasColumn('school_settings', 'automatic_report_card_email')) {
                $table->boolean('automatic_report_card_email')->default(true);
            }
        });

        // 2. Enhance email_events table
        Schema::table('email_events', function (Blueprint $table) {
            if (!Schema::hasColumn('email_events', 'school_id')) {
                $table->unsignedBigInteger('school_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('email_events', 'session_id')) {
                $table->foreignId('session_id')->nullable()->after('report_card_id')->constrained('academic_sessions')->nullOnDelete();
            }
            if (!Schema::hasColumn('email_events', 'term')) {
                $table->string('term')->nullable()->after('session_id');
            }
            if (!Schema::hasColumn('email_events', 'email_subject')) {
                $table->string('email_subject')->nullable()->after('recipient');
            }
            if (!Schema::hasColumn('email_events', 'retry_count')) {
                $table->integer('retry_count')->default(0)->after('failure_reason');
            }
            if (!Schema::hasColumn('email_events', 'triggered_by')) {
                $table->string('triggered_by')->nullable()->after('retry_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('email_events', function (Blueprint $table) {
            $table->dropColumn(['school_id', 'session_id', 'term', 'email_subject', 'retry_count', 'triggered_by']);
        });

        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn(['annual_calculation_method', 'annual_term_weights', 'missing_term_policy', 'automatic_report_card_email']);
        });
    }
};
