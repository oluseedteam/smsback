# School Management System Auth API

This is a production-ready Laravel REST API providing robust authentication services for a School Management System. It supports separate roles for **Students** and **Teachers**, with secure token-based authentication and flexible login options.

---

## 🚀 1. Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- MySQL/PostgreSQL (or SQLite for development)

### Setup Instructions
1.  **Install dependencies**:
    ```bash
    composer install
    ```
2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
3.  **Database Migration**:
    Configure your `DB_*` settings in `.env`, then run:
    ```bash
    php artisan migrate
    ```
4.  **Run the Server**:
    ```bash
    php artisan serve
    ```
    The API will be available at `http://localhost:8000`.

---

## 🔐 2. Authentication Workflow

This API uses **Laravel Sanctum** for secure, stateful, and token-based authentication.

1.  **Register/Login**: Send your credentials to the respective endpoints.
2.  **Receive Token**: On success, you receive a `plainTextToken`.
3.  **Authorize Requests**: Include this token in the `Authorization` header of all subsequent requests:
    ```http
    Authorization: Bearer <your_token_here>
    Accept: application/json
    ```

---

## 🛠 3. API Reference

Interactive documentation is available at `http://localhost:8000/docs/api` (powered by Scramble).

### 🔐 Authentication
All auth routes are prefixed with `/api/auth`.

- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate and receive a Bearer token.
- `POST /api/auth/forgot-password`: Request a password reset link.
- `POST /api/auth/reset-password`: Reset password using a token.
- `POST /api/auth/logout`: Revoke the current access token (Requires Auth).

---

### 📊 Dashboard
- `GET /api/dashboard/summary`: Get a role-specific overview of system data (Requires Auth).

---

### 👥 User Management (Admin Only)
All routes require Admin role.
- `GET /api/users?role={admin|teacher|student}`: List and search users.
- `POST /api/users`: Create a new user manually.
- `GET /api/users/{role}/{id}`: View specific user details.
- `PATCH /api/users/{role}/{id}`: Update user information.
- `DELETE /api/users/{role}/{id}`: Remove a user account.

---

### 🏫 School Management
- **Classes**:
  - `GET /api/classes`: List all school classes.
  - `POST /api/classes`: Create a new class (Admin).
  - `GET /api/classes/{id}`: View class details, students, and subjects.
  - `PATCH /api/classes/{id}`: Update class info or assignments.
  - `DELETE /api/classes/{id}`: Delete a class.
- **Subjects**:
  - `GET /api/subjects`: List all subjects.
  - `POST /api/subjects`: Create a new subject.
  - `GET /api/subjects/{id}`: View subject details.
  - `PATCH /api/subjects/{id}`: Update subject info.
  - `DELETE /api/subjects/{id}`: Delete a subject.

---

### 📝 Academic Management
- **Attendance**:
  - `GET /api/attendance`: Filter and view attendance records.
  - `POST /api/attendance/bulk`: Submit attendance records in bulk.
  - `PATCH /api/attendance/{id}`: Update a specific attendance entry.
- **Results**:
  - `GET /api/results`: List and filter academic results.
  - `POST /api/results`: Grade an assessment.
  - `PATCH /api/results/{id}`: Update a result entry.
  - `DELETE /api/results/{id}`: Remove a result.

---

## 🛡 4. Security & Best Practices

-   **Rate Limiting**:
    -   Authentication (Login/Register): **10 requests/min**
    -   Password Resets: **5 requests/min**
-   **Validation**: Strict input validation with clear JSON error messages.
*   **Data Protection**: All passwords are hashed using **Bcrypt**.
*   **Role Isolation**: Users cannot login as a role they aren't registered for.

---

## 🧪 5. Testing

The project includes a comprehensive test suite covering all authentication flows.

```bash
# Run all tests
php artisan test
```

Currently active tests:
-   `✓` Student/Teacher Registration
-   `✓` Multi-credential Login (Email/ID)
-   `✓` Secure Logout
-   `✓` Password Reset Lifecycle
