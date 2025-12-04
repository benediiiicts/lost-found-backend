import http from "node:http";
import path from "node:path";
import { fileURLToPath } from 'url';


// Import Helpers & Controllers
import { serveFile, servePageWithHeader } from "./utils/staticServer.js"; 
import { getCookie } from "./utils/httpData.js";
import { SESSIONS } from "./utils/sessionStore.js";
import * as Auth from "./controllers/authController.js";
import * as Api from "./controllers/apiController.js";

// Konfigurasi Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");

const server = new http.Server();

server.on("request", async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // 1. CEK AUTH
    const sessionId = getCookie(req, "session_id");
    let currentUser = null;
    if (sessionId && SESSIONS.has(sessionId)) {
        currentUser = SESSIONS.get(sessionId);
    }

    console.log(`[${method}] ${pathname} | User: ${currentUser ? currentUser.username : 'Guest'}`);

    // --- ROUTING ---

    // A. AUTHENTICATION
    if (pathname === "/auth/login" && method === "POST") return Auth.handleLogin(req, res);
    if (pathname === "/auth/register" && method === "POST") return Auth.handleRegister(req, res);
    if (pathname === "/logout") return Auth.handleLogout(req, res, sessionId);

    // B. API LAPORAN
    if (pathname === "/api/laporan") {
        if (method === "GET") return Api.getLaporan(req, res, url, currentUser);
        if (method === "POST") return Api.postLaporan(req, res, currentUser);
    }
    // API dengan ID (Update/Delete)
    if (pathname.startsWith("/api/laporan/") && pathname.length > 13) {
        const idLaporan = pathname.split("/")[3];
        if (!currentUser) return res.end();
        
        if (method === "DELETE") return Api.deleteLaporan(res, idLaporan);
        if (method === "PUT") return Api.updateLaporanStatus(res, idLaporan);
    }

    // C. STATIC FILES (CSS, JS, GAMBAR)
    if (pathname.startsWith("/styles/") || pathname.startsWith("/scripts/") || pathname.startsWith("/gambar/")) {
        const mimeTypes = {
            ".css": "text/css",
            ".js": "application/javascript",
            ".jpg": "image/jpeg",
            ".png": "image/png"
        };
        const ext = path.extname(pathname);
        // Hapus slash awal agar path.join bekerja benar dari root public
        const filePath = path.join(PUBLIC_DIR, pathname); 
        return serveFile(res, filePath, mimeTypes[ext] || "text/plain");
    }

    // D. HTML PAGES (VIEW)
    // Redirect Root
    if (pathname === "/") {
        res.setHeader("Location", currentUser ? "/beranda" : "/login");
        res.statusCode = 302;
        return res.end();
    }
    
    // Login/Register Pages
    if (pathname === "/login" || pathname === "/register") {
        if (currentUser) {
            res.setHeader("Location", "/beranda");
            res.statusCode = 302;
            return res.end();
        }
        return serveFile(res, path.join(PUBLIC_DIR, "pages", `${pathname}.html`), "text/html");
    }

    // Protected Pages
    if (["/beranda", "/pelaporan", "/laporansaya"].includes(pathname)) {
        if (!currentUser) {
            res.setHeader("Location", "/login");
            res.statusCode = 302;
            return res.end();
        }
        const fileMap = {
            "/beranda": "index.html",
            "/pelaporan": "report.html",
            "/laporansaya": "dashboard.html"
        };
        const fullPath = path.join(PUBLIC_DIR, "pages", fileMap[pathname]);
        return servePageWithHeader(res, fullPath, currentUser);
    }

    // Admin Panel
    if (pathname === "/adminpanel") {
        if (currentUser && currentUser.role === "admin") {
            return servePageWithHeader(res, path.join(PUBLIC_DIR, "pages", "admin.html"), currentUser);
        }
        res.statusCode = 403;
        return res.end("Forbidden");
    }

    // 404 Not Found
    res.statusCode = 404;
    res.end("Not Found");
});

server.listen({ host: "127.0.0.1", port: 8000 }, () => {
    console.log("Server berjalan di http://127.0.0.1:8000");
});