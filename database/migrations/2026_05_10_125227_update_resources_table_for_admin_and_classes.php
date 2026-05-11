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
        Schema::table('resources', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('id')->constrained('admins')->nullOnDelete();
            $table->foreignId('school_class_id')->nullable()->after('admin_id')->constrained('school_classes')->nullOnDelete();
            $table->unsignedBigInteger('teacher_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admin_id');
            $table->dropConstrainedForeignId('school_class_id');
            $table->unsignedBigInteger('teacher_id')->nullable(false)->change();
        });
    }
};
