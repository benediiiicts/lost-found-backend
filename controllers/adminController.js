import ejs from "ejs";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";
import { Readable } from 'stream';

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
            (err, html) => {
                if (err) {
                    console.error(err);
                    res.writeHead(500);
                    return res.end("EJS Error: " + err);
                }

                const acceptEncoding = req.headers['accept-encoding'] || "";
                                                                                
                const streamToSend = Readable.from(html);
                                                
                if (acceptEncoding.includes('gzip')) {
                    res.writeHead(200, {
                    "Content-Type": "text/html",
                    "Content-Encoding": "gzip"
                });

                streamToSend
                    .pipe(zlib.createGzip())
                    .pipe(res);
                } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(html);
                }
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
            `DELETE FROM laporan WHERE id_laporan = $1`,
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
            (err, html) => {
                if (err) {
                    console.error(err);
                    res.writeHead(500);
                    return res.end("EJS Error: " + err);
                }

                const acceptEncoding = req.headers['accept-encoding'] || "";
                const streamToSend = Readable.from(html);
                                
                if (acceptEncoding.includes('gzip')) {
                    res.writeHead(200, {
                    "Content-Type": "text/html",
                    "Content-Encoding": "gzip"
                });

                streamToSend
                    .pipe(zlib.createGzip())
                    .pipe(res);
                } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(html);
                }
            }
        );

    } catch (err) {
        console.error("DB ERROR:", err);
        res.writeHead(500);
        res.end("Database error");
    }
};