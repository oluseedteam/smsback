<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fee structures set by admin
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->string('class_name'); // e.g. JSS1, SS1-Science, SS2-Art, SS3-Commercial
            $table->string('department')->nullable(); // science, art, commercial (for SS1-SS3)
            $table->enum('term', ['1st Term', '2nd Term', '3rd Term']);
            $table->string('academic_year')->nullable(); // e.g. 2025/2026
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->unique(['class_name', 'department', 'term', 'academic_year'], 'unique_fee_structure');
        });

        // Student wallet balances
        Schema::create('wallet_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->decimal('balance', 12, 2)->default(0);
            $table->timestamps();

            $table->unique('student_id');
        });

        // Payment transactions
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->enum('type', ['funding', 'fee_payment']); // funding = adding money, fee_payment = paying fees
            $table->decimal('amount', 12, 2);
            $table->string('reference')->unique(); // Flutterwave transaction reference
            $table->string('flutterwave_tx_id')->nullable();
            $table->enum('status', ['pending', 'successful', 'failed'])->default('pending');
            $table->foreignId('fee_structure_id')->nullable()->constrained('fee_structures')->nullOnDelete();
            $table->enum('term', ['1st Term', '2nd Term', '3rd Term'])->nullable();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('wallet_balances');
        Schema::dropIfExists('fee_structures');
    }
};
