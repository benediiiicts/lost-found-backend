import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "../public");

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


export const servePageWithHeader = (res, pagePath, currentUser) => {
    try {
        let headerPath;
        let headerContent;

        if(currentUser.role === "admin") {
            headerPath = path.join(PUBLIC_DIR, "pages", "headerAdmin.html");
            headerContent = fs.readFileSync(headerPath, "utf-8");
        }else {
            headerPath = path.join(PUBLIC_DIR, "pages", "header.html");
            headerContent = fs.readFileSync(headerPath, "utf-8");
        }
        
        const pageContent = fs.readFileSync(pagePath, "utf-8");

        const finalHtml = pageContent.replace("", headerContent);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(finalHtml);
    } catch (err) {
        console.error("Error serving page:", err);
        res.writeHead(500);
        res.end("Server Error");
    }
};