import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const preferredPort = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, {
        "Content-Length": "0",
        "Connection": "close"
      });
      response.end();
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (url.pathname === "/") {
      response.writeHead(302, {
        "Location": "/playground/",
        "Content-Length": "0",
        "Connection": "close"
      });
      response.end();
      return;
    }

    const filePath = await resolveRequestPath(url.pathname);
    const file = await readFile(filePath);

    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Content-Length": String(file.byteLength),
      "Connection": "close"
    });
    response.end(request.method === "HEAD" ? undefined : file);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status === 404 ? "No encontrado" : "Error del servidor";

    response.writeHead(status, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(Buffer.byteLength(message)),
      "Connection": "close"
    });
    response.end(request.method === "HEAD" ? undefined : message);
  }
});

listen(preferredPort);

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, () => {
    console.log(`SVG Reveal playground: http://localhost:${port}/`);
  });
}

async function resolveRequestPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(join(root, normalizedPath));

  if (!isInsideRoot(filePath)) {
    throw notFound();
  }

  const fileStat = await stat(filePath).catch(() => null);

  if (fileStat?.isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  const finalStat = await stat(filePath).catch(() => null);

  if (!finalStat?.isFile()) {
    throw notFound();
  }

  return filePath;
}

function isInsideRoot(filePath) {
  return filePath === root || filePath.startsWith(`${root}${sep}`);
}

function notFound() {
  const error = new Error("No encontrado");
  error.statusCode = 404;
  return error;
}
