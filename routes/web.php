<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'School Management System Auth API',
        'status' => 'ok',
    ]);
});
