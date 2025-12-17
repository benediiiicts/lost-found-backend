CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'pelapor')) NOT NULL DEFAULT 'pelapor'
);

CREATE TABLE laporan (
    id_laporan SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
    tipe_laporan VARCHAR(20) CHECK (tipe_laporan IN ('kehilangan', 'penemuan')) NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    foto_barang TEXT, 
    lokasi TEXT NOT NULL,
    tanggal_kejadian TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, role) 
VALUES (
    'admin', 
    encode(hmac('admin', 'admin', 'sha256'), 'hex'), 
    'admin'
);