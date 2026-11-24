# ==========================================================================
#   EXAMINATION SEATING ARRANGEMENT SYSTEM - COMPREHENSIVE AUTH TEST SUITE
#   Validates all endpoints, security rules, role enforcement, and lockout
# ==========================================================================

import threading
import time
import urllib.request
import json
import auth
import api_server
import backend

BASE_URL = "http://127.0.0.1:5011"

def req(path, method="GET", body=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        res = urllib.request.urlopen(request)
        raw_body = res.read().decode("utf-8")
        try:
            return res.status, json.loads(raw_body)
        except json.JSONDecodeError:
            return res.status, {"html": raw_body}
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_data = {"raw": "error"}
        return e.code, err_data
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    print("=" * 70)
    print("  RUNNING AUTHENTICATION & SECURITY INTEGRATION TEST SUITE")
    print("=" * 70)

    # 0. Clean & Seed Database for reliable test execution
    import seed
    seed.run_seed()

    # 1. Start Server on test port 5011
    server_thread = threading.Thread(target=api_server.start_server, kwargs={"host": "127.0.0.1", "port": 5011}, daemon=True)
    server_thread.start()
    time.sleep(1.2)

    passed = 0
    failed = 0

    def assert_test(cond, title, details=""):
        nonlocal passed, failed
        if cond:
            print(f" [PASS] {title}")
            passed += 1
        else:
            print(f" [FAIL] {title} -> {details}")
            failed += 1

    # --- TEST 1: STATIC & SPA ROUTES ---
    print("\n--- 1. Testing SPA Fallback & Static Serving ---")
    st, _ = req("/", "GET")
    assert_test(st == 200, "GET / returns index.html (200)")

    st, _ = req("/student/login", "GET")
    assert_test(st == 200, "GET /student/login falls back to index.html (200)")

    st, _ = req("/admin/login", "GET")
    assert_test(st == 200, "GET /admin/login falls back to index.html (200)")

    st, _ = req("/forgot-password", "GET")
    assert_test(st == 200, "GET /forgot-password falls back to index.html (200)")

    st, _ = req("/student/my-seat", "GET")
    assert_test(st == 200, "GET /student/my-seat falls back to index.html (200)")

    # --- TEST 2: STUDENT SIGNUP VALIDATION ---
    print("\n--- 2. Testing Student Registration ---")
    # A: Roll not in backend.students (e.g. 9999)
    st, res = req("/api/auth/signup/student", "POST", {
        "name": "Ghost Student",
        "roll": 9999,
        "email": "ghost@student.edu",
        "password": "Password123",
        "confirm_password": "Password123"
    })
    assert_test(st == 400 and not res.get("success"), "Reject roll number not in candidate database")

    # B: Name mismatch (Roll 111 is 'Vikram', but user enters 'Alice')
    st, res = req("/api/auth/signup/student", "POST", {
        "name": "Alice Mismatch",
        "roll": 111,
        "email": "alice111@student.edu",
        "password": "Password123",
        "confirm_password": "Password123"
    })
    assert_test(st == 400 and "does not match" in str(res), "Reject registration when student name does not match enrolled record")

    # C: Password mismatch
    st, res = req("/api/auth/signup/student", "POST", {
        "name": "Vikram",
        "roll": 111,
        "email": "vikram111@student.edu",
        "password": "StudentPassword111",
        "confirm_password": "DifferentPassword111"
    })
    assert_test(st == 400 and "do not match" in str(res), "Reject registration when passwords do not match")

    # D: Weak password (no uppercase or digits)
    st, res = req("/api/auth/signup/student", "POST", {
        "name": "Vikram",
        "roll": 111,
        "email": "vikram111@student.edu",
        "password": "weak",
        "confirm_password": "weak"
    })
    assert_test(st == 400 and "at least 8" in str(res), "Reject password failing complexity requirements")

    # E: Valid Student Signup (Vikram Roll 111)
    st, res = req("/api/auth/signup/student", "POST", {
        "name": "Vikram",
        "roll": 111,
        "email": "vikram111@student.edu",
        "password": "StudentPassword111",
        "confirm_password": "StudentPassword111"
    })
    assert_test(st == 201 and res.get("success") and res.get("token"), "Valid student registration succeeded (201)")
    vikram_token = res.get("token")

    # F: Duplicate Signup with same roll
    st, res = req("/api/auth/signup/student", "POST", {
        "name": "Vikram",
        "roll": 111,
        "email": "another_email@student.edu",
        "password": "StudentPassword111",
        "confirm_password": "StudentPassword111"
    })
    assert_test(st == 400 and "already been registered" in str(res), "Reject duplicate registration for existing roll number")

    # --- TEST 3: ADMIN SETUP & PUBLIC SIGNUP DISABLEMENT ---
    print("\n--- 3. Testing Admin Security & Public Signup Disablement ---")
    st, res = req("/api/auth/signup/admin", "POST", {
        "name": "Fake Admin",
        "email": "fake@admin.edu",
        "username": "fakeadmin",
        "password": "AdminPassword123"
    })
    assert_test(st == 403 and "disabled" in str(res).lower(), "Public administrator signup endpoint is blocked with 403 Forbidden")

    # --- TEST 4: LOGIN & LOCKOUT MECHANISM ---
    print("\n--- 4. Testing Login & 5-Attempt Lockout ---")
    # A: Wrong password attempts (Kapil kapil101@student.edu)
    for i in range(1, 6):
        st, res = req("/api/auth/login", "POST", {
            "identifier": "kapil101@student.edu",
            "password": "WrongPassword999",
            "role": "student"
        })
    assert_test(st == 401 and "locked" in str(res).lower(), "Account locked after 5 consecutive failed attempts")

    # 6th attempt while locked
    st, res = req("/api/auth/login", "POST", {
        "identifier": "kapil101@student.edu",
        "password": "StudentPassword101",
        "role": "student"
    })
    assert_test(st == 401 and "locked" in str(res).lower(), "Locked account blocks even correct password during lockout")

    # Reset Kapil's lockout for subsequent testing
    users = auth.load_users()
    for u in users:
        if u.get("roll") == 101:
            u["failed_attempts"] = 0
            u["locked_until"] = 0
    auth.save_users(users)

    # B: Successful Student Login using registered Email Address
    st, res = req("/api/auth/login", "POST", {
        "identifier": "kapil101@student.edu",
        "password": "StudentPassword101",
        "role": "student"
    })
    assert_test(st == 200 and res.get("success") and res.get("token"), "Student login with registered email succeeds (200)")
    kapil_token = res.get("token")

    # C: Successful Admin Login using Username
    st, res = req("/api/auth/login", "POST", {
        "identifier": "admin",
        "password": "AdminPassword123",
        "role": "admin"
    })
    assert_test(st == 200 and res.get("success") and res.get("token"), "Admin login with username succeeds (200)")
    admin_token = res.get("token")

    # --- TEST 5: ROLE ENFORCEMENT & SECURITY ---
    print("\n--- 5. Testing Role-Based Access Enforcement ---")
    # A: Unauthenticated request to /api/state
    st, res = req("/api/state", "GET")
    assert_test(st == 401, "Unauthenticated request to /api/state returns 401")

    # B: Student trying to access admin seating endpoints -> MUST RETURN 403!
    st, res = req("/api/state", "GET", token=kapil_token)
    assert_test(st == 403, "Student access to /api/state blocked with 403 Forbidden")

    st, res = req("/api/generate", "POST", token=kapil_token)
    assert_test(st == 403, "Student calling /api/generate blocked with 403 Forbidden")

    st, res = req("/api/assign-seats", "POST", token=kapil_token)
    assert_test(st == 403, "Student calling /api/assign-seats blocked with 403 Forbidden")

    # C: Admin accessing /api/state and assigning seats
    st, res = req("/api/state", "GET", token=admin_token)
    assert_test(st == 200 and res.get("success"), "Admin calling /api/state allowed (200)")

    st, res = req("/api/assign-seats", "POST", token=admin_token)
    assert_test(st == 200 and res.get("success"), "Admin executing /api/assign-seats allowed (200)")

    # D: Student calling /api/my_seat (reads roll 101 from session)
    st, res = req("/api/my_seat", "GET", token=kapil_token)
    assert_test(st == 200 and res.get("allocated") and res["data"]["roll"] == 101, "Student calling /api/my_seat returns their own seat (Room 101, Seat 1)")

    # --- TEST 6: REAL OTP FORGOT PASSWORD WORKFLOW ---
    print("\n--- 6. Testing Real OTP Password Reset Workflow ---")
    # A: Request OTP for non-existent student email
    st, res = req("/api/auth/forgot-password/send-otp", "POST", {
        "email": "nonexistent@student.edu"
    })
    assert_test(st == 400 and "no registered student" in str(res).lower(), "Reject OTP request for non-existent student email")

    # B: Request OTP when SMTP is unconfigured (clean error explaining configuration)
    st, res = req("/api/auth/forgot-password/send-otp", "POST", {
        "email": "anurag102@student.edu"
    })
    # Since SMTP host is unconfigured or placeholder, backend returns informative error
    assert_test(st == 400 and ("smtp" in str(res).lower() or "email service is not configured" in str(res).lower()),
                "Informative error explaining SMTP configuration in config.json is returned when SMTP is unconfigured")

    # C: Test OTP verification, expiration, and password reset directly through auth engine
    import hashlib, secrets
    test_otp = "842915"
    test_otp_hash = hashlib.sha256(test_otp.encode("utf-8")).hexdigest()
    otps = auth.load_otps()
    otps["anurag102@student.edu"] = {
        "otp_hash": test_otp_hash,
        "expires_at": time.time() + 600,
        "attempts": 0,
        "max_attempts": 3,
        "verified": False,
        "created_at": time.time()
    }
    auth.save_otps(otps)

    # D: Verify wrong OTP -> attempt count increments
    st, res = req("/api/auth/forgot-password/verify-otp", "POST", {
        "email": "anurag102@student.edu",
        "otp": "000000"
    })
    assert_test(st == 400 and "remaining" in str(res).lower(), "Invalid OTP rejected and remaining attempts reported")

    # E: Verify correct OTP
    st, res = req("/api/auth/forgot-password/verify-otp", "POST", {
        "email": "anurag102@student.edu",
        "otp": test_otp
    })
    assert_test(st == 200 and res.get("success"), "Valid 6-digit OTP verified successfully (200)")

    # F: Reset password with verified OTP
    st, res = req("/api/auth/forgot-password/reset", "POST", {
        "email": "anurag102@student.edu",
        "otp": test_otp,
        "new_password": "NewStudentPassword102!",
        "confirm_password": "NewStudentPassword102!"
    })
    assert_test(st == 200 and res.get("success"), "Password reset with verified OTP succeeds (200)")

    # G: Reusing OTP must fail
    st, res = req("/api/auth/forgot-password/reset", "POST", {
        "email": "anurag102@student.edu",
        "otp": test_otp,
        "new_password": "AnotherPassword123!",
        "confirm_password": "AnotherPassword123!"
    })
    assert_test(st == 400 and "no active otp" in str(res).lower(), "Single-use OTP cannot be reused after password reset")

    # H: Login with the new password
    st, res = req("/api/auth/login", "POST", {
        "identifier": "anurag102@student.edu",
        "password": "NewStudentPassword102!",
        "role": "student"
    })
    assert_test(st == 200 and res.get("success"), "Login succeeds with the newly reset password")

    print("\n" + "=" * 70)
    print(f"  TEST SUITE RESULTS: {passed} PASSED | {failed} FAILED")
    print("=" * 70)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    import sys
    sys.exit(0 if success else 1)
