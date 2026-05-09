<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeStructure;
use App\Models\Payment;
use App\Models\WalletBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    // ─── Fee Structures (Admin) ─────────────────────────────

    public function feeIndex(Request $request): JsonResponse
    {
        $query = FeeStructure::query()->orderBy('class_name');

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }
        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->input('academic_year'));
        }

        return response()->json($query->get());
    }

    public function feeStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_name' => 'required|string|max:100',
            'department' => 'nullable|string|max:100',
            'term' => 'required|in:1st Term,2nd Term,3rd Term',
            'academic_year' => 'nullable|string|max:20',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:500',
        ]);

        $fee = FeeStructure::updateOrCreate(
            [
                'class_name' => $validated['class_name'],
                'department' => $validated['department'] ?? null,
                'term' => $validated['term'],
                'academic_year' => $validated['academic_year'] ?? null,
            ],
            [
                'amount' => $validated['amount'],
                'description' => $validated['description'] ?? null,
            ]
        );

        return response()->json($fee, 201);
    }

    public function feeUpdate(Request $request, FeeStructure $fee): JsonResponse
    {
        $validated = $request->validate([
            'class_name' => 'sometimes|string|max:100',
            'department' => 'nullable|string|max:100',
            'term' => 'sometimes|in:1st Term,2nd Term,3rd Term',
            'academic_year' => 'nullable|string|max:20',
            'amount' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string|max:500',
        ]);

        $fee->update($validated);

        return response()->json($fee);
    }

    public function feeDestroy(FeeStructure $fee): JsonResponse
    {
        $fee->delete();
        return response()->json(['message' => 'Fee structure deleted.']);
    }

    // ─── Student Finance View ───────────────────────────────

    public function studentFinance(Request $request): JsonResponse
    {
        $student = $request->user();

        // Get student's class info
        $studentClass = $student->classes()->first();
        $className = $studentClass ? $studentClass->name : null;
        $department = $student->department;

        // Get applicable fees
        $fees = collect();
        if ($className) {
            $fees = FeeStructure::where('class_name', $className)
                ->where(function ($q) use ($department) {
                    $q->whereNull('department')
                      ->orWhere('department', '')
                      ->orWhere('department', $department);
                })
                ->get();
        }

        // Get wallet
        $wallet = WalletBalance::firstOrCreate(
            ['student_id' => $student->id],
            ['balance' => 0]
        );

        // Get payment history
        $payments = Payment::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate paid fees
        $paidFees = Payment::where('student_id', $student->id)
            ->where('type', 'fee_payment')
            ->where('status', 'successful')
            ->pluck('fee_structure_id')
            ->toArray();

        return response()->json([
            'wallet' => $wallet,
            'fees' => $fees,
            'payments' => $payments,
            'paid_fee_ids' => $paidFees,
            'class_name' => $className,
            'department' => $department,
        ]);
    }

    // ─── Flutterwave Payment ────────────────────────────────

    public function initializePayment(Request $request): JsonResponse
    {
        $student = $request->user();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:100',
            'type' => 'required|in:funding,fee_payment',
            'fee_structure_id' => 'nullable|required_if:type,fee_payment|exists:fee_structures,id',
        ]);

        $reference = 'SMS-' . strtoupper(Str::random(12)) . '-' . time();

        // Create pending payment record
        $payment = Payment::create([
            'student_id' => $student->id,
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'reference' => $reference,
            'status' => 'pending',
            'fee_structure_id' => $validated['fee_structure_id'] ?? null,
            'description' => $validated['type'] === 'funding'
                ? 'Wallet funding'
                : 'Fee payment',
        ]);

        // Initialize Flutterwave
        $flutterwaveSecretKey = config('services.flutterwave.secret_key');

        $response = Http::withToken($flutterwaveSecretKey)
            ->post('https://api.flutterwave.com/v3/payments', [
                'tx_ref' => $reference,
                'amount' => (float) $validated['amount'],
                'currency' => 'NGN',
                'redirect_url' => config('services.flutterwave.redirect_url', config('app.frontend_url', 'http://localhost:5173') . '/student/finance/callback'),
                'customer' => [
                    'email' => $student->email,
                    'name' => $student->full_name,
                ],
                'customizations' => [
                    'title' => 'GHRA School Payment',
                    'description' => $validated['type'] === 'funding'
                        ? 'Wallet Funding'
                        : 'School Fee Payment',
                    'logo' => config('app.url') . '/logo.png',
                ],
                'meta' => [
                    'payment_id' => $payment->id,
                    'student_id' => $student->id,
                    'type' => $validated['type'],
                ],
            ]);

        if ($response->successful() && $response->json('status') === 'success') {
            return response()->json([
                'payment_link' => $response->json('data.link'),
                'reference' => $reference,
                'payment_id' => $payment->id,
            ]);
        }

        $payment->update(['status' => 'failed']);

        return response()->json([
            'message' => 'Failed to initialize payment. Please try again.',
            'error' => $response->json('message'),
        ], 500);
    }

    public function verifyPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required|string',
            'tx_ref' => 'required|string',
        ]);

        $payment = Payment::where('reference', $validated['tx_ref'])->first();

        if (!$payment) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        if ($payment->status === 'successful') {
            return response()->json(['message' => 'Payment already verified.', 'payment' => $payment]);
        }

        // Verify with Flutterwave
        $flutterwaveSecretKey = config('services.flutterwave.secret_key');

        $response = Http::withToken($flutterwaveSecretKey)
            ->get("https://api.flutterwave.com/v3/transactions/{$validated['transaction_id']}/verify");

        if (
            $response->successful() &&
            $response->json('status') === 'success' &&
            $response->json('data.status') === 'successful' &&
            (float) $response->json('data.amount') >= (float) $payment->amount &&
            $response->json('data.currency') === 'NGN'
        ) {
            $payment->update([
                'status' => 'successful',
                'flutterwave_tx_id' => $validated['transaction_id'],
                'metadata' => $response->json('data'),
            ]);

            // Handle post-payment logic
            if ($payment->type === 'funding') {
                // Credit wallet
                $wallet = WalletBalance::firstOrCreate(
                    ['student_id' => $payment->student_id],
                    ['balance' => 0]
                );
                $wallet->increment('balance', (float) $payment->amount);
            }

            return response()->json([
                'message' => 'Payment verified successfully.',
                'payment' => $payment->fresh(),
            ]);
        }

        $payment->update(['status' => 'failed']);

        return response()->json(['message' => 'Payment verification failed.'], 400);
    }

    public function payFeeFromWallet(Request $request): JsonResponse
    {
        $student = $request->user();

        $validated = $request->validate([
            'fee_structure_id' => 'required|exists:fee_structures,id',
        ]);

        $fee = FeeStructure::findOrFail($validated['fee_structure_id']);

        // Check if already paid
        $alreadyPaid = Payment::where('student_id', $student->id)
            ->where('fee_structure_id', $fee->id)
            ->where('status', 'successful')
            ->where('type', 'fee_payment')
            ->exists();

        if ($alreadyPaid) {
            return response()->json(['message' => 'This fee has already been paid.'], 400);
        }

        $wallet = WalletBalance::where('student_id', $student->id)->first();

        if (!$wallet || $wallet->balance < $fee->amount) {
            return response()->json(['message' => 'Insufficient wallet balance.'], 400);
        }

        $reference = 'SMS-WALLET-' . strtoupper(Str::random(8)) . '-' . time();

        // Deduct from wallet
        $wallet->decrement('balance', (float) $fee->amount);

        // Create payment record
        Payment::create([
            'student_id' => $student->id,
            'type' => 'fee_payment',
            'amount' => $fee->amount,
            'reference' => $reference,
            'status' => 'successful',
            'fee_structure_id' => $fee->id,
            'term' => $fee->term,
            'description' => "Fee payment for {$fee->class_name} - {$fee->term}",
        ]);

        return response()->json([
            'message' => 'Fee paid successfully from wallet.',
            'wallet' => $wallet->fresh(),
        ]);
    }

    // ─── Admin: View All Payments ────────────────────────────

    public function allPayments(Request $request): JsonResponse
    {
        $query = Payment::with(['student:id,full_name,student_id', 'feeStructure'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        return response()->json($query->paginate(50));
    }
}
