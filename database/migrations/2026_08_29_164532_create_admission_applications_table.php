<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_number')->unique();
            $table->enum('type', ['student', 'teacher'])->default('student');
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('gender')->nullable();
            $table->string('date_of_birth')->nullable();
            $table->text('address')->nullable();
            
            // Student specific fields
            $table->string('target_class')->nullable();
            $table->string('department')->nullable();
            $table->string('parent_name')->nullable();
            $table->string('parent_phone')->nullable();
            $table->string('parent_email')->nullable();
            $table->string('previous_school')->nullable();
            $table->string('last_grade_completed')->nullable();

            // Teacher specific fields
            $table->string('subject_specialization')->nullable();
            $table->string('qualification')->nullable();
            $table->string('experience_years')->nullable();
            $table->text('cover_letter')->nullable();

            // Status & review
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('provisioned_id_code')->nullable(); // student_id or employee_id generated upon approval
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};

