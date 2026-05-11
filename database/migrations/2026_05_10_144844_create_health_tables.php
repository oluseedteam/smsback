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
        Schema::create('health_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('user_role'); // admin, teacher, student, worker
            $table->string('blood_group')->nullable();
            $table->string('genotype')->nullable();
            $table->string('allergies')->nullable();
            $table->text('emergency_contact')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'user_role']);
        });

        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('user_role');
            $table->string('condition');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'user_role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_profiles');
        Schema::dropIfExists('health_records');
    }
};
