<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create academic_sections table
        if (!Schema::hasTable('academic_sections')) {
            Schema::create('academic_sections', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // e.g. "Nursery", "Primary", "Junior Secondary", "Senior Secondary"
                $table->text('description')->nullable();
                $table->integer('ordering')->default(0);
                $table->string('status')->default('active'); // active, inactive
                $table->unsignedBigInteger('school_id')->nullable();
                $table->timestamps();
            });
        }

        // 2. Enhance school_classes
        Schema::table('school_classes', function (Blueprint $table) {
            if (!Schema::hasColumn('school_classes', 'academic_section_id')) {
                $table->foreignId('academic_section_id')->nullable()->constrained('academic_sections')->nullOnDelete();
            }
            if (!Schema::hasColumn('school_classes', 'arm')) {
                $table->string('arm')->nullable(); // "A", "B", "Gold", etc.
            }
            if (!Schema::hasColumn('school_classes', 'status')) {
                $table->string('status')->default('active'); // active, inactive
            }
        });

        // 3. Enhance subjects
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'academic_section_id')) {
                $table->foreignId('academic_section_id')->nullable()->constrained('academic_sections')->nullOnDelete();
            }
            if (!Schema::hasColumn('subjects', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('subjects', 'status')) {
                $table->string('status')->default('active');
            }
            if (!Schema::hasColumn('subjects', 'school_id')) {
                $table->unsignedBigInteger('school_id')->nullable();
            }
        });

        // 4. Enhance academic_sessions
        Schema::table('academic_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('academic_sessions', 'status')) {
                $table->string('status')->default('active'); // active, closed, upcoming
            }
            if (!Schema::hasColumn('academic_sessions', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('admins')->nullOnDelete();
            }
        });

        // 5. Enhance cbt_tests
        Schema::table('cbt_tests', function (Blueprint $table) {
            if (!Schema::hasColumn('cbt_tests', 'academic_section_id')) {
                $table->foreignId('academic_section_id')->nullable()->constrained('academic_sections')->nullOnDelete();
            }
            if (!Schema::hasColumn('cbt_tests', 'academic_session_id')) {
                $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
            }
            if (!Schema::hasColumn('cbt_tests', 'attempt_limit')) {
                $table->integer('attempt_limit')->default(1);
            }
            if (!Schema::hasColumn('cbt_tests', 'randomize_questions')) {
                $table->boolean('randomize_questions')->default(false);
            }
            if (!Schema::hasColumn('cbt_tests', 'randomize_options')) {
                $table->boolean('randomize_options')->default(false);
            }
            if (!Schema::hasColumn('cbt_tests', 'status')) {
                $table->string('status')->default('published'); // draft, pending_approval, scheduled, active, completed, cancelled
            }
        });

        // 6. Enhance assessment_configurations
        Schema::table('assessment_configurations', function (Blueprint $table) {
            if (!Schema::hasColumn('assessment_configurations', 'academic_section_id')) {
                $table->foreignId('academic_section_id')->nullable()->constrained('academic_sections')->nullOnDelete();
            }
            if (!Schema::hasColumn('assessment_configurations', 'assignment_max')) {
                $table->decimal('assignment_max', 5, 2)->default(0.00);
            }
            if (!Schema::hasColumn('assessment_configurations', 'test_max')) {
                $table->decimal('test_max', 5, 2)->default(0.00);
            }
            if (!Schema::hasColumn('assessment_configurations', 'project_max')) {
                $table->decimal('project_max', 5, 2)->default(0.00);
            }
            if (!Schema::hasColumn('assessment_configurations', 'attendance_max')) {
                $table->decimal('attendance_max', 5, 2)->default(0.00);
            }
        });
    }

    public function down(): void
    {
        Schema::table('assessment_configurations', function (Blueprint $table) {
            $table->dropForeign(['academic_section_id']);
            $table->dropColumn(['academic_section_id', 'assignment_max', 'test_max', 'project_max', 'attendance_max']);
        });

        Schema::table('cbt_tests', function (Blueprint $table) {
            $table->dropForeign(['academic_section_id']);
            $table->dropColumn(['academic_section_id', 'academic_session_id', 'attempt_limit', 'randomize_questions', 'randomize_options', 'status']);
        });

        Schema::table('academic_sessions', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['status', 'created_by']);
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['academic_section_id']);
            $table->dropColumn(['academic_section_id', 'description', 'status', 'school_id']);
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropForeign(['academic_section_id']);
            $table->dropColumn(['academic_section_id', 'arm', 'status']);
        });

        Schema::dropIfExists('academic_sections');
    }
};