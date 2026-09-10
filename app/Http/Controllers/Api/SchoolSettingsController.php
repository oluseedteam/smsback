<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolSettingsController extends Controller
{
    /**
     * Public endpoint to retrieve general school identity, contact, about, and experience info.
     */
    public function getPublicSettings(): JsonResponse
    {
        $settings = SchoolSetting::getSettings();

        return response()->json([
            'school_name' => $settings->school_name ?? 'GHRA',
            'motto' => $settings->motto ?? 'SHAPING YOUNG MINDS',
            'address' => $settings->address ?? 'Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria',
            'phone' => $settings->phone ?? '+234 814 435 3033',
            'admissions_phone' => $settings->admissions_phone ?? '+234 814 435 3033',
            'email' => $settings->email ?? 'info@ghraschools.edu.ng',
            'admissions_email' => $settings->admissions_email ?? 'admissions@ghraschools.edu.ng',
            'visiting_hours' => $settings->visiting_hours ?? 'Mon – Fri: 7:30 AM – 4:00 PM',
            'about_us' => $settings->about_us ?? 'At GHRA, we provide an intellectually vibrant and nurturing environment where learners thrive. Guided by our motto "Shaping Young Minds, Building Future Leaders", we harmonize national benchmarks with global standards, cultivating critical thinking, creativity, moral integrity, and technological fluency.',
            'vision' => $settings->vision ?? 'To be a premier, benchmark educational institution recognized nationally and globally for academic brilliance, unshakeable character, and the continuous nurturing of confident, visionary leaders.',
            'mission' => $settings->mission ?? 'To deliver a balanced, world-class curriculum through modern pedagogy, instilling critical thinking, ethical integrity, digital literacy, and leadership skills in every child.',
            'years_of_experience' => $settings->years_of_experience ?? '15+',
            'experience_subtitle' => $settings->experience_subtitle ?? 'Years of Educational Excellence',
            'facebook_url' => $settings->facebook_url ?? 'https://facebook.com',
            'instagram_url' => $settings->instagram_url ?? 'https://instagram.com',
            'twitter_url' => $settings->twitter_url ?? 'https://twitter.com',
            'youtube_url' => $settings->youtube_url ?? 'https://youtube.com',
            'logo_url' => $settings->logo_url,
            'website' => $settings->website,
            'cbt_enabled' => (bool) ($settings->cbt_enabled ?? true),
            'admission_enabled' => (bool) ($settings->admission_enabled ?? true),
        ]);
    }

    /**
     * Admin endpoint to get school settings.
     */
    public function getAdminSettings(): JsonResponse
    {
        $settings = SchoolSetting::getSettings();

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Admin endpoint to update contact, about, experience, and school identity.
     */
    public function updateSchoolSettings(Request $request): JsonResponse
    {
        $settings = SchoolSetting::getSettings();

        $validated = $request->validate([
            'school_name' => 'sometimes|string|max:255',
            'motto' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:100',
            'admissions_phone' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'admissions_email' => 'nullable|email|max:255',
            'visiting_hours' => 'nullable|string|max:255',
            'about_us' => 'nullable|string|max:10000',
            'vision' => 'nullable|string|max:10000',
            'mission' => 'nullable|string|max:10000',
            'years_of_experience' => 'nullable|string|max:50',
            'experience_subtitle' => 'nullable|string|max:255',
            'facebook_url' => 'nullable|string|max:255',
            'instagram_url' => 'nullable|string|max:255',
            'twitter_url' => 'nullable|string|max:255',
            'youtube_url' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'cbt_enabled' => 'sometimes|boolean',
            'admission_enabled' => 'sometimes|boolean',
        ]);

        $settings->update($validated);

        return response()->json([
            'message' => 'School information updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }
}
