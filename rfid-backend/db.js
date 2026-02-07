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

module.exports = { getConnection };