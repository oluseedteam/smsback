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
        $tables = ['admins', 'teachers', 'students', 'workers'];
        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                // Change profile_picture to longText to accommodate base64 strings
                $table->longText('profile_picture')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['admins', 'teachers', 'students', 'workers'];
        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('profile_picture')->nullable()->change();
            });
        }
    }
};
