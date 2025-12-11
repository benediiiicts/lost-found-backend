import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib"

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
        console.error("Render Login Error:", err);
        res.writeHead(500);
        res.end("Server error");
    }
};
