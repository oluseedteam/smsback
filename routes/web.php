<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Single Page Application Shell
|--------------------------------------------------------------------------
|
| All web routes (excluding API, docs, Sanctum CSRF, storage, and health checks)
| are routed to the master Blade view which hosts the React application.
|
*/

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|docs|sanctum|storage|up).*$');
