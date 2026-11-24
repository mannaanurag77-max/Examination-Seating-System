# ==========================================================================
#   EXAMINATION SEATING ARRANGEMENT SYSTEM - API SERVER (api_server.py)
#   Pure Python standard library HTTP Server with Auth & Role Enforcement
# ==========================================================================

import http.server
import json
import urllib.parse
import os
import sys
import mimetypes

import auth
import backend

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".jsx")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

class SeatingApiRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    HTTP Request Handler serving both the 3D React SPA
    and Role-Enforced RESTful JSON APIs.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=TEMPLATES_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for cross-origin development (e.g. Vite, React dev server)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, PUT")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def parse_body(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                raw = self.rfile.read(content_length)
                return json.loads(raw.decode("utf-8"))
        except Exception:
            pass
        return {}

    # -------------------- GET ROUTER --------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. PUBLIC AUTH ROUTE: Get Current User profile
        if path == "/api/auth/me":
            session_data, err_code, err_msg = auth.authenticate_request(self.headers)
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            
            # Enrich student profile if available
            user_data = dict(session_data)
            if user_data.get("role") == "student" and user_data.get("roll"):
                for s in backend.students:
                    if s["roll"] == user_data["roll"]:
                        user_data["section"] = s.get("section")
                        user_data["subject"] = s.get("subject")
                        user_data["preferred_room"] = s.get("preferred_room")
                        user_data["special_requirement"] = s.get("special_requirement")
                        break
            
            self.send_json(200, {"success": True, "user": user_data})
            return

        # 2. STUDENT-SPECIFIC ROUTE: /api/my_seat
        # Strictly reads student roll from the authenticated session (never from query param)
        elif path == "/api/my_seat":
            session_data, err_code, err_msg = auth.require_role(self.headers, ["student", "admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return

            roll = session_data.get("roll")
            if not roll:
                self.send_json(400, {"success": False, "error": "No student roll number associated with this account."})
                return

            # Lookup student record in backend
            student_info = None
            for s in backend.students:
                if s["roll"] == roll:
                    student_info = s
                    break

            if not student_info:
                self.send_json(404, {"success": False, "error": "Student candidate record not found."})
                return

            # Check if allocated in any room
            allocated_room = None
            seat_index = None
            invigilator = None
            is_priority = False

            for r in backend.rooms:
                for idx, al in enumerate(r.get("allocated_students", []), start=1):
                    if al.get("roll") == roll:
                        allocated_room = r["room_no"]
                        seat_index = idx
                        invigilator = r["invigilator"]
                        is_priority = idx in r.get("priority_seats", [1, 2])
                        break
                if allocated_room:
                    break

            # Calculate Row and Column (for 3x2 room layout)
            # Seat 1: Row 1, Col 1; Seat 2: Row 1, Col 2; Seat 3: Row 1, Col 3
            # Seat 4: Row 2, Col 1; Seat 5: Row 2, Col 2; Seat 6: Row 2, Col 3
            row = None
            col = None
            if seat_index:
                row = ((seat_index - 1) // 3) + 1
                col = ((seat_index - 1) % 3) + 1

            # Prepare room preview for the 3D viewer
            rooms_overview = []
            for r in backend.rooms:
                rooms_overview.append({
                    "room_no": r["room_no"],
                    "invigilator": r["invigilator"],
                    "capacity": r["capacity"],
                    "priority_seats": r.get("priority_seats", [1, 2]),
                    "allocated_students": r.get("allocated_students", [])
                })

            if allocated_room:
                self.send_json(200, {
                    "success": True,
                    "allocated": True,
                    "data": {
                        "roll": roll,
                        "name": student_info["name"],
                        "section": student_info["section"],
                        "subject": student_info["subject"],
                        "room_no": allocated_room,
                        "seat_no": seat_index,
                        "row": row,
                        "col": col,
                        "invigilator": invigilator,
                        "is_priority": is_priority,
                        "special_requirement": student_info.get("special_requirement"),
                        "preferred_room": student_info.get("preferred_room"),
                        "rooms_overview": rooms_overview
                    }
                })
            else:
                self.send_json(200, {
                    "success": True,
                    "allocated": False,
                    "data": {
                        "roll": roll,
                        "name": student_info["name"],
                        "section": student_info["section"],
                        "subject": student_info["subject"],
                        "special_requirement": student_info.get("special_requirement"),
                        "preferred_room": student_info.get("preferred_room"),
                        "rooms_overview": rooms_overview,
                        "message": "Examination seating arrangement has not been generated yet. Please check back later."
                    }
                })
            return

        # 3. ADMIN-PROTECTED SEATING ENDPOINTS
        admin_get_endpoints = {
            "/api/state": lambda: {"data": backend.api_get_state()},
            "/api/students": lambda: {"students": backend.students, "count": len(backend.students)},
            "/api/rooms": lambda: {"rooms": backend.rooms, "total_capacity": backend.calculate_room_capacity()},
            "/api/validate-students": lambda: {"data": backend.api_validate_students()},
            "/api/check-capacity": lambda: {"data": backend.api_check_capacity()},
            "/api/group-students": lambda: {"data": backend.api_group_students()},
            "/api/arrange-slots": lambda: {"data": backend.api_arrange_students()},
            "/api/validate-seating": lambda: {"data": backend.api_validate_seating()},
            "/api/room-summary": lambda: {"data": backend.api_room_summary()},
        }

        if path in admin_get_endpoints:
            session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            result = admin_get_endpoints[path]()
            result["success"] = True
            self.send_json(200, result)
            return

        elif path == "/api/search":
            session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            q = query.get("q", [""])[0]
            results = backend.api_search_student(q)
            self.send_json(200, {
                "success": True,
                "query": q,
                "count": len(results),
                "results": results
            })
            return

        # 4. STATIC FILE SERVING WITH SPA FALLBACK
        # If the path exists as a physical static file (e.g. style.css, app.js, vendor/...)
        local_filepath = os.path.normpath(os.path.join(TEMPLATES_DIR, path.lstrip("/")))
        if os.path.exists(local_filepath) and os.path.isfile(local_filepath):
            return super().do_GET()

        # SPA Fallback: Any other non-API route (e.g. /, /student/login, /admin/dashboard, etc.)
        # serves templates/index.html so React Router handles the navigation!
        self.path = "/index.html"
        return super().do_GET()

    # -------------------- POST ROUTER --------------------
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_body()

        # 1. AUTH: Student Signup
        if path == "/api/auth/signup/student":
            success, msg, data = auth.register_student(
                body.get("name"),
                body.get("roll"),
                body.get("email"),
                body.get("password"),
                body.get("confirm_password")
            )
            self.send_json(201 if success else 400, {
                "success": success,
                "message": msg,
                "token": data["token"] if success else None,
                "user": data["user"] if success else None
            })
            return

        # 2. AUTH: Admin Signup (Public registration disabled; must use secure controlled setup)
        elif path == "/api/auth/signup/admin":
            self.send_json(403, {
                "success": False,
                "message": "Public administrator registration is disabled. Admin accounts must be created through the secure CLI setup tool."
            })
            return

        # 3. AUTH: Login (Role: student or admin)
        elif path == "/api/auth/login":
            success, msg, data = auth.login_user(
                body.get("identifier"),
                body.get("password"),
                body.get("role")
            )
            self.send_json(200 if success else 401, {
                "success": success,
                "message": msg,
                "token": data["token"] if success else None,
                "user": data["user"] if success else None
            })
            return

        # 4. AUTH: Logout
        elif path == "/api/auth/logout":
            token = auth.extract_token_from_header(self.headers.get("Authorization"))
            if token:
                auth.destroy_session(token)
            self.send_json(200, {"success": True, "message": "Logged out successfully."})
            return

        # 5. AUTH: Real OTP Forgot Password Workflow
        elif path == "/api/auth/forgot-password/send-otp":
            success, msg = auth.send_password_reset_otp(body.get("email"))
            self.send_json(200 if success else 400, {"success": success, "message": msg})
            return

        elif path == "/api/auth/forgot-password/verify-otp":
            success, msg = auth.verify_password_reset_otp(body.get("email"), body.get("otp"))
            self.send_json(200 if success else 400, {"success": success, "message": msg})
            return

        elif path == "/api/auth/forgot-password/reset":
            success, msg = auth.reset_password_with_otp(
                body.get("email"),
                body.get("otp"),
                body.get("new_password"),
                body.get("confirm_password")
            )
            self.send_json(200 if success else 400, {"success": success, "message": msg})
            return

        # Legacy reset endpoints kept for backward compatibility
        elif path == "/api/auth/forgot-password":
            success, msg = auth.send_password_reset_otp(body.get("email"))
            self.send_json(200 if success else 400, {"success": success, "message": msg})
            return

        elif path == "/api/auth/reset-password":
            success, msg = auth.reset_password_with_otp(
                body.get("email"),
                body.get("otp"),
                body.get("new_password"),
                body.get("confirm_password")
            )
            self.send_json(200 if success else 400, {"success": success, "message": msg})
            return

        # 7. ADMIN-ONLY SEATING COMMANDS
        elif path == "/api/generate":
            session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            success, msg = backend.api_generate_seating()
            self.send_json(200 if success else 400, {
                "success": success,
                "message": msg,
                "state": backend.api_get_state()
            })
            return

        elif path == "/api/assign-seats":
            session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            res = backend.api_assign_seats()
            self.send_json(200 if res["success"] else 400, {
                "success": res["success"],
                "data": res,
                "state": backend.api_get_state()
            })
            return

        elif path == "/api/reset":
            session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            success, msg = backend.api_reset_seating()
            self.send_json(200, {
                "success": success,
                "message": msg,
                "state": backend.api_get_state()
            })
            return

        elif path == "/api/student":
            session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
            if err_code:
                self.send_json(err_code, {"success": False, "error": err_msg})
                return
            success, result = backend.api_add_student(
                body.get("roll"),
                body.get("name"),
                body.get("section"),
                body.get("subject"),
                body.get("preferred_room"),
                body.get("special_requirement")
            )
            self.send_json(201 if success else 400, {
                "success": success,
                "message": "Student candidate added successfully" if success else str(result),
                "student": result if success else None,
                "state": backend.api_get_state()
            })
            return

        else:
            self.send_json(404, {"error": "API route not found"})

    # -------------------- DELETE ROUTER --------------------
    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Admin check for deleting student candidates
        session_data, err_code, err_msg = auth.require_role(self.headers, ["admin"])
        if err_code:
            self.send_json(err_code, {"success": False, "error": err_msg})
            return

        roll = None
        if path.startswith("/api/student/"):
            try:
                roll = int(path.split("/api/student/")[1])
            except ValueError:
                roll = None
        else:
            query = urllib.parse.parse_qs(parsed.query)
            try:
                roll = int(query.get("roll", [None])[0])
            except (ValueError, TypeError):
                roll = None

        if roll is not None:
            success, msg = backend.api_remove_student(roll)
            self.send_json(200 if success else 404, {
                "success": success,
                "message": msg,
                "state": backend.api_get_state()
            })
            return

        self.send_json(400, {"error": "Invalid or missing candidate roll number"})


def start_server(host="0.0.0.0", port=5000):
    """Starts the Threading HTTP Server for Examination Seating System with Auth"""
    server_address = (host, port)
    httpd = http.server.ThreadingHTTPServer(server_address, SeatingApiRequestHandler)
    print("\n" + "=" * 65)
    print("  EXAMINATION SEATING ARRANGEMENT SYSTEM — SECURE SERVER ACTIVE")
    print("=" * 65)
    print(f"  * Web Application:     http://localhost:{port}")
    print(f"  * Auth API Base:       http://localhost:{port}/api/auth")
    print(f"  * Seating API Base:    http://localhost:{port}/api/state")
    print(f"  * Static Files Root:   {TEMPLATES_DIR}")
    print("=" * 65)
    print("  Press Ctrl+C to stop the server.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        httpd.server_close()


if __name__ == "__main__":
    port = 5000
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            try:
                port = int(sys.argv[i + 1])
            except ValueError:
                pass
    start_server(port=port)
