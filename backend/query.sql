CREATE TABLE admin (
    idAdmin SERIAL PRIMARY KEY,
    username varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL
);

CREATE TABLE users (
    idUser SERIAL PRIMARY KEY,
    username varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL
);

CREATE TABLE barang (
    idBarang SERIAL PRIMARY KEY,
    namaBarang varchar(255) NOT NULL,
    deskripsi text,
    gambar BYTEA NOT NULL
);

CREATE TABLE laporan (
    idLaporan SERIAL PRIMARY KEY,
    tanggalLaporan timestamp NOT NULL,
    lokasi text NOT NULL,
    status varchar(255) NOT NULL,
    idUser int REFERENCES users(idUser),
    idBarang int REFERENCES barang(idBarang)
);