import pg from 'pg';
import 'dotenv/config'; // Baris ini WAJIB ada di paling atas untuk load .env

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

// Cek koneksi (Opsional, agar tahu kalau gagal connect)
pool.connect((err) => {
    if (err) {
        console.error('Koneksi Database GAGAL:', err.message);
    } else {
        console.log('Koneksi Database BERHASIL');
    }
});

export default pool;