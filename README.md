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

All routes are prefixed with `/api/auth`.

### 📝 Registration
`POST /api/auth/register`

Used to create a new Student or Teacher account.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `fullName` | String | Yes | User's full name |
| `email` | String | Yes | Unique email address |
| `role` | String | Yes | `student` or `teacher` |
| `studentId` | String | Required if role is `student` | Unique School ID |
| `employeeId` | String | Required if role is `teacher` | Unique Employee ID |
| `password` | String | Yes | Min 8 characters |
| `confirmPassword` | String | Yes | Must match `password` |

**Example Student Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@school.edu",
  "role": "student",
  "studentId": "SCH-2024-001",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

---

### 🔑 Login
`POST /api/auth/login`

Returns an access token on success.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | String | Yes | `student`, `teacher`, or `admin` |
| `login` | String | Yes | **Email** (or Student/Employee ID for non-admins) |
| `password` | String | Yes | User's password |

**Example Request:**
```json
{
  "role": "admin",
  "login": "admin@school.edu",
  "password": "secureAdminPassword"
}
```

---

### 📩 Forgot Password
`POST /api/auth/forgot-password`

Initiates the password reset flow.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Registered email address |

**Note:** Returns a generic success message even if the email doesn't exist for security reasons.

---

### 🔄 Reset Password
`POST /api/auth/reset-password`

Completes the password reset using the token received via email.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Registered email address |
| `token` | String | Yes | Token from the reset email |
| `password` | String | Yes | New password |
| `confirmPassword` | String | Yes | Confirm new password |

---

### 🚪 Logout
`POST /api/auth/logout`

**Requires Bearer Token.** Revokes the current access token.

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
