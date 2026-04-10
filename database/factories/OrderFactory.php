<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => $this->faker->randomElement(['pending', 'processing', 'on_the_way', 'delivered', 'cancelled']),
            'subtotal' => $this->faker->randomFloat(2, 100, 1000),
            'tax' => $this->faker->randomFloat(2, 10, 100),
            'total' => $this->faker->randomFloat(2, 110, 1100),
            'tracking_code' => 'TRK-' . strtoupper(uniqid()),
            'delivery_address' => $this->faker->address(),
            'delivery_method' => $this->faker->randomElement(['standard', 'express', 'same_day']),
            'payment_method' => $this->faker->randomElement(['cash_on_delivery', 'online_payment']),
        ];
    }
} 