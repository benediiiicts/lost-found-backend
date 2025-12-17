import https from "node:https";
import http from "node:http";
import fs from "fs";

const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

const proxy = https.createServer(options, (req, res) => {
  const serverReq = http.request(
    {
      host: "127.0.0.1",
      port: 8000,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        "x-forwarded-proto": "https",
        "x-forwarded-for": req.socket.remoteAddress,
      },
    },
    (serverRes) => {
      res.writeHead(serverRes.statusCode, serverRes.headers);
      serverRes.pipe(res);
    }
  );

  req.pipe(serverReq);

  serverReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
});

proxy.listen(7000, () => {
  console.log("HTTPS reverse proxy running on https://localhost:7000");
});
