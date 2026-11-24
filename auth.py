# ==========================================================================
#   EXAMINATION SEATING ARRANGEMENT SYSTEM - AUTHENTICATION MODULE (auth.py)
#   Pure Python standard library implementation: hashlib, secrets, json, time, re, smtplib
# ==========================================================================

import os
import re
import json
import time
import secrets
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Import backend to validate student rolls & names against actual seating records
import backend

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")
USERS_FILE = os.path.join(BASE_DIR, "users.json")
OTPS_FILE = os.path.join(BASE_DIR, "otps.json")
RESET_TOKENS_FILE = os.path.join(BASE_DIR, "reset_tokens.json")

# In-memory active sessions: token -> { user_id, role, name, email, roll, username, expires_at }
active_sessions = {}

def load_config():
    """Loads configuration from config.json with fallback defaults"""
    default_config = {
        "admin_invite_code": "EXAM_ADMIN_2026",
        "session_expiry_hours": 2,
        "otp_expiry_minutes": 10,
        "max_otp_attempts": 3,
        "max_failed_attempts": 5,
        "lockout_duration_minutes": 5,
        "app_url": "http://localhost:5000",
        "smtp": {
            "host": "",
            "port": 587,
            "username": "",
            "password": "",
            "from_email": "no-reply@exam-system.edu",
            "use_tls": True
        }
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                default_config.update(loaded)
        except Exception as e:
            print(f"[AUTH WARNING] Error reading config.json: {e}")
    return default_config

def load_json(filepath, default_value):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[AUTH ERROR] Failed to load {filepath}: {e}")
    return default_value

def save_json(filepath, data):
    tmp_path = filepath + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_path, filepath)

def load_users():
    return load_json(USERS_FILE, [])

def save_users(users):
    save_json(USERS_FILE, users)

def load_otps():
    return load_json(OTPS_FILE, {})

def save_otps(otps):
    save_json(OTPS_FILE, otps)

def load_reset_tokens():
    return load_json(RESET_TOKENS_FILE, [])

def save_reset_tokens(tokens):
    save_json(RESET_TOKENS_FILE, tokens)


# -------------------- PASSWORD HASHING & SECURITY --------------------

def hash_password(password, salt_hex=None):
    """
    Hashes password using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns (salt_hex, hash_hex).
    """
    if salt_hex is None:
        salt_bytes = secrets.token_bytes(16)
        salt_hex = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt_hex)

    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 100000)
    return salt_hex, derived.hex()

def verify_password(password, salt_hex, stored_hash_hex):
    """Timing-attack-safe password verification"""
    try:
        _, test_hash_hex = hash_password(password, salt_hex)
        return secrets.compare_digest(test_hash_hex, stored_hash_hex)
    except Exception:
        return False

def validate_password_strength(password):
    """
    Rules: min 8 characters, at least 1 uppercase letter,
    at least 1 lowercase letter, at least 1 digit.
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit (0-9)."
    return True, ""

def validate_email(email):
    """Checks for standard email syntax"""
    if not email:
        return False, "Email address is required."
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, email.strip()):
        return False, "Please enter a valid email address."
    return True, ""


# -------------------- SESSION MANAGEMENT --------------------

def create_session(user):
    """Creates a secure token and saves in memory for session_expiry_hours"""
    cfg = load_config()
    token = secrets.token_hex(32)
    expiry = time.time() + (cfg.get("session_expiry_hours", 2) * 3600)
    
    session_data = {
        "user_id": user["user_id"],
        "role": user["role"],
        "name": user["name"],
        "email": user["email"],
        "username": user.get("username"),
        "roll": user.get("roll"),
        "expires_at": expiry
    }
    active_sessions[token] = session_data
    return token, session_data

def get_session(token):
    """Validates session token; auto-cleans expired sessions"""
    if not token or token not in active_sessions:
        return None
    session_data = active_sessions[token]
    if time.time() > session_data["expires_at"]:
        del active_sessions[token]
        return None
    return session_data

def destroy_session(token):
    if token in active_sessions:
        del active_sessions[token]
        return True
    return False

def destroy_all_sessions_for_user(user_id):
    """Invalidates every session belonging to a specific user (e.g. after password reset)"""
    tokens_to_remove = [tok for tok, s in active_sessions.items() if s.get("user_id") == user_id]
    for tok in tokens_to_remove:
        del active_sessions[tok]


# -------------------- STUDENT REGISTRATION --------------------

def register_student(name, roll, email, password, confirm_password=None):
    """
    Registers a student.
    Strict Requirements:
      1. Only students whose roll numbers already exist in backend.students can register.
      2. Verify that the entered roll number exists.
      3. Verify that the student's name matches the existing record in backend.students.
      4. Do not allow duplicate roll numbers.
      5. Do not allow duplicate email addresses.
      6. Validate email format.
      7. Validate password strength and confirm password match.
      8. Hash passwords with individual salts.
      9. Automatically assign role 'student'.
      10. Never allow users to choose their own role.
      11. Store in users.json.
    """
    name = str(name).strip() if name else ""
    if not name:
        return False, "Full name is required.", None

    try:
        roll_num = int(roll)
    except (ValueError, TypeError):
        return False, "A valid numeric roll number is required.", None

    # Check 1 & 2: Roll number must exist in backend student records
    matched_student = None
    for s in backend.students:
        if s["roll"] == roll_num:
            matched_student = s
            break

    if not matched_student:
        return False, f"Roll number {roll_num} does not exist in student examination records. Please contact an administrator.", None

    # Check 3: Student's name must match the existing record (case-insensitive stripped match)
    expected_name = matched_student.get("name", "").strip().lower()
    actual_name = name.strip().lower()
    if actual_name != expected_name:
        return False, f"The entered name '{name}' does not match the enrolled student record for Roll Number {roll_num}.", None

    # Check 5 & 6: Validate email format
    valid_email, email_err = validate_email(email)
    if not valid_email:
        return False, email_err, None
    clean_email = email.strip().lower()

    # Check 7: Password strength and confirm password
    valid_pwd, pwd_err = validate_password_strength(password)
    if not valid_pwd:
        return False, pwd_err, None

    if confirm_password is not None and password != confirm_password:
        return False, "Passwords do not match.", None

    # Check 4 & 5: Duplicate check against users.json
    users = load_users()
    for u in users:
        if u.get("role") == "student" and u.get("roll") == roll_num:
            return False, f"An account has already been registered for Roll Number {roll_num}. Please log in or reset your password.", None
        if u.get("email", "").lower() == clean_email:
            return False, "This email address is already registered.", None

    # Check 8: Hash password with individual salt
    salt_hex, hash_hex = hash_password(password)
    user_id = "stu_" + secrets.token_hex(8)

    # Check 9 & 10: Automatically assign role 'student' (never user-selectable)
    new_user = {
        "user_id": user_id,
        "role": "student",
        "name": matched_student["name"],  # use verified official name casing
        "roll": roll_num,
        "email": clean_email,
        "salt": salt_hex,
        "password_hash": hash_hex,
        "failed_attempts": 0,
        "locked_until": 0,
        "created_at": time.time()
    }
    users.append(new_user)
    save_users(users)

    token, session_data = create_session(new_user)
    return True, "Student registration successful.", {
        "token": token,
        "user": {
            "user_id": user_id,
            "role": "student",
            "name": matched_student["name"],
            "roll": roll_num,
            "email": clean_email,
            "section": matched_student.get("section"),
            "subject": matched_student.get("subject")
        }
    }


# -------------------- ADMIN CONTROLLED SETUP --------------------

def register_admin(name, email, username, password):
    """
    Creates/updates an administrator account through a secure, controlled setup process.
    Public student signup can NEVER call or access this function.
    """
    name = str(name).strip() if name else "System Administrator"
    username = str(username).strip().lower() if username else ""
    email = str(email).strip().lower() if email else ""

    if not username:
        return False, "Admin username is required.", None

    valid_email, email_err = validate_email(email)
    if not valid_email:
        return False, email_err, None

    valid_pwd, pwd_err = validate_password_strength(password)
    if not valid_pwd:
        return False, pwd_err, None

    users = load_users()
    existing_admin = None
    for u in users:
        if u.get("role") == "admin" and (u.get("username", "").lower() == username or u.get("email", "").lower() == email):
            existing_admin = u
            break

    salt_hex, hash_hex = hash_password(password)

    if existing_admin:
        existing_admin["name"] = name
        existing_admin["email"] = email
        existing_admin["username"] = username
        existing_admin["salt"] = salt_hex
        existing_admin["password_hash"] = hash_hex
        existing_admin["failed_attempts"] = 0
        existing_admin["locked_until"] = 0
        save_users(users)
        destroy_all_sessions_for_user(existing_admin["user_id"])
        token, session_data = create_session(existing_admin)
        return True, "Admin account updated successfully.", {"token": token, "user": existing_admin}
    else:
        user_id = "adm_" + secrets.token_hex(8)
        new_admin = {
            "user_id": user_id,
            "role": "admin",
            "name": name,
            "email": email,
            "username": username,
            "salt": salt_hex,
            "password_hash": hash_hex,
            "failed_attempts": 0,
            "locked_until": 0,
            "created_at": time.time()
        }
        users.append(new_admin)
        save_users(users)
        token, session_data = create_session(new_admin)
        return True, "Admin account provisioned successfully.", {"token": token, "user": new_admin}


# -------------------- LOGIN SYSTEM --------------------

def login_user(identifier, password, role):
    """
    Authenticates student or admin.
    Rules:
      - Student login: uses registered email and password.
      - Admin login: uses username and password.
      - Account lockout: after 5 failed attempts, locked for 5 minutes.
      - Generic error messages ("Invalid credentials").
    """
    if not identifier or not password or not role:
        return False, "Missing credentials.", None

    role = str(role).strip().lower()
    clean_id = str(identifier).strip()
    users = load_users()
    matched_user = None

    if role == "student":
        # Students MUST log in using their registered Email Address
        clean_email = clean_id.lower()
        for u in users:
            if u.get("role") == "student" and u.get("email", "").lower() == clean_email:
                matched_user = u
                break
        
        # If user inadvertently typed their roll number instead of email, provide clear guidance
        if not matched_user:
            try:
                roll_val = int(clean_id)
                for u in users:
                    if u.get("role") == "student" and u.get("roll") == roll_val:
                        return False, "Please log in using your registered Email Address (not Roll Number).", None
            except ValueError:
                pass
    elif role == "admin":
        # Admins log in using their username
        clean_user = clean_id.lower()
        for u in users:
            if u.get("role") == "admin" and (u.get("username", "").lower() == clean_user or u.get("email", "").lower() == clean_user):
                matched_user = u
                break
    else:
        return False, "Invalid role specified.", None

    if not matched_user:
        return False, "Invalid credentials.", None

    now = time.time()

    # Check lockout status
    locked_until = matched_user.get("locked_until", 0)
    if now < locked_until:
        remaining_secs = int(locked_until - now)
        remaining_mins = max(1, (remaining_secs + 59) // 60)
        return False, f"Account is temporarily locked due to too many failed attempts. Try again in {remaining_mins} minute{'s' if remaining_mins != 1 else ''}.", None

    # Verify password hash
    is_valid = verify_password(password, matched_user["salt"], matched_user["password_hash"])

    if not is_valid:
        # Increment failed attempts
        failed = matched_user.get("failed_attempts", 0) + 1
        matched_user["failed_attempts"] = failed
        cfg = load_config()
        max_attempts = cfg.get("max_failed_attempts", 5)
        lockout_minutes = cfg.get("lockout_duration_minutes", 5)

        if failed >= max_attempts:
            matched_user["locked_until"] = now + (lockout_minutes * 60)
            save_users(users)
            return False, f"Account is temporarily locked due to too many failed attempts. Try again in {lockout_minutes} minutes.", None
        else:
            save_users(users)
            rem = max_attempts - failed
            return False, f"Invalid credentials. ({rem} attempt{'s' if rem != 1 else ''} remaining before temporary lock)", None

    # Reset failure counters upon successful authentication
    matched_user["failed_attempts"] = 0
    matched_user["locked_until"] = 0
    save_users(users)

    # Issue secure session token
    token, session_data = create_session(matched_user)

    user_profile = {
        "user_id": matched_user["user_id"],
        "role": matched_user["role"],
        "name": matched_user["name"],
        "email": matched_user["email"],
        "username": matched_user.get("username"),
        "roll": matched_user.get("roll")
    }

    # Enrich student profile with exam details
    if matched_user["role"] == "student" and matched_user.get("roll"):
        for s in backend.students:
            if s["roll"] == matched_user["roll"]:
                user_profile["section"] = s.get("section")
                user_profile["subject"] = s.get("subject")
                user_profile["special_requirement"] = s.get("special_requirement")
                break

    return True, "Login successful.", {
        "token": token,
        "user": user_profile
    }


# -------------------- REAL OTP PASSWORD RESET WORKFLOW --------------------

def is_smtp_configured(cfg):
    """
    Checks if real SMTP credentials are provided in config.json.
    Returns (is_configured: bool, reason_or_help: str).
    """
    smtp_cfg = cfg.get("smtp", {})
    host = smtp_cfg.get("host", "").strip()
    port = smtp_cfg.get("port", 587)
    username = smtp_cfg.get("username", "").strip()
    password = smtp_cfg.get("password", "").strip()

    if not host or host in ["localhost", "smtp.example.com", "example.com"]:
        return False, (
            "Email service is not configured. "
            "Please configure your SMTP settings in 'config.json' (set host, port, username, and password) "
            "to send real password reset OTP emails."
        )

    if not username or "example.com" in username or not password or "your-app-password" in password:
        return False, (
            "Email service is not configured. "
            "Please set your real email address in 'smtp.username' and your email app password in 'smtp.password' "
            "inside 'config.json'."
        )

    return True, ""

def send_password_reset_otp(email):
    """
    Generates a secure 6-digit numeric OTP, sends it via real SMTP email service,
    and stores the SHA-256 hash in otps.json with a 10-minute expiry.
    If email configuration is missing, clearly explains what needs to be configured.
    """
    clean_email = str(email).strip().lower() if email else ""
    if not clean_email:
        return False, "Please enter your registered email address."

    users = load_users()
    matched_student = None
    for u in users:
        if u.get("role") == "student" and u.get("email", "").lower() == clean_email:
            matched_student = u
            break

    if not matched_student:
        return False, "No registered student account was found with this email address. Please check your email or sign up."

    cfg = load_config()
    smtp_ok, help_msg = is_smtp_configured(cfg)
    if not smtp_ok:
        return False, help_msg

    # Generate cryptographically secure 6-digit numeric OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expiry_minutes = cfg.get("otp_expiry_minutes", 10)
    expires_at = time.time() + (expiry_minutes * 60)

    # Attempt sending through real SMTP service
    smtp_cfg = cfg.get("smtp", {})
    host = smtp_cfg.get("host", "")
    port = int(smtp_cfg.get("port", 587))
    user = smtp_cfg.get("username", "")
    password = smtp_cfg.get("password", "")
    from_email = smtp_cfg.get("from_email", user) or user
    use_tls = smtp_cfg.get("use_tls", True)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Password Reset OTP - Examination Seating System"
        msg["From"] = from_email
        msg["To"] = clean_email

        html_body = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0d1117; color: #ffffff; padding: 28px; border-radius: 12px; max-width: 520px;">
          <h2 style="color: #60a5fa; margin-top: 0;">Examination Seating Arrangement System</h2>
          <p>Hello <strong>{matched_student.get('name')}</strong>,</p>
          <p>You requested to reset your password. Use the following 6-digit verification code (OTP):</p>
          <div style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; border-radius: 10px; padding: 18px; font-size: 34px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #93c5fd; margin: 22px 0;">
            {otp_code}
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This code will expire in {expiry_minutes} minutes. If you did not make this request, you can safely ignore this email.</p>
        </div>
        """
        plain_text = f"Your Password Reset OTP is: {otp_code}. This code expires in {expiry_minutes} minutes."

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if use_tls:
            server = smtplib.SMTP(host, port, timeout=12)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(host, port, timeout=12)

        if user and password:
            server.login(user, password)
        server.sendmail(from_email, [clean_email], msg.as_string())
        server.quit()

        print(f"[AUTH SMTP] Successfully dispatched password reset OTP to {clean_email}")
    except Exception as e:
        print(f"[AUTH SMTP ERROR] Failed to send email via SMTP: {e}")
        return False, f"Failed to send email via SMTP ({str(e)}). Please verify your SMTP settings in 'config.json'."

    # Store OTP record in otps.json
    otps = load_otps()
    otps[clean_email] = {
        "otp_hash": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "max_attempts": cfg.get("max_otp_attempts", 3),
        "verified": False,
        "created_at": time.time()
    }
    save_otps(otps)

    return True, f"A 6-digit OTP has been sent to {clean_email}. Please check your inbox."

def verify_password_reset_otp(email, entered_otp):
    """
    Verifies the 6-digit OTP entered by the student.
    Enforces expiration and maximum failed attempts.
    """
    clean_email = str(email).strip().lower() if email else ""
    entered_otp = str(entered_otp).strip() if entered_otp else ""

    if not clean_email or not entered_otp:
        return False, "Email and 6-digit OTP are required."

    otps = load_otps()
    record = otps.get(clean_email)
    if not record:
        return False, "No active OTP request found for this email. Please request a new OTP."

    now = time.time()
    if now > record.get("expires_at", 0):
        del otps[clean_email]
        save_otps(otps)
        return False, "This OTP has expired (10-minute limit). Please request a new OTP."

    attempts = record.get("attempts", 0)
    max_attempts = record.get("max_attempts", 3)

    if attempts >= max_attempts:
        del otps[clean_email]
        save_otps(otps)
        return False, "Maximum verification attempts exceeded for this OTP. Please request a new OTP."

    entered_hash = hashlib.sha256(entered_otp.encode("utf-8")).hexdigest()
    if not secrets.compare_digest(entered_hash, record.get("otp_hash", "")):
        attempts += 1
        record["attempts"] = attempts
        save_otps(otps)
        rem = max_attempts - attempts
        if rem <= 0:
            del otps[clean_email]
            save_otps(otps)
            return False, "Invalid OTP. Maximum attempts exceeded. Please request a new OTP."
        return False, f"Invalid OTP. {rem} attempt{'s' if rem != 1 else ''} remaining."

    # Mark OTP as successfully verified
    record["verified"] = True
    save_otps(otps)
    return True, "OTP verified successfully. You may now set your new password."

def reset_password_with_otp(email, entered_otp, new_password, confirm_password=None):
    """
    Resets the student password upon presenting a verified, unexpired OTP.
    Hashes the new password and invalidates all active sessions for the user.
    """
    clean_email = str(email).strip().lower() if email else ""
    entered_otp = str(entered_otp).strip() if entered_otp else ""

    if not clean_email or not entered_otp or not new_password:
        return False, "Email, OTP, and new password are required."

    if confirm_password is not None and new_password != confirm_password:
        return False, "Passwords do not match."

    valid_pwd, pwd_err = validate_password_strength(new_password)
    if not valid_pwd:
        return False, pwd_err

    otps = load_otps()
    record = otps.get(clean_email)
    if not record:
        return False, "No active OTP session found. Please request a new OTP."

    if time.time() > record.get("expires_at", 0):
        del otps[clean_email]
        save_otps(otps)
        return False, "This OTP session has expired. Please request a new OTP."

    if not record.get("verified"):
        return False, "Please verify your OTP code before submitting a new password."

    entered_hash = hashlib.sha256(entered_otp.encode("utf-8")).hexdigest()
    if not secrets.compare_digest(entered_hash, record.get("otp_hash", "")):
        return False, "Invalid OTP for password reset."

    users = load_users()
    target_user = None
    for u in users:
        if u.get("role") == "student" and u.get("email", "").lower() == clean_email:
            target_user = u
            break

    if not target_user:
        return False, "Student account not found."

    # Update password with new individual salt
    salt_hex, hash_hex = hash_password(new_password)
    target_user["salt"] = salt_hex
    target_user["password_hash"] = hash_hex
    target_user["failed_attempts"] = 0
    target_user["locked_until"] = 0
    save_users(users)

    # Invalidate OTP record
    del otps[clean_email]
    save_otps(otps)

    # Invalidate all active sessions for this user
    destroy_all_sessions_for_user(target_user["user_id"])

    return True, "Your password has been reset successfully! Please log in with your new password."


# -------------------- REQUEST AUTHENTICATION MIDDLEWARE --------------------

def extract_token_from_header(auth_header):
    if not auth_header:
        return None
    parts = auth_header.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None

def authenticate_request(headers):
    """
    Extracts Bearer token and returns (session_data, error_code, error_msg).
    Returns (session_data, None, None) on success.
    """
    auth_header = headers.get("Authorization", "")
    token = extract_token_from_header(auth_header)
    if not token:
        return None, 401, "Missing Authorization Bearer token. Please log in."

    session_data = get_session(token)
    if not session_data:
        return None, 401, "Invalid or expired session. Please log in again."

    return session_data, None, None

def require_role(headers, allowed_roles):
    """
    Enforces RBAC.
    Returns (session_data, error_code, error_msg).
    """
    session_data, err_code, err_msg = authenticate_request(headers)
    if err_code:
        return None, err_code, err_msg

    user_role = session_data.get("role")
    if user_role not in allowed_roles:
        return None, 403, f"Access Forbidden: Requires role {' or '.join(allowed_roles)} (You are '{user_role}')."

    return session_data, None, None
