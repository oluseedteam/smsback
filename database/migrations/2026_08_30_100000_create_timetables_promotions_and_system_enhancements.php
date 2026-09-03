<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhancements to students table
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'status')) {
                $table->string('status')->default('active'); // active, pending_approval, suspended, inactive, graduated
            }
            if (!Schema::hasColumn('students', 'first_name')) {
                $table->string('first_name')->nullable();
            }
            if (!Schema::hasColumn('students', 'last_name')) {
                $table->string('last_name')->nullable();
            }
            if (!Schema::hasColumn('students', 'other_name')) {
                $table->string('other_name')->nullable();
            }
            if (!Schema::hasColumn('students', 'section')) {
                $table->string('section')->nullable();
            }
            if (!Schema::hasColumn('students', 'academic_session_id')) {
                $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
            }
            if (!Schema::hasColumn('students', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable();
            }
            if (!Schema::hasColumn('students', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone')->nullable();
            }
            if (!Schema::hasColumn('students', 'emergency_contact_relationship')) {
                $table->string('emergency_contact_relationship')->nullable();
            }
            if (!Schema::hasColumn('students', 'qr_code_identifier')) {
                $table->string('qr_code_identifier')->nullable()->unique();
            }
            if (!Schema::hasColumn('students', 'created_by_teacher_id')) {
                $table->foreignId('created_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            }
        });

        // 2. Enhancements to teachers table
        Schema::table('teachers', function (Blueprint $table) {
            if (!Schema::hasColumn('teachers', 'status')) {
                $table->string('status')->default('active');
            }
            if (!Schema::hasColumn('teachers', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('teachers', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable();
            }
            if (!Schema::hasColumn('teachers', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone')->nullable();
            }
            if (!Schema::hasColumn('teachers', 'emergency_contact_relationship')) {
                $table->string('emergency_contact_relationship')->nullable();
            }
            if (!Schema::hasColumn('teachers', 'qr_code_identifier')) {
                $table->string('qr_code_identifier')->nullable()->unique();
            }
            if (!Schema::hasColumn('teachers', 'assigned_session_id')) {
                $table->foreignId('assigned_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
            }
        });

        // 3. Enhancements to admins table
        Schema::table('admins', function (Blueprint $table) {
            if (!Schema::hasColumn('admins', 'status')) {
                $table->string('status')->default('active');
            }
            if (!Schema::hasColumn('admins', 'role')) {
                $table->string('role')->default('admin'); // admin, sub_admin
            }
            if (!Schema::hasColumn('admins', 'permissions')) {
                $table->json('permissions')->nullable();
            }
            if (!Schema::hasColumn('admins', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('admins', 'qr_code_identifier')) {
                $table->string('qr_code_identifier')->nullable()->unique();
            }
        });

        // 4. Enhancements to cbt_questions table (question approval workflow)
        Schema::table('cbt_questions', function (Blueprint $table) {
            if (!Schema::hasColumn('cbt_questions', 'status')) {
                $table->string('status')->default('approved'); // draft, pending_review, approved, rejected
            }
            if (!Schema::hasColumn('cbt_questions', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable();
            }
            if (!Schema::hasColumn('cbt_questions', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('admins')->nullOnDelete();
            }
        });

        // 5. Enhancements to school_settings table (cbt_enabled)
        Schema::table('school_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('school_settings', 'cbt_enabled')) {
                $table->boolean('cbt_enabled')->default(true);
            }
        });

        // 6. Timetables table
        if (!Schema::hasTable('timetables')) {
            Schema::create('timetables', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->string('term')->default('1st Term');
                $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->string('section')->nullable();
                $table->string('day_of_week'); // Monday, Tuesday, Wednesday, Thursday, Friday
                $table->integer('period_number'); // 1, 2, 3, 4, 5, 6, 7, 8
                $table->string('period_name')->nullable(); // "Period 1", "Break", "Period 2"
                $table->string('start_time'); // "08:00"
                $table->string('end_time'); // "08:45"
                $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
                $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
                $table->string('room')->nullable();
                $table->boolean('is_break')->default(false);
                $table->timestamps();

                $table->index(['academic_session_id', 'term', 'school_class_id']);
                $table->index(['academic_session_id', 'term', 'teacher_id']);
            });
        }

        // 7. Timetable Change Requests table
        if (!Schema::hasTable('timetable_change_requests')) {
            Schema::create('timetable_change_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('timetable_id')->constrained('timetables')->cascadeOnDelete();
                $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
                $table->string('requested_day');
                $table->integer('requested_period_number');
                $table->string('requested_start_time')->nullable();
                $table->string('requested_end_time')->nullable();
                $table->text('reason');
                $table->string('status')->default('pending'); // pending, approved, rejected
                $table->foreignId('reviewed_by')->nullable()->constrained('admins')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('admin_notes')->nullable();
                $table->timestamps();
            });
        }

        // 8. Student Promotions & Class History table
        if (!Schema::hasTable('student_promotions')) {
            Schema::create('student_promotions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('from_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->foreignId('from_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->string('from_section')->nullable();
                $table->foreignId('to_session_id')->constrained('academic_sessions')->cascadeOnDelete();
                $table->foreignId('to_class_id')->constrained('school_classes')->cascadeOnDelete();
                $table->string('to_section')->nullable();
                $table->string('promotion_status')->default('promoted'); // promoted, promoted_on_trial, retained, graduated
                $table->foreignId('promoted_by')->nullable()->constrained('admins')->nullOnDelete();
                $table->timestamp('promoted_at')->useCurrent();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['student_id', 'from_session_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_promotions');
        Schema::dropIfExists('timetable_change_requests');
        Schema::dropIfExists('timetables');
    }
};
