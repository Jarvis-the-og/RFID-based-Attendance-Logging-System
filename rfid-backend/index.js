// index.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
//enrollment part
let enrollmentMode = false;
let lastEnrollmentUID = null;

// ---------- DB CONNECTION ----------
async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      ca: fs.readFileSync("./ca.pem"),
      rejectUnauthorized: true
    }
  });
}

// ---------- GET LATEST ATTENDANCE STATUS (ONE ROW PER USER) ----------
app.get("/api/attendance", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const [rows] = await conn.query(`
      SELECT
        u.user_id,
        u.rfid_uid AS rfid,
        u.name,
        'N/A' AS department,
        al.scan_type AS status,
        al.scan_time AS lastScan
      FROM users u
      LEFT JOIN attendance_logs al
        ON al.log_id = (
          SELECT log_id
          FROM attendance_logs
          WHERE user_id = u.user_id
          ORDER BY scan_time DESC
          LIMIT 1
        )
      ORDER BY u.name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch attendance data" });
  } finally {
    if (conn) await conn.end();
  }
});

// ---------- ADD NEW RFID USER ----------
app.post("/api/rfid", async (req, res) => {
  const { rfid, name } = req.body;

  if (!rfid || !name) {
    return res.status(400).json({ error: "RFID and name are required" });
  }

  let conn;
  try {
    conn = await getConnection();

    await conn.query(
      "INSERT INTO users (rfid_uid, name) VALUES (?, ?)",
      [rfid, name]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("RFID insert error:", err);
    res.status(500).json({ error: "Failed to add RFID" });
  } finally {
    if (conn) await conn.end();
  }
});

// ---------- RFID TAP (ATTENDANCE or ENROLLMENT) ----------
app.post("/api/scan", async (req, res) => {
  const { rfid_uid, device_id } = req.body;

  if (!rfid_uid) {
    return res.status(400).json({ error: "RFID UID required" });
  }

  // 🔴 ENROLLMENT MODE: just capture UID, NO attendance
  if (enrollmentMode) {
    lastEnrollmentUID = rfid_uid;
    return res.json({
      enroll: true,
      rfid_uid,
      message: "RFID captured for enrollment"
    });
  }

  // 🟢 ATTENDANCE MODE
  let conn;
  try {
    conn = await getConnection();

    // 1. Find user (NO auto-creation)
    const [[user]] = await conn.query(
      "SELECT user_id, name FROM users WHERE rfid_uid = ?",
      [rfid_uid]
    );

    if (!user) {
      return res.status(403).json({ error: "RFID not registered" });
    }

    // 2. Get last scan
    const [[last]] = await conn.query(
      `
      SELECT scan_type
      FROM attendance_logs
      WHERE user_id = ?
      ORDER BY scan_time DESC
      LIMIT 1
      `,
      [user.user_id]
    );

    // 3. Toggle status
    let nextStatus = "IN";
    if (last && last.scan_type === "IN") {
      nextStatus = "OUT";
    }

    // 4. Insert attendance log
    await conn.query(
      `
      INSERT INTO attendance_logs (user_id, scan_type, device_id)
      VALUES (?, ?, ?)
      `,
      [user.user_id, nextStatus, device_id || null]
    );

    res.json({
      success: true,
      rfid_uid,
      status: nextStatus,
      name: user.name
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ error: "Scan failed" });
  } finally {
    if (conn) await conn.end();
  }
});

// Enable enrollment mode
app.post("/api/enroll/start", (req, res) => {
  enrollmentMode = true;
  lastEnrollmentUID = null;
  res.json({ success: true });
});

// Disable enrollment mode
app.post("/api/enroll/stop", (req, res) => {
  enrollmentMode = false;
  lastEnrollmentUID = null;
  res.json({ success: true });
});

// Fetch last tapped UID during enrollment
app.get("/api/enroll/latest", (req, res) => {
  res.json({ rfid_uid: lastEnrollmentUID });
});

// ---------- SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});