<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Recreate payments table to ensure SQLite CHECK constraint on status does not block PENDING_VERIFICATION / CONFIRMED / REJECTED
        if (DB::getDriverName() === 'sqlite') {
            // Backup any existing rows just in case
            $existing = DB::table('payments')->get()->map(fn ($r) => (array) $r)->all();

            Schema::dropIfExists('payments');

            Schema::create('payments', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('school_id')->default(1)->index();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->unsignedBigInteger('academic_session_id')->nullable()->index();
                $table->unsignedBigInteger('school_class_id')->nullable()->index();
                $table->foreignId('fee_structure_id')->nullable()->constrained('fee_structures')->nullOnDelete();
                $table->decimal('amount', 12, 2);
                $table->string('payment_method')->default('BANK_TRANSFER');
                $table->string('bank_used')->nullable();
                $table->string('sender_account_name')->nullable();
                $table->string('sender_account_last4', 10)->nullable();
                $table->string('transaction_reference')->nullable()->index();
                $table->date('payment_date')->nullable();
                $table->string('receipt_url')->nullable();
                $table->string('receipt_file_type')->nullable();
                $table->string('receipt_path')->nullable();
                $table->text('student_note')->nullable();
                $table->string('status')->default('PENDING_VERIFICATION')->index();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->unsignedBigInteger('verified_by')->nullable()->index();
                $table->text('rejection_reason')->nullable();
                $table->text('admin_note')->nullable();
                $table->string('official_receipt_number')->nullable()->unique();
                $table->timestamp('official_receipt_issued_at')->nullable();
                $table->string('type')->default('fee_payment');
                $table->string('reference')->unique();
                $table->string('term')->nullable();
                $table->text('description')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });

            if (!empty($existing)) {
                DB::table('payments')->insert($existing);
            }
        }
    }

    public function down(): void
    {
        // No down needed as schema is superset
    }
};
