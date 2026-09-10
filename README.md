# GHRA School Management System (Laravel 12 + React)

A premium School Management Platform designed for modern educational institutions.

## Tech Stack
- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 with Vite
- **Database**: MySQL / MariaDB
- **Authentication**: Laravel Sanctum (Token-based)
- **API**: RESTful API design

## Core Features
1. **User Management**: Unified management for Admins, Teachers, Students, and Workers.
2. **Academic System**: Dynamic Classes, Subjects, and Attendance tracking.
3. **CBT System**: Complete Computer-Based Testing module with automated grading and administrative approval workflow.
4. **Finance**: Fee management, digital wallet, and transaction history.
5. **Health & Bio**: Medical records, bio-data tracking, and emergency contact management.
6. **Communication**: Internal messaging, broadcasting, and dispute/feedback loop.

## Setup Instructions

### 1. Prerequisites
- PHP 8.2+
- Composer
- Node.js 20+ and npm
- MySQL

### 2. Installation
```bash
composer install
npm ci
cp .env.example .env
php artisan key:generate
```

### 3. Database Configuration
Update `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_sms
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Migrate & Seed
```bash
php artisan migrate --seed
npm run build
```

Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `.env` before seeding if the
first administrator account needs to be created. The application does not ship
with a default production password.

### 5. Production Deployment

After each release, install the locked dependencies, run every migration, build
the frontend, and refresh Laravel's caches:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
```

## API Documentation

All endpoints are prefixed with `/api`. Authentication is required for most routes via `Bearer` token.

### Authentication
- `POST /api/auth/login`: Authenticate and receive token.
- `POST /api/auth/register`: Public registration (Student/Teacher).
- `PATCH /api/auth/profile`: Update personal bio and security.

### 👤 User Management (Admin Only)
- `GET /api/users`: List all system users.
- `GET /api/users/{role}/{id}`: Deep dive into a specific user's portfolio.
- `POST /api/users`: Create new user (any role).
- `PATCH /api/users/{role}/{id}`: Update user data.
- `DELETE /api/users/{role}/{id}`: Soft/Hard delete user.

### 🏥 Health & Emergency
- `GET /api/health-records`: Fetch student/teacher health profile and medical history.
- `POST /api/health-records`: Update health profile (Blood group, Genotype, Allergies, Emergency Contacts).
- `DELETE /api/health-records/{id}`: Remove specific medical condition record.

### 📝 CBT System
- **Teacher**:
  - `POST /api/cbt-tests`: Create new assessment.
  - `POST /api/cbt-tests/{id}/questions/bulk`: Upload questions.
- **Student**:
  - `GET /api/student/cbt-tests`: View available exams.
  - `POST /api/student/cbt-tests/{id}/submit`: Submit exam answers.
- **Admin**:
  - `GET /api/cbt-submissions`: Review all participant scores.
  - `PATCH /api/cbt-submissions/{id}/release`: Approve and publish specific result.
  - `PATCH /api/cbt-submissions/release-all`: Publish all pending results.

### 💰 Finance & Payments (Manual Bank Transfer & Receipt Verification)
- `GET /api/payment-settings/bank-account`: View authoritative school bank account details.
- `PUT /api/payment-settings/bank-account`: (Admin) Update school bank account details.
- `GET /api/fee-types`: List available fee types.
- `GET /api/fees`: Class fee structures.
- `GET /api/student/finance`: (Student) Personal balance, fee breakdown, and payment history.
- `POST /api/student/payments`: (Student) Submit bank transfer receipt for verification.
- `GET /api/admin/payments`: (Admin) Payment verification hub.
- `POST /api/admin/payments/{payment}/confirm`: (Admin) Confirm receipt, update student balance, and generate official receipt number.
- `POST /api/admin/payments/{payment}/reject`: (Admin) Reject payment submission with reason.

### 📂 Communication & Materials
- `apiResource('messages')`: Internal chat system.
- `apiResource('assignments')`: Teacher-Student homework loop.
- `apiResource('resources')`: Library and PDF sharing.

## Credentials

No default login credentials are committed to the repository. Create accounts
with the administration workflow or configure the one-time bootstrap admin
variables described above before running the seeder.
