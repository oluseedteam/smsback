<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Worker;
use App\Repositories\UserRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApplicationIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_controller_route_references_an_existing_method(): void
    {
        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName();
            if (!str_contains($action, '@')) {
                continue;
            }

            [$controller, $method] = explode('@', $action, 2);
            $this->assertTrue(class_exists($controller), "Route controller {$controller} does not exist.");
            $this->assertTrue(method_exists($controller, $method), "Route action {$action} does not exist.");
        }
    }

    public function test_public_library_search_is_reachable_without_authentication(): void
    {
        $this->getJson('/api/library/search?category=school')
            ->assertOk()
            ->assertJsonStructure(['school_library', 'open_library', 'google_books', 'total']);
    }

    public function test_worker_account_fields_and_dashboard_are_functional(): void
    {
        $worker = Worker::query()->create([
            'full_name' => 'Operations Staff',
            'employee_id' => 'GHRA-WRK-001',
            'email' => 'worker@example.com',
            'password' => 'password123',
            'institutional_role' => 'Facilities Officer',
            'phone' => '+2348000000000',
            'gender' => 'male',
            'status' => 'active',
        ]);

        $this->assertSame('Facilities Officer', $worker->fresh()->institutional_role);
        $this->assertSame('+2348000000000', $worker->fresh()->phone);

        $this->actingAs($worker, 'sanctum')
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('role', 'worker')
            ->assertJsonStructure(['summary' => ['current_session', 'current_term', 'available_resources', 'upcoming_events']]);
    }

    public function test_students_cannot_mutate_teacher_managed_resources(): void
    {
        $student = Student::factory()->create();
        $this->actingAs($student, 'sanctum');

        $this->postJson('/api/assignments', [])->assertForbidden();
        $this->postJson('/api/resources', [])->assertForbidden();
        $this->postJson('/api/calendar-events', [])->assertForbidden();
        $this->getJson('/api/teacher-classes')->assertForbidden();
    }

    public function test_unknown_admin_login_never_creates_a_default_account(): void
    {
        $admin = app(UserRepository::class)->findByRoleAndLogin('admin', 'admin');

        $this->assertNull($admin);
        $this->assertSame(0, Admin::query()->count());
    }
}
