import ejs from "ejs";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import formidable from "formidable";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderLaporanPage = async (req, res, currentUser) => {
    try {
        const filePath = path.join(__dirname, "..", "views", "laporan.ejs");

        ejs.renderFile(
            filePath,
            {},
            (err, html) => {
                if (err) {
                    console.error(err);
                    res.writeHead(500);
                    return res.end("EJS Error: " + err);
                }

                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(html);
            }
        );
    } catch (err) {
        console.error("DB ERROR:", err);
        res.writeHead(500);
        res.end("Database error");
    }
};

export const postLaporan = (req, res, currentUser) => {
    const form = formidable({
        uploadDir: path.join(process.cwd(), "public/gambar"),
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
        allowEmptyFiles: false,
        filter: function({ mimetype }) {
            return mimetype && mimetype.includes("image");
        },
        filename: (name, ext) => {
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

            const tipe = typeVal === "lost" ? "kehilangan" : "penemuan";

            await pool.query(
                `INSERT INTO laporan (id_user, tipe_laporan, nama_barang, lokasi, deskripsi, foto_barang, tanggal_kejadian)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [currentUser.id_user, tipe, nameVal, locVal, descVal, fotoPath]
            );

            // 🔥 Setelah insert, redirect ke halaman laporan
            res.writeHead(302, { Location: "/laporan" });
            res.end();

        } catch (dbErr) {
            console.error("Database Error:", dbErr);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: "Gagal menyimpan ke database" }));
        }
    });
};
