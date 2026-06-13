const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const root = __dirname;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

http
  .createServer((request, response) => {
    const requestedPath = request.url === "/" ? "/index.html" : request.url;
    const filePath = path.join(root, decodeURIComponent(requestedPath.split("?")[0]));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, contents) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(contents);
    });
  })
  .listen(port, () => {
    console.log(`Speaklio preview running at http://localhost:${port}`);
  });
