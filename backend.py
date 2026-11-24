# ==========================================================
#       EXAMINATION SEATING ARRANGEMENT SYSTEM
# ==========================================================

# -------------------- PART 1: STUDENT DATA --------------------

students = [
    {"roll": 101, "name": "Kapil", "section": "A", "subject": "Python",
     "preferred_room": None, "special_requirement": "Near Entrance"},

    {"roll": 102, "name": "Anurag", "section": "B", "subject": "Java",
     "preferred_room": 104, "special_requirement": None},

    {"roll": 103, "name": "Priya", "section": "C", "subject": "C++",
     "preferred_room": None, "special_requirement": None},

    {"roll": 104, "name": "Rahul", "section": "A", "subject": "JavaScript",
     "preferred_room": None, "special_requirement": None},

    {"roll": 105, "name": "Sneha", "section": "C", "subject": "Python",
     "preferred_room": None, "special_requirement": "Front Row"},

    {"roll": 106, "name": "Amit", "section": "D", "subject": "Java",
     "preferred_room": None, "special_requirement": None},

    {"roll": 107, "name": "Neha", "section": "A", "subject": "C++",
     "preferred_room": None, "special_requirement": None},

    {"roll": 108, "name": "Raj", "section": "B", "subject": "JavaScript",
     "preferred_room": None, "special_requirement": None},

    {"roll": 109, "name": "Pooja", "section": "C", "subject": "C++",
     "preferred_room": None, "special_requirement": None},

    {"roll": 110, "name": "Riya", "section": "A", "subject": "JavaScript",
     "preferred_room": None, "special_requirement": None},

    {"roll": 111, "name": "Vikram", "section": "C", "subject": "Python",
     "preferred_room": None, "special_requirement": None},

    {"roll": 112, "name": "Anjali", "section": "B", "subject": "Java",
     "preferred_room": None, "special_requirement": None},

    {"roll": 113, "name": "Karan", "section": "B", "subject": "Python",
     "preferred_room": None, "special_requirement": None},

    {"roll": 114, "name": "Sakshi", "section": "A", "subject": "JavaScript",
     "preferred_room": None, "special_requirement": None},

    {"roll": 115, "name": "Rohit", "section": "A", "subject": "C++",
     "preferred_room": None, "special_requirement": None},

    {"roll": 116, "name": "Priya", "section": "A", "subject": "JavaScript",
     "preferred_room": 101, "special_requirement": None},

    {"roll": 117, "name": "Aishwarya", "section": "C", "subject": "Python",
     "preferred_room": None, "special_requirement": None},

    {"roll": 118, "name": "Siddharth", "section": "D", "subject": "Java",
     "preferred_room": None, "special_requirement": None},

    {"roll": 119, "name": "Ananya", "section": "D", "subject": "Python",
     "preferred_room": None, "special_requirement": None},

    {"roll": 120, "name": "Aditya", "section": "D", "subject": "C++",
     "preferred_room": None, "special_requirement": None},

    {"roll": 121, "name": "Isha", "section": "A", "subject": "JavaScript",
     "preferred_room": None, "special_requirement": None},

    {"roll": 122, "name": "Raghav", "section": "A", "subject": "Java",
     "preferred_room": None, "special_requirement": None},

    {"roll": 123, "name": "Meera", "section": "C", "subject": "C++",
     "preferred_room": None, "special_requirement": None},

    {"roll": 124, "name": "Kabir", "section": "B", "subject": "JavaScript",
     "preferred_room": None, "special_requirement": None}
]


# -------------------- PART 2: ROOM DATA --------------------

rooms = [
    {"room_no": 101, "invigilator": "Mrs. A Thakuri",
     "capacity": 6, "priority_seats": [1, 2],
     "allocated_students": []},

    {"room_no": 102, "invigilator": "Mr. S Mitra",
     "capacity": 6, "priority_seats": [1, 2],
     "allocated_students": []},

    {"room_no": 103, "invigilator": "Mrs. S Majumdar",
     "capacity": 6, "priority_seats": [1, 2],
     "allocated_students": []},

    {"room_no": 104, "invigilator": "Mr. D Acharya",
     "capacity": 6, "priority_seats": [1, 2],
     "allocated_students": []}
]


# -------------------- PART 3: SPECIAL SEAT RULES --------------------

# Room number -> student roll number
special_student_by_room = {
    101: 101,  # Kapil: Room 101, Seat 1
    102: 105   # Sneha: Room 102, Seat 1
}

# Student roll number -> room number
special_room_by_student = {
    101: 101,
    105: 102
}

seating_generated = False


# -------------------- PART 4: DISPLAY STUDENTS --------------------

def display_students():

    print("\n========== STUDENT DETAILS ==========")

    for s in students:
        print("Roll:", s["roll"])
        print("Name:", s["name"])
        print("Section:", s["section"])
        print("Subject:", s["subject"])
        print("------------------------------------")


# -------------------- PART 5: ADD STUDENT --------------------

def add_student():

    global seating_generated

    print("\n========== ADD STUDENT ==========")

    roll = int(input("Enter roll number: "))

    for s in students:
        if s["roll"] == roll:
            print("This roll number already exists.")
            return

    name = input("Enter student name: ")
    section = input("Enter section: ").upper()
    subject = input("Enter subject: ")

    new_student = {
        "roll": roll,
        "name": name,
        "section": section,
        "subject": subject,
        "preferred_room": None,
        "special_requirement": None
    }

    students.append(new_student)

    seating_generated = False

    print("Student added successfully.")


# -------------------- PART 6: REMOVE STUDENT --------------------

def remove_student():

    global seating_generated

    roll = int(input("Enter roll number to remove: "))

    for s in students:
        if s["roll"] == roll:
            students.remove(s)
            seating_generated = False
            print("Student removed successfully.")
            return

    print("Student not found.")


# -------------------- PART 7: VALIDATE STUDENTS --------------------

def validate_students():

    seen_rolls = []

    for s in students:

        if s["roll"] in seen_rolls:
            print("Duplicate roll number found:", s["roll"])
            return False

        seen_rolls.append(s["roll"])

        if not s["name"] or not s["section"] or not s["subject"]:
            print("Incomplete student information found.")
            return False

    print("Student information is valid.")
    return True


# -------------------- PART 8: DISPLAY ROOMS --------------------

def display_rooms():

    print("\n========== EXAMINATION ROOMS ==========")

    for r in rooms:
        print("Room Number:", r["room_no"])
        print("Invigilator:", r["invigilator"])
        print("Capacity:", r["capacity"])
        print("Priority Seats:", r["priority_seats"])
        print("--------------------------------------")


# -------------------- PART 9: CALCULATE TOTAL CAPACITY --------------------

def calculate_room_capacity():

    total_capacity = 0

    for r in rooms:
        total_capacity += r["capacity"]

    return total_capacity


# -------------------- PART 10: CHECK CAPACITY --------------------

def check_capacity():

    total_capacity = calculate_room_capacity()
    total_students = len(students)

    print("\n========== CAPACITY CHECK ==========")
    print("Total Students:", total_students)
    print("Total Available Seats:", total_capacity)

    if total_students <= total_capacity:
        print("Sufficient examination seats are available.")
        return True

    print("Not enough examination seats.")
    return False


# -------------------- PART 11: GROUP AND SORT STUDENTS --------------------

def group_students():

    sorted_students = sorted(students, key=lambda s: s["roll"])

    section_count = {}

    for s in sorted_students:

        section = s["section"]

        if section not in section_count:
            section_count[section] = 0

        section_count[section] += 1

    print("\n========== SECTION-WISE GROUPING ==========")

    for section in section_count:
        print("Section", section, ":", section_count[section], "students")

    return sorted_students


# -------------------- PART 12: CHECK SEATING CONSTRAINTS --------------------

def check_seating_constraints(student1, student2):

    different_sections = (
        student1["section"] != student2["section"]
    )

    different_subjects = (
        student1["subject"].lower() != student2["subject"].lower()
    )

    return different_sections and different_subjects


# -------------------- PART 13: PREPARE SEATING SLOTS --------------------

def arrange_students():

    seating_slots = []

    maximum_capacity = 0

    for r in rooms:
        if r["capacity"] > maximum_capacity:
            maximum_capacity = r["capacity"]

    # Seat 1 of every room, then Seat 2, and so on.
    for seat_no in range(1, maximum_capacity + 1):

        for r in rooms:

            if seat_no <= r["capacity"]:
                seating_slots.append((r, seat_no))

    return seating_slots


# -------------------- PART 14: ASSIGN STUDENTS TO SEATS --------------------

def assign_seats():

    # Clear old seating arrangements.
    for r in rooms:
        r["allocated_students"] = []

    sorted_students = group_students()
    seating_slots = arrange_students()

    total_slots = len(seating_slots)

    # Track students who already have seats.
    allocated_rolls = set()

    # Store the student selected for each slot.
    chosen_students = [None] * total_slots

    # Store possible candidates for each slot.
    candidate_lists = [None] * total_slots

    # Track which candidate to try next.
    next_choice = [0] * total_slots

    position = 0

    # Iterative backtracking: uses a while loop, not recursion.
    while position < total_slots:

        current_room, current_seat = seating_slots[position]

        # Generate candidates when entering this slot.
        if candidate_lists[position] is None:

            candidates = []

            for s in sorted_students:

                if s["roll"] in allocated_rolls:
                    continue

                # A student with a special seat must use it.
                required_room = special_room_by_student.get(s["roll"])

                if required_room is not None:

                    if current_room["room_no"] != required_room:
                        continue

                    if current_seat != 1:
                        continue

                # Reserve the required first seat for its student.
                required_roll = special_student_by_room.get(
                    current_room["room_no"]
                )

                if current_seat == 1 and required_roll is not None:

                    if s["roll"] != required_roll:
                        continue

                # Honour a specified preferred room.
                if s["preferred_room"] is not None:

                    if current_room["room_no"] != s["preferred_room"]:
                        continue

                # Check the student sitting immediately before this seat.
                if current_seat > 1:

                    previous_student = current_room["allocated_students"][-1]

                    if not check_seating_constraints(s, previous_student):
                        continue

                candidates.append(s)

            candidate_lists[position] = candidates

        # Try the next available candidate.
        if next_choice[position] < len(candidate_lists[position]):

            selected_student = candidate_lists[position][
                next_choice[position]
            ]

            next_choice[position] += 1

            current_room["allocated_students"].append(selected_student)

            allocated_rolls.add(selected_student["roll"])

            chosen_students[position] = selected_student

            # Move to the next seat.
            position += 1

            # Prepare the next slot for candidate generation.
            if position < total_slots:
                candidate_lists[position] = None
                next_choice[position] = 0

        else:

            # No candidate fits this slot. Go back one step.
            candidate_lists[position] = None
            next_choice[position] = 0

            if position == 0:
                break

            position -= 1

            previous_room, previous_seat = seating_slots[position]
            previous_student = chosen_students[position]

            previous_room["allocated_students"].pop()
            allocated_rolls.remove(previous_student["roll"])

            chosen_students[position] = None

    # Check whether every student received a seat.
    if len(allocated_rolls) == len(students):

        print("\nAll students have been allocated successfully.")
        return True

    # Remove incomplete arrangements.
    for r in rooms:
        r["allocated_students"] = []

    print("\nA complete seating arrangement could not be created.")
    return False


# -------------------- PART 15: DISPLAY SEATING PLAN --------------------

def display_seating_plan():

    print("\n========== FINAL SEATING PLAN ==========")

    for r in rooms:

        print("\nRoom Number:", r["room_no"])
        print("Invigilator:", r["invigilator"])
        print("---------------------------------------")

        if len(r["allocated_students"]) == 0:
            print("No students allocated.")
            continue

        for seat_index, s in enumerate(r["allocated_students"], start=1):

            seat_type = "PRIORITY" if seat_index in r["priority_seats"] else "NORMAL"

            print(
                "Seat:", seat_index,
                "| Roll:", s["roll"],
                "| Name:", s["name"],
                "| Section:", s["section"],
                "| Subject:", s["subject"],
                "|", seat_type
            )


# -------------------- PART 16: VALIDATE FINAL SEATING --------------------

def validate_seating():

    print("\n========== SEATING VALIDATION ==========")

    allocated_rolls = []

    # Check room capacity and duplicate allocation.
    for r in rooms:

        if len(r["allocated_students"]) > r["capacity"]:
            print("Room capacity exceeded:", r["room_no"])
            return False

        for s in r["allocated_students"]:

            if s["roll"] in allocated_rolls:
                print("A student has been allocated more than once.")
                return False

            allocated_rolls.append(s["roll"])

    # Check that all students have seats.
    if len(allocated_rolls) != len(students):
        print("Some students have not been allocated.")
        return False

    # Check adjacent students and room preferences.
    for r in rooms:

        allocated = r["allocated_students"]

        for i in range(1, len(allocated)):

            if not check_seating_constraints(allocated[i - 1], allocated[i]):
                print("Seating constraint violated in Room:", r["room_no"])
                return False

        # Check preferred room assignments.
        for s in allocated:

            if s["preferred_room"] is not None:

                if s["preferred_room"] != r["room_no"]:
                    print("Preferred room rule violated for:", s["name"])
                    return False

    # Check special seat assignments.
    for room_no, roll in special_student_by_room.items():

        found = False

        for r in rooms:

            if r["room_no"] == room_no:

                if len(r["allocated_students"]) > 0:

                    if r["allocated_students"][0]["roll"] == roll:
                        found = True

        if not found:
            print("Special seat requirement not satisfied.")
            return False

    print("All seating rules have been satisfied.")
    return True


# -------------------- PART 17: SEARCH STUDENT --------------------

def search_student():

    roll = int(input("\nEnter student roll number: "))

    for s in students:

        if s["roll"] == roll:

            print("Student Found!")
            print("Name:", s["name"])
            print("Roll:", s["roll"])
            print("Section:", s["section"])
            print("Subject:", s["subject"])
            return

    print("Student not found.")


# -------------------- PART 18: FIND STUDENT SEAT --------------------

def find_student_seat():

    if not seating_generated:
        print("Generate the seating arrangement first.")
        return

    roll = int(input("\nEnter roll number: "))

    for r in rooms:

        for seat_index, s in enumerate(r["allocated_students"], start=1):

            if s["roll"] == roll:

                print("\nStudent Seat Details")
                print("Name:", s["name"])
                print("Roll:", s["roll"])
                print("Room Number:", r["room_no"])
                print("Seat Number:", seat_index)
                print("Invigilator:", r["invigilator"])
                return

    print("Student seat not found.")


# -------------------- PART 19: GENERATE ROOM SUMMARY --------------------

def generate_room_summary():

    print("\n========== ROOM-WISE SUMMARY ==========")

    for r in rooms:

        occupied = len(r["allocated_students"])
        available = r["capacity"] - occupied

        print("\nRoom Number:", r["room_no"])
        print("Invigilator:", r["invigilator"])
        print("Total Capacity:", r["capacity"])
        print("Occupied Seats:", occupied)
        print("Available Seats:", available)


# -------------------- PART 20: GENERATE SEATING --------------------

def generate_seating():

    global seating_generated

    seating_generated = False

    if not validate_students():
        return

    if not check_capacity():
        return

    if assign_seats():

        if validate_seating():

            seating_generated = True

            display_seating_plan()
            generate_room_summary()

        else:

            print("Final seating arrangement is invalid.")

            for r in rooms:
                r["allocated_students"] = []


# -------------------- PART 21: MAIN MENU --------------------

def main_menu():

    while True:

        print("\n======================================")
        print(" EXAMINATION SEATING ARRANGEMENT SYSTEM")
        print("======================================")

        print("1. Display Students")
        print("2. Display Examination Rooms")
        print("3. Add Student")
        print("4. Remove Student")
        print("5. Validate Students")
        print("6. Check Total Capacity")
        print("7. Group and Sort Students")
        print("8. Generate Seating Arrangement")
        print("9. Display Seating Plan")
        print("10. Validate Seating")
        print("11. Search Student")
        print("12. Find Student Seat")
        print("13. Generate Room Summary")
        print("14. Exit")

        choice = input("\nEnter your choice: ")

        if choice == "1":
            display_students()

        elif choice == "2":
            display_rooms()

        elif choice == "3":
            add_student()

        elif choice == "4":
            remove_student()

        elif choice == "5":
            validate_students()

        elif choice == "6":
            check_capacity()

        elif choice == "7":
            group_students()

        elif choice == "8":
            generate_seating()

        elif choice == "9":

            if seating_generated:
                display_seating_plan()
            else:
                print("Generate a valid seating arrangement first.")

        elif choice == "10":

            if seating_generated:
                validate_seating()
            else:
                print("Generate a seating arrangement first.")

        elif choice == "11":
            search_student()

        elif choice == "12":
            find_student_seat()

        elif choice == "13":

            if seating_generated:
                generate_room_summary()
            else:
                print("Generate a seating arrangement first.")

        elif choice == "14":
            print("\nStarting Web Application Server...")
            start_server()
            break

        elif choice == "15":
            print("Thank you for using the system.")
            break

        else:
            print("Invalid choice. Please try again.")


# -------------------- PART 21B: API HELPER FUNCTIONS FOR WEB BACKEND --------------------

def api_get_state():
    return {
        "students": students,
        "rooms": rooms,
        "seating_generated": seating_generated,
        "total_students": len(students),
        "total_capacity": calculate_room_capacity()
    }

def api_validate_students():
    valid = validate_students()
    seen = set()
    duplicates = []
    incomplete = []
    for s in students:
        if s["roll"] in seen:
            duplicates.append(s["roll"])
        seen.add(s["roll"])
        if not s.get("name") or not s.get("section") or not s.get("subject"):
            incomplete.append(s["roll"])
    return {
        "valid": valid,
        "total_students": len(students),
        "duplicates": duplicates,
        "incomplete": incomplete,
        "message": "Student records validated successfully." if valid else "Validation failed: duplicate roll or incomplete student data."
    }

def api_check_capacity():
    total_cap = calculate_room_capacity()
    total_stu = len(students)
    sufficient = total_stu <= total_cap
    return {
        "total_students": total_stu,
        "total_capacity": total_cap,
        "sufficient": sufficient,
        "available_seats": total_cap - total_stu,
        "message": "Sufficient examination seats are available." if sufficient else "Not enough examination seats."
    }

def api_group_students():
    sorted_s = group_students()
    section_count = {}
    for s in sorted_s:
        sec = s["section"]
        section_count[sec] = section_count.get(sec, 0) + 1
    return {
        "section_counts": section_count,
        "sorted_students": sorted_s
    }

def api_arrange_students():
    slots = arrange_students()
    slot_details = []
    for r, seat_no in slots:
        slot_details.append({
            "room_no": r["room_no"],
            "seat_no": seat_no,
            "invigilator": r["invigilator"],
            "capacity": r["capacity"],
            "is_priority": seat_no in r.get("priority_seats", [])
        })
    return {
        "total_slots": len(slots),
        "slots": slot_details
    }

def api_assign_seats():
    global seating_generated
    assigned = assign_seats()
    if assigned:
        valid = validate_seating()
        seating_generated = valid
        return {
            "success": assigned and valid,
            "assigned": assigned,
            "valid": valid,
            "message": "All students have been allocated and constraints verified." if (assigned and valid) else "Allocation completed but constraints failed."
        }
    else:
        seating_generated = False
        return {
            "success": False,
            "assigned": False,
            "valid": False,
            "message": "Backtracking solver failed to place all students."
        }

def api_validate_seating():
    valid = validate_seating()
    return {
        "valid": valid,
        "message": "All seating rules and constraints satisfied." if valid else "Seating constraint violation detected."
    }

def api_room_summary():
    summaries = []
    for r in rooms:
        occupied = len(r.get("allocated_students", []))
        summaries.append({
            "room_no": r["room_no"],
            "invigilator": r["invigilator"],
            "capacity": r["capacity"],
            "occupied": occupied,
            "available": r["capacity"] - occupied,
            "priority_seats": r.get("priority_seats", [1, 2]),
            "allocated_students": r.get("allocated_students", [])
        })
    return summaries

def api_generate_seating():
    global seating_generated
    seating_generated = False
    if not validate_students():
        return False, "Validation failed: duplicate roll or incomplete student details."
    if not check_capacity():
        return False, "Capacity check failed: not enough examination seats."
    if assign_seats():
        if validate_seating():
            seating_generated = True
            return True, "Seating arrangement generated successfully."
        else:
            for r in rooms:
                r["allocated_students"] = []
            return False, "Validation failed: seating constraints could not be fully met."
    return False, "Backtracking solver failed to place all candidates."

def api_reset_seating():
    global seating_generated
    for r in rooms:
        r["allocated_students"] = []
    seating_generated = False
    return True, "Seating arrangement has been reset."

def api_search_student(query):
    query = str(query).strip().lower()
    if not query:
        return []
    results = []
    # Search in allocated rooms first
    for r in rooms:
        for seat_index, s in enumerate(r["allocated_students"], start=1):
            if (query in str(s["roll"]).lower() or
                query in s["name"].lower() or
                query in s["subject"].lower() or
                query in s["section"].lower()):
                results.append({
                    "roll": s["roll"],
                    "name": s["name"],
                    "section": s["section"],
                    "subject": s["subject"],
                    "room_no": r["room_no"],
                    "seat_no": seat_index,
                    "invigilator": r["invigilator"],
                    "is_priority": seat_index in r["priority_seats"],
                    "allocated": True
                })
    # If not found or not allocated yet, check in general student list
    allocated_rolls = {res["roll"] for res in results}
    for s in students:
        if s["roll"] not in allocated_rolls:
            if (query in str(s["roll"]).lower() or
                query in s["name"].lower() or
                query in s["subject"].lower() or
                query in s["section"].lower()):
                results.append({
                    "roll": s["roll"],
                    "name": s["name"],
                    "section": s["section"],
                    "subject": s["subject"],
                    "room_no": None,
                    "seat_no": None,
                    "invigilator": None,
                    "is_priority": False,
                    "allocated": False
                })
    return results

def api_add_student(roll, name, section, subject, preferred_room=None, special_requirement=None):
    global seating_generated
    try:
        roll = int(roll)
    except (ValueError, TypeError):
        return False, "Invalid roll number."
    for s in students:
        if s["roll"] == roll:
            return False, f"Roll number {roll} already exists."
    new_student = {
        "roll": roll,
        "name": str(name).strip(),
        "section": str(section).strip().upper(),
        "subject": str(subject).strip(),
        "preferred_room": int(preferred_room) if preferred_room else None,
        "special_requirement": str(special_requirement).strip() if special_requirement else None
    }
    students.append(new_student)
    seating_generated = False
    return True, new_student

def api_remove_student(roll):
    global seating_generated
    try:
        roll = int(roll)
    except (ValueError, TypeError):
        return False, "Invalid roll number."
    for s in students:
        if s["roll"] == roll:
            students.remove(s)
            seating_generated = False
            return True, f"Student {roll} removed."
    return False, f"Student with roll {roll} not found."


# -------------------- PART 21C: BUILT-IN HTTP REST API & WEB SERVER --------------------

import http.server
import json
import urllib.parse
import os
import sys
import mimetypes

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".jsx")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

class SeatingRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    HTTP Request Handler serving both the 3D React Web Application
    and RESTful JSON APIs for backend.py.
    Zero external dependencies - runs on Python standard library!
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

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API Endpoints
        if path == "/api/state":
            self.send_json(200, {
                "success": True,
                "data": api_get_state()
            })
            return
        elif path == "/api/students":
            self.send_json(200, {
                "success": True,
                "students": students,
                "count": len(students)
            })
            return
        elif path == "/api/rooms":
            self.send_json(200, {
                "success": True,
                "rooms": rooms,
                "total_capacity": calculate_room_capacity()
            })
            return
        elif path == "/api/validate-students":
            res = api_validate_students()
            self.send_json(200 if res["valid"] else 400, {
                "success": True,
                "data": res
            })
            return
        elif path == "/api/check-capacity":
            res = api_check_capacity()
            self.send_json(200 if res["sufficient"] else 400, {
                "success": True,
                "data": res
            })
            return
        elif path == "/api/group-students":
            res = api_group_students()
            self.send_json(200, {
                "success": True,
                "data": res
            })
            return
        elif path == "/api/arrange-slots":
            res = api_arrange_students()
            self.send_json(200, {
                "success": True,
                "data": res
            })
            return
        elif path == "/api/validate-seating":
            res = api_validate_seating()
            self.send_json(200 if res["valid"] else 400, {
                "success": True,
                "data": res
            })
            return
        elif path == "/api/room-summary":
            res = api_room_summary()
            self.send_json(200, {
                "success": True,
                "data": res
            })
            return
        elif path == "/api/search":
            q = query.get("q", [""])[0]
            results = api_search_student(q)
            self.send_json(200, {
                "success": True,
                "query": q,
                "count": len(results),
                "results": results
            })
            return

        # Web Static File Routing:
        # Default root '/' serves 'index.html' from templates/
        if path == "/" or path == "/index.html":
            self.path = "/index.html"
            return super().do_GET()

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/generate":
            success, msg = api_generate_seating()
            self.send_json(200 if success else 400, {
                "success": success,
                "message": msg,
                "state": api_get_state()
            })
            return

        elif path == "/api/assign-seats":
            res = api_assign_seats()
            self.send_json(200 if res["success"] else 400, {
                "success": res["success"],
                "data": res,
                "state": api_get_state()
            })
            return

        elif path == "/api/reset":
            success, msg = api_reset_seating()
            self.send_json(200, {
                "success": success,
                "message": msg,
                "state": api_get_state()
            })
            return

        elif path == "/api/student":
            body = self.parse_body()
            success, result = api_add_student(
                body.get("roll"),
                body.get("name"),
                body.get("section"),
                body.get("subject"),
                body.get("preferred_room"),
                body.get("special_requirement")
            )
            self.send_json(201 if success else 400, {
                "success": success,
                "message": "Student enrolled successfully" if success else str(result),
                "student": result if success else None,
                "state": api_get_state()
            })
            return

        else:
            self.send_json(404, {"error": "API route not found"})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
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
            success, msg = api_remove_student(roll)
            self.send_json(200 if success else 404, {
                "success": success,
                "message": msg,
                "state": api_get_state()
            })
            return

        self.send_json(400, {"error": "Invalid or missing student roll number"})


def start_server(host="0.0.0.0", port=5000):
    """Starts the Threading HTTP Server via api_server with full auth and role enforcement"""
    try:
        import api_server
        api_server.start_server(host=host, port=port)
    except ImportError:
        server_address = (host, port)
        httpd = http.server.ThreadingHTTPServer(server_address, SeatingRequestHandler)
        print("\n" + "=" * 60)
        print("  EXAMINATION SEATING SYSTEM - 3D REST SERVER ACTIVE")
        print("=" * 60)
        print(f"  * Web Application URL: http://localhost:{port}")
        print("=" * 60)
        httpd.serve_forever()


# -------------------- PART 22: START PROGRAM --------------------

if __name__ == "__main__":
    if "--cli" in sys.argv:
        main_menu()
    else:
        # Default action: launch the web server or accept --port
        port = 5000
        for i, arg in enumerate(sys.argv):
            if arg == "--port" and i + 1 < len(sys.argv):
                try:
                    port = int(sys.argv[i + 1])
                except ValueError:
                    pass
        start_server(port=port)


