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
            $table->boolean('is_prefect')->default(false);
            $table->string('prefect_title')->nullable();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('institutional_role')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['is_prefect', 'prefect_title']);
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('institutional_role');
        });
    }
};
