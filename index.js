import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'url';
import pool from "./db.js"; // Import koneksi database

// --- KONFIGURASI PATH ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");

// --- SESSION STORAGE (In-Memory) ---
// Key: SessionID, Value: { id_user, username, role }
const SESSIONS = new Map();

// --- HELPER: Serve File Statis ---
const serveFile = (response, filePath, contentType) => {
    const fullPath = path.join(PUBLIC_DIR, filePath);
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            response.statusCode = 404;
            response.end("File not found");
        } else {
            response.statusCode = 200;
            response.setHeader("Content-Type", contentType);
            response.end(data);
        }
    });
};

// --- HELPER: Baca Body Request (JSON) ---
const readBody = (request) => {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", chunk => body += chunk.toString());
        request.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
        request.on("error", reject);
    });
};

// --- HELPER: Ambil Cookie ---
function getCookie(request, name) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;
    const list = {};
    cookieHeader.split(`;`).forEach(function(cookie) {
        let [parts_name, ...parts_value] = cookie.split(`=`);
        list[parts_name.trim()] = parts_value.join(`=`);
    });
    return list[name];
}

const server = new http.Server();

server.on("request", async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;
    const method = request.method;

    // 1. CEK AUTH (SESSION)
    const sessionId = getCookie(request, "session_id");
    let currentUser = null;
    
    if (sessionId && SESSIONS.has(sessionId)) {
        currentUser = SESSIONS.get(sessionId); // Isinya: { id_user, username, role }
    }

    console.log(`[${method}] ${pathname} | User: ${currentUser ? currentUser.username : 'Guest'}`);

    // ================================================================
    // A. API ENDPOINTS (Database Interactions)
    // ================================================================

    // 1. API LOGIN (POST)
    if (pathname === "/auth/login" && method === "POST") {
        const { username, password } = await readBody(request);
        
        try {
            // Cek ke Database
            const resDb = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            
            if (resDb.rows.length > 0) {
                const user = resDb.rows[0];
                // Cek Password (Idealnya di-hash, tapi sesuai request kita plain dulu/sesuai input)
                if (user.password === password) {
                    const newSessionId = crypto.randomBytes(32).toString("hex");
                    // Simpan data penting di session server
                    SESSIONS.set(newSessionId, { 
                        id_user: user.id_user, 
                        username: user.username, 
                        role: user.role 
                    });

                    response.setHeader("Set-Cookie", `session_id=${newSessionId}; HttpOnly; SameSite=Strict; Max-Age=3600; Path=/`);
                    response.writeHead(200, { "Content-Type": "application/json" });
                    return response.end(JSON.stringify({ 
                        success: true, 
                        redirectUrl: user.role === "admin" ? "/adminpanel" : "/beranda" 
                    }));
                }
            }
            // Gagal
            response.writeHead(401, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: false, message: "Username/Password Salah" }));
        } catch (err) {
            console.error(err);
            response.writeHead(500);
            response.end(JSON.stringify({ success: false, message: "Server Error" }));
        }
        return;
    }

    // 2. API REGISTER (POST)
    else if (pathname === "/auth/register" && method === "POST") {
        const { username, password } = await readBody(request);
        try {
            // Default role = 'pelapor' sesuai query.sql
            await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, password, 'pelapor']);
            
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: true }));
        } catch (err) {
            console.error(err);
            response.writeHead(400, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: false, message: "Username mungkin sudah dipakai" }));
        }
        return;
    }

    // 3. API GET LAPORAN (Semua atau Filter User)
    else if (pathname === "/api/laporan" && method === "GET") {
        try {
            let result;
            const filterUser = url.searchParams.get("mine"); // ?mine=true

            if (filterUser === "true" && currentUser) {
                // Ambil laporan milik user yang sedang login saja
                result = await pool.query(
                    'SELECT l.*, u.username as pelapor_name FROM laporan l JOIN users u ON l.id_user = u.id_user WHERE l.id_user = $1 ORDER BY l.created_at DESC', 
                    [currentUser.id_user]
                );
            } else {
                // Ambil semua laporan (untuk beranda/admin)
                result = await pool.query(
                    'SELECT l.*, u.username as pelapor_name FROM laporan l JOIN users u ON l.id_user = u.id_user ORDER BY l.created_at DESC'
                );
            }

            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(result.rows));
        } catch (err) {
            console.error(err);
            response.writeHead(500);
            response.end("Error DB");
        }
        return;
    }

    // 4. API POST LAPORAN BARU
    else if (pathname === "/api/laporan" && method === "POST") {
        if (!currentUser) {
            response.writeHead(403);
            return response.end(JSON.stringify({message: "Belum Login"}));
        }

        const data = await readBody(request); // { type, name, loc, desc }
        try {
            // Mapping data JSON ke Kolom DB
            const tipe = data.type === 'lost' ? 'kehilangan' : 'penemuan';
            const foto = "/gambar/cat4.jpg"; // Default gambar (karena kita belum handle upload file server-side)

            await pool.query(
                `INSERT INTO laporan (id_user, tipe_laporan, nama_barang, lokasi, deskripsi, foto_barang, tanggal_kejadian) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [currentUser.id_user, tipe, data.name, data.loc, data.desc, foto]
            );

            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: true }));
        } catch (err) {
            console.error(err);
            response.writeHead(500);
            response.end(JSON.stringify({ success: false }));
        }
        return;
    }

    // 5. API UPDATE STATUS (Selesai) / DELETE
    // Format URL: /api/laporan/123 (method DELETE atau PUT)
    else if (pathname.startsWith("/api/laporan/") && pathname.length > 13) {
        const idLaporan = pathname.split("/")[3];

        if (method === "DELETE") {
            // Cek kepemilikan atau admin
            if (!currentUser) return response.end();
            
            await pool.query('DELETE FROM laporan WHERE id_laporan = $1', [idLaporan]);
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: true }));
        } 
        else if (method === "PUT") { // Mark as solved
             if (!currentUser) return response.end();

             await pool.query("UPDATE laporan SET status = 'Selesai' WHERE id_laporan = $1", [idLaporan]);
             response.writeHead(200, { "Content-Type": "application/json" });
             response.end(JSON.stringify({ success: true }));
        }
        return;
    }

    // 6. LOGOUT
    else if (pathname === "/logout") {
        if (sessionId) SESSIONS.delete(sessionId);
        response.setHeader("Set-Cookie", `session_id=; HttpOnly; Max-Age=0; Path=/`);
        response.setHeader("Location", "/login");
        response.statusCode = 302;
        response.end();
        return;
    }

    // ================================================================
    // B. ROUTING HTML PAGES (Frontend)
    // ================================================================

    if (pathname === "/") {
        response.setHeader("Location", currentUser ? "/beranda" : "/login");
        response.statusCode = 302;
        response.end();
    }
    else if (pathname === "/login" || pathname === "/register") {
        if (currentUser) {
            response.setHeader("Location", "/beranda");
            response.statusCode = 302;
            response.end();
        } else {
            serveFile(response, `pages${pathname}.html`, "text/html");
        }
    }
    else if (["/beranda", "/pelaporan", "/laporansaya"].includes(pathname)) {
        if (!currentUser) {
            response.setHeader("Location", "/login");
            response.statusCode = 302;
            response.end();
        } else {
            // Mapping route ke file asli
            const fileMap = {
                "/beranda": "index.html",
                "/pelaporan": "report.html",
                "/laporansaya": "dashboard.html"
            };
            serveFile(response, `pages/${fileMap[pathname]}`, "text/html");
        }
    }
    else if (pathname === "/adminpanel") {
        if (currentUser && currentUser.role === "admin") {
            serveFile(response, "pages/admin.html", "text/html");
        } else {
            response.statusCode = 403;
            response.end("<h1>403 Forbidden</h1>");
        }
    }
    else if (pathname === "/header.html" || pathname.endsWith("header.html")) {
         serveFile(response, "pages/header.html", "text/html");
    }

    // ================================================================
    // C. STATIC FILES (CSS, JS, IMAGES)
    // ================================================================
    
    else if (pathname.startsWith("/styles/")) {
        serveFile(response, `styles/${path.basename(pathname)}`, "text/css");
    } 
    else if (pathname.startsWith("/scripts/")) {
        serveFile(response, `scripts/${path.basename(pathname)}`, "application/javascript");
    }
    else if (pathname.startsWith("/gambar/")) {
        serveFile(response, `gambar/${path.basename(pathname)}`, "image/jpeg"); // Simplifikasi mime type
    }
    else {
        response.statusCode = 404;
        response.end("Not Found");
    }
});

server.listen({ host: "127.0.0.1", port: 8000 }, () => {
    console.log("Server berjalan di http://127.0.0.1:8000");
});