import ejs from "ejs";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteLaporan = async (req, res, currentUser, id_laporan) => {
    try {
        await pool.query(
            `DELETE FROM laporan WHERE id_laporan = $1 AND id_user = $2`,
            [id_laporan, currentUser.id_user]
        );

        const result = await pool.query(
            `SELECT * FROM laporan WHERE id_user = $1 ORDER BY created_at DESC`,
            [currentUser.id_user]
        );

        const filePath = path.join(__dirname, "..", "views", "history.ejs");

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
                
                if (acceptEncoding.includes('gzip')) {
                    zlib.gzip(html, (error, buffer) => {
                        if (error) {
                            console.error("Compression Error:", error);
                            res.writeHead(200, { "Content-Type": "text/html" });
                            return res.end(html);
                        }

                        res.writeHead(200, {
                            "Content-Type": "text/html",
                            "Content-Encoding": "gzip"
                        });
                        res.end(buffer);
                    });
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