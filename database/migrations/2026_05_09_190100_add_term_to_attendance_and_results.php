<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->enum('term', ['1st Term', '2nd Term', '3rd Term'])->default('1st Term')->after('attendance_date');
        });

        Schema::table('results', function (Blueprint $table) {
            $table->enum('term', ['1st Term', '2nd Term', '3rd Term'])->default('1st Term')->after('assessment_type');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn('term');
        });

        Schema::table('results', function (Blueprint $table) {
            $table->dropColumn('term');
        });
    }
};
