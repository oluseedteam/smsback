<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('school_settings', 'admissions_phone')) {
                $table->string('admissions_phone')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'admissions_email')) {
                $table->string('admissions_email')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'visiting_hours')) {
                $table->string('visiting_hours')->nullable()->default('Mon – Fri: 7:30 AM – 4:00 PM');
            }
            if (!Schema::hasColumn('school_settings', 'about_us')) {
                $table->text('about_us')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'vision')) {
                $table->text('vision')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'mission')) {
                $table->text('mission')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'years_of_experience')) {
                $table->string('years_of_experience')->nullable()->default('15+');
            }
            if (!Schema::hasColumn('school_settings', 'experience_subtitle')) {
                $table->string('experience_subtitle')->nullable()->default('Years of Educational Excellence');
            }
            if (!Schema::hasColumn('school_settings', 'facebook_url')) {
                $table->string('facebook_url')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'instagram_url')) {
                $table->string('instagram_url')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'twitter_url')) {
                $table->string('twitter_url')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'youtube_url')) {
                $table->string('youtube_url')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $columns = [
                'admissions_phone',
                'admissions_email',
                'visiting_hours',
                'about_us',
                'vision',
                'mission',
                'years_of_experience',
                'experience_subtitle',
                'facebook_url',
                'instagram_url',
                'twitter_url',
                'youtube_url',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('school_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
