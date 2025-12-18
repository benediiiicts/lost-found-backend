import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Readable } from 'stream';
import { compressFile }from "./compresser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderLoginPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "..", "views", "login.ejs");
        ejs.renderFile(
            filePath,
            { success : true },
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
        console.error("Render Login Error:", err);
        res.writeHead(500);
        res.end("Server error");
    }
};
