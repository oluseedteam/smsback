<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Admin;

echo "ADMINS:\n";
foreach (Admin::all() as $u) echo "{$u->email} / admin\n";

echo "\nTEACHERS:\n";
foreach (Teacher::all() as $u) echo "{$u->email} / password\n";

echo "\nSTUDENTS:\n";
foreach (Student::all() as $u) echo "{$u->email} / password\n";
