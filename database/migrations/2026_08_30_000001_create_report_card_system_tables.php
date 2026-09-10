<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Academic Sessions
        if (!Schema::hasTable('academic_sessions')) {
            Schema::create('academic_sessions', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // e.g. "2026/2027"
                $table->boolean('is_current')->default(false);
                $table->json('terms')->nullable(); // ['1st Term', '2nd Term', '3rd Term']
                $table->string('current_term')->default('1st Term');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->timestamps();
            });
        }

        // 2. School Settings
        if (!Schema::hasTable('school_settings')) {
            Schema::create('school_settings', function (Blueprint $table) {
                $table->id();
                $table->string('school_name')->default('GHRA');
                $table->string('motto')->default('SHAPING YOUNG MINDS');
                $table->string('address')->nullable();
                $table->string('phone')->nullable();
                $table->string('email')->nullable();
                $table->longText('logo_url')->nullable();
                $table->string('principal_name')->nullable();
                $table->longText('principal_signature_url')->nullable();
                $table->longText('school_stamp_url')->nullable();
                $table->string('email_accent_color')->default('#047857');
                $table->text('email_footer_message')->nullable();
                $table->text('result_release_email_message')->nullable();
                $table->boolean('attach_pdf_to_email')->default(true);
                $table->boolean('require_fee_payment_for_release')->default(false);
                $table->json('allowed_payment_statuses_for_release')->nullable();
                $table->json('affective_traits')->nullable();
                $table->json('psychomotor_traits')->nullable();
                $table->integer('max_rating_scale')->default(5);
                $table->boolean('show_position')->default(true);
                $table->boolean('show_cumulative_on_third_term')->default(true);
                $table->timestamps();
            });
        }

        // 3. Grading Scales
        if (!Schema::hasTable('grading_scales')) {
            Schema::create('grading_scales', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
                $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
                $table->string('grade'); // A, B, C, D, E, F
                $table->decimal('min_score', 5, 2);
                $table->decimal('max_score', 5, 2);
                $table->decimal('grade_point', 4, 2)->nullable();
                $table->string('remark'); // Excellent, Very Good, Good, etc.
                $table->timestamps();
            });
        }

        // 4. Assessment Configurations (CA Max, Exam Max, Written vs CBT)
        if (!Schema::hasTable('assessment_configurations')) {
            Schema::create('assessment_configurations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
                $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
                $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
                $table->string('term')->default('1st Term');
                $table->decimal('ca1_max', 5, 2)->default(20.00);
                $table->decimal('ca2_max', 5, 2)->default(20.00);
                $table->decimal('exam_max', 5, 2)->default(60.00);
                $table->decimal('total_max', 5, 2)->default(100.00);
                $table->enum('exam_method', ['written', 'cbt'])->default('written');
                $table->timestamps();
            });
        }

        // 5. Course Registrations
        if (!Schema::hasTable('course_registrations')) {
            Schema::create('course_registrations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
                $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->string('term')->default('1st Term');
                $table->enum('status', ['registered', 'approved', 'dropped'])->default('registered');
                $table->timestamps();

                $table->unique(['student_id', 'subject_id', 'academic_session_id', 'term'], 'uniq_student_course_reg');
            });
        }

        // 6. Subject Results (authoritative per-subject assessment scores)
        if (!Schema::hasTable('subject_results')) {
            Schema::create('subject_results', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
                $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->string('term')->default('1st Term');
                $table->decimal('ca1_score', 5, 2)->nullable();
                $table->decimal('ca2_score', 5, 2)->nullable();
                $table->foreignId('cbt_submission_id')->nullable()->constrained('cbt_submissions')->nullOnDelete();
                $table->decimal('exam_score', 5, 2)->nullable();
                $table->enum('exam_method', ['written', 'cbt'])->default('written');
                $table->decimal('total_score', 5, 2)->default(0.00);
                $table->decimal('percentage', 5, 2)->default(0.00);
                $table->string('grade')->nullable();
                $table->string('remark')->nullable();
                $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
                $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');
                $table->timestamps();

                $table->unique(['student_id', 'subject_id', 'academic_session_id', 'term'], 'uniq_student_subject_result');
            });
        }

        // 7. Affective Domain Assessments
        if (!Schema::hasTable('affective_assessments')) {
            Schema::create('affective_assessments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->string('term')->default('1st Term');
                $table->json('ratings')->nullable();
                $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
                $table->timestamps();

                $table->unique(['student_id', 'academic_session_id', 'term'], 'uniq_student_affective');
            });
        }

        // 8. Psychomotor Domain Assessments
        if (!Schema::hasTable('psychomotor_assessments')) {
            Schema::create('psychomotor_assessments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->string('term')->default('1st Term');
                $table->json('ratings')->nullable();
                $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
                $table->timestamps();

                $table->unique(['student_id', 'academic_session_id', 'term'], 'uniq_student_psychomotor');
            });
        }

        // 9. Official Report Cards
        if (!Schema::hasTable('report_cards')) {
            Schema::create('report_cards', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->string('term')->default('1st Term');
                $table->decimal('total_score', 8, 2)->default(0.00);
                $table->decimal('average_score', 5, 2)->default(0.00);
                $table->integer('total_subjects')->default(0);
                $table->integer('position')->nullable();
                $table->integer('total_students_in_class')->nullable();
                $table->string('overall_grade')->nullable();
                $table->text('class_teacher_comment')->nullable();
                $table->text('principal_comment')->nullable();
                $table->string('promotion_status')->nullable(); // 'Promoted', 'Promoted on Trial', 'Not Promoted'
                $table->foreignId('destination_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
                $table->string('destination_class_name')->nullable();
                $table->decimal('term1_average', 5, 2)->nullable();
                $table->decimal('term2_average', 5, 2)->nullable();
                $table->decimal('term3_average', 5, 2)->nullable();
                $table->decimal('cumulative_average', 5, 2)->nullable();
                $table->integer('attendance_present')->nullable();
                $table->integer('attendance_total')->nullable();
                $table->enum('status', ['draft', 'submitted', 'approved', 'released', 'withheld'])->default('draft');
                $table->foreignId('approved_by')->nullable()->constrained('admins')->nullOnDelete();
                $table->dateTime('approved_at')->nullable();
                $table->foreignId('released_by')->nullable()->constrained('admins')->nullOnDelete();
                $table->dateTime('released_at')->nullable();
                $table->text('withheld_reason')->nullable();
                $table->timestamps();

                $table->unique(['student_id', 'academic_session_id', 'term'], 'uniq_student_report_card');
            });
        }

        // 10. Report Card Access Tokens (For secure Parent & Verification links)
        if (!Schema::hasTable('report_card_access_tokens')) {
            Schema::create('report_card_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('report_card_id')->constrained('report_cards')->cascadeOnDelete();
                $table->string('token_hash', 64)->unique();
                $table->enum('recipient_type', ['parent', 'public_verification'])->default('parent');
                $table->dateTime('expires_at');
                $table->boolean('is_revoked')->default(false);
                $table->integer('used_count')->default(0);
                $table->dateTime('last_accessed_at')->nullable();
                $table->timestamps();
            });
        }

        // 11. Email Events
        if (!Schema::hasTable('email_events')) {
            Schema::create('email_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('report_card_id')->constrained('report_cards')->cascadeOnDelete();
                $table->string('recipient');
                $table->enum('recipient_type', ['student', 'parent']);
                $table->enum('email_type', ['report_card_released'])->default('report_card_released');
                $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
                $table->string('provider_message_id')->nullable();
                $table->dateTime('sent_at')->nullable();
                $table->dateTime('failed_at')->nullable();
                $table->text('failure_reason')->nullable();
                $table->timestamps();
            });
        }

        // 12. Audit Logs
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('user_type')->nullable(); // 'admin', 'teacher', 'student'
                $table->string('user_name')->nullable();
                $table->string('action'); // 'RESULT_SUBMITTED', 'RESULT_APPROVED', 'REPORT_CARD_RELEASED', etc.
                $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
                $table->string('term')->nullable();
                $table->json('details')->nullable();
                $table->string('ip_address')->nullable();
                $table->timestamps();
            });
        }

        // 13. Student In-App Notifications
        if (!Schema::hasTable('student_notifications')) {
            Schema::create('student_notifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('user_type')->default('student');
                $table->string('title');
                $table->text('message');
                $table->string('link')->nullable();
                $table->boolean('is_read')->default(false);
                $table->string('type')->default('report_card_released');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('email_events');
        Schema::dropIfExists('report_card_access_tokens');
        Schema::dropIfExists('report_cards');
        Schema::dropIfExists('psychomotor_assessments');
        Schema::dropIfExists('affective_assessments');
        Schema::dropIfExists('subject_results');
        Schema::dropIfExists('course_registrations');
        Schema::dropIfExists('assessment_configurations');
        Schema::dropIfExists('grading_scales');
        Schema::dropIfExists('school_settings');
        Schema::dropIfExists('academic_sessions');
    }
};
