// controllers/apiController.js
import pool from "../db.js";
import { readBody } from "../utils/httpData.js";

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

export const postLaporan = async (req, res, currentUser) => {
    if (!currentUser) {
        res.writeHead(403);
        return res.end(JSON.stringify({message: "Belum Login"}));
    }
    const data = await readBody(req);
    try {
        const tipe = data.type === 'lost' ? 'kehilangan' : 'penemuan';
        const foto = "/gambar/cat4.jpg"; 
        await pool.query(
            `INSERT INTO laporan (id_user, tipe_laporan, nama_barang, lokasi, deskripsi, foto_barang, tanggal_kejadian) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [currentUser.id_user, tipe, data.name, data.loc, data.desc, foto]
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
    } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false }));
    }
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