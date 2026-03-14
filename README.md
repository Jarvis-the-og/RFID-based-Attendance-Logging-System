# RFID-Based Attendance Logging System

A **real-time attendance management system** using RFID technology, ESP32 devices, and a full-stack web dashboard.  
The system enables organizations to **track employee attendance, manage roles, and monitor check-in/check-out activity in real time**.

---

## System Architecture

```mermaid
flowchart TD

A[ESP32 Device] -->|RFID Scan Request| B[Node.js Backend API]
B -->|Store / Retrieve Data| C[(MySQL Database - Aiven Cloud)]
B -->|REST API| D[React Admin Dashboard]

D -->|Start Enrollment| B
D -->|View Attendance Logs| B
D -->|Register RFID Users| B

A -->|HTTP Request /api/scan| B
```

---

## Attendance Workflow

```mermaid
sequenceDiagram

participant ESP32
participant Backend
participant Database
participant Dashboard

ESP32->>Backend: POST /api/scan (RFID UID)
Backend->>Database: Find User by RFID
Database-->>Backend: User Found
Backend->>Database: Insert Attendance Log (IN/OUT)
Backend-->>ESP32: Response (Success + Status)

Dashboard->>Backend: GET /api/attendance
Backend->>Database: Fetch Latest Logs
Database-->>Backend: Attendance Data
Backend-->>Dashboard: JSON Response
Dashboard->>Dashboard: Update UI
```

---

## Role Hierarchy

```mermaid
graph TD

Admin --> Manager
Manager --> AssistantEmployee1
Manager --> AssistantEmployee2
Manager --> AssistantEmployee3
```

---

## Features

### RFID Attendance Logging
- Employees tap RFID cards to **check IN / OUT**
- System automatically **toggles attendance status**
- Attendance records are stored in the database

---

### Role-Based Access

The system supports three types of users:

| Role | Permissions |
|-----|-------------|
Admin | Full system control |
Manager | View attendance of assigned employees |
Assistant Employee | Mark attendance via RFID |

---

### Admin Dashboard

The Admin Dashboard provides:

- RFID card registration
- Employee role assignment
- Department assignment
- Manager assignment
- Real-time attendance monitoring
- Attendance statistics
- Activity logs
- CSV report export
- RFID enrollment mode

---

### RFID Enrollment Mode

Admin can enable **Enrollment Mode** to register new cards.

**Process:**

1. Admin clicks **Start Enrollment**
2. User taps an RFID card
3. UID is captured automatically
4. Admin enters employee details
5. User is registered in the system

---

## Tech Stack

### Hardware
- ESP32
- RFID Reader (RC522 or simulated ESP32 requests)

### Backend
- Node.js
- Express.js
- MySQL
- Aiven Cloud Database

### Frontend
- React.js
- Tailwind CSS
- Lucide Icons

### Communication
- REST API
- HTTP requests from ESP32

---

## Project Structure

```
RFID-based-Attendance-Logging-System
│
├── backend
│   ├── index.js
│   └── db.js
│
├── frontend
│   └── RFIDDashboard.jsx
│
├── esp32
│   └── esp32_simulation.ino
│
├── .gitignore
└── README.md
```

---

## Database Schema

### Users Table

| Field | Description |
|-----|-------------|
user_id | Unique user identifier |
name | Employee name |
rfid_uid | RFID card UID |
role | admin / manager / assistant_employee |
department | Department name |
manager_id | Assigned manager |

---

### Attendance Logs Table

| Field | Description |
|-----|-------------|
log_id | Unique log entry |
user_id | Employee reference |
scan_type | IN / OUT |
device_id | Device identifier |
scan_time | Timestamp |

---

## API Endpoints

### Get Attendance

```
GET /api/attendance
```

Returns current attendance status of all users.

---

### Add RFID User

```
POST /api/rfid
```

Example request:

```json
{
  "rfid": "UID123",
  "name": "John",
  "role": "assistant_employee",
  "department": "Engineering",
  "manager_id": 2
}
```

---

### RFID Scan

```
POST /api/scan
```

Example request:

```json
{
  "rfid_uid": "UID123",
  "device_id": "ENTRANCE_GATE"
}
```

---

### Start Enrollment Mode

```
POST /api/enroll/start
```

---

### Stop Enrollment Mode

```
POST /api/enroll/stop
```

---

### Get Last Enrollment UID

```
GET /api/enroll/latest
```

---

## ESP32 Simulation

For testing without RFID hardware, the ESP32 can simulate card scans by sending requests to:

```
POST /api/scan
```

Example payload:

```json
{
  "rfid_uid": "TEST_RFID_001",
  "device_id": "ESP32_TEST"
}
```

---

## Installation

### Clone Repository

```
git clone https://github.com/Jarvis-the-og/RFID-based-Attendance-Logging-System.git
```

---

### Backend Setup

```
cd backend
npm install
node index.js
```

---

### Frontend Setup

```
cd frontend
npm install
npm start
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

---

## Demo Workflow

1. Start backend server
2. Start frontend dashboard
3. Register employee RFID
4. Tap RFID card using ESP32
5. Attendance is logged automatically
6. Dashboard updates in real time

---

## Security

Sensitive files are excluded using `.gitignore`.

Ignored files include:

- `.env`
- `ca.pem`
- `node_modules`
- build artifacts

---

## Future Improvements

- Manager dashboard
- WebSocket-based real-time updates
- Mobile application support
- Multi-device attendance gates
- Face recognition fallback

---

## Author

**Rishabh Dev**

GitHub:  
https://github.com/Jarvis-the-og