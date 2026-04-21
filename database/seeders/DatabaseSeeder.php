<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Admin::query()->firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name' => 'System Admin',
                'password' => Hash::make('admin'),
            ]
        );
    }
}
