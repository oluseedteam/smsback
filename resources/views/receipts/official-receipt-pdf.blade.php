<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Official School Fee Receipt - {{ $receipt['receipt_number'] }}</title>
    <style>
        @page {
            margin: 25px 30px;
            size: a4 portrait;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            font-size: 12px;
            margin: 0;
            padding: 0;
        }
        .container {
            border: 2px solid #1e3a8a;
            border-radius: 8px;
            padding: 24px;
            background: #ffffff;
            position: relative;
        }
        .header {
            border-bottom: 2px double #cbd5e1;
            padding-bottom: 16px;
            margin-bottom: 20px;
            text-align: center;
        }
        .school-name {
            font-size: 22px;
            font-weight: 900;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 4px 0;
        }
        .school-meta {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0;
        }
        .receipt-title-box {
            margin: 18px 0 16px 0;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 16px;
        }
        .receipt-title-box table {
            width: 100%;
        }
        .receipt-heading {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .receipt-number {
            font-size: 14px;
            font-weight: 900;
            color: #1e3a8a;
            text-align: right;
            font-family: 'Courier New', Courier, monospace;
        }
        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-grid td {
            padding: 6px 10px;
            font-size: 12px;
        }
        .label {
            font-weight: 700;
            color: #475569;
            width: 25%;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
        }
        .value {
            font-weight: 600;
            color: #0f172a;
            width: 25%;
        }
        .table-custom {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table-custom th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 12px;
            text-align: left;
        }
        .table-custom td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
        }
        .table-custom tr.total-row td {
            font-weight: 800;
            font-size: 13px;
            background: #f8fafc;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
        }
        .badge-confirmed {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
            padding: 4px 10px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 11px;
            text-transform: uppercase;
        }
        .footer-section {
            margin-top: 30px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 16px;
        }
        .stamp-box {
            border: 2px solid #15803d;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            color: #15803d;
            font-weight: 800;
            font-size: 11px;
            text-transform: uppercase;
            display: inline-block;
            transform: rotate(-3deg);
        }
        .footer-note {
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- School Header -->
        <div class="header">
            <h1 class="school-name">{{ $school['name'] ?? config('app.name', 'School Portal') }}</h1>
            @if(!empty($school['motto']))
                <p class="school-meta" style="font-style: italic; font-weight: 600;">"{{ $school['motto'] }}"</p>
            @endif
            @if(!empty($school['address']))
                <p class="school-meta">{{ $school['address'] }}</p>
            @endif
            @if(!empty($school['phone']) || !empty($school['email']))
                <p class="school-meta">
                    {{ $school['phone'] ?? '' }} 
                    {{ !empty($school['phone']) && !empty($school['email']) ? ' | ' : '' }} 
                    {{ $school['email'] ?? '' }}
                </p>
            @endif
        </div>

        <!-- Receipt Title & Number Box -->
        <div class="receipt-title-box">
            <table>
                <tr>
                    <td class="receipt-heading">OFFICIAL PAYMENT RECEIPT</td>
                    <td class="receipt-number">RECEIPT NO: {{ $receipt['receipt_number'] }}</td>
                </tr>
            </table>
        </div>

        <!-- Student & Academic Details -->
        <table class="info-grid">
            <tr>
                <td class="label">Student Name:</td>
                <td class="value">{{ $student['full_name'] }}</td>
                <td class="label">Student ID:</td>
                <td class="value">{{ $student['student_id'] }}</td>
            </tr>
            <tr>
                <td class="label">Class:</td>
                <td class="value">{{ $student['class_name'] ?? 'N/A' }}</td>
                <td class="label">Session:</td>
                <td class="value">{{ $payment['academic_session'] }}</td>
            </tr>
            <tr>
                <td class="label">Term:</td>
                <td class="value">{{ $payment['term'] }}</td>
                <td class="label">Payment Date:</td>
                <td class="value">{{ $payment['payment_date'] }}</td>
            </tr>
            <tr>
                <td class="label">Payment Method:</td>
                <td class="value">BANK TRANSFER</td>
                <td class="label">Verification Date:</td>
                <td class="value">{{ $payment['verified_at'] }}</td>
            </tr>
            <tr>
                <td class="label">Transaction Ref:</td>
                <td class="value" style="font-family: monospace;">{{ $payment['transaction_reference'] }}</td>
                <td class="label">Verified By:</td>
                <td class="value">{{ $payment['verified_by'] }}</td>
            </tr>
        </table>

        <!-- Payment Breakdown Table -->
        <table class="table-custom">
            <thead>
                <tr>
                    <th style="width: 50%;">Fee Description</th>
                    <th style="width: 25%; text-align: center;">Payment Channel</th>
                    <th style="width: 25%; text-align: right;">Amount Paid</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $payment['fee_type'] ?: 'School Fees' }}</strong>
                        @if(!empty($payment['description']))
                            <br><small style="color: #64748b;">{{ $payment['description'] }}</small>
                        @endif
                        @if(!empty($payment['bank_used']))
                            <br><small style="color: #64748b;">Bank: {{ $payment['bank_used'] }} | Sender: {{ $payment['sender_name'] }}</small>
                        @endif
                    </td>
                    <td style="text-align: center;">Manual Bank Transfer</td>
                    <td style="text-align: right; font-weight: 700; color: #1e3a8a;">
                        &#8358;{{ number_format($payment['amount'], 2) }}
                    </td>
                </tr>
                <tr class="total-row">
                    <td colspan="2" style="text-align: right; text-transform: uppercase;">Amount Paid Confirmed:</td>
                    <td style="text-align: right; color: #16a34a;">&#8358;{{ number_format($payment['amount'], 2) }}</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: 600; color: #475569;">Total Applicable Fees:</td>
                    <td style="text-align: right; font-weight: 600;">&#8358;{{ number_format($finance['total_fee'], 2) }}</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: 600; color: #475569;">Total Confirmed Payments to Date:</td>
                    <td style="text-align: right; font-weight: 600; color: #16a34a;">&#8358;{{ number_format($finance['total_paid'], 2) }}</td>
                </tr>
                <tr style="background: #fef2f2;">
                    <td colspan="2" style="text-align: right; font-weight: 800; color: #b91c1c;">Outstanding Balance:</td>
                    <td style="text-align: right; font-weight: 800; color: #b91c1c;">&#8358;{{ number_format($finance['balance'], 2) }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Status & Sign-off -->
        <table style="width: 100%; margin-top: 20px;">
            <tr>
                <td style="width: 60%;">
                    <div class="stamp-box">
                        &#10003; PAYMENT VERIFIED & CONFIRMED<br>
                        <span style="font-size: 9px; font-weight: 600;">DATE: {{ $payment['verified_at'] }}</span>
                    </div>
                </td>
                <td style="width: 40%; text-align: right; vertical-align: bottom;">
                    <div style="border-top: 1px solid #475569; display: inline-block; padding-top: 4px; min-width: 180px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; color: #1e293b;">Bursary / Accounts Office</span><br>
                        <span style="font-size: 9px; color: #64748b;">Authorized Signatory</span>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-section">
            <p class="footer-note">
                This is a computer-generated official receipt issued by {{ $school['name'] ?? config('app.name') }}.
                Valid only after human bank reconciliation confirmation by school administration.
                Receipt ID: {{ $receipt['receipt_number'] }} | Issued: {{ $receipt['issued_at'] }}
            </p>
        </div>
    </div>
</body>
</html>
