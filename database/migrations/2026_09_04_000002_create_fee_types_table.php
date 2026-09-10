<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_types', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('school_id')->default(1)->index();
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->unique(['school_id', 'name']);
        });

        // Seed default fee types
        $defaultTypes = [
            ['name' => 'Tuition', 'description' => 'Academic tuition fee', 'is_system' => true],
            ['name' => 'School Fees', 'description' => 'General school fees', 'is_system' => true],
            ['name' => 'Acceptance Fee', 'description' => 'New admission acceptance fee', 'is_system' => true],
            ['name' => 'PTA Fee', 'description' => 'Parents Teachers Association levy', 'is_system' => true],
            ['name' => 'Development Levy', 'description' => 'School infrastructure development levy', 'is_system' => true],
            ['name' => 'Examination Fee', 'description' => 'Terminal / external examination fee', 'is_system' => true],
            ['name' => 'Laboratory Fee', 'description' => 'Science and practical laboratory fee', 'is_system' => true],
            ['name' => 'ICT Fee', 'description' => 'Computer and digital library fee', 'is_system' => true],
            ['name' => 'Uniform Fee', 'description' => 'School uniform and sportswear fee', 'is_system' => true],
            ['name' => 'Transportation Fee', 'description' => 'School bus transit fee', 'is_system' => true],
            ['name' => 'Boarding Fee', 'description' => 'Hostel and boarding accommodation fee', 'is_system' => true],
            ['name' => 'Other', 'description' => 'Miscellaneous or custom fee', 'is_system' => true],
        ];

        foreach ($defaultTypes as $type) {
            DB::table('fee_types')->insert(array_merge($type, [
                'school_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_types');
    }
};
