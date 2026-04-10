<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $role = $this->input('role');

        $this->merge([
            'password_confirmation' => $this->input('confirmPassword', $this->input('password_confirmation')),
            // Backward compatibility with current frontend payload.
            'employeeId' => $this->input('employeeId', $role === 'teacher' ? $this->input('studentId') : null),
        ]);
    }

    public function rules(): array
    {
        return [
            'fullName' => ['required', 'string', 'max:255'],
            'studentId' => [
                'required_if:role,student',
                'nullable',
                'string',
                'max:50',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$value) {
                        return;
                    }

                    $exists = DB::table('students')->where('student_id', $value)->exists()
                        || DB::table('teachers')->where('employee_id', $value)->exists();

                    if ($exists) {
                        $fail('Student ID is already taken.');
                    }
                },
            ],
            'employeeId' => [
                'required_if:role,teacher',
                'nullable',
                'string',
                'max:50',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$value) {
                        return;
                    }

                    $exists = DB::table('students')->where('student_id', $value)->exists()
                        || DB::table('teachers')->where('employee_id', $value)->exists();

                    if ($exists) {
                        $fail('Employee ID is already taken.');
                    }
                },
            ],
            'role' => ['required', Rule::in(['student', 'teacher'])],
            'email' => [
                'required',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $exists = DB::table('students')->where('email', $value)->exists()
                        || DB::table('teachers')->where('email', $value)->exists();

                    if ($exists) {
                        $fail('The email has already been taken.');
                    }
                },
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'fullName.required' => 'Full name is required.',
            'studentId.required_if' => 'Student ID is required for student registration.',
            'employeeId.required_if' => 'Employee ID is required for teacher registration.',
            'acceptTerms.accepted' => 'You must accept the terms before registering.',
        ];
    }
}
