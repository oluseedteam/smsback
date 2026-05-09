<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // CBT Tests (assignments with questions)
        Schema::create('cbt_tests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->enum('term', ['1st Term', '2nd Term', '3rd Term'])->default('1st Term');
            $table->integer('duration_minutes')->default(30);
            $table->integer('max_score')->default(100);
            $table->boolean('is_published')->default(false);
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->timestamps();
        });

        // Questions for each CBT test
        Schema::create('cbt_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_test_id')->constrained('cbt_tests')->cascadeOnDelete();
            $table->text('question');
            $table->string('option_a');
            $table->string('option_b');
            $table->string('option_c');
            $table->string('option_d');
            $table->enum('correct_answer', ['A', 'B', 'C', 'D']);
            $table->integer('points')->default(1);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Student submissions
        Schema::create('cbt_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_test_id')->constrained('cbt_tests')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->integer('score')->default(0);
            $table->integer('total_questions')->default(0);
            $table->integer('correct_answers')->default(0);
            $table->integer('wrong_answers')->default(0);
            $table->integer('time_spent_seconds')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['cbt_test_id', 'student_id']);
        });

        // Individual question answers
        Schema::create('cbt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_submission_id')->constrained('cbt_submissions')->cascadeOnDelete();
            $table->foreignId('cbt_question_id')->constrained('cbt_questions')->cascadeOnDelete();
            $table->enum('selected_answer', ['A', 'B', 'C', 'D'])->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamps();

            $table->unique(['cbt_submission_id', 'cbt_question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cbt_answers');
        Schema::dropIfExists('cbt_submissions');
        Schema::dropIfExists('cbt_questions');
        Schema::dropIfExists('cbt_tests');
    }
};
