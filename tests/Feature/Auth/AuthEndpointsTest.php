<?php

namespace Tests\Feature\Auth;

use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register_with_frontend_fields(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'fullName' => 'Jane Doe',
            'studentId' => 'SCH-1001',
            'role' => 'student',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'confirmPassword' => 'password123',
            'acceptTerms' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.role', 'student')
            ->assertJsonStructure(['token', 'token_type', 'user']);

        $this->assertDatabaseHas('students', [
            'email' => 'jane@example.com',
            'student_id' => 'SCH-1001',
        ]);
    }

    public function test_teacher_can_register_with_employee_id(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'fullName' => 'Mr. Adams',
            'employeeId' => 'EMP-2002',
            'role' => 'teacher',
            'email' => 'adams@example.com',
            'password' => 'password123',
            'confirmPassword' => 'password123',
            'acceptTerms' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.role', 'teacher')
            ->assertJsonStructure(['token', 'token_type', 'user']);

        $this->assertDatabaseHas('teachers', [
            'email' => 'adams@example.com',
            'employee_id' => 'EMP-2002',
        ]);
    }

    public function test_login_supports_email_or_school_id(): void
    {
        Teacher::factory()->create([
            'full_name' => 'Teacher One',
            'employee_id' => 'EMP-4455',
            'email' => 'teacher@example.com',
            'password' => 'password123',
        ]);

        $emailLogin = $this->postJson('/api/auth/login', [
            'role' => 'teacher',
            'login' => 'teacher@example.com',
            'password' => 'password123',
        ]);

        $emailLogin->assertOk()->assertJsonStructure(['token', 'user']);

        $idLogin = $this->postJson('/api/auth/login', [
            'role' => 'teacher',
            'login' => 'EMP-4455',
            'password' => 'password123',
        ]);

        $idLogin->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_invalid_login_returns_unauthorized(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'role' => 'student',
            'login' => 'missing@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_forgot_password_sends_reset_notification_for_existing_email(): void
    {
        Notification::fake();

        $user = Student::factory()->create([
            'email' => 'student@example.com',
            'student_id' => 'SCH-9901',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'student@example.com',
        ]);

        $response->assertOk()->assertJsonPath('message', 'If that email exists, a password reset link has been sent.');

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = Student::factory()->create([
            'email' => 'reset@example.com',
            'student_id' => 'SCH-7001',
            'password' => 'oldpassword123',
        ]);

        $token = Password::broker()->createToken($user);

        $resetResponse = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset@example.com',
            'token' => $token,
            'password' => 'newpassword123',
            'confirmPassword' => 'newpassword123',
        ]);

        $resetResponse->assertOk()->assertJsonPath('message', 'Password reset successful.');

        $loginResponse = $this->postJson('/api/auth/login', [
            'role' => 'student',
            'login' => 'reset@example.com',
            'password' => 'newpassword123',
        ]);

        $loginResponse->assertOk()->assertJsonStructure(['token']);
    }
}
