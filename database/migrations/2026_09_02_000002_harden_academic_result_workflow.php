<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_configurations', function (Blueprint $table): void {
            $table->decimal('cbt_max', 5, 2)->default(0)->after('attendance_max');
            $table->decimal('written_max', 5, 2)->default(0)->after('cbt_max');
            $table->json('components')->nullable()->after('written_max');
            $table->index(
                ['school_class_id', 'academic_session_id', 'subject_id', 'term'],
                'assessment_config_scope_idx'
            );
        });

        Schema::table('cbt_tests', function (Blueprint $table): void {
            $table->text('instructions')->nullable()->after('description');
            $table->unsignedInteger('total_questions')->nullable()->after('duration_minutes');
            $table->decimal('total_marks', 8, 2)->default(100)->after('total_questions');
        });

        Schema::table('subject_results', function (Blueprint $table): void {
            $table->string('status', 32)->default('draft')->change();
            $table->json('assessment_scores')->nullable()->after('ca2_score');
            $table->decimal('total_obtainable', 6, 2)->default(100)->after('total_score');
            $table->decimal('grade_point', 5, 2)->nullable()->after('grade');
            $table->boolean('is_pass')->default(false)->after('grade_point');
            $table->timestamp('submitted_at')->nullable()->after('status');
            $table->timestamp('locked_at')->nullable()->after('submitted_at');
            $table->index(
                ['school_class_id', 'subject_id', 'academic_session_id', 'term'],
                'subject_result_marksheet_idx'
            );
        });

        Schema::table('course_registrations', function (Blueprint $table): void {
            $table->string('status', 32)->default('pending')->change();
        });

        Schema::table('report_cards', function (Blueprint $table): void {
            $table->string('status', 32)->default('draft')->change();
            $table->foreignId('academic_section_id')->nullable()->after('school_class_id')
                ->constrained('academic_sections')->nullOnDelete();
            $table->string('academic_section_name')->nullable()->after('academic_section_id');
            $table->string('class_name')->nullable()->after('academic_section_name');
            $table->string('class_arm')->nullable()->after('class_name');
            $table->decimal('total_obtainable', 8, 2)->default(0)->after('total_score');
            $table->json('subject_results_snapshot')->nullable()->after('attendance_total');
            $table->json('assessment_configuration_snapshot')->nullable()->after('subject_results_snapshot');
            $table->json('grading_configuration_snapshot')->nullable()->after('assessment_configuration_snapshot');
            $table->json('school_snapshot')->nullable()->after('grading_configuration_snapshot');
            $table->json('student_snapshot')->nullable()->after('school_snapshot');
            $table->json('affective_snapshot')->nullable()->after('student_snapshot');
            $table->json('psychomotor_snapshot')->nullable()->after('affective_snapshot');
            $table->string('pdf_path')->nullable()->after('psychomotor_snapshot');
            $table->timestamp('pdf_generated_at')->nullable()->after('pdf_path');
            $table->unsignedInteger('template_version')->default(1)->after('pdf_generated_at');
            $table->index(
                ['school_class_id', 'academic_session_id', 'term', 'status'],
                'report_card_release_idx'
            );
        });

        Schema::table('email_events', function (Blueprint $table): void {
            $table->string('status', 32)->default('queued')->change();
            $table->string('idempotency_key', 64)->nullable()->after('report_card_id');
            $table->index(['report_card_id', 'recipient_type'], 'report_card_recipient_idx');
            $table->unique('idempotency_key', 'email_event_idempotency_unique');
        });

        Schema::table('cbt_submissions', function (Blueprint $table): void {
            $table->dropUnique(['cbt_test_id', 'student_id']);
            $table->decimal('raw_score', 8, 2)->default(0)->after('score');
            $table->decimal('weighted_score', 8, 2)->default(0)->after('raw_score');
            $table->decimal('percentage', 5, 2)->default(0)->after('weighted_score');
            $table->unsignedInteger('duration_used')->nullable()->after('time_spent_seconds');
            $table->unsignedInteger('attempt_number')->default(1)->after('duration_used');
            $table->string('status')->default('in_progress')->after('attempt_number');
            $table->unique(['cbt_test_id', 'student_id', 'attempt_number'], 'cbt_student_attempt_unique');
        });

        Schema::table('student_promotions', function (Blueprint $table): void {
            $table->unsignedBigInteger('to_session_id')->nullable()->change();
            $table->unsignedBigInteger('to_class_id')->nullable()->change();
            $table->string('promotion_status')->nullable()->default(null)->change();
            $table->decimal('annual_average', 5, 2)->nullable()->after('promotion_status');
            $table->text('reason')->nullable()->after('annual_average');
            $table->unique(['student_id', 'from_session_id'], 'student_session_promotion_unique');
        });

        Schema::table('grading_scales', function (Blueprint $table): void {
            $table->boolean('is_pass')->default(true)->after('remark');
            $table->index(['school_class_id', 'academic_session_id'], 'grading_scope_idx');
        });

        Schema::table('school_settings', function (Blueprint $table): void {
            $table->string('website')->nullable()->after('email');
            $table->string('report_card_theme')->default('classic')->after('school_stamp_url');
            $table->boolean('show_student_photo')->default(true)->after('report_card_theme');
            $table->boolean('show_grade_point')->default(false)->after('show_student_photo');
            $table->boolean('show_attendance')->default(true)->after('show_grade_point');
            $table->boolean('show_teacher_signature')->default(true)->after('show_attendance');
            $table->boolean('show_principal_signature')->default(true)->after('show_teacher_signature');
            $table->boolean('show_school_stamp')->default(true)->after('show_principal_signature');
            $table->boolean('show_watermark')->default(false)->after('show_school_stamp');
            $table->boolean('show_promotion')->default(true)->after('show_watermark');
            $table->boolean('show_annual_summary')->default(true)->after('show_promotion');
            $table->boolean('require_class_teacher_review')->default(false)->after('show_annual_summary');
            $table->text('report_card_footer_text')->nullable()->after('require_class_teacher_review');
        });
    }

    public function down(): void
    {
        Schema::table('cbt_tests', function (Blueprint $table): void {
            $table->dropColumn(['instructions', 'total_questions', 'total_marks']);
        });

        Schema::table('school_settings', function (Blueprint $table): void {
            $table->dropColumn([
                'website', 'report_card_theme', 'show_student_photo', 'show_grade_point',
                'show_attendance', 'show_teacher_signature', 'show_principal_signature',
                'show_school_stamp', 'show_watermark', 'show_promotion',
                'show_annual_summary', 'require_class_teacher_review', 'report_card_footer_text',
            ]);
        });

        Schema::table('grading_scales', function (Blueprint $table): void {
            $table->dropIndex('grading_scope_idx');
            $table->dropColumn('is_pass');
        });

        Schema::table('student_promotions', function (Blueprint $table): void {
            $table->dropUnique('student_session_promotion_unique');
            $table->dropColumn(['annual_average', 'reason']);
        });

        Schema::table('cbt_submissions', function (Blueprint $table): void {
            $table->dropUnique('cbt_student_attempt_unique');
            $table->dropColumn([
                'raw_score', 'weighted_score', 'percentage', 'duration_used',
                'attempt_number', 'status',
            ]);
            $table->unique(['cbt_test_id', 'student_id']);
        });

        Schema::table('email_events', function (Blueprint $table): void {
            $table->dropUnique('email_event_idempotency_unique');
            $table->dropIndex('report_card_recipient_idx');
            $table->dropColumn('idempotency_key');
        });

        Schema::table('report_cards', function (Blueprint $table): void {
            $table->dropIndex('report_card_release_idx');
            $table->dropForeign(['academic_section_id']);
            $table->dropColumn([
                'academic_section_id', 'academic_section_name', 'class_name', 'class_arm',
                'total_obtainable', 'subject_results_snapshot',
                'assessment_configuration_snapshot', 'grading_configuration_snapshot',
                'school_snapshot', 'student_snapshot', 'affective_snapshot',
                'psychomotor_snapshot', 'pdf_path', 'pdf_generated_at', 'template_version',
            ]);
        });

        Schema::table('subject_results', function (Blueprint $table): void {
            $table->dropIndex('subject_result_marksheet_idx');
            $table->dropColumn([
                'assessment_scores', 'total_obtainable', 'grade_point', 'is_pass',
                'submitted_at', 'locked_at',
            ]);
        });

        Schema::table('assessment_configurations', function (Blueprint $table): void {
            $table->dropIndex('assessment_config_scope_idx');
            $table->dropColumn(['cbt_max', 'written_max', 'components']);
        });
    }
};
