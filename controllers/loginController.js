import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib"
import fs from "fs";
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderLoginPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "..", "views", "login.ejs");
        ejs.renderFile(
            filePath,
            { success : true },
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
                    // PENTING: Jangan set 'Content-Length'!
                    // Node.js akan otomatis menambahkan 'Transfer-Encoding: chunked'
                });

                // 2. Alirkan Stream -> Kompresi Gzip -> Response
                streamToSend
                    .pipe(zlib.createGzip()) // Kompresi sambil jalan (Streaming)
                    .pipe(res);
                } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(html);
                }
            }
        );
    } catch (err) {
        console.error("Render Login Error:", err);
        res.writeHead(500);
        res.end("Server error");
    }
};
