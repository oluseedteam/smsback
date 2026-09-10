<?php

namespace Tests\Feature;

use App\Models\Teacher;
use App\Models\SchoolSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CpanelDeploymentAndAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_cpanel_spa_deep_routes_return_html_shell(): void
    {
        $routes = [
            '/',
            '/login',
            '/admin/login',
            '/auth/signup',
            '/about',
            '/contact',
            '/admissions',
            '/admin/dashboard',
            '/admin/finance',
            '/student/dashboard',
            '/student/finance',
            '/teacher/gradebook',
            '/some/arbitrary/nested/spa/path',
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $response->assertStatus(200);
            $response->assertSee('<div id="root"></div>', false);
            $response->assertSee('GHRA School');
        }
    }

    public function test_api_routes_are_not_intercepted_by_spa_shell(): void
    {
        SchoolSetting::create([
            'school_name' => 'GHRA School',
            'email' => 'info@ghra.org.ng',
            'phone' => '+2340000000',
            'address' => 'Lagos, Nigeria',
        ]);

        $response = $this->getJson('/api/public/school-settings');
        $response->assertStatus(200);
        $response->assertJsonStructure(['school_name', 'email']);

        // Missing API route should return 404 JSON, not the HTML SPA page
        $missingApiResponse = $this->getJson('/api/non-existent-endpoint-test');
        $missingApiResponse->assertStatus(404);
        $this->assertStringNotContainsString('<div id="root"></div>', (string) $missingApiResponse->getContent());
    }

    public function test_bearer_token_authentication_with_standard_header(): void
    {
        $teacher = Teacher::factory()->create([
            'full_name' => 'Jane Teacher',
            'employee_id' => 'EMP-9090',
            'email' => 'jane.teacher@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);

        $token = $teacher->createToken('cpanel-test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200);
        $response->assertJsonPath('user.id', $teacher->id);
    }

    public function test_cpanel_fastcgi_redirect_http_authorization_simulation(): void
    {
        $teacher = Teacher::factory()->create([
            'full_name' => 'John Teacher',
            'employee_id' => 'EMP-9091',
            'email' => 'john.teacher@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);

        $token = $teacher->createToken('cpanel-fastcgi-test')->plainTextToken;

        // Simulate Apache FastCGI environment variable REDIRECT_HTTP_AUTHORIZATION
        $response = $this->withServerVariables([
            'REDIRECT_HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ])->getJson('/api/auth/me');

        $response->assertStatus(200);
        $response->assertJsonPath('user.id', $teacher->id);
    }

    public function test_unauthenticated_api_request_returns_clean_401_json(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
        $response->assertJsonStructure(['error']);
    }
}
