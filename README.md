# GHRA School Management System - Backend (Laravel)

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Environment Configuration

### Local Development (.env)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=template
DB_USERNAME=root
DB_PASSWORD=
```

### Production (cPanel)
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_cpanel_db_name
DB_USERNAME=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
```

## Database Migrations

Run all migrations:
```bash
php artisan migrate
```

Key migration files:
- `create_school_domain_tables` — Core tables (students, teachers, workers, classes, subjects, etc.)
- `add_department_to_students_table` — Adds `department` column (science/art/commercial) for Nigerian school model

## API Routes

All routes are prefixed with `/api`.

### Authentication (Public)
- `POST /auth/login` — Login
- `POST /auth/register` — Register student/teacher

### Protected Routes (Bearer Token)

#### Dashboard
- `GET /dashboard/summary` — Role-specific summary

#### Classes & Subjects (Read: All | Write: Admin)
- `GET /classes` — List all
- `GET /classes/{id}` — Show with students
- `POST/PUT/DELETE /classes/{id}` — Admin CRUD
- `GET /subjects` — List all
- `POST/PUT/DELETE /subjects/{id}` — Admin CRUD

#### Attendance (Admin + Teacher)
- `GET /attendance` — List
- `POST /attendance/bulk` — Save bulk

#### Student Only
- `GET /my/attendance` — Student's attendance records
- `GET /my/results` — Student's grades/scores
- `GET /my/classes` — Classes the student is enrolled in

#### Assignments, Messages, Resources, Calendar Events
- Standard CRUD via `apiResource`
- `GET/POST/PUT/DELETE /teacher-classes` — Teacher class/schedule management

#### Admin Only
- `GET/DELETE /logs` — System logs
- `GET/POST/PATCH/DELETE /users` — User management

## Default Admin Login
- **Username**: `admin`
- **Password**: `admin`
