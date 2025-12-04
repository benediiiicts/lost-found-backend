import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "../public");

// --- Helper: Serve File Biasa ---
export const serveFile = (response, fullPath, contentType) => {
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

// --- Helper: Serve Page dengan Header (VERSI SIMPEL / ROLLBACK) ---
// Parameter 'currentUser' boleh dibiarkan ada, meski tidak dipakai di sini
export const servePageWithHeader = (res, pagePath, currentUser) => {
    try {
        // 1. Ambil Header (yang sudah ada link Admin-nya)
        const headerPath = path.join(PUBLIC_DIR, "pages", "header.html");
        const headerContent = fs.readFileSync(headerPath, "utf-8");

        // 2. Ambil Halaman Utama
        const pageContent = fs.readFileSync(pagePath, "utf-8");

        // 3. Gabungkan
        const finalHtml = pageContent.replace("", headerContent);

        // 4. Kirim
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(finalHtml);
    } catch (err) {
        console.error("Error serving page:", err);
        res.writeHead(500);
        res.end("Server Error");
    }
};