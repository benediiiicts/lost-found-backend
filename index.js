import http from "node:http";
import fs from "fs";
import path from "path";

import { handleLogin, handleLogout, handleRegister } from "./controllers/authController.js";
import { renderHomePage } from "./controllers/homeController.js";
import { postLaporan, renderLaporanPage } from "./controllers/laporanController.js";
import { renderHistoryPage } from "./controllers/historyController.js";
import { renderAdminPage } from "./controllers/adminController.js";
import { renderLoginPage } from "./controllers/loginController.js";
import { renderRegisterPage } from "./controllers/registerController.js";
import { readBody } from "./utils/utility.js";


const server = new http.Server();
const SESSIONS = new Map();

// ------------------------------
// STATIC FILES
// ------------------------------
const publicPath = path.join(process.cwd(), "public");


// ------------------------------
server.on("request", async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // STATIC
    if (
        pathname.startsWith("/styles/") ||
        pathname.startsWith("/scripts/") ||
        pathname.startsWith("/gambar/")
    ) {
        const filePath = path.join(publicPath, pathname);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                return res.end("File not found");
            }

            let contentType = "text/plain";
            if (pathname.endsWith(".css")) contentType = "text/css";
            if (pathname.endsWith(".js")) contentType = "application/javascript";
            if (pathname.endsWith(".png")) contentType = "image/png";
            if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg"))
                contentType = "image/jpeg";

            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        });

        return;
    }

    // ------------------------------
    // SESSION CHECK (simple)
    // ------------------------------
    const rawCookie = req.headers.cookie; 
    let sessionId = null;

    if (rawCookie) {
        const cookies = rawCookie.split("; ");
        for (const cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "session_id") {
                sessionId = value;
                break;
            }
        }
    }
    const isLoggedIn = sessionId && SESSIONS.has(sessionId);

    console.log(`[${method}] ${pathname} | Session: ${isLoggedIn ? sessionId : "NONE"}`);

    // ------------------------------
    // ROUTING
    // ------------------------------
    switch (pathname) {

        case "/login":
            if (method === "POST") {
                return handleLogin(req, res, SESSIONS);
            }
            if (method === "GET") return renderLoginPage(req, res);
            break;

        case "/register":
            if (method === "POST") return handleRegister(req, res, SESSIONS);
            if (method === "GET") return renderRegisterPage(req, res);
            break;

        case "/logout":
            if (sessionId) handleLogout(sessionId);
            res.writeHead(302, { location: "/login" });
            return res.end();

        case "/":
            if (!isLoggedIn) {
                res.writeHead(302, { location: "/login" });
                return res.end();
            }
            return renderHomePage(req, res, SESSIONS.get(sessionId));

        case "/laporan":
            if (!isLoggedIn) {
                res.writeHead(302, { location: "/login" });
                return res.end();
            }

            if (method === "GET")
                return renderLaporanPage(req, res, SESSIONS.get(sessionId));

            if (method === "POST")
                return postLaporan(req, res, SESSIONS.get(sessionId));

            break;

        case "/history":
            if (!isLoggedIn) {
                res.writeHead(302, { location: "/login" });
                return res.end();
            }
            return renderHistoryPage(req, res, SESSIONS.get(sessionId));

        case "/admin":
            if (!isLoggedIn || SESSIONS.get(sessionId).role !== "admin") {
                res.writeHead(302, { location: "/login" });
                return res.end();
            }
            return renderAdminPage(req, res, SESSIONS.get(sessionId));

        default:
            res.statusCode = 404;
            res.end("Route not found");
    }
});

server.listen(8000, () => {
    console.log("Server berjalan di http://127.0.0.1:8000");
});
