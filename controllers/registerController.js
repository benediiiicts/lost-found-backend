import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderRegisterPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "..", "views", "register.ejs");
        ejs.renderFile(
            filePath,
            {},
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
        console.error("Render Register Error:", err);
        res.writeHead(500);
        res.end("Server error");
    }
};