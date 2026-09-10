<?php

namespace Tests\Feature;

use Tests\TestCase;

class SpaRoutingTest extends TestCase
{
    public function test_spa_root_returns_view(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertSee('GHRA School');
        $response->assertSee('id="root"', false);
    }

    public function test_spa_deep_links_return_view(): void
    {
        $response = $this->get('/student/dashboard');
        $response->assertStatus(200);
        $response->assertSee('id="root"', false);

        $response = $this->get('/admin/finance');
        $response->assertStatus(200);
        $response->assertSee('id="root"', false);
    }
}
