const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};
// Serve only public app assets, never source tests, environment files or the server.
const assets = new Set(["index.html", "styles.css", "app.js", "catalog.mjs", "state.mjs", "format.mjs", "assistant.mjs"]);
const server = http.createServer((request, response) => {
  let requestedPath;
  try {
    requestedPath = decodeURIComponent((request.url || "/").split("?")[0]);
  } catch {
    response.writeHead(400);
    response.end("Invalid URL");
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  if (requestedPath === "/") requestedPath = "/index.html";
  if (requestedPath.split(/[\\/]/).includes("..")) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const asset = requestedPath.slice(1);
  if (!assets.has(asset)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  fs.readFile(path.join(root, asset), (error, contents) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(asset)],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  });
});
server.listen(Number(process.env.PORT ?? 4173), "127.0.0.1", () => {
  console.log(`Speaklio preview running at http://127.0.0.1:${server.address().port}`);
});
