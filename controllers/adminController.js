import ejs from "ejs";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from 'stream';
import { compressFile }from "./compresser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderAdminPage = async (req, res, currentUser) => {
    try {
        const result = await pool.query(
            `SELECT * FROM laporan ORDER BY created_at DESC`
        );

        const filePath = path.join(__dirname, "..", "views", "admin.ejs");

        ejs.renderFile(
            filePath,
            { items: result.rows, user: currentUser },
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


export const deleteLaporanAdmin = async (req, res, currentUser,id_laporan) => {
    try {
        await pool.query(
            `UPDATE laporan SET status = 'Selesai' WHERE id_laporan = $1`,
            [id_laporan]
        );

        const result = await pool.query(
            `SELECT * FROM laporan ORDER BY created_at DESC`,
            []
        );

        const filePath = path.join(__dirname, "..", "views", "admin.ejs");

        ejs.renderFile(
            filePath,
            { items: result.rows, user: currentUser },
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