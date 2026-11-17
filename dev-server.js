// Local test server – no installs needed. Mimics Vercel: serves index.html
// and routes POST /api/chat to api/chat.js.
//   1. Put your key in .env.local:  DEEPSEEK_API_KEY=sk-...
//   2. node dev-server.js
//   3. Open http://localhost:3000 (or http://<your-laptop-IP>:3000 on a phone on the same Wi-Fi)

const http = require("http");
const fs = require("fs");
const path = require("path");

const envFile = path.join(__dirname, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

process.chdir(__dirname);
const handler = require("./api/chat.js");
const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    if (req.url.startsWith("/api/chat")) {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
        if (raw.length > 1e5) req.destroy();
      });
      req.on("end", () => {
        try {
          req.body = JSON.parse(raw || "{}");
        } catch {
          req.body = {};
        }
        handler(req, res);
      });
      return;
    }
    // Static files in /assets (images)
    if (req.url.startsWith("/assets/")) {
      const f = path.join(__dirname, "assets", path.basename(req.url.split(/[?#]/)[0]));
      const types = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
      if (fs.existsSync(f)) {
        res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream");
        return fs.createReadStream(f).pipe(res);
      }
    }
    // Same as Vercel "cleanUrls": / → index.html, /chat → chat.html
    const page = req.url.split(/[?#]/)[0].replace(/\.html$/, "").replace(/\/$/, "") || "/index";
    const file = path.join(__dirname, path.basename(page) + ".html");
    if (fs.existsSync(file)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return fs.createReadStream(file).pipe(res);
    }
    res.statusCode = 404;
    res.end("Not found");
  })
  .listen(PORT, () => {
    console.log(`Choi Choi running at http://localhost:${PORT}`);
    if (!process.env.DEEPSEEK_API_KEY) console.log("⚠️  DEEPSEEK_API_KEY not set – add it to .env.local");
  });
