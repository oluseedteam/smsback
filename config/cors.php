<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Production frontend: https://ghra.org.ng
    | API backend:         https://api.ghra.org.ng
    |
    | NOTE: 'allowed_origins' must list specific origins (not '*') when
    | 'supports_credentials' is true — browsers reject wildcard + credentials.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_unique(array_merge([
        'https://ghra.org.ng',
        'https://www.ghra.org.ng',
        env('APP_URL'),
        env('FRONTEND_URL'),
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ], array_map('trim', explode(',', (string) env('ALLOWED_ORIGINS', ''))))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
