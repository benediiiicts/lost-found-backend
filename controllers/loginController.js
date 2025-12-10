import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderLoginPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "..", "views", "login.ejs");
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
        console.error("Render Login Error:", err);
        res.writeHead(500);
        res.end("Server error");
    }
};
