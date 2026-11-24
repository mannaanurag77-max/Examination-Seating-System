# 🎓 Examination Seating Arrangement System
### Full-Stack Authentication & 3D Glassmorphism Portal

A full-stack, production-grade Examination Seating Arrangement System featuring student self-registration with enrolled name-roll verification, student login by registered email, separate administrator login, a real 6-digit OTP password reset workflow via SMTP, and an interactive 3D examination hall seat locator.

Built strictly according to project specifications using **Python Standard Library ONLY** (no external framework or database dependencies) paired with a **React 18 + 3D Glassmorphism** frontend with blue and purple gradients.

---

## 🌟 Key Features

1. **Student Signup System**:
   - **Enrolled Roll Verification**: Only students whose roll numbers exist in `backend.students` can register.
   - **Official Name Match Verification**: Strictly verifies that the student's entered name matches the official candidate record for that roll number (case-insensitive trimmed comparison).
   - **Duplicate Protection**: Prevents duplicate roll numbers or duplicate email addresses.
   - **Email & Password Validation**: Enforces standard email syntax and password complexity (minimum 8 characters with uppercase, lowercase, and digit).
   - **Cryptographic Security**: PBKDF2-HMAC-SHA256 password hashing with individual 16-byte cryptographic salts (`100,000` iterations).
   - **Role Assignment**: Automatically assigns role `"student"`. Users cannot specify or escalate roles.
   - **Safe Storage**: Saved in [users.json](file:///c:/Users/ANURAG%20MANNA/OneDrive/Desktop/examination_seating_Syatem/users.json).
2. **Student Login**:
   - Authenticates using registered **Email Address** and password.
   - Redirects to the **Student Dashboard** (`/student/my-seat`).
   - Strict data isolation: Endpoint `/api/my_seat` extracts the roll number exclusively from the verified server-side session token. Students can only see their own profile and seat details, protecting other students' private information.
3. **Admin Login**:
   - Dedicated Admin Portal at `/admin/login` using **Username** and password.
   - Admin accounts are provisioned exclusively via a secure, controlled setup tool ([seed.py](file:///c:/Users/ANURAG%20MANNA/OneDrive/Desktop/examination_seating_Syatem/seed.py)). Public self-registration is disabled.
   - Administrative endpoints (`/api/state`, `/api/generate`, `/api/assign-seats`, etc.) require role `"admin"`.
4. **Real OTP Password Reset Workflow**:
   - Student enters their registered email address.
   - Backend generates a secure 6-digit numeric OTP (`secrets.randbelow`).
   - Dispatches the OTP via real email using Python's standard `smtplib` (with STARTTLS/TLS).
   - If email configuration is missing in [config.json](file:///c:/Users/ANURAG%20MANNA/OneDrive/Desktop/examination_seating_Syatem/config.json), the interface presents a clear, helpful setup guide explaining exactly which SMTP keys need to be configured (no fake success messages or demo links).
   - Enforces a 10-minute expiration countdown and a 3-attempt limit.
   - Validates and hashes the new password with a fresh salt and invalidates all existing sessions.
5. **Modern 3D Glassmorphism Design**:
   - Dark theme with vibrant **blue and purple gradients** (`#3b82f6` electric blue, `#6366f1` indigo, `#8b5cf6` purple, `#a855f7` violet).
   - Glass-effect login and signup cards (`backdrop-filter: blur(20px)`).
   - Smooth transitions, password strength meter, failed-login shake animations, and responsive desktop/mobile layouts.

---

## 📁 Project Structure

```text
examination_seating_Syatem/
├── api_server.py         # ThreadingHTTPServer with CORS, RBAC, session verification, and SPA fallback
├── auth.py               # Pure stdlib auth engine (PBKDF2, sessions, lockout, real OTPs)
├── backend.py            # Preserved seating arrangement algorithms and student/room data
├── config.json           # Application settings, OTP/session expiry, and SMTP email parameters
├── seed.py               # Controlled setup tool initializing Chief Admin and sample students
├── test_auth_system.py   # Comprehensive automated test suite (30 assertions, 100% pass rate)
├── users.json            # JSON storage for student and admin accounts with salts and hashes
├── otps.json             # Active hashed 6-digit OTPs with expiration and attempt counters
├── README.md             # Complete technical documentation & quick start guide
└── templates/
    ├── index.html        # SPA root loading React 18, styling, and precompiled bundle
    ├── style.css         # Blue & purple 3D glassmorphism design system & animations
    ├── app.jsx           # React JSX source with AuthContext, routing, 3D desk view & dashboards
    └── app.js            # Pre-compiled classic React bundle (zero build-step required in browser)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.9+ (Installed on Windows, macOS, or Linux)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Seed Accounts (Controlled Setup)
To reset or provision initial student and administrator accounts:
```bash
python seed.py
```

### 2. Launch the Application Server
Run either `api_server.py` or `backend.py`:
```bash
python api_server.py
```
*or:*
```bash
python backend.py
```
The server will start on: **`http://localhost:5000`** (or `http://127.0.0.1:5000`).

---

## 🔑 Pre-Seeded Credentials

### Administrator Account
| Role | Username | Password | Access / Scope | Setup Process |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `AdminPassword123` | Full examination coordinator suite, seating solver, student management | Controlled CLI (`seed.py`) |

### Sample Enrolled Students
| Roll | Official Name | Registered Email | Password | Subject | Enrolled Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **101** | Kapil | `kapil101@student.edu` | `StudentPassword101` | Python | Pre-seeded |
| **102** | Anurag | `anurag102@student.edu` | `StudentPassword102` | Java | Pre-seeded |
| **103** | Priya | `priya103@student.edu` | `StudentPassword103` | C++ | Pre-seeded |
| **104** | Rahul | `rahul104@student.edu` | `StudentPassword104` | JavaScript | Pre-seeded |
| **105** | Sneha | `sneha105@student.edu` | `StudentPassword105` | Python | Pre-seeded |
| **106** | Amit | `amit106@student.edu` | `StudentPassword106` | Java | Pre-seeded |
| **107** | Neha | `neha107@student.edu` | `StudentPassword107` | C++ | Pre-seeded |
| **108** | Raj | `raj108@student.edu` | `StudentPassword108` | JavaScript | Pre-seeded |
| **124** | Kabir | `kabir124@student.edu` | `StudentPassword124` | JavaScript | Pre-seeded |

> **Available for Fresh Self-Registration**:
> Rolls `110` through `123` exist in `backend.py`'s student roster and can be used to test new registrations at `/student/signup`!
> Example: Roll **111** (Name: **Vikram**), Roll **112** (Name: **Anjali**), Roll **113** (Name: **Karan**).

---

## ⚙️ SMTP Email Configuration (`config.json`)

To enable live OTP password reset emails, configure your real SMTP credentials in `config.json`:
```json
{
  "session_expiry_hours": 2,
  "otp_expiry_minutes": 10,
  "max_otp_attempts": 3,
  "max_failed_attempts": 5,
  "lockout_duration_minutes": 5,
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "your-email@gmail.com",
    "password": "your-app-password-here",
    "from_email": "your-email@gmail.com",
    "use_tls": true
  }
}
```

> **Note on Missing Configuration**:
> If SMTP credentials are not filled in, the system **will not display fake success messages**. Instead, it informs the student and displays setup instructions on screen.

---

## 🧪 Automated Test Suite

Run the automated integration test suite:
```bash
python test_auth_system.py
```
**Results: 30 / 30 tests passed (100% pass rate)**:
- SPA fallback on client routes (`/`, `/student/login`, `/admin/login`, etc.).
- Enrolled student signup validation with official Name + Roll matching.
- Rejection of name mismatches, non-enrolled rolls, weak passwords, and duplicate registrations.
- Blocked public admin registration (HTTP 403).
- 5-attempt brute-force lockout defense (5 minutes).
- Student login strictly via registered email.
- Role-based authorization (401 Unauthorized, 403 Forbidden).
- Data isolation on `/api/my_seat` (reading roll from session).
- Real OTP workflow: expiration, 3-attempt limit, verified single-use reset, session invalidation.

---

## 📋 Comprehensive Manual Test Checklist

Open **[http://localhost:5000](http://localhost:5000)** in your browser:

### 1. Role Landing Page (`/`)
- [ ] Observe the two 3D glass cards with blue and purple ambient glows.
- [ ] Click **"I'm a Student"** &rarr; Navigates to `/student/login` with electric blue accents.
- [ ] Click **"I'm an Admin"** &rarr; Navigates to `/admin/login` with royal purple accents.

### 2. Student Self-Registration (`/student/signup`)
- [ ] Navigate to `/student/signup`.
- [ ] **Test Non-Enrolled Roll**: Enter Name `"John Doe"`, Roll `999` &rarr; Rejection: *"Roll number 999 does not exist in student examination records."*
- [ ] **Test Name Mismatch**: Enter Name `"Wrong Name"`, Roll `111` (Official name in `backend.py` is Vikram) &rarr; Rejection: *"The entered name does not match the enrolled student record for Roll Number 111."*
- [ ] **Test Duplicate Roll**: Enter Name `"Kapil"`, Roll `101` &rarr; Rejection: *"An account has already been registered for Roll Number 101."*
- [ ] **Test Valid Registration**: Enter Name `"Vikram"`, Roll `111`, Email `vikram111@student.edu`, Password `SecurePass111!`, Confirm Password `SecurePass111!`.
  - Live strength meter updates.
  - Submits and redirects directly into the student dashboard.

### 3. Student Login (`/student/login`)
- [ ] Enter registered email `kapil101@student.edu` and password `StudentPassword101`.
- [ ] Click **"Sign In as Student"** &rarr; Redirects to `/student/my-seat`.
- [ ] View assigned examination details: Room 101, Seat 1, Row 1, Column 1, Subject Python.
- [ ] Observe the **3D Hall Layout**: Desk #1 is spotlighted with a glowing blue border and `★ YOUR SEAT` badge.
- [ ] Verify other students' personal data is not exposed.

### 4. Admin Portal (`/admin/login`)
- [ ] Open `/admin/login`.
- [ ] Verify there is **no public sign-up link** on the admin page.
- [ ] Sign in with `admin` and `AdminPassword123`.
- [ ] View the full Examination Coordinator Suite.
- [ ] Click **"Assign Seats"** or **"Generate Seating"** &rarr; Algorithm runs and assigns all candidates across rooms with zero adjacent conflicts.

### 5. Brute-Force Lockout Defense
- [ ] At `/student/login`, enter an incorrect password 5 consecutive times for an account.
- [ ] Observe card shake animation on each failure.
- [ ] On the 5th attempt &rarr; Account locks for 5 minutes (*"Account is temporarily locked due to too many failed attempts. Try again in 5 minutes."*).

### 6. Real OTP Password Reset Workflow
- [ ] Click **"Forgot password?"** on the login page.
- [ ] Enter a registered email (e.g. `anurag102@student.edu`).
- [ ] **When SMTP is not configured**: System displays a clear warning box explaining that SMTP settings need to be added to `config.json` (no fake success messages).
- [ ] **When SMTP is configured**: A 6-digit numeric OTP is dispatched to the student's email.
- [ ] Enter the 6-digit code on Step 2. Verify countdown timer and attempt limit.
- [ ] Enter a new password on Step 3 &rarr; Password is encrypted, previous sessions are terminated, and student is redirected to login.
