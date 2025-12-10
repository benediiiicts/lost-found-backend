import ejs from "ejs";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderHistoryPage = async (req, res, currentUser) => {
    try {
        const result = await pool.query(
            `SELECT * FROM laporan WHERE id_user = $1 ORDER BY created_at DESC`, [currentUser.id_user]
        );

        const filePath = path.join(__dirname, "..", "views", "home.ejs");

        ejs.renderFile(
            filePath,
            { items: result.rows, user: currentUser },
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
