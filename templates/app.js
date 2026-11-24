// ==========================================================================
//   EXAMINATION SEATING ARRANGEMENT SYSTEM - REACT SINGLE PAGE APP (app.jsx)
//   Complete Role-Based Authentication, 3D Hall, Admin & Student Portals
// ==========================================================================

const {
  useState,
  useEffect,
  useRef,
  useMemo,
  createContext,
  useContext
} = React;

// --- CONFIG & HOST AUTO-DETECTION ---
const API_BASE = typeof window !== 'undefined' && window.location.protocol === 'file:' ? 'http://localhost:5000' : '';

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
  const response = await fetch(`${API_BASE}${url}`, Object.assign({}, options, {
    headers
  }));
  if (response.status === 401) {
    if (onGlobalUnauthorized) {
      onGlobalUnauthorized();
    }
  }
  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// --- AUTH API SERVICE (authApi.js) ---
const authApi = {
  async signupStudent(payload) {
    return authFetch('/api/auth/signup/student', {
      method: 'POST',
      body: payload
    });
  },
  async login(identifier, password, role) {
    return authFetch('/api/auth/login', {
      method: 'POST',
      body: {
        identifier,
        password,
        role
      }
    });
  },
  async logout() {
    return authFetch('/api/auth/logout', {
      method: 'POST'
    });
  },
  async getMe() {
    return authFetch('/api/auth/me');
  },
  async sendOtp(email) {
    return authFetch('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      body: {
        email
      }
    });
  },
  async verifyOtp(email, otp) {
    return authFetch('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: {
        email,
        otp
      }
    });
  },
  async resetPasswordWithOtp(email, otp, newPassword, confirmPassword) {
    return authFetch('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      }
    });
  },
  async forgotPassword(email, role) {
    return authFetch('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      body: {
        email,
        role
      }
    });
  },
  async resetPassword(token, role, newPassword) {
    return authFetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        role,
        new_password: newPassword
      }
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
    return authFetch('/api/assign-seats', {
      method: 'POST'
    });
  },
  async validateSeating() {
    return authFetch('/api/validate-seating');
  },
  async getRoomSummary() {
    return authFetch('/api/room-summary');
  },
  async generateSeating() {
    return authFetch('/api/generate', {
      method: 'POST'
    });
  },
  async resetSeating() {
    return authFetch('/api/reset', {
      method: 'POST'
    });
  },
  async addStudent(studentData) {
    return authFetch('/api/student', {
      method: 'POST',
      body: studentData
    });
  },
  async removeStudent(roll) {
    return authFetch(`/api/student/${roll}`, {
      method: 'DELETE'
    });
  },
  async searchStudents(q) {
    return authFetch(`/api/search?q=${encodeURIComponent(q)}`);
  }
};

// --- INLINE SVG ICONS ---
const Icons = {
  StudentCap: () => /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 10v6M2 10l10-5 10 5-10 5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 12v5c3 3 9 3 12 0v-5"
  })),
  ShieldAdmin: () => /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 12 2 2 4-4"
  })),
  Eye: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  EyeOff: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9.88 9.88a3 3 0 1 0 4.24 4.24"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "2",
    y1: "2",
    x2: "22",
    y2: "22"
  })),
  Lock: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "11",
    width: "18",
    height: "11",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 11V7a5 5 0 0 1 10 0v4"
  })),
  Check: () => /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  })),
  XCircle: () => /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "15",
    y1: "9",
    x2: "9",
    y2: "15"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "9",
    x2: "15",
    y2: "15"
  })),
  ArrowRight: () => /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 5 19 12 12 19"
  })),
  LogOut: () => /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 17 21 12 16 7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "12",
    x2: "9",
    y2: "12"
  })),
  Printer: () => /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 6 2 18 2 18 9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "14",
    width: "12",
    height: "8"
  })),
  Dashboard: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5",
    rx: "1"
  })),
  Users: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23 21v-2a4 4 0 0 0-3-3.87"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3.13a4 4 0 0 1 0 7.75"
  })),
  Door: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 21h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "12",
    r: "1"
  })),
  Layers: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "12 2 2 7 12 12 22 7 12 2"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "2 17 12 22 22 17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "2 12 12 17 22 12"
  })),
  Shuffle: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "16 3 21 3 21 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "20",
    x2: "21",
    y2: "3"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "21 16 21 21 16 21"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "15",
    y1: "15",
    x2: "21",
    y2: "21"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "4",
    x2: "9",
    y2: "9"
  })),
  Cube: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "3.27 6.96 12 12.01 20.73 6.96"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "22.08",
    x2: "12",
    y2: "12"
  })),
  Search: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "21",
    x2: "16.65",
    y2: "16.65"
  })),
  PieChart: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21.21 15.89A10 10 0 1 1 8 2.83"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 12A10 10 0 0 0 12 2v10z"
  })),
  Plus: () => /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  })),
  Trash: () => /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "3 6 5 6 21 6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  })),
  Refresh: () => /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "23 4 23 10 17 10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "1 20 1 14 7 14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
  })),
  Close: () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))
};

// --- REUSABLE UI: FLOATING INPUT ---
function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = ' ',
  autoFocus = false,
  error = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "floating-group"
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    type: type,
    className: "floating-input",
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    required: required,
    autoFocus: autoFocus,
    style: error ? {
      borderColor: 'var(--accent-rose)'
    } : {}
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    className: "floating-label"
  }, label), error && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--accent-rose)',
      marginTop: '4px'
    }
  }, error));
}

// --- REUSABLE UI: PASSWORD INPUT WITH TOGGLE ---
function PasswordInput({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = ' '
}) {
  const [show, setShow] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "floating-group password-wrapper"
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    type: show ? 'text' : 'password',
    className: "floating-input",
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    required: required
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    className: "floating-label"
  }, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "password-toggle-btn",
    onClick: () => setShow(!show),
    tabIndex: "-1",
    "aria-label": show ? 'Hide password' : 'Show password'
  }, show ? /*#__PURE__*/React.createElement(Icons.EyeOff, null) : /*#__PURE__*/React.createElement(Icons.Eye, null)));
}

// --- REUSABLE UI: PASSWORD STRENGTH METER ---
function StrengthMeter({
  password
}) {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "strength-meter-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "strength-bars-row"
  }, [1, 2, 3, 4].map(idx => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: `strength-bar ${score >= idx ? barClass[score] : ''}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "strength-status-text"
  }, /*#__PURE__*/React.createElement("span", null, "Password Strength:"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: score === 4 ? 'var(--accent-sage)' : score >= 2 ? 'var(--accent-teal)' : 'var(--accent-rose)'
    }
  }, labels[score] || 'Too Short')), /*#__PURE__*/React.createElement("div", {
    className: "strength-rules-list"
  }, /*#__PURE__*/React.createElement("div", {
    className: `strength-rule-item ${rules.length ? 'met' : ''}`
  }, rules.length ? /*#__PURE__*/React.createElement(Icons.Check, null) : /*#__PURE__*/React.createElement(Icons.XCircle, null), " Min 8 characters"), /*#__PURE__*/React.createElement("div", {
    className: `strength-rule-item ${rules.upper ? 'met' : ''}`
  }, rules.upper ? /*#__PURE__*/React.createElement(Icons.Check, null) : /*#__PURE__*/React.createElement(Icons.XCircle, null), " One uppercase (A-Z)"), /*#__PURE__*/React.createElement("div", {
    className: `strength-rule-item ${rules.lower ? 'met' : ''}`
  }, rules.lower ? /*#__PURE__*/React.createElement(Icons.Check, null) : /*#__PURE__*/React.createElement(Icons.XCircle, null), " One lowercase (a-z)"), /*#__PURE__*/React.createElement("div", {
    className: `strength-rule-item ${rules.digit ? 'met' : ''}`
  }, rules.digit ? /*#__PURE__*/React.createElement(Icons.Check, null) : /*#__PURE__*/React.createElement(Icons.XCircle, null), " One digit (0-9)")));
}

// --- REUSABLE UI: 3D GLASS CARD ---
function GlassCard({
  children,
  className = '',
  roleTheme = ''
}) {
  const cardRef = useRef(null);
  const handleMouseMove = e => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -5;
    const rotateY = (x - centerX) / centerX * 5;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
  };
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: `auth-card ${roleTheme ? `role-${roleTheme}` : ''} ${className}`,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave
  }, children);
}

// --- HELPER: SECTION STYLING ---
const getSectionClass = section => {
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
function LandingPage({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-teal"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-indigo"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-sage"
  }), /*#__PURE__*/React.createElement("div", {
    className: "landing-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "landing-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "landing-badge"
  }, /*#__PURE__*/React.createElement(Icons.Cube, null), " Examination Seating Arrangement System"), /*#__PURE__*/React.createElement("h1", {
    className: "landing-title"
  }, "Select Your Portal"), /*#__PURE__*/React.createElement("p", {
    className: "landing-subtitle"
  }, "Secure, constraint-verified seating allocations with real-time 3D hall rendering.")), /*#__PURE__*/React.createElement("div", {
    className: "landing-roles-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "role-choice-card student-card",
    onClick: () => onNavigate('/student/login')
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "role-icon-box"
  }, /*#__PURE__*/React.createElement(Icons.StudentCap, null)), /*#__PURE__*/React.createElement("h2", {
    className: "role-card-title"
  }, "I'm a Student"), /*#__PURE__*/React.createElement("p", {
    className: "role-card-desc"
  }, "Sign in to check your examination room, view your exact desk in the 3D hall, and download your official seat pass slip.")), /*#__PURE__*/React.createElement("div", {
    className: "role-card-footer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "role-action-text"
  }, "Student Sign In ", /*#__PURE__*/React.createElement(Icons.ArrowRight, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, "Roll / Email Access"))), /*#__PURE__*/React.createElement("div", {
    className: "role-choice-card admin-card",
    onClick: () => onNavigate('/admin/login')
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "role-icon-box"
  }, /*#__PURE__*/React.createElement(Icons.ShieldAdmin, null)), /*#__PURE__*/React.createElement("h2", {
    className: "role-card-title"
  }, "I'm an Admin"), /*#__PURE__*/React.createElement("p", {
    className: "role-card-desc"
  }, "Access the full examination coordinator dashboard: manage candidates, verify room capacities, and execute backtracking solvers.")), /*#__PURE__*/React.createElement("div", {
    className: "role-card-footer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "role-action-text"
  }, "Administrator Sign In ", /*#__PURE__*/React.createElement(Icons.ArrowRight, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, "Authorized Staff Only")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '36px',
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, "Powered by Python Backtracking Solver • 3D Glassmorphism Interface")));
}

// ==========================================================================
//   PAGE 2: STUDENT LOGIN (/student/login)
// ==========================================================================
//   PAGE 2: STUDENT LOGIN (/student/login)
// ==========================================================================
function StudentLoginPage({
  onNavigate,
  onLoginSuccess
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const handleSubmit = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-teal"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-indigo"
  }), /*#__PURE__*/React.createElement(GlassCard, {
    roleTheme: "student",
    className: shake ? 'shake-anim' : ''
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-role-pill student"
  }, /*#__PURE__*/React.createElement(Icons.StudentCap, null), " Student Portal"), /*#__PURE__*/React.createElement("h2", {
    className: "auth-title"
  }, "Welcome Back"), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "Sign in with your registered email to view your exam seat")), errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "form-error-alert"
  }, /*#__PURE__*/React.createElement(Icons.XCircle, null), /*#__PURE__*/React.createElement("span", null, errorMsg)), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement(FloatingInput, {
    id: "student-identifier",
    label: "Registered Email Address",
    type: "email",
    value: identifier,
    onChange: e => setIdentifier(e.target.value),
    required: true,
    autoFocus: true
  }), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "student-password",
    label: "Password",
    value: password,
    onChange: e => setPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#forgot",
    onClick: e => {
      e.preventDefault();
      onNavigate('/forgot-password?role=student');
    },
    style: {
      fontSize: '0.8rem',
      color: 'var(--accent-blue)',
      textDecoration: 'none',
      fontWeight: 500
    }
  }, "Forgot password?")), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-gradient-primary btn-block",
    disabled: loading
  }, loading ? 'Authenticating...' : 'Sign In as Student')), /*#__PURE__*/React.createElement("div", {
    className: "auth-footer-links"
  }, /*#__PURE__*/React.createElement("span", null, "Don't have an account yet?", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#signup",
    onClick: e => {
      e.preventDefault();
      onNavigate('/student/signup');
    }
  }, "Sign Up")), /*#__PURE__*/React.createElement("a", {
    href: "#home",
    onClick: e => {
      e.preventDefault();
      onNavigate('/');
    },
    style: {
      color: 'var(--text-muted)'
    }
  }, "← Return to Portal Selection"))));
}

// ==========================================================================
//   PAGE 3: STUDENT SIGNUP (/student/signup)
// ==========================================================================
function StudentSignupPage({
  onNavigate,
  onLoginSuccess
}) {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const handleSubmit = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-teal"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-indigo"
  }), /*#__PURE__*/React.createElement(GlassCard, {
    roleTheme: "student",
    style: {
      maxWidth: '520px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-role-pill student"
  }, /*#__PURE__*/React.createElement(Icons.StudentCap, null), " Candidate Registration"), /*#__PURE__*/React.createElement("h2", {
    className: "auth-title"
  }, "Create Student Account"), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "Link your enrolled examination roll number")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-secondary)',
      marginBottom: '18px',
      background: 'rgba(59, 130, 246, 0.08)',
      padding: '10px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(59, 130, 246, 0.22)',
      lineHeight: 1.4
    }
  }, "ℹ️ ", /*#__PURE__*/React.createElement("strong", null, "Enrollment Rule:"), " Only enrolled students in the examination candidate database can register. Your Name and Roll Number must match the official record."), errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "form-error-alert"
  }, /*#__PURE__*/React.createElement(Icons.XCircle, null), /*#__PURE__*/React.createElement("span", null, errorMsg)), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement(FloatingInput, {
    id: "student-name",
    label: "Full Name (matches exam record)",
    value: name,
    onChange: e => setName(e.target.value),
    required: true,
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement(FloatingInput, {
    id: "student-roll",
    label: "Roll Number (e.g. 101)",
    type: "number",
    value: roll,
    onChange: e => setRoll(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement(FloatingInput, {
    id: "student-email",
    label: "Email Address",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "student-new-password",
    label: "Password",
    value: password,
    onChange: e => setPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement(StrengthMeter, {
    password: password
  }), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "student-confirm-password",
    label: "Confirm Password",
    value: confirmPassword,
    onChange: e => setConfirmPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-gradient-primary btn-block",
    disabled: loading
  }, loading ? 'Verifying Roll & Creating Account...' : 'Complete Student Registration')), /*#__PURE__*/React.createElement("div", {
    className: "auth-footer-links"
  }, /*#__PURE__*/React.createElement("span", null, "Already registered?", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#login",
    onClick: e => {
      e.preventDefault();
      onNavigate('/student/login');
    }
  }, "Sign In")), /*#__PURE__*/React.createElement("a", {
    href: "#home",
    onClick: e => {
      e.preventDefault();
      onNavigate('/');
    },
    style: {
      color: 'var(--text-muted)'
    }
  }, "← Return to Portal Selection"))));
}

// ==========================================================================
//   PAGE 4: ADMIN LOGIN (/admin/login)
// ==========================================================================
function AdminLoginPage({
  onNavigate,
  onLoginSuccess
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const handleSubmit = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-indigo"
  }), /*#__PURE__*/React.createElement(GlassCard, {
    roleTheme: "admin",
    className: shake ? 'shake-anim' : ''
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-role-pill admin"
  }, /*#__PURE__*/React.createElement(Icons.ShieldAdmin, null), " Administrator Portal"), /*#__PURE__*/React.createElement("h2", {
    className: "auth-title"
  }, "Coordinator Sign In"), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "Access examination hall management & solvers")), errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "form-error-alert"
  }, /*#__PURE__*/React.createElement(Icons.XCircle, null), /*#__PURE__*/React.createElement("span", null, errorMsg)), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement(FloatingInput, {
    id: "admin-identifier",
    label: "Username or Email",
    value: identifier,
    onChange: e => setIdentifier(e.target.value),
    required: true,
    autoFocus: true
  }), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "admin-password",
    label: "Password",
    value: password,
    onChange: e => setPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#forgot",
    onClick: e => {
      e.preventDefault();
      onNavigate('/forgot-password?role=admin');
    },
    style: {
      fontSize: '0.78rem',
      color: 'var(--accent-indigo)',
      textDecoration: 'none'
    }
  }, "Forgot password?")), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-gradient-admin btn-block",
    disabled: loading
  }, loading ? 'Authenticating...' : 'Sign In as Administrator')), /*#__PURE__*/React.createElement("div", {
    className: "auth-footer-links"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-muted)',
      lineHeight: 1.5,
      background: 'rgba(255,255,255,0.03)',
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)',
      textAlign: 'center',
      marginBottom: '8px'
    }
  }, "🔒 Administrator accounts are provisioned via secure internal setup (", /*#__PURE__*/React.createElement("code", null, "seed.py"), "). Public self-registration is disabled."), /*#__PURE__*/React.createElement("a", {
    href: "#home",
    onClick: e => {
      e.preventDefault();
      onNavigate('/');
    },
    style: {
      color: 'var(--text-muted)'
    }
  }, "← Return to Portal Selection"))));
}

// ==========================================================================
//   PAGE 5: ADMIN SIGNUP (/admin/signup)
// ==========================================================================
function AdminSignupPage({
  onNavigate,
  onLoginSuccess
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const handleSubmit = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-indigo"
  }), /*#__PURE__*/React.createElement(GlassCard, {
    roleTheme: "admin",
    style: {
      maxWidth: '520px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-role-pill admin"
  }, /*#__PURE__*/React.createElement(Icons.ShieldAdmin, null), " Staff Authorization"), /*#__PURE__*/React.createElement("h2", {
    className: "auth-title"
  }, "Register Administrator"), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "Authorized coordinator setup with invite passkey")), errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "form-error-alert"
  }, /*#__PURE__*/React.createElement(Icons.XCircle, null), /*#__PURE__*/React.createElement("span", null, errorMsg)), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement(FloatingInput, {
    id: "admin-name",
    label: "Full Name",
    value: name,
    onChange: e => setName(e.target.value),
    required: true,
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement(FloatingInput, {
    id: "admin-username",
    label: "Username",
    value: username,
    onChange: e => setUsername(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement(FloatingInput, {
    id: "admin-email",
    label: "Staff Email",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement(FloatingInput, {
    id: "admin-invite",
    label: "Admin Invite Code (from config.json)",
    value: inviteCode,
    onChange: e => setInviteCode(e.target.value),
    required: true,
    placeholder: "e.g. EXAM_ADMIN_2026"
  }), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "admin-new-password",
    label: "Password",
    value: password,
    onChange: e => setPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement(StrengthMeter, {
    password: password
  }), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "admin-confirm-password",
    label: "Confirm Password",
    value: confirmPassword,
    onChange: e => setConfirmPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-indigo btn-block",
    disabled: loading
  }, loading ? 'Validating Invite Code...' : 'Create Administrator Account')), /*#__PURE__*/React.createElement("div", {
    className: "auth-footer-links"
  }, /*#__PURE__*/React.createElement("span", null, "Already have an admin account?", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#login",
    onClick: e => {
      e.preventDefault();
      onNavigate('/admin/login');
    }
  }, "Sign In")), /*#__PURE__*/React.createElement("a", {
    href: "#home",
    onClick: e => {
      e.preventDefault();
      onNavigate('/');
    },
    style: {
      color: 'var(--text-muted)'
    }
  }, "← Return to Portal Selection"))));
}

// ==========================================================================
//   PAGE 6: FORGOT & RESET PASSWORD VIA REAL OTP (/forgot-password)
// ==========================================================================
function ForgotPasswordPage({
  onNavigate,
  role = 'student'
}) {
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
  const formatTimer = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 1: Send OTP to Student's Registered Email
  const handleSendOtp = async e => {
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
  const handleVerifyOtp = async e => {
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
  const handleResetPassword = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: `auth-blob ${isStudent ? 'auth-blob-teal' : 'auth-blob-indigo'}`
  }), /*#__PURE__*/React.createElement(GlassCard, {
    roleTheme: isStudent ? 'student' : 'admin',
    style: {
      maxWidth: '520px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: `auth-role-pill ${isStudent ? 'student' : 'admin'}`
  }, /*#__PURE__*/React.createElement(Icons.Lock, null), " Password Recovery"), /*#__PURE__*/React.createElement("h2", {
    className: "auth-title"
  }, "Reset Your Password"), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "Real-time OTP verification via email")), step < 4 && /*#__PURE__*/React.createElement("div", {
    className: "otp-steps-indicator"
  }, /*#__PURE__*/React.createElement("div", {
    className: `otp-step-dot ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`
  }), /*#__PURE__*/React.createElement("div", {
    className: `otp-step-dot ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`
  }), /*#__PURE__*/React.createElement("div", {
    className: `otp-step-dot ${step === 3 ? 'active' : ''}`
  })), errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "form-error-alert",
    style: {
      flexDirection: 'column',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icons.XCircle, null), /*#__PURE__*/React.createElement("span", null, errorMsg)), isSmtpConfigError && /*#__PURE__*/React.createElement("div", {
    className: "smtp-notice-box",
    style: {
      marginTop: '8px',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement(Icons.AlertTriangle, null), " Email Service Configuration Required"), /*#__PURE__*/React.createElement("p", null, "Real email dispatch requires SMTP credentials in ", /*#__PURE__*/React.createElement("code", null, "config.json"), ":"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '8px',
      fontSize: '0.78rem'
    }
  }, /*#__PURE__*/React.createElement("ol", {
    style: {
      paddingLeft: '18px',
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("li", null, "Open ", /*#__PURE__*/React.createElement("code", null, "config.json"), " in the server root."), /*#__PURE__*/React.createElement("li", null, "Set ", /*#__PURE__*/React.createElement("code", null, "smtp.host"), " (e.g. ", /*#__PURE__*/React.createElement("code", null, "smtp.gmail.com"), ")."), /*#__PURE__*/React.createElement("li", null, "Set ", /*#__PURE__*/React.createElement("code", null, "smtp.port"), " (e.g. ", /*#__PURE__*/React.createElement("code", null, "587"), ")."), /*#__PURE__*/React.createElement("li", null, "Set ", /*#__PURE__*/React.createElement("code", null, "smtp.username"), " to your sender email."), /*#__PURE__*/React.createElement("li", null, "Set ", /*#__PURE__*/React.createElement("code", null, "smtp.password"), " to your App Password."))))), step === 1 && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSendOtp
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.84rem',
      color: 'var(--text-secondary)',
      marginBottom: '18px',
      lineHeight: 1.5
    }
  }, "Enter the email address registered with your student account. A 6-digit One-Time Password (OTP) will be sent to your inbox."), /*#__PURE__*/React.createElement(FloatingInput, {
    id: "reset-email",
    label: "Registered Email Address",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true,
    autoFocus: true
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-gradient-primary btn-block",
    disabled: loading
  }, loading ? 'Dispatching OTP via Email...' : 'Send 6-Digit OTP'), /*#__PURE__*/React.createElement("div", {
    className: "auth-footer-links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#back",
    onClick: e => {
      e.preventDefault();
      onNavigate(isStudent ? '/student/login' : '/admin/login');
    }
  }, "← Back to Sign In"))), step === 2 && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleVerifyOtp
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: '18px'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.84rem',
      color: 'var(--text-secondary)',
      marginBottom: '6px'
    }
  }, "Enter the 6-digit code sent to ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text-highlight)'
    }
  }, email), ":"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.78rem',
      color: timer < 120 ? '#ef4444' : 'var(--accent-blue)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", null, "⏱️ Code expires in: ", formatTimer(timer)))), /*#__PURE__*/React.createElement(FloatingInput, {
    id: "reset-otp-input",
    label: "6-Digit Verification Code",
    type: "text",
    value: otp,
    onChange: e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)),
    placeholder: "e.g. 583921",
    required: true,
    autoFocus: true,
    style: {
      textAlign: 'center',
      letterSpacing: '6px',
      fontSize: '1.25rem',
      fontWeight: 700
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      fontSize: '0.78rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Attempt limit: 3 maximum"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "resend-otp-btn",
    onClick: handleResendOtp,
    disabled: resendCooldown > 0 || loading
  }, resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code')), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-gradient-primary btn-block",
    disabled: loading || otp.trim().length !== 6
  }, loading ? 'Verifying OTP...' : 'Verify OTP Code'), /*#__PURE__*/React.createElement("div", {
    className: "auth-footer-links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#change-email",
    onClick: e => {
      e.preventDefault();
      setStep(1);
      setErrorMsg('');
    }
  }, "← Change email address"))), step === 3 && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleResetPassword
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.84rem',
      color: 'var(--text-secondary)',
      marginBottom: '18px'
    }
  }, "OTP successfully verified. Create your new password (minimum 8 characters with upper, lower, and digit):"), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "otp-new-password",
    label: "New Password",
    value: newPassword,
    onChange: e => setNewPassword(e.target.value),
    required: true,
    autoFocus: true
  }), /*#__PURE__*/React.createElement(StrengthMeter, {
    password: newPassword
  }), /*#__PURE__*/React.createElement(PasswordInput, {
    id: "otp-confirm-password",
    label: "Confirm New Password",
    value: confirmPassword,
    onChange: e => setConfirmPassword(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-gradient-primary btn-block",
    disabled: loading
  }, loading ? 'Saving New Password...' : 'Save Password & Return to Login')), step === 4 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "form-success-alert"
  }, /*#__PURE__*/React.createElement("strong", null, "🎉 Password Reset Successful!"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Your new password has been securely saved, and all prior active sessions have been invalidated. You can now log in with your updated credentials."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-gradient-primary btn-block",
    onClick: () => onNavigate(isStudent ? '/student/login' : '/admin/login')
  }, "Proceed to Sign In"))));
}
function ResetPasswordPage({
  onNavigate,
  role = 'student'
}) {
  return /*#__PURE__*/React.createElement(ForgotPasswordPage, {
    onNavigate: onNavigate,
    role: role
  });
}

// ==========================================================================
//   PAGE 8: STUDENT MY-SEAT PORTAL (/student/my-seat)
//   Displays the student's assigned room and seat highlighted in 3D!
// ==========================================================================
function StudentMySeatPage({
  user,
  onLogout
}) {
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 3D Isometric View parameters
  const [pitch, setPitch] = useState(48);
  const [yaw, setYaw] = useState(-28);
  const [zoom, setZoom] = useState(1.05);
  const [is3DDragging, setIs3DDragging] = useState(false);
  const dragStartRef = useRef({
    x: 0,
    y: 0
  });
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
  const handleMouseDown = e => {
    setIs3DDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };
  const handleMouseMove = e => {
    if (!is3DDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
    setYaw(prev => prev + deltaX * 0.5);
    setPitch(prev => Math.min(80, Math.max(10, prev - deltaY * 0.5)));
  };
  const handleMouseUp = () => {
    setIs3DDragging(false);
  };
  const info = seatData ? seatData.data : null;
  const isAllocated = seatData ? seatData.allocated : false;
  return /*#__PURE__*/React.createElement("div", {
    className: "main-wrapper",
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-logo-icon"
  }, /*#__PURE__*/React.createElement(Icons.StudentCap, null)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.05rem',
      margin: 0
    }
  }, "Student Examination Portal"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--accent-teal)'
    }
  }, "Official Candidate Seat Pass"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-profile-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-avatar-circle student"
  }, user.name ? user.name.charAt(0).toUpperCase() : 'S'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-meta-name"
  }, user.name), /*#__PURE__*/React.createElement("div", {
    className: "user-meta-role"
  }, "Roll #", user.roll, " • Candidate"))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: onLogout,
    title: "Sign Out"
  }, /*#__PURE__*/React.createElement(Icons.LogOut, null), " Sign Out"))), /*#__PURE__*/React.createElement("main", {
    className: "content-body",
    style: {
      maxWidth: '1100px'
    }
  }, loading && !seatData ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '40px',
      height: '40px',
      border: '3px solid rgba(255,255,255,0.1)',
      borderTopColor: 'var(--accent-teal)',
      borderRadius: '50%',
      margin: '0 auto 16px',
      animation: 'spin 0.8s linear infinite'
    }
  }), /*#__PURE__*/React.createElement("div", null, "Retrieving verified examination seat record...")) : errorMsg ? /*#__PURE__*/React.createElement("div", {
    className: "glass-panel",
    style: {
      textAlign: 'center',
      padding: '40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--accent-rose)',
      fontSize: '1.1rem',
      marginBottom: '12px'
    }
  }, errorMsg), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: fetchSeat
  }, "Retry")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "admit-slip-card",
    style: {
      maxWidth: '100%',
      marginBottom: '28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: '1px solid var(--border-glass)',
      paddingBottom: '16px',
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.4rem',
      fontWeight: 800,
      color: 'var(--text-highlight)'
    }
  }, info.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem',
      color: 'var(--accent-teal)',
      marginTop: '2px'
    }
  }, "Candidate Roll: ", /*#__PURE__*/React.createElement("strong", null, "#", info.roll), " • Section ", info.section)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => window.print()
  }, /*#__PURE__*/React.createElement(Icons.Printer, null), " Print Seat Pass"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.68rem',
      color: 'var(--text-muted)',
      marginTop: '6px'
    }
  }, "Official Admit Slip"))), isAllocated ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px',
      background: 'rgba(95, 168, 160, 0.1)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(95, 168, 160, 0.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, "Assigned Room"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.8rem',
      fontWeight: 800,
      color: 'var(--accent-teal)'
    }
  }, "Room ", info.room_no), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    }
  }, "Invigilator: ", info.invigilator)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px',
      background: 'rgba(212, 184, 150, 0.1)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(212, 184, 150, 0.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, "Assigned Desk"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.8rem',
      fontWeight: 800,
      color: 'var(--accent-sand)'
    }
  }, "Seat #", info.seat_no), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    }
  }, "Grid: Row ", info.row, ", Desk ", info.col, " ", info.is_priority ? '(Front Priority)' : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, "Subject"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.3rem',
      fontWeight: 700,
      color: 'var(--text-highlight)'
    }
  }, info.subject), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    }
  }, "Examination Paper"))), info.special_requirement && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(201, 138, 138, 0.15)',
      border: '1px solid rgba(201, 138, 138, 0.35)',
      color: 'var(--accent-rose)',
      fontSize: '0.82rem',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Special Accommodation:"), " ", info.special_requirement)) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '30px 20px',
      textAlign: 'center',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: 'var(--accent-sand)',
      marginBottom: '8px'
    }
  }, "Seating Plan In Progress"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: '0.85rem',
      maxWidth: '500px',
      margin: '0 auto'
    }
  }, info.message || 'The examination coordinator has not finalized room allocations yet. Once published, your assigned room and 3D desk location will appear here automatically.'))), isAllocated && /*#__PURE__*/React.createElement("div", {
    className: "room-3d-wrapper"
  }, /*#__PURE__*/React.createElement("div", {
    className: "room-3d-toolbar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--accent-teal)'
    }
  }, /*#__PURE__*/React.createElement(Icons.Cube, null), " 3D Room Spotlight • Room ", info.room_no), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.76rem',
      color: 'var(--text-secondary)'
    }
  }, "Your assigned desk (Seat #", info.seat_no, ") is highlighted in glowing teal below")), /*#__PURE__*/React.createElement("div", {
    className: "room-controls-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slider-control"
  }, /*#__PURE__*/React.createElement("span", null, "Pitch: ", pitch, "°"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "15",
    max: "75",
    value: pitch,
    onChange: e => setPitch(Number(e.target.value))
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider-control"
  }, /*#__PURE__*/React.createElement("span", null, "Yaw: ", yaw, "°"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "-180",
    max: "180",
    value: yaw,
    onChange: e => setYaw(Number(e.target.value))
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider-control"
  }, /*#__PURE__*/React.createElement("span", null, "Zoom: ", zoom.toFixed(1), "x"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.7",
    max: "1.4",
    step: "0.05",
    value: zoom,
    onChange: e => setZoom(Number(e.target.value))
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => {
      setPitch(48);
      setYaw(-28);
      setZoom(1.05);
    }
  }, "Reset Camera"))), /*#__PURE__*/React.createElement("div", {
    className: "viewport-3d",
    onMouseDown: handleMouseDown,
    title: "Click and drag to rotate the examination room"
  }, /*#__PURE__*/React.createElement("div", {
    className: "room-stage-3d",
    style: {
      transform: `rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${zoom})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "floor-3d"
  }), /*#__PURE__*/React.createElement("div", {
    className: "invigilator-stage-3d"
  }, /*#__PURE__*/React.createElement("div", {
    className: "board-label"
  }, "BLACKBOARD • INVIGILATOR DESK"), /*#__PURE__*/React.createElement("div", {
    className: "invigilator-name"
  }, info.invigilator, " (Room ", info.room_no, ")")), /*#__PURE__*/React.createElement("div", {
    className: "entrance-marker-3d"
  }, "← ENTRANCE"), /*#__PURE__*/React.createElement("div", {
    className: "desks-grid-3d"
  }, Array.from({
    length: 6
  }).map((_, seatIdx) => {
    const seatNumber = seatIdx + 1;
    const isMySeat = seatNumber === info.seat_no;
    const isPriority = [1, 2].includes(seatNumber);
    return /*#__PURE__*/React.createElement("div", {
      key: seatNumber,
      className: `desk-block-3d ${isPriority ? 'priority-seat' : ''} ${isMySeat ? 'my-seat-desk-3d' : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "desk-shadow"
    }), /*#__PURE__*/React.createElement("div", {
      className: "desk-side-left"
    }), /*#__PURE__*/React.createElement("div", {
      className: "desk-side-right"
    }), /*#__PURE__*/React.createElement("div", {
      className: "desk-front"
    }), /*#__PURE__*/React.createElement("div", {
      className: "desk-top"
    }, isMySeat && /*#__PURE__*/React.createElement("div", {
      className: "my-seat-pulse-tag"
    }, "YOUR SEAT (#", seatNumber, ")"), /*#__PURE__*/React.createElement("div", {
      className: "desk-header"
    }, /*#__PURE__*/React.createElement("span", {
      className: "seat-badge"
    }, "Seat #", seatNumber), isPriority && /*#__PURE__*/React.createElement("span", {
      className: "priority-tag"
    }, "Priority")), /*#__PURE__*/React.createElement("div", {
      className: "student-info"
    }, /*#__PURE__*/React.createElement("div", {
      className: "student-name"
    }, isMySeat ? info.name : `Seat ${seatNumber}`), /*#__PURE__*/React.createElement("div", {
      className: "student-roll"
    }, isMySeat ? `Roll: #${info.roll}` : 'Occupied')), /*#__PURE__*/React.createElement("div", {
      className: "desk-tags"
    }, isMySeat ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: `tag ${getSectionClass(info.section)}`
    }, "Sec ", info.section), /*#__PURE__*/React.createElement("span", {
      className: "tag tag-subject"
    }, info.subject)) : /*#__PURE__*/React.createElement("span", {
      className: "tag tag-subject"
    }, "Assigned Desk"))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "room-3d-legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'var(--accent-teal)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Your Allocated Seat")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'rgba(212, 184, 150, 0.4)',
      border: '1px solid var(--accent-sand)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Priority Seat (Seats 1, 2)")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: '#242935',
      border: '1px solid var(--border-glass)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Other Examination Desks")))))));
}

// ==========================================================================
//   PAGE 9: ADMIN DASHBOARD (/admin/dashboard)
//   Full Examination Seating Coordinator System
// ==========================================================================
function AdminDashboardPage({
  user,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appState, setAppState] = useState({
    students: [],
    rooms: [],
    seating_generated: false,
    total_students: 0,
    total_capacity: 0
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
  const dragStartRef = useRef({
    x: 0,
    y: 0
  });
  const addToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, {
      id,
      type,
      message
    }]);
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
      addToast('error', res.data && res.data.message || 'Seating generation failed constraints.');
      setStepStatus(prev => ({
        ...prev,
        assign: 'error'
      }));
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
  const runWorkflowStep = async stepKey => {
    setLoading(true);
    try {
      if (stepKey === 'validate') {
        const res = await adminApi.validateStudents();
        if (res.ok && res.data.data.valid) {
          addToast('success', `Validation Passed: ${res.data.data.total_students} records verified.`);
          setStepStatus(prev => ({
            ...prev,
            validate: 'done'
          }));
        } else {
          addToast('error', 'Validation failed: duplicate or incomplete records.');
          setStepStatus(prev => ({
            ...prev,
            validate: 'error'
          }));
        }
      } else if (stepKey === 'capacity') {
        const res = await adminApi.checkCapacity();
        if (res.ok && res.data.data.sufficient) {
          addToast('success', `Capacity Verified: ${res.data.data.total_students} candidates $\\le$ ${res.data.data.total_capacity} seats.`);
          setStepStatus(prev => ({
            ...prev,
            capacity: 'done'
          }));
        } else {
          addToast('error', 'Capacity check failed.');
          setStepStatus(prev => ({
            ...prev,
            capacity: 'error'
          }));
        }
      } else if (stepKey === 'group') {
        const res = await adminApi.groupStudents();
        if (res.ok && res.data.data) {
          addToast('success', 'Grouping: candidates sorted and section frequencies calculated.');
          setStepStatus(prev => ({
            ...prev,
            group: 'done'
          }));
          setActiveTab('grouping');
        }
      } else if (stepKey === 'arrange') {
        const res = await adminApi.arrangeSlots();
        if (res.ok && res.data.data) {
          addToast('success', `Slot Schedule Prepared: ${res.data.data.total_slots} round-robin slots.`);
          setStepStatus(prev => ({
            ...prev,
            arrange: 'done'
          }));
          setActiveTab('arrange');
        }
      } else if (stepKey === 'assign') {
        const res = await adminApi.assignSeats();
        if (res.ok && res.data.success) {
          addToast('success', 'Backtracking solver satisfied all adjacent rules and preferences!');
          setStepStatus(prev => ({
            ...prev,
            assign: 'done',
            plan: 'done'
          }));
          await loadState();
          setActiveTab('plan');
        } else {
          addToast('error', res.data && res.data.data && res.data.data.message || 'Assignment solver failed constraints.');
          setStepStatus(prev => ({
            ...prev,
            assign: 'error'
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };
  const handleMouseDown = e => {
    setIs3DDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };
  const handleMouseMove = e => {
    if (!is3DDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
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
  return /*#__PURE__*/React.createElement("div", {
    className: "app-container",
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove
  }, /*#__PURE__*/React.createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-logo-icon"
  }, /*#__PURE__*/React.createElement(Icons.ShieldAdmin, null)), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-brand"
  }, /*#__PURE__*/React.createElement("h1", null, "SeatGrid 3D"), /*#__PURE__*/React.createElement("p", null, "Admin Portal"))), /*#__PURE__*/React.createElement("nav", {
    className: "sidebar-nav"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-label"
  }, "Management"), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'dashboard' ? 'active' : ''}`,
    onClick: () => setActiveTab('dashboard')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Dashboard, null)), /*#__PURE__*/React.createElement("span", null, "Dashboard")), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'students' ? 'active' : ''}`,
    onClick: () => setActiveTab('students')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Users, null)), /*#__PURE__*/React.createElement("span", null, "Students"), /*#__PURE__*/React.createElement("span", {
    className: "nav-badge"
  }, appState.total_students)), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'rooms' ? 'active' : ''}`,
    onClick: () => setActiveTab('rooms')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Door, null)), /*#__PURE__*/React.createElement("span", null, "Rooms"), /*#__PURE__*/React.createElement("span", {
    className: "nav-badge"
  }, appState.rooms.length)), /*#__PURE__*/React.createElement("span", {
    className: "nav-label"
  }, "Allocation Pipeline"), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'grouping' ? 'active' : ''}`,
    onClick: () => setActiveTab('grouping')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Layers, null)), /*#__PURE__*/React.createElement("span", null, "Grouping")), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'arrange' ? 'active' : ''}`,
    onClick: () => setActiveTab('arrange')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Shuffle, null)), /*#__PURE__*/React.createElement("span", null, "Arrange & Assign")), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'plan' ? 'active' : ''}`,
    onClick: () => setActiveTab('plan')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Cube, null)), /*#__PURE__*/React.createElement("span", null, "3D Seating Plan"), appState.seating_generated && /*#__PURE__*/React.createElement("span", {
    className: "nav-badge",
    style: {
      background: 'rgba(155, 181, 154, 0.25)',
      color: 'var(--accent-sage)'
    }
  }, "Active")), /*#__PURE__*/React.createElement("span", {
    className: "nav-label"
  }, "Reports"), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'search' ? 'active' : ''}`,
    onClick: () => setActiveTab('search')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.Search, null)), /*#__PURE__*/React.createElement("span", null, "Student Search")), /*#__PURE__*/React.createElement("button", {
    className: `nav-item ${activeTab === 'summary' ? 'active' : ''}`,
    onClick: () => setActiveTab('summary')
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-icon"
  }, /*#__PURE__*/React.createElement(Icons.PieChart, null)), /*#__PURE__*/React.createElement("span", null, "Room Summary"))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "system-status-indicator"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "status-dot online"
  }), "Admin Authenticated"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      color: 'var(--accent-indigo)'
    }
  }, "Role: Admin")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: onLogout,
    style: {
      width: '100%',
      marginTop: '6px'
    }
  }, /*#__PURE__*/React.createElement(Icons.LogOut, null), " Sign Out"))), /*#__PURE__*/React.createElement("div", {
    className: "main-wrapper"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topbar-search-box"
  }, /*#__PURE__*/React.createElement("span", {
    className: "topbar-search-icon"
  }, /*#__PURE__*/React.createElement(Icons.Search, null)), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "topbar-search-input",
    placeholder: "Search candidate by name, roll, or subject...",
    value: globalSearchQuery,
    onChange: e => setGlobalSearchQuery(e.target.value),
    onFocus: () => {
      if (searchResults.length > 0) setShowSearchDropdown(true);
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "search-shortcut-badge"
  }, "Ctrl+K"), showSearchDropdown && searchResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
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
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 10px',
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, searchResults.length, " Results Found"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer'
    },
    onClick: () => setShowSearchDropdown(false)
  }, "Close")), searchResults.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.roll,
    style: {
      padding: '10px 12px',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(255,255,255,0.03)',
      marginBottom: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    onClick: () => {
      setSelectedStudentForDetail(s);
      setShowSearchDropdown(false);
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--text-highlight)'
    }
  }, s.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, "#", s.roll)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-secondary)'
    }
  }, "Sec: ", s.section, " | Sub: ", s.subject)), /*#__PURE__*/React.createElement("div", null, s.allocated ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      padding: '3px 8px',
      borderRadius: '4px',
      background: 'rgba(155, 181, 154, 0.2)',
      color: 'var(--accent-sage)',
      fontWeight: 600
    }
  }, "Room ", s.room_no, " • Seat ", s.seat_no) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      padding: '3px 8px',
      borderRadius: '4px',
      background: 'rgba(255, 255, 255, 0.08)',
      color: 'var(--text-muted)'
    }
  }, "Not Allocated")))))), /*#__PURE__*/React.createElement("div", {
    className: "topbar-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-profile-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-avatar-circle admin"
  }, "A"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-meta-name"
  }, user.username || user.name), /*#__PURE__*/React.createElement("div", {
    className: "user-meta-role"
  }, "Admin Controller"))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => setShowAddModal(true)
  }, /*#__PURE__*/React.createElement(Icons.Plus, null), " Add Candidate"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => setShowResetConfirm(true),
    title: "Reset allocation"
  }, /*#__PURE__*/React.createElement(Icons.Refresh, null), " Reset"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-indigo btn-sm",
    onClick: handleGenerateAll,
    disabled: loading
  }, loading ? 'Assigning...' : 'Auto Assign All'))), /*#__PURE__*/React.createElement("main", {
    className: "content-body"
  }, activeTab === 'dashboard' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-card tilt-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-title"
  }, "Total Candidates"), /*#__PURE__*/React.createElement("span", {
    className: "stat-icon teal"
  }, /*#__PURE__*/React.createElement(Icons.Users, null))), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, appState.total_students), /*#__PURE__*/React.createElement("div", {
    className: "stat-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Enrolled for examination"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-card tilt-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-title"
  }, "Examination Rooms"), /*#__PURE__*/React.createElement("span", {
    className: "stat-icon indigo"
  }, /*#__PURE__*/React.createElement(Icons.Door, null))), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, appState.rooms.length), /*#__PURE__*/React.createElement("div", {
    className: "stat-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Rooms: 101, 102, 103, 104"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-card tilt-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-title"
  }, "Room Capacity"), /*#__PURE__*/React.createElement("span", {
    className: "stat-icon sand"
  }, /*#__PURE__*/React.createElement(Icons.Layers, null))), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, appState.total_capacity), /*#__PURE__*/React.createElement("div", {
    className: "stat-meta"
  }, /*#__PURE__*/React.createElement("span", null, "6 desks per room"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-card tilt-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-title"
  }, "Seats Allocated"), /*#__PURE__*/React.createElement("span", {
    className: "stat-icon sage"
  }, /*#__PURE__*/React.createElement(Icons.Check, null))), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, totalAllocatedSeats, " / ", appState.total_capacity), /*#__PURE__*/React.createElement("div", {
    className: "stat-meta"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: appState.seating_generated ? 'var(--accent-sage)' : 'var(--text-muted)'
    }
  }, appState.seating_generated ? '100% Constraints Met' : 'Awaiting Allocation')))), /*#__PURE__*/React.createElement("div", {
    className: "glass-panel stepper-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stepper-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Examination Allocation Workflow"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Follow sequential verification steps powered by backend.py rules and iterative backtracking")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-indigo btn-sm",
    onClick: handleGenerateAll,
    disabled: loading
  }, "Execute Entire Pipeline"))), /*#__PURE__*/React.createElement("div", {
    className: "stepper-track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-item done",
    onClick: () => setActiveTab('students')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "1"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "Add / Manage", /*#__PURE__*/React.createElement("br", null), "Students"), /*#__PURE__*/React.createElement("div", {
    className: "step-connector"
  })), /*#__PURE__*/React.createElement("div", {
    className: `step-item ${stepStatus.validate}`,
    onClick: () => runWorkflowStep('validate')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "2"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "Validate", /*#__PURE__*/React.createElement("br", null), "Data Integrity"), /*#__PURE__*/React.createElement("div", {
    className: "step-connector"
  })), /*#__PURE__*/React.createElement("div", {
    className: `step-item ${stepStatus.capacity}`,
    onClick: () => runWorkflowStep('capacity')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "3"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "Check Room", /*#__PURE__*/React.createElement("br", null), "Capacity"), /*#__PURE__*/React.createElement("div", {
    className: "step-connector"
  })), /*#__PURE__*/React.createElement("div", {
    className: `step-item ${stepStatus.group}`,
    onClick: () => runWorkflowStep('group')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "4"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "Group & Sort", /*#__PURE__*/React.createElement("br", null), "Sections"), /*#__PURE__*/React.createElement("div", {
    className: "step-connector"
  })), /*#__PURE__*/React.createElement("div", {
    className: `step-item ${stepStatus.arrange}`,
    onClick: () => runWorkflowStep('arrange')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "5"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "Arrange", /*#__PURE__*/React.createElement("br", null), "Room Slots"), /*#__PURE__*/React.createElement("div", {
    className: "step-connector"
  })), /*#__PURE__*/React.createElement("div", {
    className: `step-item ${stepStatus.assign}`,
    onClick: () => runWorkflowStep('assign')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "6"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "Backtracking", /*#__PURE__*/React.createElement("br", null), "Assign Seats"), /*#__PURE__*/React.createElement("div", {
    className: "step-connector"
  })), /*#__PURE__*/React.createElement("div", {
    className: `step-item ${stepStatus.plan}`,
    onClick: () => setActiveTab('plan')
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-node"
  }, "7"), /*#__PURE__*/React.createElement("span", {
    className: "step-label"
  }, "View 3D", /*#__PURE__*/React.createElement("br", null), "Seating Plan")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '28px'
    }
  }, appState.rooms.map(room => {
    const occupiedCount = room.allocated_students ? room.allocated_students.length : 0;
    const percent = Math.round(occupiedCount / room.capacity * 100);
    return /*#__PURE__*/React.createElement("div", {
      key: room.room_no,
      className: "glass-panel",
      style: {
        padding: '20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '14px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: '1.1rem',
        color: 'var(--text-highlight)'
      }
    }, "Room ", room.room_no), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }
    }, "Invigilator: ", room.invigilator)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        padding: '3px 8px',
        borderRadius: '4px',
        background: percent === 100 ? 'rgba(155, 181, 154, 0.2)' : 'rgba(255, 255, 255, 0.08)',
        color: percent === 100 ? 'var(--accent-sage)' : 'var(--text-secondary)',
        fontWeight: 600
      }
    }, occupiedCount, " / ", room.capacity, " Desks")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${percent}%`,
        height: '100%',
        background: percent === 100 ? 'var(--accent-sage)' : 'var(--accent-teal)',
        transition: 'width 300ms'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        color: 'var(--text-muted)'
      }
    }, "Priority Seats: ", room.priority_seats.join(', ')), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-secondary btn-sm",
      onClick: () => {
        setSelectedRoom3D(room.room_no);
        setActiveTab('plan');
      }
    }, "Open 3D View")));
  })), /*#__PURE__*/React.createElement("div", {
    className: "glass-panel"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-sand)'
    }
  }, /*#__PURE__*/React.createElement(Icons.Layers, null)), " Active Seating Rules & Constraints"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '14px',
      fontSize: '0.82rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--accent-teal)',
      marginBottom: '4px'
    }
  }, "1. Section Diversity"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, "Adjacent students in the same room cannot be from the same section.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--accent-indigo)',
      marginBottom: '4px'
    }
  }, "2. Subject Isolation"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, "Adjacent students in the same room must take different subjects.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--accent-sand)',
      marginBottom: '4px'
    }
  }, "3. Special Seats Lock"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, "Kapil (101) pinned to Room 101 Seat 1; Sneha (105) pinned to Room 102 Seat 1.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--accent-sage)',
      marginBottom: '4px'
    }
  }, "4. Room Preferences"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, "Honours Anurag (Roll 102 → Room 104) and Priya (Roll 116 → Room 101)."))))), activeTab === 'students' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Student Enrollment Directory"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Admin candidate records. Students can only sign up if their roll number is listed here.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => runWorkflowStep('validate')
  }, /*#__PURE__*/React.createElement(Icons.Check, null), " Validate Records"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-indigo btn-sm",
    onClick: () => setShowAddModal(true)
  }, /*#__PURE__*/React.createElement(Icons.Plus, null), " Enroll Candidate"))), /*#__PURE__*/React.createElement("div", {
    className: "table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Roll No"), /*#__PURE__*/React.createElement("th", null, "Candidate Name"), /*#__PURE__*/React.createElement("th", null, "Section"), /*#__PURE__*/React.createElement("th", null, "Subject"), /*#__PURE__*/React.createElement("th", null, "Preferred Room"), /*#__PURE__*/React.createElement("th", null, "Special Need"), /*#__PURE__*/React.createElement("th", null, "Allocation"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, appState.students.map(s => {
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
    return /*#__PURE__*/React.createElement("tr", {
      key: s.roll
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 700,
        color: 'var(--text-highlight)'
      }
    }, "#", s.roll), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 600
      }
    }, s.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `tag ${getSectionClass(s.section)}`
    }, "Sec ", s.section)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "tag tag-subject"
    }, s.subject)), /*#__PURE__*/React.createElement("td", null, s.preferred_room ? `Room ${s.preferred_room}` : '—'), /*#__PURE__*/React.createElement("td", null, s.special_requirement ? /*#__PURE__*/React.createElement("span", {
      style: {
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'rgba(201, 138, 138, 0.2)',
        color: 'var(--accent-rose)',
        fontSize: '0.72rem',
        fontWeight: 600
      }
    }, s.special_requirement) : '—'), /*#__PURE__*/React.createElement("td", null, allocRoom ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--accent-sage)',
        fontWeight: 600
      }
    }, "Room ", allocRoom, " • Seat ", allocSeat) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }
    }, "Unallocated")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-danger btn-sm",
      onClick: () => setStudentToDelete(s)
    }, /*#__PURE__*/React.createElement(Icons.Trash, null))));
  }))))), activeTab === 'rooms' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Examination Rooms & Invigilators"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Room capacities, invigilator assignments, and priority front-seat allocations.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }
  }, appState.rooms.map(room => /*#__PURE__*/React.createElement("div", {
    key: room.room_no,
    className: "glass-panel"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Room ", room.room_no), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--accent-teal)'
    }
  }, "Invigilator: ", room.invigilator)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.2rem',
      fontWeight: 700,
      color: 'var(--text-highlight)'
    }
  }, (room.allocated_students || []).length, " / ", room.capacity), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)'
    }
  }, "Seats Filled"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--accent-sand)',
      marginBottom: '12px'
    }
  }, "★ Priority Seats: ", room.priority_seats.map(p => `Seat ${p}`).join(', ')), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '8px',
      letterSpacing: '0.05em'
    }
  }, "Seated Students:"), room.allocated_students && room.allocated_students.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, room.allocated_students.map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: st.roll,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(255,255,255,0.03)',
      fontSize: '0.8rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      fontWeight: 700,
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: i + 1 <= 2 ? 'rgba(212, 184, 150, 0.25)' : 'rgba(255,255,255,0.08)',
      color: i + 1 <= 2 ? 'var(--accent-sand)' : 'var(--text-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, st.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)'
    }
  }, "#", st.roll)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `tag ${getSectionClass(st.section)}`
  }, st.section), /*#__PURE__*/React.createElement("span", {
    className: "tag tag-subject"
  }, st.subject))))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.78rem'
    }
  }, "No students allocated yet.")))))), activeTab === 'grouping' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Section-wise Grouping & Sorting"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Result from group_students() in backend.py: groups candidates by section and sorts by roll number.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }
  }, ['A', 'B', 'C', 'D'].map(sec => {
    const count = appState.students.filter(s => s.section === sec).length;
    return /*#__PURE__*/React.createElement("div", {
      key: sec,
      className: "glass-panel",
      style: {
        padding: '18px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: `tag ${getSectionClass(sec)}`,
      style: {
        fontSize: '0.85rem',
        padding: '3px 10px'
      }
    }, "Section ", sec), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--text-highlight)'
      }
    }, count)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }
    }, (count / appState.total_students * 100 || 0).toFixed(1), "% of total students"));
  })), /*#__PURE__*/React.createElement("div", {
    className: "glass-panel"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '14px'
    }
  }, "Sorted Candidate Stream (Roll Ascending)"), /*#__PURE__*/React.createElement("div", {
    className: "table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Roll No"), /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Section"), /*#__PURE__*/React.createElement("th", null, "Subject"), /*#__PURE__*/React.createElement("th", null, "Special Note"))), /*#__PURE__*/React.createElement("tbody", null, [...appState.students].sort((a, b) => a.roll - b.roll).map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.roll
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 700,
      color: 'var(--text-highlight)'
    }
  }, "#", s.roll), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 600
    }
  }, s.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `tag ${getSectionClass(s.section)}`
  }, "Sec ", s.section)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag tag-subject"
  }, s.subject)), /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--text-muted)'
    }
  }, s.special_requirement || (s.preferred_room ? `Prefers Room ${s.preferred_room}` : 'Standard'))))))))), activeTab === 'arrange' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Seating Slots & Backtracking Assignment"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Visualizes arrange_students() interleaved slot ordering and executes assign_seats().")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-indigo",
    onClick: () => runWorkflowStep('assign'),
    disabled: loading
  }, "Run Backtracking Assignment")), /*#__PURE__*/React.createElement("div", {
    className: "glass-panel",
    style: {
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '14px'
    }
  }, "Interleaved Slot Sequence (24 Examination Slots)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: '10px'
    }
  }, Array.from({
    length: 6
  }).map((_, seatIdx) => {
    const seatNo = seatIdx + 1;
    return appState.rooms.map(r => {
      const isAllocated = r.allocated_students && r.allocated_students[seatIdx];
      const student = isAllocated ? r.allocated_students[seatIdx] : null;
      return /*#__PURE__*/React.createElement("div", {
        key: `${r.room_no}-${seatNo}`,
        style: {
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          background: student ? 'rgba(95, 168, 160, 0.12)' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${student ? 'rgba(95, 168, 160, 0.3)' : 'var(--border-subtle)'}`,
          fontSize: '0.78rem'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--text-muted)',
          fontSize: '0.7rem'
        }
      }, /*#__PURE__*/React.createElement("span", null, "R", r.room_no), /*#__PURE__*/React.createElement("span", null, "Seat ", seatNo)), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: '6px',
          fontWeight: 600,
          color: student ? 'var(--text-highlight)' : 'var(--text-muted)'
        }
      }, student ? student.name : 'Slot Available'), student && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: '0.68rem',
          color: 'var(--accent-teal)',
          marginTop: '2px'
        }
      }, "Sec ", student.section, " • ", student.subject));
    });
  })))), activeTab === 'plan' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "room-3d-wrapper"
  }, /*#__PURE__*/React.createElement("div", {
    className: "room-3d-toolbar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-teal)'
    }
  }, /*#__PURE__*/React.createElement(Icons.Cube, null)), " 3D Isometric Examination Hall"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.76rem',
      color: 'var(--text-secondary)'
    }
  }, "Interactive 3D physical desks with depth, priority indicators, and real-time candidate cards")), /*#__PURE__*/React.createElement("div", {
    className: "room-selector-tabs"
  }, appState.rooms.map(r => /*#__PURE__*/React.createElement("button", {
    key: r.room_no,
    className: `room-tab-btn ${selectedRoom3D === r.room_no ? 'active' : ''}`,
    onClick: () => setSelectedRoom3D(r.room_no)
  }, "Room ", r.room_no))), /*#__PURE__*/React.createElement("div", {
    className: "room-controls-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slider-control"
  }, /*#__PURE__*/React.createElement("span", null, "Pitch: ", pitch, "°"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "15",
    max: "75",
    value: pitch,
    onChange: e => setPitch(Number(e.target.value))
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider-control"
  }, /*#__PURE__*/React.createElement("span", null, "Yaw: ", yaw, "°"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "-180",
    max: "180",
    value: yaw,
    onChange: e => setYaw(Number(e.target.value))
  })), /*#__PURE__*/React.createElement("div", {
    className: "slider-control"
  }, /*#__PURE__*/React.createElement("span", null, "Zoom: ", zoom.toFixed(1), "x"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.7",
    max: "1.4",
    step: "0.05",
    value: zoom,
    onChange: e => setZoom(Number(e.target.value))
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => {
      setPitch(45);
      setYaw(-30);
      setZoom(1.0);
    }
  }, "Reset View"))), /*#__PURE__*/React.createElement("div", {
    className: "viewport-3d",
    onMouseDown: handleMouseDown,
    title: "Click and drag to rotate the 3D room"
  }, /*#__PURE__*/React.createElement("div", {
    className: "room-stage-3d",
    style: {
      transform: `rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${zoom})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "floor-3d"
  }), (() => {
    const currentRoomObj = appState.rooms.find(r => r.room_no === selectedRoom3D);
    return /*#__PURE__*/React.createElement("div", {
      className: "invigilator-stage-3d"
    }, /*#__PURE__*/React.createElement("div", {
      className: "board-label"
    }, "BLACKBOARD • INVIGILATOR DESK"), /*#__PURE__*/React.createElement("div", {
      className: "invigilator-name"
    }, currentRoomObj ? currentRoomObj.invigilator : 'Invigilator', " (Room ", selectedRoom3D, ")"));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "entrance-marker-3d"
  }, "← MAIN ENTRANCE"), /*#__PURE__*/React.createElement("div", {
    className: "desks-grid-3d"
  }, (() => {
    const currentRoom = appState.rooms.find(r => r.room_no === selectedRoom3D) || {
      allocated_students: [],
      capacity: 6,
      priority_seats: [1, 2]
    };
    const capacity = currentRoom.capacity || 6;
    const allocatedList = currentRoom.allocated_students || [];
    return Array.from({
      length: capacity
    }).map((_, seatIdx) => {
      const seatNumber = seatIdx + 1;
      const student = allocatedList[seatIdx];
      const isPriority = (currentRoom.priority_seats || [1, 2]).includes(seatNumber);
      return /*#__PURE__*/React.createElement("div", {
        key: seatNumber,
        className: `desk-block-3d ${isPriority ? 'priority-seat' : ''} ${!student ? 'empty-seat' : ''}`,
        onClick: () => {
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
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "desk-shadow"
      }), /*#__PURE__*/React.createElement("div", {
        className: "desk-side-left"
      }), /*#__PURE__*/React.createElement("div", {
        className: "desk-side-right"
      }), /*#__PURE__*/React.createElement("div", {
        className: "desk-front"
      }), /*#__PURE__*/React.createElement("div", {
        className: "desk-top"
      }, /*#__PURE__*/React.createElement("div", {
        className: "desk-header"
      }, /*#__PURE__*/React.createElement("span", {
        className: "seat-badge"
      }, "Seat #", seatNumber), isPriority && /*#__PURE__*/React.createElement("span", {
        className: "priority-tag"
      }, "Priority")), student ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "student-info"
      }, /*#__PURE__*/React.createElement("div", {
        className: "student-name"
      }, student.name), /*#__PURE__*/React.createElement("div", {
        className: "student-roll"
      }, "Roll: #", student.roll)), /*#__PURE__*/React.createElement("div", {
        className: "desk-tags"
      }, /*#__PURE__*/React.createElement("span", {
        className: `tag ${getSectionClass(student.section)}`
      }, "Sec ", student.section), /*#__PURE__*/React.createElement("span", {
        className: "tag tag-subject"
      }, student.subject))) : /*#__PURE__*/React.createElement("div", {
        className: "empty-seat-text"
      }, "Empty Seat")));
    });
  })()))), /*#__PURE__*/React.createElement("div", {
    className: "room-3d-legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: '#242935',
      border: '1px solid var(--border-glass)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Normal Seat")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'rgba(212, 184, 150, 0.4)',
      border: '1px solid var(--accent-sand)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Priority Seat (Seats 1, 2)")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'var(--accent-teal)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Section A")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'var(--accent-indigo)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Section B")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'var(--accent-sage)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Section C")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color-box",
    style: {
      background: 'var(--accent-sand)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Section D"))))), activeTab === 'search' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Candidate Seat Lookup & Admit Pass"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Search by roll number, student name, or subject to generate the official examination seat pass.")), /*#__PURE__*/React.createElement("div", {
    className: "glass-panel",
    style: {
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Enter Candidate Roll Number, Name, Section, or Subject...",
    value: globalSearchQuery,
    onChange: e => setGlobalSearchQuery(e.target.value)
  })), selectedStudentForDetail ? /*#__PURE__*/React.createElement("div", {
    className: "glass-panel"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Official Examination Seat Slip"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => setSelectedStudentForDetail(null)
  }, "Back to Search"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary btn-sm",
    onClick: () => window.print()
  }, /*#__PURE__*/React.createElement(Icons.Printer, null), " Print Admit Pass"))), /*#__PURE__*/React.createElement("div", {
    className: "admit-slip-card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-glass)',
      paddingBottom: '16px',
      marginBottom: '18px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: 'var(--text-highlight)'
    }
  }, selectedStudentForDetail.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--accent-teal)'
    }
  }, "Candidate Roll: #", selectedStudentForDetail.roll)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Status"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: selectedStudentForDetail.allocated ? 'var(--accent-sage)' : 'var(--accent-rose)'
    }
  }, selectedStudentForDetail.allocated ? 'ALLOCATED' : 'NOT ALLOCATED'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, "Section"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: '0.95rem'
    }
  }, "Section ", selectedStudentForDetail.section)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, "Examination Subject"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: '0.95rem',
      color: 'var(--accent-sand)'
    }
  }, selectedStudentForDetail.subject)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, "Assigned Room"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: '1.2rem',
      color: 'var(--text-highlight)'
    }
  }, selectedStudentForDetail.room_no ? `Room ${selectedStudentForDetail.room_no}` : 'Pending')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, "Seat Number"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: '1.2rem',
      color: 'var(--accent-teal)'
    }
  }, selectedStudentForDetail.seat_no ? `Seat #${selectedStudentForDetail.seat_no}` : 'Pending')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, "Invigilator In Charge"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem'
    }
  }, selectedStudentForDetail.invigilator || 'To be announced')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, "Seat Priority Class"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem'
    }
  }, selectedStudentForDetail.is_priority ? 'Front Priority (Seat 1-2)' : 'Standard Examination Desk'))))) : /*#__PURE__*/React.createElement("div", {
    className: "table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Roll No"), /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Section"), /*#__PURE__*/React.createElement("th", null, "Subject"), /*#__PURE__*/React.createElement("th", null, "Room"), /*#__PURE__*/React.createElement("th", null, "Seat"), /*#__PURE__*/React.createElement("th", null, "Invigilator"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, (searchResults.length > 0 ? searchResults : appState.students).map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.roll
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 700,
      color: 'var(--text-highlight)'
    }
  }, "#", s.roll), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 600
    }
  }, s.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `tag ${getSectionClass(s.section)}`
  }, "Sec ", s.section)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag tag-subject"
  }, s.subject)), /*#__PURE__*/React.createElement("td", null, s.room_no ? `Room ${s.room_no}` : '—'), /*#__PURE__*/React.createElement("td", null, s.seat_no ? `Seat #${s.seat_no}` : '—'), /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: '0.8rem'
    }
  }, s.invigilator || '—'), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary btn-sm",
    onClick: () => setSelectedStudentForDetail(s)
  }, "View Pass")))))))), activeTab === 'summary' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Room-wise Capacity & Utilization Summary"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }
  }, "Comprehensive breakdown matching generate_room_summary() in backend.py.")), /*#__PURE__*/React.createElement("div", {
    className: "glass-panel",
    style: {
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-container"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Room Number"), /*#__PURE__*/React.createElement("th", null, "Invigilator"), /*#__PURE__*/React.createElement("th", null, "Capacity"), /*#__PURE__*/React.createElement("th", null, "Occupied"), /*#__PURE__*/React.createElement("th", null, "Available"), /*#__PURE__*/React.createElement("th", null, "Utilization"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, appState.rooms.map(r => {
    const occupied = (r.allocated_students || []).length;
    const available = r.capacity - occupied;
    const percent = Math.round(occupied / r.capacity * 100);
    return /*#__PURE__*/React.createElement("tr", {
      key: r.room_no
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 700,
        fontSize: '1rem',
        color: 'var(--text-highlight)'
      }
    }, "Room ", r.room_no), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 600
      }
    }, r.invigilator), /*#__PURE__*/React.createElement("td", null, r.capacity, " Seats"), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 700,
        color: 'var(--accent-sage)'
      }
    }, occupied), /*#__PURE__*/React.createElement("td", {
      style: {
        color: available === 0 ? 'var(--text-muted)' : 'var(--accent-sand)'
      }
    }, available), /*#__PURE__*/React.createElement("td", {
      style: {
        width: '180px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: '6px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '3px',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${percent}%`,
        height: '100%',
        background: percent === 100 ? 'var(--accent-sage)' : 'var(--accent-teal)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        fontWeight: 600
      }
    }, percent, "%"))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        padding: '3px 8px',
        borderRadius: '4px',
        background: percent === 100 ? 'rgba(155, 181, 154, 0.2)' : 'rgba(212, 184, 150, 0.2)',
        color: percent === 100 ? 'var(--accent-sage)' : 'var(--accent-sand)',
        fontWeight: 600
      }
    }, percent === 100 ? 'FULL CAPACITY' : 'SEATS VACANT')));
  })))))))), showAddModal && /*#__PURE__*/React.createElement(AddStudentModal, {
    onClose: () => setShowAddModal(false),
    onAdded: newStudent => {
      addToast('success', `Candidate ${newStudent.name} (Roll ${newStudent.roll}) enrolled.`);
      loadState();
      setShowAddModal(false);
    }
  }), studentToDelete && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    style: {
      maxWidth: '440px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, "Confirm Candidate Removal"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-icon",
    onClick: () => setStudentToDelete(null)
  }, /*#__PURE__*/React.createElement(Icons.Close, null))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("p", null, "Are you sure you want to delete candidate ", /*#__PURE__*/React.createElement("strong", null, studentToDelete.name), " (Roll #", studentToDelete.roll, ")?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--accent-rose)',
      marginTop: '8px'
    }
  }, "Existing seating arrangements will be reset to guarantee constraint validity.")), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => setStudentToDelete(null)
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: async () => {
      const res = await adminApi.removeStudent(studentToDelete.roll);
      if (res.ok && res.data.success) {
        addToast('info', `Candidate ${studentToDelete.roll} removed.`);
        loadState();
      } else {
        addToast('error', res.data.message);
      }
      setStudentToDelete(null);
    }
  }, "Confirm Delete")))), showResetConfirm && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    style: {
      maxWidth: '440px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, "Reset Seating Arrangement"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-icon",
    onClick: () => setShowResetConfirm(false)
  }, /*#__PURE__*/React.createElement(Icons.Close, null))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("p", null, "Are you sure you want to clear all allocated seats across all rooms?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-muted)',
      marginTop: '8px'
    }
  }, "Candidate records will remain intact.")), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: () => setShowResetConfirm(false)
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: handleReset
  }, "Reset All Seats")))), /*#__PURE__*/React.createElement("div", {
    className: "toast-container"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: `toast ${t.type}`
  }, /*#__PURE__*/React.createElement("div", null, t.type === 'success' && /*#__PURE__*/React.createElement(Icons.Check, null), t.type === 'error' && /*#__PURE__*/React.createElement(Icons.XCircle, null), t.type === 'info' && /*#__PURE__*/React.createElement(Icons.Layers, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, t.message)))));
}

// --- ADD STUDENT MODAL HELPER ---
function AddStudentModal({
  onClose,
  onAdded
}) {
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('Python');
  const [preferredRoom, setPreferredRoom] = useState('');
  const [specialRequirement, setSpecialRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const handleSubmit = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, "Enroll Candidate Record"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-icon",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icons.Close, null))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "form-error-alert"
  }, /*#__PURE__*/React.createElement(Icons.XCircle, null), " ", /*#__PURE__*/React.createElement("span", null, errorMsg)), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Candidate Roll Number *"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    placeholder: "e.g. 125",
    value: roll,
    onChange: e => setRoll(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Full Name *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. Tanmay Sharma",
    value: name,
    onChange: e => setName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Section *"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: section,
    onChange: e => setSection(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "A"
  }, "Section A"), /*#__PURE__*/React.createElement("option", {
    value: "B"
  }, "Section B"), /*#__PURE__*/React.createElement("option", {
    value: "C"
  }, "Section C"), /*#__PURE__*/React.createElement("option", {
    value: "D"
  }, "Section D"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Examination Subject *"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: subject,
    onChange: e => setSubject(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "Python"
  }, "Python"), /*#__PURE__*/React.createElement("option", {
    value: "Java"
  }, "Java"), /*#__PURE__*/React.createElement("option", {
    value: "C++"
  }, "C++"), /*#__PURE__*/React.createElement("option", {
    value: "JavaScript"
  }, "JavaScript")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Preferred Room (Optional)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: preferredRoom,
    onChange: e => setPreferredRoom(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "No Preference"), /*#__PURE__*/React.createElement("option", {
    value: "101"
  }, "Room 101 (Mrs. A Thakuri)"), /*#__PURE__*/React.createElement("option", {
    value: "102"
  }, "Room 102 (Mr. S Mitra)"), /*#__PURE__*/React.createElement("option", {
    value: "103"
  }, "Room 103 (Mrs. S Majumdar)"), /*#__PURE__*/React.createElement("option", {
    value: "104"
  }, "Room 104 (Mr. D Acharya)"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Special Requirement (Optional)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. Near Entrance, Front Row",
    value: specialRequirement,
    onChange: e => setSpecialRequirement(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-indigo",
    disabled: loading
  }, loading ? 'Enrolling...' : 'Enroll Candidate')))));
}

// ==========================================================================
//   PAGE 10: UNAUTHORIZED ACCESS PAGE (/unauthorized)
// ==========================================================================
function UnauthorizedPage({
  user,
  onNavigate,
  onLogout
}) {
  const isStudent = user && user.role === 'student';
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-viewport"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-blob auth-blob-indigo"
  }), /*#__PURE__*/React.createElement("div", {
    className: "unauthorized-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "unauthorized-icon"
  }, /*#__PURE__*/React.createElement(Icons.ShieldAdmin, null)), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.6rem',
      color: 'var(--text-highlight)',
      marginBottom: '8px'
    }
  }, "Access Restricted"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: '0.9rem',
      lineHeight: '1.6',
      marginBottom: '24px'
    }
  }, "You are currently signed in as ", /*#__PURE__*/React.createElement("strong", null, user ? user.name : 'Unknown'), " with role", ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: isStudent ? 'var(--accent-teal)' : 'var(--accent-indigo)',
      fontWeight: 700
    }
  }, user ? user.role.toUpperCase() : ''), ".", /*#__PURE__*/React.createElement("br", null), "You do not have permission to access this protected area."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn ${isStudent ? 'btn-primary' : 'btn-indigo'}`,
    onClick: () => onNavigate(isStudent ? '/student/my-seat' : '/admin/dashboard')
  }, "Return to My Portal"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    onClick: onLogout
  }, "Sign Out"))));
}

// ==========================================================================
//   MAIN APPLICATION ROUTER & ROOT CONTAINER
// ==========================================================================
function ExaminationApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = path => {
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
    return /*#__PURE__*/React.createElement("div", {
      className: "auth-viewport"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        color: 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '48px',
        height: '48px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: 'var(--accent-teal)',
        borderRadius: '50%',
        margin: '0 auto 16px',
        animation: 'spin 0.8s linear infinite'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        color: 'var(--text-highlight)'
      }
    }, "Authenticating Secure Session...")));
  }

  // --- ROUTE DISPATCHER ---

  // Public Route: Root / Landing
  if (currentPath === '/' || currentPath === '/index.html') {
    if (user) {
      if (user.role === 'admin') return /*#__PURE__*/React.createElement(AdminDashboardPage, {
        user: user,
        onLogout: handleLogout
      });
      return /*#__PURE__*/React.createElement(StudentMySeatPage, {
        user: user,
        onLogout: handleLogout
      });
    }
    return /*#__PURE__*/React.createElement(LandingPage, {
      onNavigate: navigate
    });
  }

  // Public Route: Student Login
  if (currentPath === '/student/login') {
    if (user && user.role === 'student') {
      return /*#__PURE__*/React.createElement(StudentMySeatPage, {
        user: user,
        onLogout: handleLogout
      });
    }
    return /*#__PURE__*/React.createElement(StudentLoginPage, {
      onNavigate: navigate,
      onLoginSuccess: handleLoginSuccess
    });
  }

  // Public Route: Student Signup
  if (currentPath === '/student/signup') {
    if (user && user.role === 'student') {
      return /*#__PURE__*/React.createElement(StudentMySeatPage, {
        user: user,
        onLogout: handleLogout
      });
    }
    return /*#__PURE__*/React.createElement(StudentSignupPage, {
      onNavigate: navigate,
      onLoginSuccess: handleLoginSuccess
    });
  }

  // Admin Login
  if (currentPath === '/admin/login' || currentPath === '/admin/signup') {
    if (user && user.role === 'admin') {
      return /*#__PURE__*/React.createElement(AdminDashboardPage, {
        user: user,
        onLogout: handleLogout
      });
    }
    return /*#__PURE__*/React.createElement(AdminLoginPage, {
      onNavigate: navigate,
      onLoginSuccess: handleLoginSuccess
    });
  }

  // Public Route: Forgot / Reset Password
  if (currentPath === '/forgot-password' || currentPath === '/reset-password') {
    return /*#__PURE__*/React.createElement(ForgotPasswordPage, {
      onNavigate: navigate,
      role: queryRole
    });
  }

  // Protected Route: Student Dashboard / Seat Locator (/student/my-seat or /student/dashboard)
  if (currentPath === '/student/my-seat' || currentPath === '/student/dashboard') {
    if (!user) {
      return /*#__PURE__*/React.createElement(StudentLoginPage, {
        onNavigate: navigate,
        onLoginSuccess: handleLoginSuccess
      });
    }
    if (user.role !== 'student' && user.role !== 'admin') {
      return /*#__PURE__*/React.createElement(UnauthorizedPage, {
        user: user,
        onNavigate: navigate,
        onLogout: handleLogout
      });
    }
    return /*#__PURE__*/React.createElement(StudentMySeatPage, {
      user: user,
      onLogout: handleLogout
    });
  }

  // Protected Route: Admin Dashboard (/admin/dashboard)
  if (currentPath === '/admin/dashboard') {
    if (!user) {
      return /*#__PURE__*/React.createElement(AdminLoginPage, {
        onNavigate: navigate,
        onLoginSuccess: handleLoginSuccess
      });
    }
    if (user.role !== 'admin') {
      return /*#__PURE__*/React.createElement(UnauthorizedPage, {
        user: user,
        onNavigate: navigate,
        onLogout: handleLogout
      });
    }
    return /*#__PURE__*/React.createElement(AdminDashboardPage, {
      user: user,
      onLogout: handleLogout
    });
  }

  // Unauthorized page
  if (currentPath === '/unauthorized') {
    return /*#__PURE__*/React.createElement(UnauthorizedPage, {
      user: user,
      onNavigate: navigate,
      onLogout: handleLogout
    });
  }

  // Fallback route: default to Landing
  return /*#__PURE__*/React.createElement(LandingPage, {
    onNavigate: navigate
  });
}

// --- MOUNT REACT APP ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(ExaminationApp, null));
}