import ejs from "ejs";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import formidable from "formidable";
import { Readable } from 'stream';
import { compressFile }from "./compresser.js";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderLaporanPage = async (req, res, currentUser) => {
    try {
        const filePath = path.join(__dirname, "..", "views", "laporan.ejs");

        ejs.renderFile(
            filePath,
            { user: currentUser },
            async (err, html) => {
                if (err) {
                    console.error(err);
                    res.writeHead(500);
                    return res.end("EJS Error: " + err);
                }

                const contentType = "text/html";
                let compressedFile = await compressFile(req, res, contentType, html);
                const streamToSend = Readable.from(compressedFile);
                res.writeHead(200, {
                    "Content-Type": contentType,
                    "Transfer-Encoding": "chunked"
                });

                streamToSend.pipe(res);
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
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
        allowEmptyFiles: false,
        filter: function({ mimetype }) {
            return mimetype && mimetype.includes("image");
        }
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Upload Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Gagal memproses file" }));
        }

        try {
            const typeVal = Array.isArray(fields.reportType) ? fields.reportType[0] : fields.reportType;
            const nameVal = Array.isArray(fields.itemName) ? fields.itemName[0] : fields.itemName;
            const locVal = Array.isArray(fields.itemLocation) ? fields.itemLocation[0] : fields.itemLocation;
            const descVal = Array.isArray(fields.itemDesc) ? fields.itemDesc[0] : fields.itemDesc;

            let fotoPath = "/gambar/cat4.jpg";
            const uploadedFile = files.fotoBarang ? (Array.isArray(files.fotoBarang) ? files.fotoBarang[0] : files.foto) : null;

            if (uploadedFile) {
                const newFilename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
                const finalPath = path.join(process.cwd(), "public/gambar", newFilename);

                await sharp(uploadedFile.filepath)
                    .resize(800)
                    .jpeg({ quality: 70, mozjpeg: true })
                    .toFile(finalPath);
                
                fotoPath = `/gambar/${newFilename}`;
            }

            const tipe = typeVal === "lost" ? "kehilangan" : "penemuan";

            await pool.query(
                `INSERT INTO laporan (id_user, tipe_laporan, nama_barang, lokasi, deskripsi, foto_barang, tanggal_kejadian)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [currentUser.id_user, tipe, nameVal, locVal, descVal, fotoPath]
            );

            res.writeHead(302, { Location: "/" });
            res.end();

        } catch (dbErr) {
            console.error("Database Error:", dbErr);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: "Gagal menyimpan ke database" }));
        }
    });
};
