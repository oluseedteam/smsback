<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('workers')) {
            return;
        }

        Schema::table('workers', function (Blueprint $table): void {
            if (!Schema::hasColumn('workers', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('workers', 'gender')) {
                $table->string('gender')->nullable();
            }
            if (!Schema::hasColumn('workers', 'profile_picture')) {
                $table->longText('profile_picture')->nullable();
            }
            if (!Schema::hasColumn('workers', 'is_first_login')) {
                $table->boolean('is_first_login')->default(true);
            }
            if (!Schema::hasColumn('workers', 'onboarding_tour')) {
                $table->json('onboarding_tour')->nullable();
            }
            if (!Schema::hasColumn('workers', 'qr_code_identifier')) {
                $table->string('qr_code_identifier')->nullable()->unique();
            }
            if (!Schema::hasColumn('workers', 'status')) {
                $table->string('status')->default('active');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('workers')) {
            return;
        }

        Schema::table('workers', function (Blueprint $table): void {
            foreach (['phone', 'gender', 'profile_picture', 'is_first_login', 'onboarding_tour', 'qr_code_identifier', 'status'] as $column) {
                if (Schema::hasColumn('workers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
