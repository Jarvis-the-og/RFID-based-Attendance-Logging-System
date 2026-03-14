const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// ---------- Enrollment State ----------
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

// ---------- DATABASE INITIALIZATION ----------
async function initDatabase() {

  let conn;

  try {

    conn = await getConnection();

    console.log("Checking database schema...");

    // USERS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (

        user_id INT AUTO_INCREMENT PRIMARY KEY,

        name VARCHAR(100) NOT NULL,

        rfid_uid VARCHAR(100) UNIQUE NOT NULL,

        role ENUM('admin','manager','assistant_employee') NOT NULL,

        department VARCHAR(100),

        manager_id INT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (manager_id) REFERENCES users(user_id)

      )
    `);

    // ATTENDANCE LOGS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (

        log_id INT AUTO_INCREMENT PRIMARY KEY,

        user_id INT NOT NULL,

        scan_type ENUM('IN','OUT') NOT NULL,

        device_id VARCHAR(50),

        scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(user_id)

      )
    `);

    // DEVICES
    await conn.query(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id VARCHAR(50) PRIMARY KEY,
        location VARCHAR(100)
      )
    `);

    // Ensure default admin exists
    const [[admin]] = await conn.query(`
      SELECT user_id FROM users WHERE role='admin' LIMIT 1
    `);

    if (!admin) {

      console.log("Creating default admin...");

      await conn.query(`
        INSERT INTO users (name, rfid_uid, role, department)
        VALUES ('System Admin', 'ADMIN_MASTER_CARD', 'admin', 'Administration')
      `);

    }

    console.log("Database ready");

  } catch (err) {

    console.error("DB INIT ERROR:", err);

  } finally {

    if (conn) await conn.end();

  }

}

// ---------- GET ATTENDANCE STATUS ----------
app.get("/api/attendance", async (req, res) => {

  let conn;

  try {

    conn = await getConnection();

    const [rows] = await conn.query(`

      SELECT
        u.user_id,
        u.rfid_uid AS rfid,
        u.name,
        u.role,
        u.department,
        u.manager_id,
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

    res.status(500).json({
      error: "Failed to fetch attendance"
    });

  } finally {

    if (conn) await conn.end();

  }
});

// ---------- ADD RFID USER ----------
app.post("/api/rfid", async (req, res) => {

  const { rfid, name, role, department, manager_id } = req.body;

  if (!rfid || !name || !role) {
    return res.status(400).json({
      error: "RFID, name and role required"
    });
  }

  if (role === "assistant_employee" && !manager_id) {
    return res.status(400).json({
      error: "Assistant employee must have manager_id"
    });
  }

  let conn;

  try {

    conn = await getConnection();

    // Check duplicate RFID
    const [[existing]] = await conn.query(
      "SELECT user_id FROM users WHERE rfid_uid = ?",
      [rfid]
    );

    if (existing) {
      return res.status(409).json({
        error: "RFID already registered"
      });
    }

    // Ensure manager exists if assistant_employee
    if (manager_id) {

      const [[manager]] = await conn.query(
        "SELECT role FROM users WHERE user_id = ?",
        [manager_id]
      );

      if (!manager || manager.role !== "manager") {
        return res.status(400).json({
          error: "manager_id must refer to a valid manager"
        });
      }
    }

    await conn.query(`
      INSERT INTO users
      (rfid_uid, name, role, department, manager_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      rfid,
      name,
      role,
      department || null,
      manager_id || null
    ]);

    res.json({ success: true });

  } catch (err) {

    console.error("RFID insert error:", err);

    res.status(500).json({
      error: "Failed to add user"
    });

  } finally {

    if (conn) await conn.end();

  }
});

// ---------- RFID SCAN ----------
app.post("/api/scan", async (req, res) => {

  const { rfid_uid, device_id } = req.body;

  if (!rfid_uid) {
    return res.status(400).json({
      error: "RFID UID required"
    });
  }

  // Enrollment Mode
  if (enrollmentMode) {

    lastEnrollmentUID = rfid_uid;

    return res.json({
      enroll: true,
      rfid_uid
    });

  }

  let conn;

  try {

    conn = await getConnection();

    const [[user]] = await conn.query(
      "SELECT user_id, name FROM users WHERE rfid_uid = ?",
      [rfid_uid]
    );

    if (!user) {
      return res.status(403).json({
        error: "RFID not registered"
      });
    }

    const [[last]] = await conn.query(`
      SELECT scan_type
      FROM attendance_logs
      WHERE user_id = ?
      ORDER BY scan_time DESC
      LIMIT 1
    `, [user.user_id]);

    let nextStatus = "IN";

    if (last && last.scan_type === "IN") {
      nextStatus = "OUT";
    }

    await conn.query(`
      INSERT INTO attendance_logs
      (user_id, scan_type, device_id)
      VALUES (?, ?, ?)
    `, [
      user.user_id,
      nextStatus,
      device_id || null
    ]);

    res.json({
      success: true,
      name: user.name,
      status: nextStatus
    });

  } catch (err) {

    console.error("Scan error:", err);

    res.status(500).json({
      error: "Scan failed"
    });

  } finally {

    if (conn) await conn.end();

  }

});

// ---------- ENROLLMENT CONTROL ----------
app.post("/api/enroll/start", (req, res) => {

  enrollmentMode = true;
  lastEnrollmentUID = null;

  res.json({ success: true });

});

app.post("/api/enroll/stop", (req, res) => {

  enrollmentMode = false;
  lastEnrollmentUID = null;

  res.json({ success: true });

});

app.get("/api/enroll/latest", (req, res) => {

  res.json({
    rfid_uid: lastEnrollmentUID
  });

});

// ---------- START SERVER ----------
(async () => {

  await initDatabase();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on http://0.0.0.0:${PORT}`);
  });

})();
