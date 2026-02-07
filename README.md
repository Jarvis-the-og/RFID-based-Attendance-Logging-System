# RFID‑Based Attendance Logging System

## 📌 Problem Statement

Traditional attendance systems (manual registers, sign sheets, proxy methods) are:

* Time‑consuming
* Prone to human error
* Easy to manipulate (proxy attendance)
* Hard to analyze and audit later

Institutions need a **secure, automated, and trackable** attendance system that integrates hardware with a modern software dashboard.

---

## 💡 Solution Overview

This project implements an **RFID‑based attendance logging system** with:

* RFID card scanning (hardware)
* A Node.js backend for validation & storage
* A React dashboard for visualization and management

Each RFID scan is validated, logged into a database, and reflected in real‑time on the dashboard.

---

## 🧠 System Architecture

```
RFID Tag
   ↓
RFID Reader (ESP32)
   ↓  HTTP Request
Backend Server (Node.js + Express)
   ↓
Database (MySQL) hosted on Aiven (for now)
   ↓
React Dashboard (Attendance View & Export)
```

---

## 🧩 Project Structure

```
RFID Attendance Logger/
│
├── rfid-backend/                # Backend server
│   ├── index.js                 # Server entry point
│   ├── db.js                    # Database connection logic
│   ├── package.json
│   ├── .env.example             # Environment variables template
│   └── ca.pem.example           # SSL certificate template
│
├── rfid-attendance-dashboard/   # Frontend dashboard (React)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
│
└── .gitignore
```

---

## ⚙️ Tech Stack

### Hardware

* ESP32
* RC522 RFID Reader
* RFID Tags/Cards
* I2C-connected LCD Displays
* Buzzers


### Backend

* Node.js
* Express.js
* MySQL

### Frontend

* React.js
* Tailwind CSS
* Axios

---

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/jarvis-the-og/RFID-based-Attendance-Logging-System.git
cd RFID-Attendance-Logger
```

---

### 2️⃣ Backend Setup

```bash
cd rfid-backend
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Fill in your database credentials in `.env`.

Run backend:

```bash
node index.js
```

---

### 3️⃣ Frontend Setup

```bash
cd rfid-attendance-dashboard
npm install
npm start
```

Dashboard runs on:

```
http://localhost:3000
```

---

## 📊 Features

* RFID‑based attendance capture
* Secure backend validation
* Centralized database logging
* Real‑time attendance dashboard
* CSV export of attendance records
* Clean separation of frontend & backend

---

## 🔐 Security Practices

* `.env` files are git‑ignored
* Example env files provided (`.env.example`)
* No credentials committed to repository
* SSL certificate example isolated

---

## 🎓 Academic / Demo Use

This project is suitable for:

* College mini / major projects
* IoT + Web integration demos
* Smart campus / smart classroom concepts

---

## 🔮 Future Enhancements (work in progress)

* Role‑based access (Admin / Faculty)
* Real‑time WebSocket updates
* Facial recognition
* Cloud deployment
* Analytics & attendance trends

---

## 👤 Author

**Rishabh Dev Pandey**
RFID • IoT • Backend • Frontend Integration

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub — it helps a lot!
