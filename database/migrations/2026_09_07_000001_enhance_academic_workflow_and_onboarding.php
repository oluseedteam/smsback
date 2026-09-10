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
        // 1. Subjects table
        Schema::table('subjects', function (Blueprint $table): void {
            if (!Schema::hasColumn('subjects', 'is_compulsory')) {
                $table->boolean('is_compulsory')->default(false)->after('description');
            }
        });

        // 2. Class-Subject pivot table
        Schema::table('class_subject', function (Blueprint $table): void {
            if (!Schema::hasColumn('class_subject', 'is_compulsory')) {
                $table->boolean('is_compulsory')->default(false)->after('teacher_id');
            }
        });

        // 3. Assessment Configurations & Subject Results - Support 'combined'
        Schema::table('assessment_configurations', function (Blueprint $table): void {
            $table->string('exam_method', 32)->default('written')->change();
        });

        Schema::table('subject_results', function (Blueprint $table): void {
            $table->string('exam_method', 32)->default('written')->change();
        });

        // 4. Onboarding Tour persistence for users
        Schema::table('admins', function (Blueprint $table): void {
            if (!Schema::hasColumn('admins', 'onboarding_tour')) {
                $table->json('onboarding_tour')->nullable()->after('is_first_login');
            }
        });

        Schema::table('teachers', function (Blueprint $table): void {
            if (!Schema::hasColumn('teachers', 'onboarding_tour')) {
                $table->json('onboarding_tour')->nullable()->after('is_first_login');
            }
        });

        Schema::table('students', function (Blueprint $table): void {
            if (!Schema::hasColumn('students', 'onboarding_tour')) {
                $table->json('onboarding_tour')->nullable()->after('is_first_login');
            }
        });

        // 5. Academic Sessions registration deadlines and reopening
        Schema::table('academic_sessions', function (Blueprint $table): void {
            if (!Schema::hasColumn('academic_sessions', 'registration_deadline')) {
                $table->timestamp('registration_deadline')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('academic_sessions', 'registration_reopened')) {
                $table->boolean('registration_reopened')->default(false)->after('registration_deadline');
            }
        });

        // 6. Course Registrations index
        Schema::table('course_registrations', function (Blueprint $table): void {
            $table->index(
                ['student_id', 'school_class_id', 'academic_session_id', 'term', 'status'],
                'course_reg_eligibility_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_registrations', function (Blueprint $table): void {
            $table->dropIndex('course_reg_eligibility_idx');
        });

        Schema::table('academic_sessions', function (Blueprint $table): void {
            $table->dropColumn(['registration_deadline', 'registration_reopened']);
        });

        Schema::table('students', function (Blueprint $table): void {
            $table->dropColumn('onboarding_tour');
        });

        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropColumn('onboarding_tour');
        });

        Schema::table('admins', function (Blueprint $table): void {
            $table->dropColumn('onboarding_tour');
        });

        Schema::table('class_subject', function (Blueprint $table): void {
            $table->dropColumn('is_compulsory');
        });

        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropColumn('is_compulsory');
        });
    }
};
