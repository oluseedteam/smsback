<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel Starter') }}</title>
        <style>
            :root { color-scheme: light dark; }
            * { box-sizing: border-box; }
            body {
                margin: 0;
                font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
                line-height: 1.5;
                background: #0b1020;
                color: #e5e7eb;
            }
            a { color: #93c5fd; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .container { max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
            .card {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                padding: 1.5rem;
            }
            .grid { display: grid; gap: 1rem; }
            @media (min-width: 768px) { .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            .pill { display: inline-flex; gap: .5rem; align-items: center; padding: .25rem .5rem; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: #c7d2fe; border-radius: 9999px; font-size: .8125rem; }
            .kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 0 .35rem; border-radius: .375rem; }
            .muted { color: #9ca3af; }
            .heading { font-size: clamp(1.75rem, 2vw + 1rem, 2.5rem); margin: .75rem 0 0; letter-spacing: .2px; }
            .sub { font-size: 1rem; color: #a5b4fc; margin-top: .5rem; }
            ul { margin: .5rem 0 0; padding-left: 1.25rem; }
            li { margin: .375rem 0; }
            code { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: .15rem .35rem; border-radius: .35rem; }
            header { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; }
            .brand { display:flex; align-items:center; gap:.75rem; }
            .logo { width: 36px; height: 36px; border-radius: 8px; background: conic-gradient(from 180deg at 50% 50%, #60a5fa, #a78bfa, #f472b6, #60a5fa); border: 1px solid rgba(255,255,255,0.25); }
            footer { margin-top: 2rem; font-size: .9rem; color: #9ca3af; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="brand">
                    <div class="logo"></div>
                    <div>
                        <div class="pill">Laravel API Starter</div>
                        <h1 class="heading">{{ config('app.name', 'Laravel Starter') }}</h1>
                        <p class="sub">Auth + Profile + Minimal Admin</p>
                    </div>
                </div>
                <nav class="muted">
                    <a href="docs/api" target="_blank" rel="noopener">Docs</a>
                </nav>
            </header>

            <div class="grid grid-cols-2">
                <section class="card">
                    <h2>Quick start</h2>
                    <ul>
                        <li>Run <span class="kbd">php artisan serve</span></li>
                        <li>Migrate DB: <span class="kbd">php artisan migrate</span></li>
                        <li>Use the API endpoints below to register and log in</li>
                    </ul>
                </section>

                <section class="card">
                    <h2>Auth endpoints</h2>
                    <ul>
                        <li><code>POST</code> <code>/api/auth/register</code></li>
                        <li><code>POST</code> <code>/api/auth/login</code></li>
                        <li><code>POST</code> <code>/api/forgot-password</code></li>
                    </ul>
                </section>

                <section class="card">
                    <h2>Authenticated</h2>
                    <ul>
                        <li><code>GET</code> <code>/api/user/me</code></li>
                        <li><code>POST</code> <code>/api/profile/update</code></li>
                        <li><code>POST</code> <code>/api/change-password</code></li>
                        <li><code>POST</code> <code>/api/logout</code></li>
                    </ul>
                </section>

                <section class="card">
                    <h2>Admin (role: admin)</h2>
                    <ul>
                        <li><code>GET</code> <code>/api/admin/users</code> <span class="muted">?role=agent|technician</span></li>
                    </ul>
                </section>
            </div>

            <footer>
                <div>Environment: <strong>{{ app()->environment() }}</strong></div>
                <div>Laravel {{ app()->version() }}</div>
            </footer>
        </div>
    </body>
    </html>


