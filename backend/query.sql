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
);