/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const MIME = {
  html: 'text/html; charset=utf-8',
  css:  'text/css; charset=utf-8',
  js:   'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  svg:  'image/svg+xml',
  ico:  'image/x-icon',
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  webm: 'video/webm',
  mp4:  'video/mp4',
  woff: 'font/woff',
  woff2:'font/woff2',
  ttf:  'font/ttf',
  webmanifest: 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  // === IRL App/Website Blocking API ===
  if (req.method === 'POST' && req.url === '/api/toggle-block') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { app, blocked } = JSON.parse(body);
        const hostsPath = process.platform === 'win32' 
          ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
          : '/etc/hosts';
        
        const domains = {
          'YouTube': ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 's.ytimg.com', 'i.ytimg.com'],
          'Instagram': ['instagram.com', 'www.instagram.com', 'cdn.instagram.com'],
          'WhatsApp': ['web.whatsapp.com', 'whatsapp.com'],
          'Snapchat': ['snapchat.com', 'www.snapchat.com'],
          'PUBG Mobile': ['pubgmobile.com'],
          'Chrome': [],
          'Edge': [],
        };

        const targetDomains = domains[app];
        
        if (app === 'Chrome' || app === 'Edge') {
          if (blocked && process.platform === 'win32') {
            const exeName = app === 'Chrome' ? 'chrome.exe' : 'msedge.exe';
            require('child_process').exec(`taskkill /F /IM ${exeName}`, () => {});
          }
        }

        if (!targetDomains || targetDomains.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, msg: `IRL Block ${blocked ? 'enabled' : 'disabled'} for ${app}` }));
        }

        try {
          let hostsContent = fs.readFileSync(hostsPath, 'utf8');
          
          if (blocked) {
            targetDomains.forEach(domain => {
              if (!hostsContent.includes(`127.0.0.1 ${domain}`)) {
                if (!hostsContent.endsWith('\n')) hostsContent += '\r\n';
                hostsContent += `127.0.0.1 ${domain} #ENTROPY_BLOCK\r\n`;
                hostsContent += `::1 ${domain} #ENTROPY_BLOCK\r\n`;
              }
            });
          } else {
            const lines = hostsContent.split('\n');
            hostsContent = lines.filter(line => {
              return !targetDomains.some(domain => line.includes(domain) && line.includes('#ENTROPY_BLOCK'));
            }).join('\n');
          }

          fs.writeFileSync(hostsPath, hostsContent);
          
          if (process.platform === 'win32') {
            require('child_process').exec('ipconfig /flushdns', () => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, msg: `IRL Block ${blocked ? 'enabled' : 'disabled'} for ${app}. (DNS flushed)` }));
            });
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, msg: `IRL Block ${blocked ? 'enabled' : 'disabled'} for ${app}` }));
          }
        } catch (e) {
          console.error("Hosts file error:", e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Permission denied. You must start the server as Administrator.' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Static file serving
  let urlPath = req.url.split('?')[0]; // Strip query strings
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  
  // Security: prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext = path.extname(filePath).slice(1) || 'html';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
});

// ─── BOOST CONNECTION HANDLING ───────────────────────────────
// Allow far more simultaneous connections (default is only 10!)
server.maxConnections = 30;

// Keep-alive: allow connection reuse for 60 seconds
server.keepAliveTimeout = 60000;

// Headers timeout: how long to wait for headers (prevent slow attacks)
server.headersTimeout = 30000;

// Request timeout: max time for a complete request
server.timeout = 120000;

// Increase max listeners to avoid warnings
server.setMaxListeners(100);

// Handle server-level errors so it doesn't crash
server.on('error', (err) => {
  console.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use! Kill the other process or use a different port.`);
    process.exit(1);
  }
});

// ─── CRASH PROTECTION ────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (server stays alive):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (server stays alive):', reason);
});

// Listen on 0.0.0.0 so Android phone on same WiFi can access
server.listen(PORT, '0.0.0.0', () => {
  // Get actual local IP
  const nets = require('os').networkInterfaces();
  let localIP = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }
  console.log('==============================================');
  console.log(' ENTROPY RECLAIMERS SERVER RUNNING');
  console.log('==============================================');
  console.log(' Local:   http://localhost:' + PORT);
  console.log(` Network: http://${localIP}:${PORT}`);
  console.log(' Max connections: ' + server.maxConnections);
  console.log('----------------------------------------------');
  console.log(' Open the Network URL on your Android phone!');
  console.log(' (Make sure phone is on same WiFi network)');
  console.log('==============================================');
});
