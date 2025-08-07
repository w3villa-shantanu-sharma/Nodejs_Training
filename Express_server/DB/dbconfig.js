import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Enable secure connection via SSL
  ssl: {
    // For testing you can set rejectUnauthorized to false.
    // For production, provide the proper CA certificate.
    rejectUnauthorized: false
  },
  // Fix timezone issues
  timezone: '+00:00',
  dateStrings: ['DATE', 'DATETIME']
};

const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
  .then(connection => {
    console.log(' Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

export default pool;

