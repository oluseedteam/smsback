<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('school_settings') && !Schema::hasColumn('school_settings', 'admission_enabled')) {
            Schema::table('school_settings', function (Blueprint $table) {
                $table->boolean('admission_enabled')->default(true)->after('cbt_enabled');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('school_settings') && Schema::hasColumn('school_settings', 'admission_enabled')) {
            Schema::table('school_settings', function (Blueprint $table) {
                $table->dropColumn('admission_enabled');
            });
        }
    }
};
