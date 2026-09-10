<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Upgrade fee_structures
        Schema::table('fee_structures', function (Blueprint $table): void {
            if (!Schema::hasColumn('fee_structures', 'school_id')) {
                $table->unsignedBigInteger('school_id')->default(1)->index();
            }
            if (!Schema::hasColumn('fee_structures', 'fee_type')) {
                $table->string('fee_type')->default('School Fees');
            }
            if (!Schema::hasColumn('fee_structures', 'title')) {
                $table->string('title')->nullable();
            }
            if (!Schema::hasColumn('fee_structures', 'academic_session_id')) {
                $table->unsignedBigInteger('academic_session_id')->nullable()->index();
            }
            if (!Schema::hasColumn('fee_structures', 'school_class_id')) {
                $table->unsignedBigInteger('school_class_id')->nullable()->index();
            }
            if (!Schema::hasColumn('fee_structures', 'academic_section_id')) {
                $table->unsignedBigInteger('academic_section_id')->nullable()->index();
            }
            if (!Schema::hasColumn('fee_structures', 'due_date')) {
                $table->date('due_date')->nullable();
            }
            if (!Schema::hasColumn('fee_structures', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });

        // 2. Upgrade payments
        Schema::table('payments', function (Blueprint $table): void {
            if (!Schema::hasColumn('payments', 'school_id')) {
                $table->unsignedBigInteger('school_id')->default(1)->index();
            }
            if (!Schema::hasColumn('payments', 'academic_session_id')) {
                $table->unsignedBigInteger('academic_session_id')->nullable()->index();
            }
            if (!Schema::hasColumn('payments', 'school_class_id')) {
                $table->unsignedBigInteger('school_class_id')->nullable()->index();
            }
            if (!Schema::hasColumn('payments', 'payment_method')) {
                $table->string('payment_method')->default('BANK_TRANSFER');
            }
            if (!Schema::hasColumn('payments', 'bank_used')) {
                $table->string('bank_used')->nullable();
            }
            if (!Schema::hasColumn('payments', 'sender_account_name')) {
                $table->string('sender_account_name')->nullable();
            }
            if (!Schema::hasColumn('payments', 'sender_account_last4')) {
                $table->string('sender_account_last4', 10)->nullable();
            }
            if (!Schema::hasColumn('payments', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->index();
            }
            if (!Schema::hasColumn('payments', 'payment_date')) {
                $table->date('payment_date')->nullable();
            }
            if (!Schema::hasColumn('payments', 'receipt_url')) {
                $table->string('receipt_url')->nullable();
            }
            if (!Schema::hasColumn('payments', 'receipt_file_type')) {
                $table->string('receipt_file_type')->nullable();
            }
            if (!Schema::hasColumn('payments', 'receipt_path')) {
                $table->string('receipt_path')->nullable();
            }
            if (!Schema::hasColumn('payments', 'student_note')) {
                $table->text('student_note')->nullable();
            }
            if (!Schema::hasColumn('payments', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable();
            }
            if (!Schema::hasColumn('payments', 'verified_at')) {
                $table->timestamp('verified_at')->nullable();
            }
            if (!Schema::hasColumn('payments', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')->nullable()->index();
            }
            if (!Schema::hasColumn('payments', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable();
            }
            if (!Schema::hasColumn('payments', 'admin_note')) {
                $table->text('admin_note')->nullable();
            }
            if (!Schema::hasColumn('payments', 'official_receipt_number')) {
                $table->string('official_receipt_number')->nullable()->unique();
            }
            if (!Schema::hasColumn('payments', 'official_receipt_issued_at')) {
                $table->timestamp('official_receipt_issued_at')->nullable();
            }
        });

        // 3. Upgrade school_settings
        Schema::table('school_settings', function (Blueprint $table): void {
            if (!Schema::hasColumn('school_settings', 'allow_overpayment')) {
                $table->boolean('allow_overpayment')->default(false);
            }
            if (!Schema::hasColumn('school_settings', 'minimum_result_payment_percentage')) {
                $table->unsignedSmallInteger('minimum_result_payment_percentage')->default(100);
            }
        });
    }

    public function down(): void
    {
        // down migrations can be handled if rollback is needed
    }
};
