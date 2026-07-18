const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const root = __dirname;
const projectRoot = path.resolve(root, "..");
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function loadEnvFile(filePath) {
  try {
    return Object.fromEntries(
      fs.readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const separator = line.indexOf("=");
          return [line.slice(0, separator), line.slice(separator + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function runtimeConfig() {
  const rootEnv = loadEnvFile(path.join(projectRoot, ".env"));
  return {
    API_BASE_URL: process.env.API_BASE_URL || rootEnv.API_BASE_URL || "http://localhost:3000",
    SUPABASE_URL: process.env.SUPABASE_URL || rootEnv.SUPABASE_URL || "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || rootEnv.SUPABASE_PUBLISHABLE_KEY || "",
  };
}

http
  .createServer((request, response) => {
    const requestedPath = request.url === "/" ? "/index.html" : request.url;
    if (requestedPath.split("?")[0] === "/config.js") {
      response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
      response.end(`window.SPEAKLIO_CONFIG = ${JSON.stringify(runtimeConfig())};\n`);
      return;
    }

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
