// ==========================================================================
//   EXAMINATION SEATING ARRANGEMENT SYSTEM - REACT SINGLE PAGE APP (app.jsx)
//   Complete Role-Based Authentication, 3D Hall, Admin & Student Portals
// ==========================================================================

const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// --- CONFIG & HOST AUTO-DETECTION ---
const API_BASE = (typeof window !== 'undefined' && window.location.protocol === 'file:') ? 'http://localhost:5000' : '';

// --- AUTH CONTEXT ---
const AuthContext = createContext(null);

// --- BASE AUTHENTICATED FETCH ---
let onGlobalUnauthorized = null;

async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('exam_auth_token');
  const headers = Object.assign({}, options.headers || {});
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${url}`, Object.assign({}, options, { headers }));
  
  if (response.status === 401) {
    if (onGlobalUnauthorized) {
      onGlobalUnauthorized();
    }
  }
  
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

// --- AUTH API SERVICE (authApi.js) ---
const authApi = {
  async signupStudent(payload) {
    return authFetch('/api/auth/signup/student', { method: 'POST', body: payload });
  },
  async login(identifier, password, role) {
    return authFetch('/api/auth/login', {
      method: 'POST',
      body: { identifier, password, role }
    });
  },
  async logout() {
    return authFetch('/api/auth/logout', { method: 'POST' });
  },
  async getMe() {
    return authFetch('/api/auth/me');
  },
  async sendOtp(email) {
    return authFetch('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      body: { email }
    });
  },
  async verifyOtp(email, otp) {
    return authFetch('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: { email, otp }
    });
  },
  async resetPasswordWithOtp(email, otp, newPassword, confirmPassword) {
    return authFetch('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: { email, otp, new_password: newPassword, confirm_password: confirmPassword }
    });
  },
  async forgotPassword(email, role) {
    return authFetch('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      body: { email, role }
    });
  },
  async resetPassword(token, role, newPassword) {
    return authFetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, role, new_password: newPassword }
    });
  }
};

// --- STUDENT API SERVICE ---
const studentApi = {
  async getMySeat() {
    return authFetch('/api/my_seat');
  }
};

// --- ADMIN SEATING API SERVICE (seatingApi.js) ---
const adminApi = {
  async getState() {
    return authFetch('/api/state');
  },
  async getStudents() {
    return authFetch('/api/students');
  },
  async getRooms() {
    return authFetch('/api/rooms');
  },
  async validateStudents() {
    return authFetch('/api/validate-students');
  },
  async checkCapacity() {
    return authFetch('/api/check-capacity');
  },
  async groupStudents() {
    return authFetch('/api/group-students');
  },
  async arrangeSlots() {
    return authFetch('/api/arrange-slots');
  },
  async assignSeats() {
    return authFetch('/api/assign-seats', { method: 'POST' });
  },
  async validateSeating() {
    return authFetch('/api/validate-seating');
  },
  async getRoomSummary() {
    return authFetch('/api/room-summary');
  },
  async generateSeating() {
    return authFetch('/api/generate', { method: 'POST' });
  },
  async resetSeating() {
    return authFetch('/api/reset', { method: 'POST' });
  },
  async addStudent(studentData) {
    return authFetch('/api/student', { method: 'POST', body: studentData });
  },
  async removeStudent(roll) {
    return authFetch(`/api/student/${roll}`, { method: 'DELETE' });
  },
  async searchStudents(q) {
    return authFetch(`/api/search?q=${encodeURIComponent(q)}`);
  }
};

// --- INLINE SVG ICONS ---
const Icons = {
  StudentCap: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
  ),
  ShieldAdmin: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
      <line x1="2" y1="2" x2="22" y2="22"></line>
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  XCircle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  Printer: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  ),
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1"></rect>
      <rect x="14" y="3" width="7" height="5" rx="1"></rect>
      <rect x="14" y="12" width="7" height="9" rx="1"></rect>
      <rect x="3" y="16" width="7" height="5" rx="1"></rect>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Door: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"></path>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
      <circle cx="15" cy="12" r="1"></circle>
    </svg>
  ),
  Layers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
  ),
  Shuffle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8"></polyline>
      <line x1="4" y1="20" x2="21" y2="3"></line>
      <polyline points="21 16 21 21 16 21"></polyline>
      <line x1="15" y1="15" x2="21" y2="21"></line>
      <line x1="4" y1="4" x2="9" y2="9"></line>
    </svg>
  ),
  Cube: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  PieChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

// --- REUSABLE UI: FLOATING INPUT ---
function FloatingInput({ id, label, type = 'text', value, onChange, required = false, placeholder = ' ', autoFocus = false, error = '' }) {
  return (
    <div className="floating-group">
      <input
        id={id}
        type={type}
        className="floating-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoFocus={autoFocus}
        style={error ? { borderColor: 'var(--accent-rose)' } : {}}
      />
      <label htmlFor={id} className="floating-label">{label}</label>
      {error && <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}

// --- REUSABLE UI: PASSWORD INPUT WITH TOGGLE ---
function PasswordInput({ id, label, value, onChange, required = false, placeholder = ' ' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="floating-group password-wrapper">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="floating-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      <label htmlFor={id} className="floating-label">{label}</label>
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow(!show)}
        tabIndex="-1"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <Icons.EyeOff /> : <Icons.Eye />}
      </button>
    </div>
  );
}

// --- REUSABLE UI: PASSWORD STRENGTH METER ---
function StrengthMeter({ password }) {
  const rules = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
  }, [password]);

  const score = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (rules.length) s++;
    if (rules.upper && rules.lower) s++;
    if (rules.digit) s++;
    if (rules.special) s++;
    return s;
  }, [rules, password]);

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const barClass = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'];

  if (!password) return null;

  return (
    <div className="strength-meter-container">
      <div className="strength-bars-row">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className={`strength-bar ${score >= idx ? barClass[score] : ''}`}
          />
        ))}
      </div>
      <div className="strength-status-text">
        <span>Password Strength:</span>
        <span style={{ color: score === 4 ? 'var(--accent-sage)' : score >= 2 ? 'var(--accent-teal)' : 'var(--accent-rose)' }}>
          {labels[score] || 'Too Short'}
        </span>
      </div>
      <div className="strength-rules-list">
        <div className={`strength-rule-item ${rules.length ? 'met' : ''}`}>
          {rules.length ? <Icons.Check /> : <Icons.XCircle />} Min 8 characters
        </div>
        <div className={`strength-rule-item ${rules.upper ? 'met' : ''}`}>
          {rules.upper ? <Icons.Check /> : <Icons.XCircle />} One uppercase (A-Z)
        </div>
        <div className={`strength-rule-item ${rules.lower ? 'met' : ''}`}>
          {rules.lower ? <Icons.Check /> : <Icons.XCircle />} One lowercase (a-z)
        </div>
        <div className={`strength-rule-item ${rules.digit ? 'met' : ''}`}>
          {rules.digit ? <Icons.Check /> : <Icons.XCircle />} One digit (0-9)
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE UI: 3D GLASS CARD ---
function GlassCard({ children, className = '', roleTheme = '' }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  return (
    <div
      ref={cardRef}
      className={`auth-card ${roleTheme ? `role-${roleTheme}` : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// --- HELPER: SECTION STYLING ---
const getSectionClass = (section) => {
  const s = String(section).toUpperCase();
  if (s === 'A') return 'tag-section-a';
  if (s === 'B') return 'tag-section-b';
  if (s === 'C') return 'tag-section-c';
  if (s === 'D') return 'tag-section-d';
  return 'tag-subject';
};


// ==========================================================================
//   PAGE 1: ROLE LANDING PAGE (/)
// ==========================================================================
function LandingPage({ onNavigate }) {
  return (
    <div className="auth-viewport">
      <div className="auth-blob auth-blob-teal"></div>
      <div className="auth-blob auth-blob-indigo"></div>
      <div className="auth-blob auth-blob-sage"></div>

      <div className="landing-container">
        <div className="landing-header">
          <div className="landing-badge">
            <Icons.Cube /> Examination Seating Arrangement System
          </div>
          <h1 className="landing-title">Select Your Portal</h1>
          <p className="landing-subtitle">
            Secure, constraint-verified seating allocations with real-time 3D hall rendering.
          </p>
        </div>

        <div className="landing-roles-grid">
          
          {/* STUDENT ROLE CARD */}
          <div className="role-choice-card student-card" onClick={() => onNavigate('/student/login')}>
            <div>
              <div className="role-icon-box">
                <Icons.StudentCap />
              </div>
              <h2 className="role-card-title">I'm a Student</h2>
              <p className="role-card-desc">
                Sign in to check your examination room, view your exact desk in the 3D hall, and download your official seat pass slip.
              </p>
            </div>
            <div className="role-card-footer">
              <span className="role-action-text">
                Student Sign In <Icons.ArrowRight />
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll / Email Access</span>
            </div>
          </div>

          {/* ADMIN ROLE CARD */}
          <div className="role-choice-card admin-card" onClick={() => onNavigate('/admin/login')}>
            <div>
              <div className="role-icon-box">
                <Icons.ShieldAdmin />
              </div>
              <h2 className="role-card-title">I'm an Admin</h2>
              <p className="role-card-desc">
                Access the full examination coordinator dashboard: manage candidates, verify room capacities, and execute backtracking solvers.
              </p>
            </div>
            <div className="role-card-footer">
              <span className="role-action-text">
                Administrator Sign In <Icons.ArrowRight />
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authorized Staff Only</span>
            </div>
          </div>

        </div>

        <div style={{ marginTop: '36px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Powered by Python Backtracking Solver &bull; 3D Glassmorphism Interface
        </div>
      </div>
    </div>
  );
}


// ==========================================================================
//   PAGE 2: STUDENT LOGIN (/student/login)
// ==========================================================================
//   PAGE 2: STUDENT LOGIN (/student/login)
// ==========================================================================
function StudentLoginPage({ onNavigate, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please enter your registered email and password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const res = await authApi.login(identifier, password, 'student');
    setLoading(false);

    if (res.ok && res.data.success) {
      onLoginSuccess(res.data.token, res.data.user);
    } else {
      setErrorMsg(res.data.message || 'Invalid credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-blob auth-blob-teal"></div>
      <div className="auth-blob auth-blob-indigo"></div>

      <GlassCard roleTheme="student" className={shake ? 'shake-anim' : ''}>
        <div className="auth-header">
          <div className="auth-role-pill student">
            <Icons.StudentCap /> Student Portal
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in with your registered email to view your exam seat</p>
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <Icons.XCircle />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FloatingInput
            id="student-identifier"
            label="Registered Email Address"
            type="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />

          <PasswordInput
            id="student-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <a
              href="#forgot"
              onClick={(e) => { e.preventDefault(); onNavigate('/forgot-password?role=student'); }}
              style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}
            >
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn btn-gradient-primary btn-block" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Student'}
          </button>
        </form>

        <div className="auth-footer-links">
          <span>
            Don't have an account yet?{' '}
            <a href="#signup" onClick={(e) => { e.preventDefault(); onNavigate('/student/signup'); }}>
              Sign Up
            </a>
          </span>
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ color: 'var(--text-muted)' }}>
            &larr; Return to Portal Selection
          </a>
        </div>
      </GlassCard>
    </div>
  );
}


// ==========================================================================
//   PAGE 3: STUDENT SIGNUP (/student/signup)
// ==========================================================================
function StudentSignupPage({ onNavigate, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !roll || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const res = await authApi.signupStudent({
      name,
      roll: Number(roll),
      email,
      password,
      confirm_password: confirmPassword
    });
    setLoading(false);

    if (res.ok && res.data.success) {
      onLoginSuccess(res.data.token, res.data.user);
    } else {
      setErrorMsg(res.data.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-blob auth-blob-teal"></div>
      <div className="auth-blob auth-blob-indigo"></div>

      <GlassCard roleTheme="student" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-role-pill student">
            <Icons.StudentCap /> Candidate Registration
          </div>
          <h2 className="auth-title">Create Student Account</h2>
          <p className="auth-subtitle">Link your enrolled examination roll number</p>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '18px', background: 'rgba(59, 130, 246, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.22)', lineHeight: 1.4 }}>
          ℹ️ <strong>Enrollment Rule:</strong> Only enrolled students in the examination candidate database can register. Your Name and Roll Number must match the official record.
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <Icons.XCircle />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FloatingInput
            id="student-name"
            label="Full Name (matches exam record)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FloatingInput
              id="student-roll"
              label="Roll Number (e.g. 101)"
              type="number"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              required
            />
            <FloatingInput
              id="student-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <PasswordInput
            id="student-new-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <StrengthMeter password={password} />

          <PasswordInput
            id="student-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-gradient-primary btn-block" disabled={loading}>
            {loading ? 'Verifying Roll & Creating Account...' : 'Complete Student Registration'}
          </button>
        </form>

        <div className="auth-footer-links">
          <span>
            Already registered?{' '}
            <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('/student/login'); }}>
              Sign In
            </a>
          </span>
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ color: 'var(--text-muted)' }}>
            &larr; Return to Portal Selection
          </a>
        </div>
      </GlassCard>
    </div>
  );
}


// ==========================================================================
//   PAGE 4: ADMIN LOGIN (/admin/login)
// ==========================================================================
function AdminLoginPage({ onNavigate, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please enter your username (or email) and password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const res = await authApi.login(identifier, password, 'admin');
    setLoading(false);

    if (res.ok && res.data.success) {
      onLoginSuccess(res.data.token, res.data.user);
    } else {
      setErrorMsg(res.data.message || 'Invalid credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-blob auth-blob-indigo"></div>

      <GlassCard roleTheme="admin" className={shake ? 'shake-anim' : ''}>
        <div className="auth-header">
          <div className="auth-role-pill admin">
            <Icons.ShieldAdmin /> Administrator Portal
          </div>
          <h2 className="auth-title">Coordinator Sign In</h2>
          <p className="auth-subtitle">Access examination hall management &amp; solvers</p>
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <Icons.XCircle />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FloatingInput
            id="admin-identifier"
            label="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />

          <PasswordInput
            id="admin-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <a
              href="#forgot"
              onClick={(e) => { e.preventDefault(); onNavigate('/forgot-password?role=admin'); }}
              style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', textDecoration: 'none' }}
            >
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn btn-gradient-admin btn-block" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="auth-footer-links">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center', marginBottom: '8px' }}>
            🔒 Administrator accounts are provisioned via secure internal setup (<code>seed.py</code>). Public self-registration is disabled.
          </div>
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ color: 'var(--text-muted)' }}>
            &larr; Return to Portal Selection
          </a>
        </div>
      </GlassCard>
    </div>
  );
}


// ==========================================================================
//   PAGE 5: ADMIN SIGNUP (/admin/signup)
// ==========================================================================
function AdminSignupPage({ onNavigate, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !username || !inviteCode || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields including the Admin Invite Code.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const res = await authApi.signupAdmin({
      name,
      email,
      username,
      invite_code: inviteCode,
      password
    });
    setLoading(false);

    if (res.ok && res.data.success) {
      onLoginSuccess(res.data.token, res.data.user);
    } else {
      setErrorMsg(res.data.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-blob auth-blob-indigo"></div>

      <GlassCard roleTheme="admin" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-role-pill admin">
            <Icons.ShieldAdmin /> Staff Authorization
          </div>
          <h2 className="auth-title">Register Administrator</h2>
          <p className="auth-subtitle">Authorized coordinator setup with invite passkey</p>
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <Icons.XCircle />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FloatingInput
            id="admin-name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FloatingInput
              id="admin-username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <FloatingInput
              id="admin-email"
              label="Staff Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <FloatingInput
            id="admin-invite"
            label="Admin Invite Code (from config.json)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            placeholder="e.g. EXAM_ADMIN_2026"
          />

          <PasswordInput
            id="admin-new-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <StrengthMeter password={password} />

          <PasswordInput
            id="admin-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-indigo btn-block" disabled={loading}>
            {loading ? 'Validating Invite Code...' : 'Create Administrator Account'}
          </button>
        </form>

        <div className="auth-footer-links">
          <span>
            Already have an admin account?{' '}
            <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('/admin/login'); }}>
              Sign In
            </a>
          </span>
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ color: 'var(--text-muted)' }}>
            &larr; Return to Portal Selection
          </a>
        </div>
      </GlassCard>
    </div>
  );
}


// ==========================================================================
//   PAGE 6: FORGOT & RESET PASSWORD VIA REAL OTP (/forgot-password)
// ==========================================================================
function ForgotPasswordPage({ onNavigate, role = 'student' }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSmtpConfigError, setIsSmtpConfigError] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);

  // 10-minute countdown for active OTP
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // 45-second cooldown for Resend OTP button
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 1: Send OTP to Student's Registered Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setIsSmtpConfigError(false);

    const res = await authApi.sendOtp(email);
    setLoading(false);

    if (res.ok && res.data.success) {
      setStep(2);
      setTimer(600);
      setResendCooldown(45);
    } else {
      const msg = res.data.message || 'Failed to send OTP.';
      setErrorMsg(msg);
      if (msg.toLowerCase().includes('email service is not configured') || msg.toLowerCase().includes('smtp') || msg.toLowerCase().includes('config.json')) {
        setIsSmtpConfigError(true);
      }
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg('');
    const res = await authApi.sendOtp(email);
    setLoading(false);
    if (res.ok && res.data.success) {
      setTimer(600);
      setResendCooldown(45);
    } else {
      setErrorMsg(res.data.message || 'Failed to resend OTP.');
    }
  };

  // Step 2: Verify Entered 6-Digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const res = await authApi.verifyOtp(email, cleanOtp);
    setLoading(false);

    if (res.ok && res.data.success) {
      setStep(3);
    } else {
      setErrorMsg(res.data.message || 'Invalid or expired OTP.');
    }
  };

  // Step 3: Set and Hash New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const res = await authApi.resetPasswordWithOtp(email, otp.trim(), newPassword, confirmPassword);
    setLoading(false);

    if (res.ok && res.data.success) {
      setStep(4);
    } else {
      setErrorMsg(res.data.message || 'Failed to reset password.');
    }
  };

  const isStudent = role === 'student';

  return (
    <div className="auth-viewport">
      <div className={`auth-blob ${isStudent ? 'auth-blob-teal' : 'auth-blob-indigo'}`}></div>

      <GlassCard roleTheme={isStudent ? 'student' : 'admin'} style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className={`auth-role-pill ${isStudent ? 'student' : 'admin'}`}>
            <Icons.Lock /> Password Recovery
          </div>
          <h2 className="auth-title">Reset Your Password</h2>
          <p className="auth-subtitle">Real-time OTP verification via email</p>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="otp-steps-indicator">
            <div className={`otp-step-dot ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}></div>
            <div className={`otp-step-dot ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}></div>
            <div className={`otp-step-dot ${step === 3 ? 'active' : ''}`}></div>
          </div>
        )}

        {errorMsg && (
          <div className="form-error-alert" style={{ flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Icons.XCircle />
              <span>{errorMsg}</span>
            </div>

            {isSmtpConfigError && (
              <div className="smtp-notice-box" style={{ marginTop: '8px', width: '100%' }}>
                <h4><Icons.AlertTriangle /> Email Service Configuration Required</h4>
                <p>Real email dispatch requires SMTP credentials in <code>config.json</code>:</p>
                <div style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                  <ol style={{ paddingLeft: '18px', lineHeight: 1.6 }}>
                    <li>Open <code>config.json</code> in the server root.</li>
                    <li>Set <code>smtp.host</code> (e.g. <code>smtp.gmail.com</code>).</li>
                    <li>Set <code>smtp.port</code> (e.g. <code>587</code>).</li>
                    <li>Set <code>smtp.username</code> to your sender email.</li>
                    <li>Set <code>smtp.password</code> to your App Password.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Enter Registered Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
              Enter the email address registered with your student account. A 6-digit One-Time Password (OTP) will be sent to your inbox.
            </p>

            <FloatingInput
              id="reset-email"
              label="Registered Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <button type="submit" className="btn btn-gradient-primary btn-block" disabled={loading}>
              {loading ? 'Dispatching OTP via Email...' : 'Send 6-Digit OTP'}
            </button>

            <div className="auth-footer-links">
              <a href="#back" onClick={(e) => { e.preventDefault(); onNavigate(isStudent ? '/student/login' : '/admin/login'); }}>
                &larr; Back to Sign In
              </a>
            </div>
          </form>
        )}

        {/* STEP 2: Enter & Verify 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Enter the 6-digit code sent to <strong style={{ color: 'var(--text-highlight)' }}>{email}</strong>:
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: timer < 120 ? '#ef4444' : 'var(--accent-blue)', fontWeight: 600 }}>
                <span>⏱️ Code expires in: {formatTimer(timer)}</span>
              </div>
            </div>

            <FloatingInput
              id="reset-otp-input"
              label="6-Digit Verification Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 583921"
              required
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.25rem', fontWeight: 700 }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Attempt limit: 3 maximum</span>
              <button
                type="button"
                className="resend-otp-btn"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <button type="submit" className="btn btn-gradient-primary btn-block" disabled={loading || otp.trim().length !== 6}>
              {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
            </button>

            <div className="auth-footer-links">
              <a href="#change-email" onClick={(e) => { e.preventDefault(); setStep(1); setErrorMsg(''); }}>
                &larr; Change email address
              </a>
            </div>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              OTP successfully verified. Create your new password (minimum 8 characters with upper, lower, and digit):
            </p>

            <PasswordInput
              id="otp-new-password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />

            <StrengthMeter password={newPassword} />

            <PasswordInput
              id="otp-confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn btn-gradient-primary btn-block" disabled={loading}>
              {loading ? 'Saving New Password...' : 'Save Password & Return to Login'}
            </button>
          </form>
        )}

        {/* STEP 4: Success State */}
        {step === 4 && (
          <div>
            <div className="form-success-alert">
              <strong>🎉 Password Reset Successful!</strong>
              <br /><br />
              Your new password has been securely saved, and all prior active sessions have been invalidated. You can now log in with your updated credentials.
            </div>

            <button
              className="btn btn-gradient-primary btn-block"
              onClick={() => onNavigate(isStudent ? '/student/login' : '/admin/login')}
            >
              Proceed to Sign In
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ResetPasswordPage({ onNavigate, role = 'student' }) {
  return <ForgotPasswordPage onNavigate={onNavigate} role={role} />;
}


// ==========================================================================
//   PAGE 8: STUDENT MY-SEAT PORTAL (/student/my-seat)
//   Displays the student's assigned room and seat highlighted in 3D!
// ==========================================================================
function StudentMySeatPage({ user, onLogout }) {
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 3D Isometric View parameters
  const [pitch, setPitch] = useState(48);
  const [yaw, setYaw] = useState(-28);
  const [zoom, setZoom] = useState(1.05);
  const [is3DDragging, setIs3DDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const fetchSeat = async () => {
    setLoading(true);
    const res = await studentApi.getMySeat();
    setLoading(false);
    if (res.ok && res.data.success) {
      setSeatData(res.data);
    } else {
      setErrorMsg(res.data.error || 'Failed to load your seating details.');
    }
  };

  useEffect(() => {
    fetchSeat();
    const interval = setInterval(fetchSeat, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = (e) => {
    setIs3DDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!is3DDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setYaw(prev => prev + deltaX * 0.5);
    setPitch(prev => Math.min(80, Math.max(10, prev - deltaY * 0.5)));
  };

  const handleMouseUp = () => {
    setIs3DDragging(false);
  };

  const info = seatData ? seatData.data : null;
  const isAllocated = seatData ? seatData.allocated : false;

  return (
    <div className="main-wrapper" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      
      {/* STUDENT TOPBAR */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo-icon">
            <Icons.StudentCap />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Student Examination Portal</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-teal)' }}>Official Candidate Seat Pass</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="user-profile-bar">
            <div className="user-avatar-circle student">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="user-meta-name">{user.name}</div>
              <div className="user-meta-role">Roll #{user.roll} &bull; Candidate</div>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Sign Out">
            <Icons.LogOut /> Sign Out
          </button>
        </div>
      </header>

      {/* STUDENT PORTAL BODY */}
      <main className="content-body" style={{ maxWidth: '1100px' }}>
        {loading && !seatData ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }}></div>
            <div>Retrieving verified examination seat record...</div>
          </div>
        ) : errorMsg ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: 'var(--accent-rose)', fontSize: '1.1rem', marginBottom: '12px' }}>{errorMsg}</div>
            <button className="btn btn-secondary" onClick={fetchSeat}>Retry</button>
          </div>
        ) : (
          <div>
            
            {/* ADMIT PASS CARD */}
            <div className="admit-slip-card" style={{ maxWidth: '100%', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-highlight)' }}>
                    {info.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', marginTop: '2px' }}>
                    Candidate Roll: <strong>#{info.roll}</strong> &bull; Section {info.section}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                    <Icons.Printer /> Print Seat Pass
                  </button>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Official Admit Slip
                  </div>
                </div>
              </div>

              {isAllocated ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    
                    <div style={{ padding: '16px', background: 'rgba(95, 168, 160, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(95, 168, 160, 0.3)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Room</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
                        Room {info.room_no}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invigilator: {info.invigilator}</div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(212, 184, 150, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212, 184, 150, 0.3)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Desk</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-sand)' }}>
                        Seat #{info.seat_no}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Grid: Row {info.row}, Desk {info.col} {info.is_priority ? '(Front Priority)' : ''}
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                        {info.subject}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Examination Paper</div>
                    </div>

                  </div>

                  {info.special_requirement && (
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(201, 138, 138, 0.15)', border: '1px solid rgba(201, 138, 138, 0.35)', color: 'var(--accent-rose)', fontSize: '0.82rem', marginBottom: '16px' }}>
                      <strong>Special Accommodation:</strong> {info.special_requirement}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-sand)', marginBottom: '8px' }}>
                    Seating Plan In Progress
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                    {info.message || 'The examination coordinator has not finalized room allocations yet. Once published, your assigned room and 3D desk location will appear here automatically.'}
                  </p>
                </div>
              )}
            </div>

            {/* 3D ROOM SPOTLIGHT (IF ALLOCATED) */}
            {isAllocated && (
              <div className="room-3d-wrapper">
                <div className="room-3d-toolbar">
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)' }}>
                      <Icons.Cube /> 3D Room Spotlight &bull; Room {info.room_no}
                    </h3>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Your assigned desk (Seat #{info.seat_no}) is highlighted in glowing teal below
                    </p>
                  </div>

                  {/* 3D CONTROLS */}
                  <div className="room-controls-group">
                    <div className="slider-control">
                      <span>Pitch: {pitch}°</span>
                      <input type="range" min="15" max="75" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                    </div>
                    <div className="slider-control">
                      <span>Yaw: {yaw}°</span>
                      <input type="range" min="-180" max="180" value={yaw} onChange={(e) => setYaw(Number(e.target.value))} />
                    </div>
                    <div className="slider-control">
                      <span>Zoom: {zoom.toFixed(1)}x</span>
                      <input type="range" min="0.7" max="1.4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setPitch(48); setYaw(-28); setZoom(1.05); }}>
                      Reset Camera
                    </button>
                  </div>
                </div>

                {/* 3D VIEWPORT */}
                <div
                  className="viewport-3d"
                  onMouseDown={handleMouseDown}
                  title="Click and drag to rotate the examination room"
                >
                  <div
                    className="room-stage-3d"
                    style={{ transform: `rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${zoom})` }}
                  >
                    <div className="floor-3d"></div>

                    {/* INVIGILATOR BOARD */}
                    <div className="invigilator-stage-3d">
                      <div className="board-label">BLACKBOARD &bull; INVIGILATOR DESK</div>
                      <div className="invigilator-name">{info.invigilator} (Room {info.room_no})</div>
                    </div>

                    <div className="entrance-marker-3d">&larr; ENTRANCE</div>

                    {/* 3D DESKS */}
                    <div className="desks-grid-3d">
                      {Array.from({ length: 6 }).map((_, seatIdx) => {
                        const seatNumber = seatIdx + 1;
                        const isMySeat = seatNumber === info.seat_no;
                        const isPriority = [1, 2].includes(seatNumber);

                        return (
                          <div
                            key={seatNumber}
                            className={`desk-block-3d ${isPriority ? 'priority-seat' : ''} ${isMySeat ? 'my-seat-desk-3d' : ''}`}
                          >
                            <div className="desk-shadow"></div>
                            <div className="desk-side-left"></div>
                            <div className="desk-side-right"></div>
                            <div className="desk-front"></div>

                            <div className="desk-top">
                              {isMySeat && (
                                <div className="my-seat-pulse-tag">
                                  YOUR SEAT (#{seatNumber})
                                </div>
                              )}

                              <div className="desk-header">
                                <span className="seat-badge">Seat #{seatNumber}</span>
                                {isPriority && <span className="priority-tag">Priority</span>}
                              </div>

                              <div className="student-info">
                                <div className="student-name">
                                  {isMySeat ? info.name : `Seat ${seatNumber}`}
                                </div>
                                <div className="student-roll">
                                  {isMySeat ? `Roll: #${info.roll}` : 'Occupied'}
                                </div>
                              </div>

                              <div className="desk-tags">
                                {isMySeat ? (
                                  <>
                                    <span className={`tag ${getSectionClass(info.section)}`}>Sec {info.section}</span>
                                    <span className="tag tag-subject">{info.subject}</span>
                                  </>
                                ) : (
                                  <span className="tag tag-subject">Assigned Desk</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="room-3d-legend">
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'var(--accent-teal)' }}></div>
                    <span>Your Allocated Seat</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'rgba(212, 184, 150, 0.4)', border: '1px solid var(--accent-sand)' }}></div>
                    <span>Priority Seat (Seats 1, 2)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: '#242935', border: '1px solid var(--border-glass)' }}></div>
                    <span>Other Examination Desks</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}


// ==========================================================================
//   PAGE 9: ADMIN DASHBOARD (/admin/dashboard)
//   Full Examination Seating Coordinator System
// ==========================================================================
function AdminDashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appState, setAppState] = useState({
    students: [],
    rooms: [],
    seating_generated: false,
    total_students: 0,
    total_capacity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Stepper state
  const [stepStatus, setStepStatus] = useState({
    add: 'done',
    validate: 'pending',
    capacity: 'pending',
    group: 'pending',
    arrange: 'pending',
    assign: 'pending',
    plan: 'pending'
  });

  // 3D Isometric View state
  const [selectedRoom3D, setSelectedRoom3D] = useState(101);
  const [pitch, setPitch] = useState(45);
  const [yaw, setYaw] = useState(-30);
  const [zoom, setZoom] = useState(1.0);
  const [is3DDragging, setIs3DDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const addToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const loadState = async () => {
    const res = await adminApi.getState();
    if (res.ok && res.data.success) {
      setAppState(res.data.data);
      if (res.data.data.seating_generated) {
        setStepStatus({
          add: 'done',
          validate: 'done',
          capacity: 'done',
          group: 'done',
          arrange: 'done',
          assign: 'done',
          plan: 'done'
        });
      }
    }
  };

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await adminApi.searchStudents(globalSearchQuery);
      if (res.ok && res.data.results) {
        setSearchResults(res.data.results);
        setShowSearchDropdown(true);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  const handleGenerateAll = async () => {
    setLoading(true);
    const res = await adminApi.generateSeating();
    setLoading(false);
    if (res.ok && res.data.success) {
      addToast('success', res.data.message || 'Seating arrangement generated successfully!');
      setAppState(res.data.state);
      setStepStatus({
        add: 'done',
        validate: 'done',
        capacity: 'done',
        group: 'done',
        arrange: 'done',
        assign: 'done',
        plan: 'done'
      });
    } else {
      addToast('error', (res.data && res.data.message) || 'Seating generation failed constraints.');
      setStepStatus(prev => ({ ...prev, assign: 'error' }));
    }
  };

  const handleReset = async () => {
    setLoading(true);
    const res = await adminApi.resetSeating();
    setLoading(false);
    setShowResetConfirm(false);
    if (res.ok && res.data.success) {
      addToast('info', 'Seating plan has been reset.');
      setAppState(res.data.state);
      setStepStatus({
        add: 'done',
        validate: 'pending',
        capacity: 'pending',
        group: 'pending',
        arrange: 'pending',
        assign: 'pending',
        plan: 'pending'
      });
    }
  };

  const runWorkflowStep = async (stepKey) => {
    setLoading(true);
    try {
      if (stepKey === 'validate') {
        const res = await adminApi.validateStudents();
        if (res.ok && res.data.data.valid) {
          addToast('success', `Validation Passed: ${res.data.data.total_students} records verified.`);
          setStepStatus(prev => ({ ...prev, validate: 'done' }));
        } else {
          addToast('error', 'Validation failed: duplicate or incomplete records.');
          setStepStatus(prev => ({ ...prev, validate: 'error' }));
        }
      } else if (stepKey === 'capacity') {
        const res = await adminApi.checkCapacity();
        if (res.ok && res.data.data.sufficient) {
          addToast('success', `Capacity Verified: ${res.data.data.total_students} candidates $\\le$ ${res.data.data.total_capacity} seats.`);
          setStepStatus(prev => ({ ...prev, capacity: 'done' }));
        } else {
          addToast('error', 'Capacity check failed.');
          setStepStatus(prev => ({ ...prev, capacity: 'error' }));
        }
      } else if (stepKey === 'group') {
        const res = await adminApi.groupStudents();
        if (res.ok && res.data.data) {
          addToast('success', 'Grouping: candidates sorted and section frequencies calculated.');
          setStepStatus(prev => ({ ...prev, group: 'done' }));
          setActiveTab('grouping');
        }
      } else if (stepKey === 'arrange') {
        const res = await adminApi.arrangeSlots();
        if (res.ok && res.data.data) {
          addToast('success', `Slot Schedule Prepared: ${res.data.data.total_slots} round-robin slots.`);
          setStepStatus(prev => ({ ...prev, arrange: 'done' }));
          setActiveTab('arrange');
        }
      } else if (stepKey === 'assign') {
        const res = await adminApi.assignSeats();
        if (res.ok && res.data.success) {
          addToast('success', 'Backtracking solver satisfied all adjacent rules and preferences!');
          setStepStatus(prev => ({ ...prev, assign: 'done', plan: 'done' }));
          await loadState();
          setActiveTab('plan');
        } else {
          addToast('error', (res.data && res.data.data && res.data.data.message) || 'Assignment solver failed constraints.');
          setStepStatus(prev => ({ ...prev, assign: 'error' }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    setIs3DDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!is3DDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setYaw(prev => prev + deltaX * 0.5);
    setPitch(prev => Math.min(80, Math.max(10, prev - deltaY * 0.5)));
  };

  const handleMouseUp = () => {
    setIs3DDragging(false);
  };

  const totalAllocatedSeats = useMemo(() => {
    if (!appState.rooms) return 0;
    return appState.rooms.reduce((acc, r) => acc + (r.allocated_students ? r.allocated_students.length : 0), 0);
  }, [appState.rooms]);

  return (
    <div className="app-container" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      
      {/* ADMIN SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Icons.ShieldAdmin />
          </div>
          <div className="sidebar-brand">
            <h1>SeatGrid 3D</h1>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Management</span>
          
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon"><Icons.Dashboard /></span>
            <span>Dashboard</span>
          </button>

          <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            <span className="nav-icon"><Icons.Users /></span>
            <span>Students</span>
            <span className="nav-badge">{appState.total_students}</span>
          </button>

          <button className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
            <span className="nav-icon"><Icons.Door /></span>
            <span>Rooms</span>
            <span className="nav-badge">{appState.rooms.length}</span>
          </button>

          <span className="nav-label">Allocation Pipeline</span>

          <button className={`nav-item ${activeTab === 'grouping' ? 'active' : ''}`} onClick={() => setActiveTab('grouping')}>
            <span className="nav-icon"><Icons.Layers /></span>
            <span>Grouping</span>
          </button>

          <button className={`nav-item ${activeTab === 'arrange' ? 'active' : ''}`} onClick={() => setActiveTab('arrange')}>
            <span className="nav-icon"><Icons.Shuffle /></span>
            <span>Arrange &amp; Assign</span>
          </button>

          <button className={`nav-item ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>
            <span className="nav-icon"><Icons.Cube /></span>
            <span>3D Seating Plan</span>
            {appState.seating_generated && <span className="nav-badge" style={{background: 'rgba(155, 181, 154, 0.25)', color: 'var(--accent-sage)'}}>Active</span>}
          </button>

          <span className="nav-label">Reports</span>

          <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <span className="nav-icon"><Icons.Search /></span>
            <span>Student Search</span>
          </button>

          <button className={`nav-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
            <span className="nav-icon"><Icons.PieChart /></span>
            <span>Room Summary</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status-indicator">
            <span>
              <span className="status-dot online"></span>
              Admin Authenticated
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-indigo)' }}>Role: Admin</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ width: '100%', marginTop: '6px' }}>
            <Icons.LogOut /> Sign Out
          </button>
        </div>
      </aside>

      {/* ADMIN MAIN WRAPPER */}
      <div className="main-wrapper">
        
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-search-box">
            <span className="topbar-search-icon"><Icons.Search /></span>
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search candidate by name, roll, or subject..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
            />
            <span className="search-shortcut-badge">Ctrl+K</span>

            {/* Quick Search Dropdown Modal */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                background: 'var(--surface-slate)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-glass-lg)',
                zIndex: 200,
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{searchResults.length} Results Found</span>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowSearchDropdown(false)}>Close</button>
                </div>
                {searchResults.map(s => (
                  <div
                    key={s.roll}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.03)',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => {
                      setSelectedStudentForDetail(s);
                      setShowSearchDropdown(false);
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-highlight)' }}>{s.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{s.roll}</span></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sec: {s.section} | Sub: {s.subject}</div>
                    </div>
                    <div>
                      {s.allocated ? (
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(155, 181, 154, 0.2)', color: 'var(--accent-sage)', fontWeight: 600 }}>
                          Room {s.room_no} • Seat {s.seat_no}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                          Not Allocated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <div className="user-profile-bar">
              <div className="user-avatar-circle admin">A</div>
              <div>
                <div className="user-meta-name">{user.username || user.name}</div>
                <div className="user-meta-role">Admin Controller</div>
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
              <Icons.Plus /> Add Candidate
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowResetConfirm(true)} title="Reset allocation">
              <Icons.Refresh /> Reset
            </button>
            <button className="btn btn-indigo btn-sm" onClick={handleGenerateAll} disabled={loading}>
              {loading ? 'Assigning...' : 'Auto Assign All'}
            </button>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="content-body">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* STATS GRID */}
              <div className="stats-grid">
                <div className="stat-card tilt-card">
                  <div className="stat-header">
                    <span className="stat-title">Total Candidates</span>
                    <span className="stat-icon teal"><Icons.Users /></span>
                  </div>
                  <div className="stat-value">{appState.total_students}</div>
                  <div className="stat-meta">
                    <span>Enrolled for examination</span>
                  </div>
                </div>

                <div className="stat-card tilt-card">
                  <div className="stat-header">
                    <span className="stat-title">Examination Rooms</span>
                    <span className="stat-icon indigo"><Icons.Door /></span>
                  </div>
                  <div className="stat-value">{appState.rooms.length}</div>
                  <div className="stat-meta">
                    <span>Rooms: 101, 102, 103, 104</span>
                  </div>
                </div>

                <div className="stat-card tilt-card">
                  <div className="stat-header">
                    <span className="stat-title">Room Capacity</span>
                    <span className="stat-icon sand"><Icons.Layers /></span>
                  </div>
                  <div className="stat-value">{appState.total_capacity}</div>
                  <div className="stat-meta">
                    <span>6 desks per room</span>
                  </div>
                </div>

                <div className="stat-card tilt-card">
                  <div className="stat-header">
                    <span className="stat-title">Seats Allocated</span>
                    <span className="stat-icon sage"><Icons.Check /></span>
                  </div>
                  <div className="stat-value">{totalAllocatedSeats} / {appState.total_capacity}</div>
                  <div className="stat-meta">
                    <span style={{ color: appState.seating_generated ? 'var(--accent-sage)' : 'var(--text-muted)' }}>
                      {appState.seating_generated ? '100% Constraints Met' : 'Awaiting Allocation'}
                    </span>
                  </div>
                </div>
              </div>

              {/* WORKFLOW STEPPER */}
              <div className="glass-panel stepper-container">
                <div className="stepper-header">
                  <div>
                    <h2>Examination Allocation Workflow</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Follow sequential verification steps powered by backend.py rules and iterative backtracking
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-indigo btn-sm" onClick={handleGenerateAll} disabled={loading}>
                      Execute Entire Pipeline
                    </button>
                  </div>
                </div>

                <div className="stepper-track">
                  <div className="step-item done" onClick={() => setActiveTab('students')}>
                    <div className="step-node">1</div>
                    <span className="step-label">Add / Manage<br/>Students</span>
                    <div className="step-connector"></div>
                  </div>

                  <div className={`step-item ${stepStatus.validate}`} onClick={() => runWorkflowStep('validate')}>
                    <div className="step-node">2</div>
                    <span className="step-label">Validate<br/>Data Integrity</span>
                    <div className="step-connector"></div>
                  </div>

                  <div className={`step-item ${stepStatus.capacity}`} onClick={() => runWorkflowStep('capacity')}>
                    <div className="step-node">3</div>
                    <span className="step-label">Check Room<br/>Capacity</span>
                    <div className="step-connector"></div>
                  </div>

                  <div className={`step-item ${stepStatus.group}`} onClick={() => runWorkflowStep('group')}>
                    <div className="step-node">4</div>
                    <span className="step-label">Group &amp; Sort<br/>Sections</span>
                    <div className="step-connector"></div>
                  </div>

                  <div className={`step-item ${stepStatus.arrange}`} onClick={() => runWorkflowStep('arrange')}>
                    <div className="step-node">5</div>
                    <span className="step-label">Arrange<br/>Room Slots</span>
                    <div className="step-connector"></div>
                  </div>

                  <div className={`step-item ${stepStatus.assign}`} onClick={() => runWorkflowStep('assign')}>
                    <div className="step-node">6</div>
                    <span className="step-label">Backtracking<br/>Assign Seats</span>
                    <div className="step-connector"></div>
                  </div>

                  <div className={`step-item ${stepStatus.plan}`} onClick={() => setActiveTab('plan')}>
                    <div className="step-node">7</div>
                    <span className="step-label">View 3D<br/>Seating Plan</span>
                  </div>
                </div>
              </div>

              {/* ROOM OVERVIEW CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {appState.rooms.map(room => {
                  const occupiedCount = room.allocated_students ? room.allocated_students.length : 0;
                  const percent = Math.round((occupiedCount / room.capacity) * 100);
                  return (
                    <div key={room.room_no} className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-highlight)' }}>Room {room.room_no}</h3>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Invigilator: {room.invigilator}</p>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: percent === 100 ? 'rgba(155, 181, 154, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: percent === 100 ? 'var(--accent-sage)' : 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          {occupiedCount} / {room.capacity} Desks
                        </span>
                      </div>

                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? 'var(--accent-sage)' : 'var(--accent-teal)', transition: 'width 300ms' }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Priority Seats: {room.priority_seats.join(', ')}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRoom3D(room.room_no); setActiveTab('plan'); }}>
                          Open 3D View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RULES SUMMARY */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-sand)' }}><Icons.Layers /></span> Active Seating Rules &amp; Constraints
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', fontSize: '0.82rem' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '4px' }}>1. Section Diversity</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Adjacent students in the same room cannot be from the same section.</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '4px' }}>2. Subject Isolation</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Adjacent students in the same room must take different subjects.</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-sand)', marginBottom: '4px' }}>3. Special Seats Lock</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Kapil (101) pinned to Room 101 Seat 1; Sneha (105) pinned to Room 102 Seat 1.</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-sage)', marginBottom: '4px' }}>4. Room Preferences</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Honours Anurag (Roll 102 &rarr; Room 104) and Priya (Roll 116 &rarr; Room 101).</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS */}
          {activeTab === 'students' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2>Student Enrollment Directory</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Admin candidate records. Students can only sign up if their roll number is listed here.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => runWorkflowStep('validate')}>
                    <Icons.Check /> Validate Records
                  </button>
                  <button className="btn btn-indigo btn-sm" onClick={() => setShowAddModal(true)}>
                    <Icons.Plus /> Enroll Candidate
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Candidate Name</th>
                      <th>Section</th>
                      <th>Subject</th>
                      <th>Preferred Room</th>
                      <th>Special Need</th>
                      <th>Allocation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appState.students.map(s => {
                      let allocRoom = null;
                      let allocSeat = null;
                      for (const r of appState.rooms) {
                        const idx = (r.allocated_students || []).findIndex(st => st.roll === s.roll);
                        if (idx !== -1) {
                          allocRoom = r.room_no;
                          allocSeat = idx + 1;
                          break;
                        }
                      }

                      return (
                        <tr key={s.roll}>
                          <td style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>#{s.roll}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td><span className={`tag ${getSectionClass(s.section)}`}>Sec {s.section}</span></td>
                          <td><span className="tag tag-subject">{s.subject}</span></td>
                          <td>{s.preferred_room ? `Room ${s.preferred_room}` : '—'}</td>
                          <td>
                            {s.special_requirement ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(201, 138, 138, 0.2)', color: 'var(--accent-rose)', fontSize: '0.72rem', fontWeight: 600 }}>
                                {s.special_requirement}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            {allocRoom ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent-sage)', fontWeight: 600 }}>
                                Room {allocRoom} • Seat {allocSeat}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unallocated</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => setStudentToDelete(s)}>
                              <Icons.Trash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ROOMS */}
          {activeTab === 'rooms' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2>Examination Rooms &amp; Invigilators</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Room capacities, invigilator assignments, and priority front-seat allocations.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {appState.rooms.map(room => (
                  <div key={room.room_no} className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <h3>Room {room.room_no}</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--accent-teal)' }}>Invigilator: {room.invigilator}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                          {(room.allocated_students || []).length} / {room.capacity}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Seats Filled</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-sand)', marginBottom: '12px' }}>
                      ★ Priority Seats: {room.priority_seats.map(p => `Seat ${p}`).join(', ')}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                        Seated Students:
                      </div>
                      {(room.allocated_students && room.allocated_students.length > 0) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {room.allocated_students.map((st, i) => (
                            <div key={st.roll} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.03)',
                              fontSize: '0.8rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: (i + 1 <= 2) ? 'rgba(212, 184, 150, 0.25)' : 'rgba(255,255,255,0.08)',
                                  color: (i + 1 <= 2) ? 'var(--accent-sand)' : 'var(--text-main)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {i + 1}
                                </span>
                                <span style={{ fontWeight: 600 }}>{st.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{st.roll}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <span className={`tag ${getSectionClass(st.section)}`}>{st.section}</span>
                                <span className="tag tag-subject">{st.subject}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          No students allocated yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GROUPING */}
          {activeTab === 'grouping' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2>Section-wise Grouping &amp; Sorting</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Result from group_students() in backend.py: groups candidates by section and sorts by roll number.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {['A', 'B', 'C', 'D'].map(sec => {
                  const count = appState.students.filter(s => s.section === sec).length;
                  return (
                    <div key={sec} className="glass-panel" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className={`tag ${getSectionClass(sec)}`} style={{ fontSize: '0.85rem', padding: '3px 10px' }}>
                          Section {sec}
                        </span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-highlight)' }}>{count}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {((count / appState.total_students) * 100 || 0).toFixed(1)}% of total students
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-panel">
                <h3 style={{ marginBottom: '14px' }}>Sorted Candidate Stream (Roll Ascending)</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Section</th>
                        <th>Subject</th>
                        <th>Special Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...appState.students].sort((a, b) => a.roll - b.roll).map(s => (
                        <tr key={s.roll}>
                          <td style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>#{s.roll}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td><span className={`tag ${getSectionClass(s.section)}`}>Sec {s.section}</span></td>
                          <td><span className="tag tag-subject">{s.subject}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {s.special_requirement || (s.preferred_room ? `Prefers Room ${s.preferred_room}` : 'Standard')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ARRANGE & ASSIGN */}
          {activeTab === 'arrange' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2>Seating Slots &amp; Backtracking Assignment</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Visualizes arrange_students() interleaved slot ordering and executes assign_seats().
                  </p>
                </div>
                <button className="btn btn-indigo" onClick={() => runWorkflowStep('assign')} disabled={loading}>
                  Run Backtracking Assignment
                </button>
              </div>

              <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '14px' }}>Interleaved Slot Sequence (24 Examination Slots)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {Array.from({ length: 6 }).map((_, seatIdx) => {
                    const seatNo = seatIdx + 1;
                    return appState.rooms.map(r => {
                      const isAllocated = r.allocated_students && r.allocated_students[seatIdx];
                      const student = isAllocated ? r.allocated_students[seatIdx] : null;
                      return (
                        <div
                          key={`${r.room_no}-${seatNo}`}
                          style={{
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            background: student ? 'rgba(95, 168, 160, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${student ? 'rgba(95, 168, 160, 0.3)' : 'var(--border-subtle)'}`,
                            fontSize: '0.78rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            <span>R{r.room_no}</span>
                            <span>Seat {seatNo}</span>
                          </div>
                          <div style={{ marginTop: '6px', fontWeight: 600, color: student ? 'var(--text-highlight)' : 'var(--text-muted)' }}>
                            {student ? student.name : 'Slot Available'}
                          </div>
                          {student && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--accent-teal)', marginTop: '2px' }}>
                              Sec {student.section} • {student.subject}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 3D SEATING PLAN */}
          {activeTab === 'plan' && (
            <div>
              <div className="room-3d-wrapper">
                <div className="room-3d-toolbar">
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--accent-teal)' }}><Icons.Cube /></span> 3D Isometric Examination Hall
                    </h2>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Interactive 3D physical desks with depth, priority indicators, and real-time candidate cards
                    </p>
                  </div>

                  <div className="room-selector-tabs">
                    {appState.rooms.map(r => (
                      <button
                        key={r.room_no}
                        className={`room-tab-btn ${selectedRoom3D === r.room_no ? 'active' : ''}`}
                        onClick={() => setSelectedRoom3D(r.room_no)}
                      >
                        Room {r.room_no}
                      </button>
                    ))}
                  </div>

                  <div className="room-controls-group">
                    <div className="slider-control">
                      <span>Pitch: {pitch}°</span>
                      <input type="range" min="15" max="75" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                    </div>
                    <div className="slider-control">
                      <span>Yaw: {yaw}°</span>
                      <input type="range" min="-180" max="180" value={yaw} onChange={(e) => setYaw(Number(e.target.value))} />
                    </div>
                    <div className="slider-control">
                      <span>Zoom: {zoom.toFixed(1)}x</span>
                      <input type="range" min="0.7" max="1.4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setPitch(45); setYaw(-30); setZoom(1.0); }}>
                      Reset View
                    </button>
                  </div>
                </div>

                <div className="viewport-3d" onMouseDown={handleMouseDown} title="Click and drag to rotate the 3D room">
                  <div className="room-stage-3d" style={{ transform: `rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${zoom})` }}>
                    <div className="floor-3d"></div>

                    {(() => {
                      const currentRoomObj = appState.rooms.find(r => r.room_no === selectedRoom3D);
                      return (
                        <div className="invigilator-stage-3d">
                          <div className="board-label">BLACKBOARD &bull; INVIGILATOR DESK</div>
                          <div className="invigilator-name">
                            {currentRoomObj ? currentRoomObj.invigilator : 'Invigilator'} (Room {selectedRoom3D})
                          </div>
                        </div>
                      );
                    })()}

                    <div className="entrance-marker-3d">&larr; MAIN ENTRANCE</div>

                    <div className="desks-grid-3d">
                      {(() => {
                        const currentRoom = appState.rooms.find(r => r.room_no === selectedRoom3D) || { allocated_students: [], capacity: 6, priority_seats: [1, 2] };
                        const capacity = currentRoom.capacity || 6;
                        const allocatedList = currentRoom.allocated_students || [];

                        return Array.from({ length: capacity }).map((_, seatIdx) => {
                          const seatNumber = seatIdx + 1;
                          const student = allocatedList[seatIdx];
                          const isPriority = (currentRoom.priority_seats || [1, 2]).includes(seatNumber);

                          return (
                            <div
                              key={seatNumber}
                              className={`desk-block-3d ${isPriority ? 'priority-seat' : ''} ${!student ? 'empty-seat' : ''}`}
                              onClick={() => {
                                if (student) {
                                  setSelectedStudentForDetail({
                                    ...student,
                                    room_no: selectedRoom3D,
                                    seat_no: seatNumber,
                                    invigilator: currentRoom.invigilator,
                                    is_priority: isPriority,
                                    allocated: true
                                  });
                                }
                              }}
                            >
                              <div className="desk-shadow"></div>
                              <div className="desk-side-left"></div>
                              <div className="desk-side-right"></div>
                              <div className="desk-front"></div>

                              <div className="desk-top">
                                <div className="desk-header">
                                  <span className="seat-badge">Seat #{seatNumber}</span>
                                  {isPriority && <span className="priority-tag">Priority</span>}
                                </div>

                                {student ? (
                                  <>
                                    <div className="student-info">
                                      <div className="student-name">{student.name}</div>
                                      <div className="student-roll">Roll: #{student.roll}</div>
                                    </div>
                                    <div className="desk-tags">
                                      <span className={`tag ${getSectionClass(student.section)}`}>Sec {student.section}</span>
                                      <span className="tag tag-subject">{student.subject}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="empty-seat-text">Empty Seat</div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                <div className="room-3d-legend">
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: '#242935', border: '1px solid var(--border-glass)' }}></div>
                    <span>Normal Seat</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'rgba(212, 184, 150, 0.4)', border: '1px solid var(--accent-sand)' }}></div>
                    <span>Priority Seat (Seats 1, 2)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'var(--accent-teal)' }}></div>
                    <span>Section A</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'var(--accent-indigo)' }}></div>
                    <span>Section B</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'var(--accent-sage)' }}></div>
                    <span>Section C</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color-box" style={{ background: 'var(--accent-sand)' }}></div>
                    <span>Section D</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SEARCH */}
          {activeTab === 'search' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2>Candidate Seat Lookup &amp; Admit Pass</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Search by roll number, student name, or subject to generate the official examination seat pass.
                </p>
              </div>

              <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Candidate Roll Number, Name, Section, or Subject..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                />
              </div>

              {selectedStudentForDetail ? (
                <div className="glass-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Official Examination Seat Slip</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForDetail(null)}>
                        Back to Search
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                        <Icons.Printer /> Print Admit Pass
                      </button>
                    </div>
                  </div>

                  <div className="admit-slip-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '18px' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                          {selectedStudentForDetail.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-teal)' }}>
                          Candidate Roll: #{selectedStudentForDetail.roll}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</div>
                        <div style={{ fontWeight: 600, color: selectedStudentForDetail.allocated ? 'var(--accent-sage)' : 'var(--accent-rose)' }}>
                          {selectedStudentForDetail.allocated ? 'ALLOCATED' : 'NOT ALLOCATED'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Section</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Section {selectedStudentForDetail.section}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Examination Subject</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-sand)' }}>{selectedStudentForDetail.subject}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Room</div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-highlight)' }}>
                          {selectedStudentForDetail.room_no ? `Room ${selectedStudentForDetail.room_no}` : 'Pending'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Seat Number</div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent-teal)' }}>
                          {selectedStudentForDetail.seat_no ? `Seat #${selectedStudentForDetail.seat_no}` : 'Pending'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Invigilator In Charge</div>
                        <div style={{ fontSize: '0.85rem' }}>{selectedStudentForDetail.invigilator || 'To be announced'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Seat Priority Class</div>
                        <div style={{ fontSize: '0.85rem' }}>
                          {selectedStudentForDetail.is_priority ? 'Front Priority (Seat 1-2)' : 'Standard Examination Desk'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Section</th>
                        <th>Subject</th>
                        <th>Room</th>
                        <th>Seat</th>
                        <th>Invigilator</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(searchResults.length > 0 ? searchResults : appState.students).map(s => (
                        <tr key={s.roll}>
                          <td style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>#{s.roll}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td><span className={`tag ${getSectionClass(s.section)}`}>Sec {s.section}</span></td>
                          <td><span className="tag tag-subject">{s.subject}</span></td>
                          <td>{s.room_no ? `Room ${s.room_no}` : '—'}</td>
                          <td>{s.seat_no ? `Seat #${s.seat_no}` : '—'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.invigilator || '—'}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForDetail(s)}>
                              View Pass
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: SUMMARY */}
          {activeTab === 'summary' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2>Room-wise Capacity &amp; Utilization Summary</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Comprehensive breakdown matching generate_room_summary() in backend.py.
                </p>
              </div>

              <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Room Number</th>
                        <th>Invigilator</th>
                        <th>Capacity</th>
                        <th>Occupied</th>
                        <th>Available</th>
                        <th>Utilization</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appState.rooms.map(r => {
                        const occupied = (r.allocated_students || []).length;
                        const available = r.capacity - occupied;
                        const percent = Math.round((occupied / r.capacity) * 100);
                        return (
                          <tr key={r.room_no}>
                            <td style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-highlight)' }}>
                              Room {r.room_no}
                            </td>
                            <td style={{ fontWeight: 600 }}>{r.invigilator}</td>
                            <td>{r.capacity} Seats</td>
                            <td style={{ fontWeight: 700, color: 'var(--accent-sage)' }}>{occupied}</td>
                            <td style={{ color: available === 0 ? 'var(--text-muted)' : 'var(--accent-sand)' }}>
                              {available}
                            </td>
                            <td style={{ width: '180px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? 'var(--accent-sage)' : 'var(--accent-teal)' }}></div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{percent}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: percent === 100 ? 'rgba(155, 181, 154, 0.2)' : 'rgba(212, 184, 150, 0.2)',
                                color: percent === 100 ? 'var(--accent-sage)' : 'var(--accent-sand)',
                                fontWeight: 600
                              }}>
                                {percent === 100 ? 'FULL CAPACITY' : 'SEATS VACANT'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ADD CANDIDATE */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onAdded={(newStudent) => {
            addToast('success', `Candidate ${newStudent.name} (Roll ${newStudent.roll}) enrolled.`);
            loadState();
            setShowAddModal(false);
          }}
        />
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {studentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Confirm Candidate Removal</h3>
              <button className="btn btn-icon" onClick={() => setStudentToDelete(null)}><Icons.Close /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete candidate <strong>{studentToDelete.name}</strong> (Roll #{studentToDelete.roll})?</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', marginTop: '8px' }}>
                Existing seating arrangements will be reset to guarantee constraint validity.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStudentToDelete(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const res = await adminApi.removeStudent(studentToDelete.roll);
                  if (res.ok && res.data.success) {
                    addToast('info', `Candidate ${studentToDelete.roll} removed.`);
                    loadState();
                  } else {
                    addToast('error', res.data.message);
                  }
                  setStudentToDelete(null);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Reset Seating Arrangement</h3>
              <button className="btn btn-icon" onClick={() => setShowResetConfirm(false)}><Icons.Close /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to clear all allocated seats across all rooms?</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Candidate records will remain intact.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReset}>Reset All Seats</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div>
              {t.type === 'success' && <Icons.Check />}
              {t.type === 'error' && <Icons.XCircle />}
              {t.type === 'info' && <Icons.Layers />}
            </div>
            <div style={{ flex: 1 }}>{t.message}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

// --- ADD STUDENT MODAL HELPER ---
function AddStudentModal({ onClose, onAdded }) {
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('Python');
  const [preferredRoom, setPreferredRoom] = useState('');
  const [specialRequirement, setSpecialRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roll || !name || !subject) {
      setErrorMsg('Please fill out Roll, Name, and Subject.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await adminApi.addStudent({
      roll: Number(roll),
      name: name.trim(),
      section: section.trim().toUpperCase(),
      subject: subject.trim(),
      preferred_room: preferredRoom ? Number(preferredRoom) : null,
      special_requirement: specialRequirement.trim() || null
    });
    setLoading(false);
    if (res.ok && res.data.success) {
      onAdded(res.data.student);
    } else {
      setErrorMsg(res.data.message || 'Failed to enroll student.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Enroll Candidate Record</h3>
          <button className="btn btn-icon" onClick={onClose}><Icons.Close /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="form-error-alert">
                <Icons.XCircle /> <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Candidate Roll Number *</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 125"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Tanmay Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Section *</label>
                <select className="form-control" value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Examination Subject *</label>
                <select className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Room (Optional)</label>
              <select className="form-control" value={preferredRoom} onChange={(e) => setPreferredRoom(e.target.value)}>
                <option value="">No Preference</option>
                <option value="101">Room 101 (Mrs. A Thakuri)</option>
                <option value="102">Room 102 (Mr. S Mitra)</option>
                <option value="103">Room 103 (Mrs. S Majumdar)</option>
                <option value="104">Room 104 (Mr. D Acharya)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Special Requirement (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Near Entrance, Front Row"
                value={specialRequirement}
                onChange={(e) => setSpecialRequirement(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-indigo" disabled={loading}>
              {loading ? 'Enrolling...' : 'Enroll Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ==========================================================================
//   PAGE 10: UNAUTHORIZED ACCESS PAGE (/unauthorized)
// ==========================================================================
function UnauthorizedPage({ user, onNavigate, onLogout }) {
  const isStudent = user && user.role === 'student';
  return (
    <div className="auth-viewport">
      <div className="auth-blob auth-blob-indigo"></div>

      <div className="unauthorized-card">
        <div className="unauthorized-icon">
          <Icons.ShieldAdmin />
        </div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-highlight)', marginBottom: '8px' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
          You are currently signed in as <strong>{user ? user.name : 'Unknown'}</strong> with role{' '}
          <span style={{ color: isStudent ? 'var(--accent-teal)' : 'var(--accent-indigo)', fontWeight: 700 }}>
            {user ? user.role.toUpperCase() : ''}
          </span>.
          <br />
          You do not have permission to access this protected area.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className={`btn ${isStudent ? 'btn-primary' : 'btn-indigo'}`}
            onClick={() => onNavigate(isStudent ? '/student/my-seat' : '/admin/dashboard')}
          >
            Return to My Portal
          </button>
          <button className="btn btn-secondary" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}


// ==========================================================================
//   MAIN APPLICATION ROUTER & ROOT CONTAINER
// ==========================================================================
function ExaminationApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global 401 Unauthorized Interceptor
  useEffect(() => {
    onGlobalUnauthorized = () => {
      sessionStorage.removeItem('exam_auth_token');
      sessionStorage.removeItem('exam_auth_user');
      setUser(null);
      setToken(null);
      if (!currentPath.includes('/login') && !currentPath.includes('/signup') && currentPath !== '/') {
        navigate('/');
      }
    };
  }, [currentPath]);

  // Load session from sessionStorage on boot
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = sessionStorage.getItem('exam_auth_token');
      const savedUserStr = sessionStorage.getItem('exam_auth_user');
      
      if (savedToken && savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          setToken(savedToken);
          setUser(parsedUser);

          // Verify with server
          const meRes = await authApi.getMe();
          if (meRes.ok && meRes.data.success) {
            setUser(meRes.data.user);
            sessionStorage.setItem('exam_auth_user', JSON.stringify(meRes.data.user));
          } else {
            sessionStorage.removeItem('exam_auth_token');
            sessionStorage.removeItem('exam_auth_user');
            setUser(null);
            setToken(null);
          }
        } catch (e) {
          sessionStorage.removeItem('exam_auth_token');
          sessionStorage.removeItem('exam_auth_user');
        }
      }
      setAuthLoading(false);
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    sessionStorage.setItem('exam_auth_token', newToken);
    sessionStorage.setItem('exam_auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    if (newUser.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/my-seat');
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    sessionStorage.removeItem('exam_auth_token');
    sessionStorage.removeItem('exam_auth_user');
    setUser(null);
    setToken(null);
    navigate('/');
  };

  // Extract query parameters for forgot/reset password
  const searchParams = new URLSearchParams(window.location.search);
  const queryRole = searchParams.get('role') || 'student';
  const queryToken = searchParams.get('token') || '';

  if (authLoading) {
    return (
      <div className="auth-viewport">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }}></div>
          <div style={{ fontWeight: 600, color: 'var(--text-highlight)' }}>Authenticating Secure Session...</div>
        </div>
      </div>
    );
  }

  // --- ROUTE DISPATCHER ---
  
  // Public Route: Root / Landing
  if (currentPath === '/' || currentPath === '/index.html') {
    if (user) {
      if (user.role === 'admin') return <AdminDashboardPage user={user} onLogout={handleLogout} />;
      return <StudentMySeatPage user={user} onLogout={handleLogout} />;
    }
    return <LandingPage onNavigate={navigate} />;
  }

  // Public Route: Student Login
  if (currentPath === '/student/login') {
    if (user && user.role === 'student') {
      return <StudentMySeatPage user={user} onLogout={handleLogout} />;
    }
    return <StudentLoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  }

  // Public Route: Student Signup
  if (currentPath === '/student/signup') {
    if (user && user.role === 'student') {
      return <StudentMySeatPage user={user} onLogout={handleLogout} />;
    }
    return <StudentSignupPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  }

  // Admin Login
  if (currentPath === '/admin/login' || currentPath === '/admin/signup') {
    if (user && user.role === 'admin') {
      return <AdminDashboardPage user={user} onLogout={handleLogout} />;
    }
    return <AdminLoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  }

  // Public Route: Forgot / Reset Password
  if (currentPath === '/forgot-password' || currentPath === '/reset-password') {
    return <ForgotPasswordPage onNavigate={navigate} role={queryRole} />;
  }

  // Protected Route: Student Dashboard / Seat Locator (/student/my-seat or /student/dashboard)
  if (currentPath === '/student/my-seat' || currentPath === '/student/dashboard') {
    if (!user) {
      return <StudentLoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
    }
    if (user.role !== 'student' && user.role !== 'admin') {
      return <UnauthorizedPage user={user} onNavigate={navigate} onLogout={handleLogout} />;
    }
    return <StudentMySeatPage user={user} onLogout={handleLogout} />;
  }

  // Protected Route: Admin Dashboard (/admin/dashboard)
  if (currentPath === '/admin/dashboard') {
    if (!user) {
      return <AdminLoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
    }
    if (user.role !== 'admin') {
      return <UnauthorizedPage user={user} onNavigate={navigate} onLogout={handleLogout} />;
    }
    return <AdminDashboardPage user={user} onLogout={handleLogout} />;
  }

  // Unauthorized page
  if (currentPath === '/unauthorized') {
    return <UnauthorizedPage user={user} onNavigate={navigate} onLogout={handleLogout} />;
  }

  // Fallback route: default to Landing
  return <LandingPage onNavigate={navigate} />;
}

// --- MOUNT REACT APP ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(ExaminationApp, null));
}
