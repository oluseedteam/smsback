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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->enum('role_type', ['parent', 'alumni', 'student', 'community'])->default('parent');
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->unsignedTinyInteger('rating')->default(5); // 1-5 stars
            $table->string('category')->default('general'); // academic, facilities, communication, activities, general, etc.
            $table->string('subject')->nullable();
            $table->text('message');
            
            // Parent specific fields
            $table->string('student_name')->nullable();
            $table->string('student_class')->nullable();

            // Alumni specific fields
            $table->string('graduation_year')->nullable();
            $table->string('department')->nullable(); // Science, Commercial, Arts
            $table->string('current_occupation')->nullable();
            $table->string('stay_connected')->nullable(); // mentorship, alumni association, reunion, etc.

            // Public display and admin moderation
            $table->boolean('is_public_testimonial')->default(true);
            $table->boolean('is_published')->default(false);
            $table->enum('status', ['pending', 'reviewed', 'published', 'archived'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
