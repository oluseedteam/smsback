@php
    $themeName = $card['template']['theme'] ?? 'classic';
    $themeColor = match ($themeName) { 'modern' => '#0f766e', 'minimal' => '#334155', default => '#173f77' };
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $card['is_third_term'] ? 'Annual Report Card' : 'Term Report Card' }}</title>
    <style>
        @page { margin: 22px 28px 28px; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #172033; font-family: DejaVu Sans, sans-serif; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        .header { border-bottom: 3px solid {{ $themeColor }}; padding-bottom: 10px; margin-bottom: 12px; }
        .logo { width: 58px; height: 58px; object-fit: contain; }
        .school-name { color: {{ $themeColor }}; font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
        .motto { color: #a06b00; font-size: 9px; font-weight: 700; letter-spacing: 1.4px; margin-top: 3px; }
        .contact { color: #5c667a; font-size: 8px; margin-top: 5px; }
        .document-label { border: 1px solid #b9c9df; background: #edf4ff; border-radius: 6px; padding: 8px; text-align: center; }
        .document-label strong { display: block; color: {{ $themeColor }}; font-size: 11px; }
        .student-box { border: 1px solid #d7deea; background: #f7f9fc; border-radius: 6px; margin-bottom: 12px; padding: 8px 10px; }
        .student-box td { padding: 3px 5px; }
        .label { color: #667085; font-size: 8px; font-weight: 700; text-transform: uppercase; }
        .value { color: #172033; font-size: 10px; font-weight: 700; }
        .results { margin-bottom: 12px; }
        .results th { background: {{ $themeColor }}; color: white; border: 1px solid {{ $themeColor }}; padding: 6px 4px; font-size: 8px; }
        .results td { border: 1px solid #c9d2df; padding: 6px 4px; text-align: center; }
        .results td:first-child { text-align: left; font-weight: 700; }
        .results tr:nth-child(even) td { background: #f8fafc; }
        .annual { border: 1px solid #e8cd88; background: #fff9e9; border-radius: 6px; padding: 9px; margin-bottom: 12px; }
        .annual-title { color: #7a5200; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; }
        .metric td { width: 25%; padding: 7px; border: 1px solid #d7deea; text-align: center; }
        .metric .metric-name { display: block; color: #667085; font-size: 7px; font-weight: 700; text-transform: uppercase; }
        .metric .metric-value { display: block; color: {{ $themeColor }}; font-size: 13px; font-weight: 800; margin-top: 2px; }
        .comments { margin-top: 12px; }
        .comments td { width: 50%; vertical-align: top; border: 1px solid #d7deea; padding: 8px; height: 58px; }
        .comment-title { color: #173f77; font-size: 8px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
        .footer { position: fixed; bottom: -15px; left: 0; right: 0; border-top: 1px solid #d7deea; padding-top: 5px; color: #7b8495; font-size: 7px; text-align: center; }
        .muted { color: #7b8495; }
        .student-photo { width: 52px; height: 52px; object-fit: cover; border: 1px solid #d7deea; }
        .signature-image { max-width: 90px; max-height: 34px; }
        .stamp-image { max-width: 60px; max-height: 48px; }
        .watermark { position: fixed; top: 38%; left: 15%; right: 15%; text-align: center; transform: rotate(-28deg); color: rgba(23,63,119,.06); font-size: 48px; font-weight: 800; z-index: -1; }
    </style>
</head>
<body>
@php
    $school = $card['school'];
    $student = $card['student'];
    $academic = $card['academic'];
    $summary = $card['summary'];
    $cumulative = $card['cumulative'];
    $results = $card['results'];
    $template = $card['template'] ?? [];
    $logo = $school['logo_url'] ?? null;
@endphp

@if($template['show_watermark'] ?? false)<div class="watermark">{{ strtoupper($school['name']) }}</div>@endif

<div class="header">
    <table>
        <tr>
            <td style="width:70px">
                @if(is_string($logo) && str_starts_with($logo, 'data:image/'))
                    <img src="{{ $logo }}" class="logo" alt="School logo">
                @else
                    <div style="width:56px;height:56px;border:2px solid #173f77;border-radius:50%;text-align:center;padding-top:17px;color:#173f77;font-size:16px;font-weight:800">S</div>
                @endif
            </td>
            <td>
                <h1 class="school-name">{{ $school['name'] }}</h1>
                @if($school['motto'])<div class="motto">{{ $school['motto'] }}</div>@endif
                <div class="contact">
                    {{ collect([$school['address'], $school['phone'], $school['email'], $school['website'] ?? null])->filter()->join(' | ') }}
                </div>
            </td>
            <td style="width:170px">
                <div class="document-label">
                    <strong>{{ $card['is_third_term'] ? 'ANNUAL REPORT CARD' : 'TERM REPORT CARD' }}</strong>
                    <span>{{ $academic['term'] }} - {{ $academic['session_name'] }}</span>
                </div>
            </td>
        </tr>
    </table>
</div>

<div class="student-box">
    <table>
        <tr>
            @if(($template['show_student_photo'] ?? true) && is_string($student['profile_picture'] ?? null) && str_starts_with($student['profile_picture'], 'data:image/'))
                <td rowspan="2" style="width:62px"><img src="{{ $student['profile_picture'] }}" class="student-photo" alt="Student photo"></td>
            @endif
            <td><span class="label">Student</span><br><span class="value">{{ $student['full_name'] }}</span></td>
            <td><span class="label">Student ID</span><br><span class="value">{{ $student['student_id'] }}</span></td>
            <td><span class="label">Admission No.</span><br><span class="value">{{ $student['admission_number'] ?? $student['student_id'] }}</span></td>
        </tr>
        <tr>
            <td><span class="label">Academic Section</span><br><span class="value">{{ $academic['academic_section_name'] ?: '-' }}</span></td>
            <td><span class="label">Class</span><br><span class="value">{{ $academic['class_name'] }}</span></td>
            <td><span class="label">Session / Term</span><br><span class="value">{{ $academic['session_name'] }} / {{ $academic['term'] }}</span></td>
        </tr>
    </table>
</div>

@if($card['is_third_term'])
    <table class="results">
        <thead><tr><th>Subject</th><th>1st Term</th><th>2nd Term</th><th>3rd Term</th><th>Annual Average</th><th>Grade</th><th>Remark</th></tr></thead>
        <tbody>
        @foreach($results as $result)
            <tr>
                <td>{{ $result['subject_name'] }}</td>
                <td>{{ $result['term1_score'] ?? '-' }}</td>
                <td>{{ $result['term2_score'] ?? '-' }}</td>
                <td>{{ $result['term3_score'] ?? '-' }}</td>
                <td><strong>{{ $result['annual_average'] ?? '-' }}</strong></td>
                <td><strong>{{ $result['annual_grade'] ?? '-' }}</strong></td>
                <td>{{ $result['annual_remark'] ?? '-' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    @if($template['show_annual_summary'] ?? true)<div class="annual">
        <div class="annual-title">Annual Performance Summary</div>
        <table>
            <tr>
                <td><span class="label">First Term Average</span><br><span class="value">{{ $cumulative['term1_average'] !== null ? number_format($cumulative['term1_average'], 2).'%' : 'Missing' }}</span></td>
                <td><span class="label">Second Term Average</span><br><span class="value">{{ $cumulative['term2_average'] !== null ? number_format($cumulative['term2_average'], 2).'%' : 'Missing' }}</span></td>
                <td><span class="label">Third Term Average</span><br><span class="value">{{ $cumulative['term3_average'] !== null ? number_format($cumulative['term3_average'], 2).'%' : 'Missing' }}</span></td>
                <td><span class="label">Annual Average</span><br><span class="value">{{ $cumulative['cumulative_average'] !== null ? number_format($cumulative['cumulative_average'], 2).'%' : 'Incomplete' }}</span></td>
            </tr>
            @if(($template['show_promotion'] ?? true) && $cumulative['promotion_status'])
                <tr><td colspan="2"><span class="label">Promotion Status</span><br><span class="value">{{ $cumulative['promotion_status'] }}</span></td><td colspan="2"><span class="label">Next Class</span><br><span class="value">{{ $cumulative['destination_class'] ?: 'Not applicable' }}</span></td></tr>
            @endif
        </table>
    </div>@endif
@else
    @php $components = $card['assessment_components'] ?? []; @endphp
    <table class="results">
        <thead><tr><th>Subject</th>@foreach($components as $component)<th>{{ $component['label'] }}@if($component['max_score'] !== null)<br>({{ number_format($component['max_score'], 0) }})@endif</th>@endforeach<th>Total</th><th>Grade</th>@if($template['show_grade_point'] ?? false)<th>Grade Point</th>@endif<th>Remark</th></tr></thead>
        <tbody>
        @foreach($results as $result)
            <tr>
                <td>{{ $result['subject_name'] }}</td>
                @foreach($components as $component)
                    <td>{{ data_get($result, 'assessment_scores.'.$component['key'], '-') ?? '-' }}</td>
                @endforeach
                <td><strong>{{ number_format($result['total_score'], 2) }}</strong></td>
                <td><strong>{{ $result['grade'] ?: '-' }}</strong></td>
                @if($template['show_grade_point'] ?? false)<td>{{ $result['grade_point'] ?? '-' }}</td>@endif
                <td>{{ $result['remark'] ?: '-' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
@endif

<table class="metric">
    <tr>
        <td><span class="metric-name">Total Obtained</span><span class="metric-value">{{ number_format($summary['total_score'], 2) }}</span></td>
        <td><span class="metric-name">Total Obtainable</span><span class="metric-value">{{ number_format($summary['total_obtainable'], 2) }}</span></td>
        <td><span class="metric-name">{{ $card['is_third_term'] ? 'Annual Average' : 'Term Average' }}</span><span class="metric-value">{{ number_format($card['is_third_term'] ? ($cumulative['cumulative_average'] ?? 0) : $summary['average_score'], 2) }}%</span></td>
        <td><span class="metric-name">Overall Grade</span><span class="metric-value">{{ $summary['overall_grade'] ?: '-' }}</span></td>
    </tr>
    <tr>
        @if($template['show_position'] ?? true)<td><span class="metric-name">Position</span><span class="metric-value">{{ $summary['position'] ?: '-' }}</span></td>@endif
        <td><span class="metric-name">Number in Class</span><span class="metric-value">{{ $summary['total_students_in_class'] ?: '-' }}</span></td>
        @if($template['show_attendance'] ?? true)<td colspan="2"><span class="metric-name">Attendance</span><span class="metric-value">{{ $summary['attendance_present'] ?? 0 }} / {{ $summary['attendance_total'] ?? 0 }}</span></td>@endif
    </tr>
</table>

@if(($template['show_teacher_signature'] ?? true) || ($template['show_principal_signature'] ?? true) || ($template['show_school_stamp'] ?? true))
<table style="margin-top:16px;text-align:center">
    <tr>
        @if($template['show_teacher_signature'] ?? true)<td><div style="border-top:1px solid #9aa4b2;padding-top:4px">Class Teacher Signature</div></td>@endif
        @if($template['show_principal_signature'] ?? true)<td>@if(is_string($school['principal_signature_url'] ?? null) && str_starts_with($school['principal_signature_url'], 'data:image/'))<img class="signature-image" src="{{ $school['principal_signature_url'] }}" alt="Principal signature"><br>@endif<div style="border-top:1px solid #9aa4b2;padding-top:4px">{{ $school['principal_name'] ?: 'Principal / Head Teacher' }}</div></td>@endif
        @if(($template['show_school_stamp'] ?? true) && is_string($school['school_stamp_url'] ?? null) && str_starts_with($school['school_stamp_url'], 'data:image/'))<td><img class="stamp-image" src="{{ $school['school_stamp_url'] }}" alt="School stamp"></td>@endif
    </tr>
</table>
@endif

<table class="comments">
    <tr>
        <td><div class="comment-title">Class Teacher's Remark</div>{{ $card['comments']['class_teacher_comment'] ?: 'No remark recorded.' }}</td>
        <td><div class="comment-title">Principal / Head Teacher's Remark</div>{{ $card['comments']['principal_comment'] ?: 'No remark recorded.' }}</td>
    </tr>
</table>

<div class="footer">{{ $school['report_card_footer_text'] ?: 'This is an official academic record generated by the school management system.' }}</div>
</body>
</html>
