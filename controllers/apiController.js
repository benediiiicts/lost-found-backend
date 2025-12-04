import pool from "../db.js";
import formidable from "formidable";
import path from "path";
import fs from "fs";

export const getLaporan = async (req, res, url, currentUser) => {
    try {
        let result;
        const filterUser = url.searchParams.get("mine");
        if (filterUser === "true" && currentUser) {
            result = await pool.query('SELECT l.*, u.username as pelapor_name FROM laporan l JOIN users u ON l.id_user = u.id_user WHERE l.id_user = $1 ORDER BY l.created_at DESC', [currentUser.id_user]);
        } else {
            result = await pool.query('SELECT l.*, u.username as pelapor_name FROM laporan l JOIN users u ON l.id_user = u.id_user ORDER BY l.created_at DESC');
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        res.writeHead(500);
        res.end("Error DB");
    }
};

export const postLaporan = (req, res, currentUser) => {
    if (!currentUser) {
        res.writeHead(403);
        return res.end(JSON.stringify({message: "Belum Login"}));
    }

    const form = formidable({
        uploadDir: path.join(process.cwd(), "public/gambar"), 
        keepExtensions: true, 
        maxFileSize: 5 * 1024 * 1024, 
        allowEmptyFiles: false,
        filter: function ({mimetype}) {
            return mimetype && mimetype.includes("image");
        },
        filename: (name, ext, part, form) => {
            return `${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
        }
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Upload Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Gagal memproses file" }));
        }

        try {
            const typeVal = Array.isArray(fields.type) ? fields.type[0] : fields.type;
            const nameVal = Array.isArray(fields.name) ? fields.name[0] : fields.name;
            const locVal = Array.isArray(fields.loc) ? fields.loc[0] : fields.loc;
            const descVal = Array.isArray(fields.desc) ? fields.desc[0] : fields.desc;

            let fotoPath = "/gambar/cat4.jpg"; 
            const uploadedFile = files.foto ? (Array.isArray(files.foto) ? files.foto[0] : files.foto) : null;

            if (uploadedFile) {
                fotoPath = `/gambar/${uploadedFile.newFilename}`;
            }

            const tipe = typeVal === 'lost' ? 'kehilangan' : 'penemuan';

            await pool.query(
                `INSERT INTO laporan (id_user, tipe_laporan, nama_barang, lokasi, deskripsi, foto_barang, tanggal_kejadian) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [currentUser.id_user, tipe, nameVal, locVal, descVal, fotoPath]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));

        } catch (dbErr) {
            console.error("Database Error:", dbErr);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: "Gagal menyimpan ke database" }));
        }
    });
};

export const deleteLaporan = async (res, idLaporan) => {
    await pool.query('DELETE FROM laporan WHERE id_laporan = $1', [idLaporan]);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
};

export const updateLaporanStatus = async (res, idLaporan) => {
    await pool.query("UPDATE laporan SET status = 'Selesai' WHERE id_laporan = $1", [idLaporan]);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
};