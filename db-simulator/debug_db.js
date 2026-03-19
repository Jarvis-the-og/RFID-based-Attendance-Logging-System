const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

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

async function debugDatabase() {

  let conn;

  try {

    conn = await getConnection();

    console.log("\n📊 DATABASE DEBUG START\n");

    // 1️⃣ Get all tables
    const [tables] = await conn.query("SHOW TABLES");

    console.log("🧾 Tables:");
    console.log(tables);

    for (let tableObj of tables) {

      const tableName = Object.values(tableObj)[0];

      console.log(`\n==============================`);
      console.log(`📌 TABLE: ${tableName}`);
      console.log(`==============================`);

      // 2️⃣ Schema (columns)
      const [columns] = await conn.query(`DESCRIBE ${tableName}`);

      console.log("\n📐 Schema:");
      columns.forEach(col => {
        console.log(
          `${col.Field} | ${col.Type} | ${col.Null} | ${col.Key}`
        );
      });

      // 3️⃣ Data
      const [rows] = await conn.query(`SELECT * FROM ${tableName}`);

      console.log("\n📦 Data:");
      if (rows.length === 0) {
        console.log("No data");
      } else {
        console.table(rows);
      }

    }

    console.log("\n✅ DATABASE DEBUG COMPLETE\n");

  } catch (err) {

    console.error("❌ ERROR:", err);

  } finally {

    if (conn) await conn.end();

  }

}

debugDatabase();