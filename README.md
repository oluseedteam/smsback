# School Management System Auth API

## 1. Project Overview
This project is a production-ready Laravel REST API focused only on authentication for two roles:
- Student
- Teacher

Implemented features:
- Registration (matching frontend signup fields)
- Login (role + email/school ID + password)
- Forgot password (email-based reset)
- Reset password (token-based)
- Token auth using Laravel Sanctum
- Rate limiting for auth endpoints



## 2. Tech Stack
- Laravel 12 (PHP 8.2+)
- MySQL
- Laravel Sanctum (Bearer token auth)
- Laravel Password Broker (secure reset tokens)

## 3. Setup Instructions
1. Install dependencies
```bash
composer install
```

2. Create environment file
```bash
cp .env.example .env
```

3. Generate app key
```bash
php artisan key:generate
```

4. Configure database in `.env`

5. Run migrations
```bash
php artisan migrate
```

6. Start server
```bash
php artisan serve
```

## 4. Environment Variables
Required/important values:
```env
APP_NAME="SMS API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sms_auth
DB_USERNAME=root
DB_PASSWORD=

AUTH_PASSWORD_RESET_EXPIRE=30

MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="noreply@example.com"
MAIL_FROM_NAME="SMS Auth API"
```

## 5. API Endpoints
Base URL: `/api/auth`

### Register
- `POST /api/auth/register`

### Login
- `POST /api/auth/login`

### Forgot Password
- `POST /api/auth/forgot-password`

### Reset Password
- `POST /api/auth/reset-password`

### Logout
- `POST /api/auth/logout` (requires Bearer token)

## 6. Example Request/Response JSON
### Register Request
```json
{
  "fullName": "Jane Doe",
  "studentId": "SCH-1001",
  "role": "student",
  "email": "jane@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "acceptTerms": true
}
```

### Register Request (Teacher)
```json
{
  "fullName": "Mr. Adams",
  "employeeId": "EMP-2002",
  "role": "teacher",
  "email": "adams@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "acceptTerms": true
}
```

### Register Response (201)
```json
{
  "message": "Registration successful.",
  "token": "1|plainTextToken...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "full_name": "Jane Doe",
    "role": "student",
    "student_id": "SCH-1001",
    "email": "jane@example.com"
  }
}
```

### Login Request
```json
{
  "role": "teacher",
  "login": "teacher@example.com",
  "password": "password123"
}
```

`login` accepts either email or school ID (`Email / School ID` from frontend).

### Login Response (200)
```json
{
  "message": "Login successful.",
  "token": "1|plainTextToken...",
  "token_type": "Bearer",
  "user": {
    "id": 2,
    "full_name": "Teacher One",
    "role": "teacher",
    "employee_id": "EMP-4455",
    "email": "teacher@example.com"
  }
}
```

### Forgot Password Request
```json
{
  "email": "jane@example.com"
}
```

### Forgot Password Response (200)
```json
{
  "message": "If that email exists, a password reset link has been sent."
}
```

### Reset Password Request
```json
{
  "email": "jane@example.com",
  "token": "reset-token",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Reset Password Response (200)
```json
{
  "message": "Password reset successful."
}
```

## 7. Database Schema (students + teachers tables)
```sql
CREATE TABLE students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE teachers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);
```

## Frontend Field Mapping (Extracted)
### Signup (`/signup`)
- `fullName` (required text)
- `studentId` (required for `student`)
- `employeeId` (required for `teacher`)
- `email` (required email)
- `password` (required)
- `confirmPassword` (required, must match password)
- role toggle (`student` or `teacher`)
- terms checkbox (required)

### Login (`/login`)
- role toggle (`student` or `teacher`)
- `Email / School ID` input (required)
- `password` input (required)

### Forgot Password
The shipped frontend bundle contains a `/forgot-password` link but no routed forgot-password form component was found in the loaded bundle. API supports standard email-based forgot/reset flow.

## Security Best Practices Applied
- Password hashing with bcrypt (Laravel Hash)
- Strict request validation via Form Requests
- SQL injection protection through Eloquent/query builder
- Throttling:
  - `auth` limiter: 10 requests/minute
  - `password-reset` limiter: 5 requests/minute
- Password reset token security and expiry via Laravel password broker (`AUTH_PASSWORD_RESET_EXPIRE`)
- Generic forgot-password response to reduce account enumeration

## Testing
Feature tests included for:
- Registration
- Login
- Forgot password
- Reset password

Run tests:
```bash
php artisan test
```
