/**
 * JANASEVA – Lightweight Local Development Server with MongoDB API Support
 * 
 * Serves the JANASEVA website locally on http://localhost:5000
 * Includes embedded MongoDB REST API endpoints under /api/mongo/*
 * 
 * Features:
 * - Static file serving with correct MIME types
 * - Clean URLs (login → login.html)
 * - Embedded MongoDB REST API (/api/mongo/complaints, /api/mongo/auth, etc.)
 * - CORS headers for cross-origin local development
 * 
 * Usage:
 *   node tools/local_server.cjs [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'website', 'public');
const WEBSITE_DIR = path.resolve(__dirname, '..', 'website');
const ROOT = fs.existsSync(PUBLIC_DIR) ? PUBLIC_DIR : WEBSITE_DIR;
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT, 10) || 5000;

// Load MongoDB API handler if available
let mongoApi = null;
let mongoClient = null;
try {
  mongoApi = require('../backend/mongodb/mongo-api.cjs');
  mongoClient = require('../backend/mongodb/mongo-client.cjs');
} catch (e) {
  console.warn('[SERVER] MongoDB API module could not be loaded:', e.message);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.apk': 'application/vnd.android.package-archive',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function resolveFilePath(reqPath) {
  let decodedPath = decodeURIComponent(reqPath.split('?')[0]);
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let fullPath = path.join(ROOT, safePath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  if (!path.extname(fullPath)) {
    const htmlPath = fullPath + '.html';
    if (fs.existsSync(htmlPath)) {
      return htmlPath;
    }
    const indexPath = path.join(fullPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // 1. Intercept MongoDB API requests (/api/mongo/*)
  if (mongoApi && pathname.startsWith('/api/mongo')) {
    const queryParams = Object.fromEntries(reqUrl.searchParams.entries());
    const handled = await mongoApi.handleMongoApi(req, res, pathname, queryParams);
    if (handled) return;
  }

  // 2. Static File Resolution
  const filePath = resolveFilePath(pathname);

  if (!filePath) {
    const indexPath = path.join(ROOT, 'index.html');
    if (pathname !== '/' && fs.existsSync(indexPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(indexPath));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
    return;
  }

  const contentType = getContentType(filePath);
  const stat = fs.statSync(filePath);

  let cacheControl = 'no-cache';
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
    cacheControl = 'max-age=7200';
  }
  if (ext === '.apk' || filePath.includes('sw.js')) {
    cacheControl = 'no-store';
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff'
  });

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`
========================================
  JANASEVA Web Server & MongoDB API
========================================

  Website:  http://localhost:${PORT}
  Root:     ${ROOT}

  Pages:
    Home:               http://localhost:${PORT}/
    Login:              http://localhost:${PORT}/login
    File Complaint:     http://localhost:${PORT}/complaint
    Track Complaint:    http://localhost:${PORT}/track
    Citizen Dashboard:  http://localhost:${PORT}/citizen-dashboard
    Receiver Dashboard: http://localhost:${PORT}/receiver-dashboard
    Directory:          http://localhost:${PORT}/directory

  MongoDB API Endpoints:
    Health Check:       http://localhost:${PORT}/api/mongo/health
    Complaints:         http://localhost:${PORT}/api/mongo/complaints
    Panchayats:         http://localhost:${PORT}/api/mongo/panchayats
    Notifications:      http://localhost:${PORT}/api/mongo/notifications
    Connect URI:        http://localhost:${PORT}/api/mongo/connect (POST)
`);

  // Attempt initial MongoDB connection
  if (mongoClient) {
    const connected = await mongoClient.connect().catch(() => false);
    if (connected) {
      console.log(`[MONGODB] Connected & Ready at: ${mongoClient.maskUri(mongoClient.config.uri)}`);
    } else {
      console.log(`[MONGODB] Status: Not Connected (${mongoClient.connectionError || 'check URI'})`);
      console.log(`[MONGODB] Set your connection string in "mongodb.config.json" or environment variable MONGODB_URI`);
    }
  }

  console.log('\n  Press Ctrl+C to stop.\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use. Try: node tools/local_server.cjs ${PORT + 1}\n`);
  } else {
    console.error('[ERROR]', err.message);
  }
  process.exit(1);
});
