<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'affective_traits',
        'psychomotor_traits',
        'max_rating_scale',
        'show_position',
        'show_cumulative_on_third_term',
        'cbt_enabled',
        'annual_calculation_method',
        'annual_term_weights',
        'missing_term_policy',
        'automatic_report_card_email',
    ];

    protected function casts(): array
    {
        return [
            'attach_pdf_to_email' => 'boolean',
            'require_fee_payment_for_release' => 'boolean',
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
        return self::firstOrCreate(
            ['id' => 1],
            [
                'school_name' => config('app.name', 'School Portal'),
                'motto' => '',
                'address' => null,
                'phone' => null,
                'email' => config('mail.from.address'),
                'email_accent_color' => '#047857',
                'email_footer_message' => 'Thank you for partnering with us in providing quality education.',
                'result_release_email_message' => 'Your academic report has been officially approved and released.',
                'attach_pdf_to_email' => true,
                'require_fee_payment_for_release' => false,
                'allowed_payment_statuses_for_release' => ['PAID', 'PARTIALLY_PAID'],
                'affective_traits' => ['Punctuality', 'Neatness', 'Honesty', 'Cooperation', 'Responsibility', 'Attitude'],
                'psychomotor_traits' => ['Handwriting', 'Drawing', 'Sports', 'Practical Skills', 'Coordination'],
                'max_rating_scale' => 5,
                'show_position' => true,
                'show_cumulative_on_third_term' => true,
                'cbt_enabled' => true,
                'annual_calculation_method' => 'equal',
                'annual_term_weights' => [33.33, 33.33, 33.34],
                'missing_term_policy' => 'average_available',
                'automatic_report_card_email' => true,
                'require_class_teacher_review' => false,
            ]
        );
    }
}
