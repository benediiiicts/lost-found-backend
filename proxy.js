import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PROXY_PORT = 4433; 
const APP_PORT = 8000; 

const sslOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'server.key')),
    cert: fs.readFileSync(path.join(process.cwd(), 'server.cert'))
};

const proxyServer = https.createServer(sslOptions, (clientReq, clientRes) => {
    
    const options = {
        hostname: 'localhost',
        port: APP_PORT,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers,
        rejectUnauthorized: false 
    };

    const proxyReq = http.request(options, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        proxyRes.pipe(clientRes, {
            end: true
        });
    });

    proxyReq.on('error', (e) => {
        console.error("Gagal koneksi ke Aplikasi Utama:", e.message);
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end("Bad Gateway: Aplikasi Utama (index.js) belum dinyalakan.");
    });

    clientReq.pipe(proxyReq, {
        end: true
    });

});

proxyServer.listen(PROXY_PORT, () => {
    console.log(`SECURE PROXY BERJALAN DI: https://localhost:${PROXY_PORT}`);
    console.log(` Meneruskan traffic ke:    http://localhost:${APP_PORT}`);
});