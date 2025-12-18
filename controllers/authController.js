import crypto from "node:crypto";
import pool from "../db.js";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import { readBody } from "../utils/utility.js";
import { compressFile }from "./compresser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handleLoginError = (req, res, message) => {
    const filePath = path.join(__dirname, "..", "views", "login.ejs");

    ejs.renderFile(
        filePath,
        {success: false, message: message},
        async (err, html) => {
            if(err){
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
};

export const handleLogin = async (req, res, SESSIONS) => {
    const { username, password } = await readBody(req);
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (user.password === password) {
                const newSessionId = crypto.randomBytes(32).toString("hex");
                SESSIONS.set(newSessionId, { id_user: user.id_user, username: user.username, role: user.role });

                res.setHeader("Set-Cookie", `session_id=${newSessionId}; HttpOnly; SameSite=Strict; Max-Age=3600; Path=/`);
                if (user.role === "admin") {
                    res.writeHead(302, { "Location": "/admin" });
                } else {
                    res.writeHead(302, { "Location": "/" });
                }
                return res.end();
            }
        }
        handleLoginError(req, res, "Username atau password salah!");
    } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: "Server Error" }));
    }
};

export const handleRegister = async (req, res, SESSIONS) => {
    const { username, password } = await readBody(req);
    try {
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, password, 'pelapor']);
        res.writeHead(302, { "Location": "/login" });
        res.end();
        // res.writeHead(200, { "Content-Type": "text/html" });
        // res.end(`
        //     <script>
        //         alert("Registrasi berhasil! Silakan login.");
        //         window.location.href = "/login";
        //     </script>    
        // `)
    } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Username sudah dipakai" }));
    }
};

export const handleLogout = (req, res, sessionId, SESSIONS) => {
    if (sessionId) SESSIONS.delete(sessionId);
    res.setHeader("Set-Cookie", `session_id=; HttpOnly; Max-Age=0; Path=/`);
    res.setHeader("Location", "/login");
    res.statusCode = 302;
    res.end();
};