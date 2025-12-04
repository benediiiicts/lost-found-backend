// controllers/authController.js
import crypto from "node:crypto";
import pool from "../db.js";
import { readBody } from "../utils/httpData.js";
import { SESSIONS } from "../utils/sessionStore.js";

export const handleLogin = async (req, res) => {
    const { username, password } = await readBody(req);
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (user.password === password) {
                const newSessionId = crypto.randomBytes(32).toString("hex");
                SESSIONS.set(newSessionId, { id_user: user.id_user, username: user.username, role: user.role });
                
                res.setHeader("Set-Cookie", `session_id=${newSessionId}; HttpOnly; SameSite=Strict; Max-Age=3600; Path=/`);
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: true, redirectUrl: user.role === "admin" ? "/adminpanel" : "/beranda" }));
            }
        }
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Username/Password Salah" }));
    } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: "Server Error" }));
    }
};

export const handleRegister = async (req, res) => {
    const { username, password } = await readBody(req);
    try {
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, password, 'pelapor']);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
    } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Username sudah dipakai" }));
    }
};

export const handleLogout = (req, res, sessionId) => {
    if (sessionId) SESSIONS.delete(sessionId);
    res.setHeader("Set-Cookie", `session_id=; HttpOnly; Max-Age=0; Path=/`);
    res.setHeader("Location", "/login");
    res.statusCode = 302;
    res.end();
};