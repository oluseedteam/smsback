<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class SchoolSetting extends Model
{
    use HasFactory;

    protected $table = 'school_settings';

    protected $fillable = [
        'school_name',
        'motto',
        'address',
        'phone',
        'email',
        'website',
        'logo_url',
        'principal_name',
        'principal_signature_url',
        'school_stamp_url',
        'report_card_theme',
        'show_student_photo',
        'show_grade_point',
        'show_attendance',
        'show_teacher_signature',
        'show_principal_signature',
        'show_school_stamp',
        'show_watermark',
        'show_promotion',
        'show_annual_summary',
        'require_class_teacher_review',
        'report_card_footer_text',
        'email_accent_color',
        'email_footer_message',
        'result_release_email_message',
        'attach_pdf_to_email',
        'require_fee_payment_for_release',
        'allowed_payment_statuses_for_release',
        'allow_overpayment',
        'minimum_result_payment_percentage',
        'affective_traits',
        'psychomotor_traits',
        'max_rating_scale',
        'show_position',
        'show_cumulative_on_third_term',
        'cbt_enabled',
        'admission_enabled',
        'annual_calculation_method',
        'annual_term_weights',
        'missing_term_policy',
        'automatic_report_card_email',
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

    protected function casts(): array
    {
        return [
            'attach_pdf_to_email' => 'boolean',
            'require_fee_payment_for_release' => 'boolean',
            'allow_overpayment' => 'boolean',
            'minimum_result_payment_percentage' => 'integer',
            'show_position' => 'boolean',
            'show_student_photo' => 'boolean',
            'show_grade_point' => 'boolean',
            'show_attendance' => 'boolean',
            'show_teacher_signature' => 'boolean',
            'show_principal_signature' => 'boolean',
            'show_school_stamp' => 'boolean',
            'show_watermark' => 'boolean',
            'show_promotion' => 'boolean',
            'show_annual_summary' => 'boolean',
            'require_class_teacher_review' => 'boolean',
            'show_cumulative_on_third_term' => 'boolean',
            'cbt_enabled' => 'boolean',
            'admission_enabled' => 'boolean',
            'automatic_report_card_email' => 'boolean',
            'allowed_payment_statuses_for_release' => 'array',
            'affective_traits' => 'array',
            'psychomotor_traits' => 'array',
            'annual_term_weights' => 'array',
            'max_rating_scale' => 'integer',
        ];
    }

    public static function getSettings(): self
    {
        $defaults = [
            'school_name' => config('app.name', 'GHRA'),
            'motto' => 'SHAPING YOUNG MINDS, BUILDING FUTURE LEADERS',
            'address' => 'Bolorunduro Area, Beside Tipper Association Office, Oba Road, Okinni, Osogbo, Osun State, Nigeria',
            'phone' => '+234 814 435 3033',
            'admissions_phone' => '+234 814 435 3033',
            'email' => config('mail.from.address', 'info@ghraschools.edu.ng'),
            'admissions_email' => 'admissions@ghraschools.edu.ng',
            'visiting_hours' => 'Mon – Fri: 7:30 AM – 4:00 PM',
            'about_us' => 'At GHRA, we provide an intellectually vibrant and nurturing environment where learners thrive. Guided by our motto "Shaping Young Minds, Building Future Leaders", we harmonize national benchmarks with global standards, cultivating critical thinking, creativity, moral integrity, and technological fluency.',
            'vision' => 'To be a premier, benchmark educational institution recognized nationally and globally for academic brilliance, unshakeable character, and the continuous nurturing of confident, visionary leaders.',
            'mission' => 'To deliver a balanced, world-class curriculum through modern pedagogy, instilling critical thinking, ethical integrity, digital literacy, and leadership skills in every child.',
            'years_of_experience' => '15+',
            'experience_subtitle' => 'Years of Educational Excellence',
            'email_accent_color' => '#047857',
            'email_footer_message' => 'Thank you for partnering with GHRA in providing quality education.',
            'result_release_email_message' => 'Your academic report has been officially approved and released.',
            'attach_pdf_to_email' => true,
            'require_fee_payment_for_release' => false,
            'allowed_payment_statuses_for_release' => ['PAID', 'PARTIALLY_PAID'],
            'allow_overpayment' => false,
            'minimum_result_payment_percentage' => 100,
            'affective_traits' => ['Punctuality', 'Neatness', 'Honesty', 'Cooperation', 'Responsibility', 'Attitude'],
            'psychomotor_traits' => ['Handwriting', 'Drawing', 'Sports', 'Practical Skills', 'Coordination'],
            'max_rating_scale' => 5,
            'show_position' => true,
            'show_cumulative_on_third_term' => true,
            'cbt_enabled' => true,
            'admission_enabled' => true,
            'annual_calculation_method' => 'equal',
            'annual_term_weights' => [33.33, 33.33, 33.34],
            'missing_term_policy' => 'average_available',
            'automatic_report_card_email' => true,
            'require_class_teacher_review' => false,
        ];

        try {
            if (!Schema::hasTable((new self)->getTable())) {
                return (new self)->forceFill($defaults);
            }

            $availableColumns = array_fill_keys(
                Schema::getColumnListing((new self)->getTable()),
                true
            );
            $persistableDefaults = array_intersect_key($defaults, $availableColumns);

            // A deployment can briefly run new code before its pending
            // migrations. Only write settings columns that actually exist.
            $settings = self::firstOrCreate(['id' => 1], $persistableDefaults);

            $shouldSave = false;
            foreach (['admissions_phone', 'admissions_email', 'visiting_hours', 'about_us', 'vision', 'mission', 'years_of_experience', 'experience_subtitle'] as $field) {
                if (isset($availableColumns[$field]) && empty($settings->{$field}) && isset($defaults[$field])) {
                    $settings->{$field} = $defaults[$field];
                    $shouldSave = true;
                }
            }
            if (isset($availableColumns['cbt_enabled']) && $settings->cbt_enabled === null) {
                $settings->cbt_enabled = true;
                $shouldSave = true;
            }
            if (isset($availableColumns['admission_enabled']) && $settings->admission_enabled === null) {
                $settings->admission_enabled = true;
                $shouldSave = true;
            }
            if ($shouldSave) {
                $settings->save();
            }

            return $settings;
        } catch (\Throwable $exception) {
            report($exception);

            // School identity has safe defaults and must not take the public
            // website down when the settings store is temporarily unavailable.
            return (new self)->forceFill($defaults);
        }
    }
}
