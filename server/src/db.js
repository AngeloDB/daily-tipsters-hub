import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'admin',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'daily_match_hub',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
};

export const pool = mysql.createPool(dbConfig);

export async function getConnection() {
  return await pool.getConnection();
}

export default pool;
