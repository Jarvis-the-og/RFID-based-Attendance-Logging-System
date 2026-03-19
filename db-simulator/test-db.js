require("dotenv").config();
const mysql = require("mysql2/promise");

async function setupDemoDB() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      multipleStatements: true,
    });

    console.log("✅ Connected to DB");

    const sql = `
    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS attendance_logs;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS devices;

    SET FOREIGN_KEY_CHECKS = 1;

    CREATE TABLE devices (
        device_id VARCHAR(50) PRIMARY KEY,
        location VARCHAR(100)
    );

    CREATE TABLE users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        rfid_uid VARCHAR(100) NOT NULL UNIQUE,
        role ENUM('admin','manager','assistant_employee') NOT NULL,
        department VARCHAR(100),
        manager_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES users(user_id)
    );

    CREATE TABLE attendance_logs (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        scan_type ENUM('IN','OUT') NOT NULL,
        device_id VARCHAR(50),
        scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
    );

    -- Devices
    INSERT INTO devices VALUES
    ('ESP32_GATE', 'Main Gate'),
    ('ESP32_OFFICE', 'Office Entrance'),
    ('ESP32_LAB', 'Engineering Lab'),
    ('ESP32_PARKING', 'Parking Area');

    -- Users (Realistic org structure)
    INSERT INTO users (name, rfid_uid, role, department, manager_id) VALUES
    ('Rishabh Pandey', 'RFID_ADMIN_001', 'admin', 'Administration', NULL),
    ('Neha Verma', 'RFID_MGR_001', 'manager', 'Operations', NULL),
    ('Amit Kulkarni', 'RFID_MGR_002', 'manager', 'Engineering', NULL),

    ('Rahul Singh', 'RFID_EMP_001', 'assistant_employee', 'Operations', 2),
    ('Priya Nair', 'RFID_EMP_002', 'assistant_employee', 'Operations', 2),

    ('Arjun Mehta', 'RFID_EMP_003', 'assistant_employee', 'Engineering', 3),
    ('Sneha Iyer', 'RFID_EMP_004', 'assistant_employee', 'Engineering', 3),
    ('Karthik Reddy', 'RFID_EMP_005', 'assistant_employee', 'Engineering', 3);

    -- Attendance Logs (Multi-day realistic data)
    INSERT INTO attendance_logs (user_id, scan_type, device_id, scan_time) VALUES

    -- Rahul (regular employee)
    (4, 'IN', 'ESP32_GATE', '2026-03-18 09:05:00'),
    (4, 'OUT', 'ESP32_GATE', '2026-03-18 17:45:00'),
    (4, 'IN', 'ESP32_GATE', '2026-03-19 09:12:00'),

    -- Priya (late entry)
    (5, 'IN', 'ESP32_GATE', '2026-03-18 10:10:00'),
    (5, 'OUT', 'ESP32_GATE', '2026-03-18 18:30:00'),

    -- Arjun (lab work)
    (6, 'IN', 'ESP32_LAB', '2026-03-18 08:50:00'),
    (6, 'OUT', 'ESP32_LAB', '2026-03-18 19:10:00'),

    -- Sneha (normal day)
    (7, 'IN', 'ESP32_OFFICE', '2026-03-18 09:00:00'),
    (7, 'OUT', 'ESP32_OFFICE', '2026-03-18 17:30:00'),

    -- Karthik (multiple scans - realistic behavior)
    (8, 'IN', 'ESP32_GATE', '2026-03-18 09:20:00'),
    (8, 'OUT', 'ESP32_PARKING', '2026-03-18 13:00:00'),
    (8, 'IN', 'ESP32_GATE', '2026-03-18 13:30:00'),
    (8, 'OUT', 'ESP32_GATE', '2026-03-18 18:10:00'),

    -- Manager Neha
    (2, 'IN', 'ESP32_OFFICE', '2026-03-18 09:00:00'),
    (2, 'OUT', 'ESP32_OFFICE', '2026-03-18 18:00:00'),

    -- Manager Amit
    (3, 'IN', 'ESP32_LAB', '2026-03-18 08:45:00'),
    (3, 'OUT', 'ESP32_LAB', '2026-03-18 18:20:00');
    `;

    await connection.query(sql);

    console.log("🎉 Realistic demo database ready!");

    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📊 Tables:", tables);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    if (connection) await connection.end();
    console.log("🔌 Connection closed");
  }
}

setupDemoDB();