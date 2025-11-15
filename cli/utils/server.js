import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

// Live reload script injected into HTML pages
const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  const eventSource = new EventSource('/__sherp_live_reload');
  eventSource.onmessage = function(event) {
    if (event.data === 'reload') {
      console.log('[sherp] Reloading page...');
      window.location.reload();
    }
  };
  eventSource.onerror = function() {
    console.log('[sherp] Live reload disconnected');
  };
})();
</script>
`;

/**
 * Creates a simple static file server for serving built Astro files
 * with optional live reload support
 */
export function createStaticServer(distPath, options = {}) {
  const { host = '0.0.0.0', port = 4321, liveReload = false } = options;
  const clients = [];

  const server = createServer(async (req, res) => {
    try {
      // Live reload SSE endpoint
      if (liveReload && req.url === '/__sherp_live_reload') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        res.write('retry: 1000\n\n');

        clients.push(res);

        req.on('close', () => {
          const index = clients.indexOf(res);
          if (index !== -1) {
            clients.splice(index, 1);
          }
        });
        return;
      }

      let filePath = req.url === '/' ? '/index.html' : req.url;

      // Remove query string
      filePath = filePath.split('?')[0];

      // Decode URI
      filePath = decodeURIComponent(filePath);

      // Security: prevent directory traversal
      if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      let fullPath = join(distPath, filePath);

      // If path doesn't exist, try with .html extension (for SPA-like routing)
      if (!existsSync(fullPath)) {
        const htmlPath = join(distPath, `${filePath}.html`);
        if (existsSync(htmlPath)) {
          fullPath = htmlPath;
        } else {
          // Try index.html in directory
          const indexPath = join(fullPath, 'index.html');
          if (existsSync(indexPath)) {
            fullPath = indexPath;
          }
        }
      }

      // Check if file exists and is a file
      const stats = await stat(fullPath).catch(() => null);
      if (!stats || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      // Read file
      let content = await readFile(fullPath);
      const ext = extname(fullPath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      // Inject live reload script into HTML pages
      if (liveReload && ext === '.html') {
        const htmlContent = content.toString();
        content = Buffer.from(htmlContent.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`));
      }

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch (error) {
      console.error(chalk.red('Server error:'), error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  return new Promise((resolve, reject) => {
    const tryPort = (currentPort) => {
      server.listen(currentPort, host, () => {
        resolve({
          server,
          url: `http://localhost:${currentPort}`,
          port: currentPort,
          reload: () => {
            // Notify all connected clients to reload
            clients.forEach(client => {
              client.write('data: reload\n\n');
            });
          },
          close: () => {
            return new Promise((resolveClose) => {
              // Close all SSE connections
              clients.forEach(client => client.end());
              clients.length = 0;
              server.close(() => resolveClose());
            });
          }
        });
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(chalk.yellow(`  Port ${currentPort} is in use, trying ${currentPort + 1}...`));
          server.removeAllListeners('error');
          tryPort(currentPort + 1);
        } else {
          reject(err);
        }
      });
    };

    tryPort(port);
  });
}
