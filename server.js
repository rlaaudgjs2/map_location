import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchFestivals } from './festival.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/map-links.js': ['map-links.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
const server = http.createServer(async (request, response) => {
  if (request.url === '/api/festivals') {
    try {
      const festivals = await fetchFestivals(process.env.TOUR_API_SERVICE_KEY);
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ festivals }));
    } catch (error) {
      console.error('Festival lookup failed:', error.message);
      response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ festivals: [] }));
    }
    return;
  }
  const asset = assets[request.url];
  if (!asset) { response.writeHead(404); response.end(); return; }
  try {
    const body = await readFile(path.join(root, asset[0]));
    response.writeHead(200, { 'Content-Type': asset[1] }); response.end(body);
  } catch { response.writeHead(500); response.end(); }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const requestedPort = Number(process.env.PORT || 3000);
  let port = requestedPort;
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && !process.env.PORT && port < requestedPort + 20) {
      port += 1;
      server.listen(port);
    } else {
      console.error(`Server failed to start: ${error.message}`);
      process.exitCode = 1;
    }
  });
  server.on('listening', () => console.log(`http://localhost:${server.address().port}`));
  server.listen(port);
}
export { server };

