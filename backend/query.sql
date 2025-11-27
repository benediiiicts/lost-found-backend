<<<<<<< HEAD
create table admin (
	idAdmin int primary key,
	username varchar(255) unique not null,
	password varchar(255) not null
);

create table users (
	idUser int primary key,
	username varchar(255) unique not null,
	password varchar(255) not null
);

create table barang (
	idBarang int primary key,
	namaBarang varchar(255) not null,
	deskripsi text,
	gambar BYTEA not null
);

create table laporan (
	idLaporan int primary key,
	tanggalLaporan timestamp not null,
	lokasi text not null,
	status varchar(255) not null,
	idUser int REFERENCES users(idUser),
	idBarang int REFERENCES barang(idBarang)
=======
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
>>>>>>> 1365ae8bdec008ef47eb1d503627ed51f8c45fdb
);