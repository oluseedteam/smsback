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
        Schema::table('students', function (Blueprint $table) {
            $table->string('parent_name')->nullable();
            $table->string('parent_phone')->nullable();
            $table->string('parent_email')->nullable();
            $table->text('parent_address')->nullable();
        });

        Schema::table('cbt_submissions', function (Blueprint $table) {
            $table->boolean('result_released')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['parent_name', 'parent_phone', 'parent_email', 'parent_address']);
        });

        Schema::table('cbt_submissions', function (Blueprint $table) {
            $table->dropColumn('result_released');
        });
    }
};
