require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Terhubung ke database PostgreSQL');
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error akuisisi client', err.stack);
  }
  console.log('Berhasil terhubung ke database saat inisialisasi!');
});