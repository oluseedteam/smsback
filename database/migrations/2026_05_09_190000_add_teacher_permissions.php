<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->boolean('can_create_students')->default(false)->after('is_first_login');
            $table->foreignId('class_teacher_of')->nullable()->after('can_create_students')
                  ->constrained('school_classes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropForeign(['class_teacher_of']);
            $table->dropColumn(['can_create_students', 'class_teacher_of']);
        });
    }
};
