/**
 * OneBot by HyperSoft
 * Unified Production Express Server & Discord Bot Process
 * 
 * Target Port: process.env.PORT || 14713
 * Host Binding: 0.0.0.0
 * Health Endpoint: GET /health -> {"status":"ok","service":"OneBot","version":"1.0.0"}
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './dashboard/routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 14713 : 3000);
const HOST = '0.0.0.0';

// Cookie Parser & Security Middleware
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(';');
  for (let i = 0; i < items.length; i++) {
    const parts = items[i].split('=');
    const key = parts[0]?.trim();
    if (key) {
      cookies[key] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  }
  return cookies;
}

app.use((req, res, next) => {
  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Cookie Parsing
  req.cookies = parseCookies(req.headers.cookie);

  // Cookie Setting Helper
  res.cookie = (name, val, options = {}) => {
    let cookieStr = `${name}=${encodeURIComponent(val)}`;
    if (options.maxAge) cookieStr += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
    if (options.httpOnly) cookieStr += '; HttpOnly';
    if (options.secure) cookieStr += '; Secure';
    if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
    cookieStr += `; Path=${options.path || '/'}`;
    res.setHeader('Set-Cookie', cookieStr);
  };

  res.clearCookie = (name, options = {}) => {
    res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=${options.path || '/'}; HttpOnly`);
  };

  next();
});

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Health Check Endpoint
app.get('/health', (req, res) => {
  return res.json({
    status: "ok",
    service: "OneBot",
    version: "1.0.0"
  });
});

// Mount Dashboard API Routes
app.use('/api', apiRouter);

// Serve Frontend Vite SPA
const distPath = path.resolve(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development before build, serve fallback
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>OneBot by HyperSoft</title></head>
        <body style="background:#0a0a0c;color:#fff;font-family:sans-serif;padding:2rem;">
          <h1>OneBot by HyperSoft v1.0.0</h1>
          <p>The production API is ONLINE on port ${PORT}.</p>
          <p>Run <code>npm run build</code> to compile the production dashboard assets.</p>
        </body>
      </html>
    `);
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[OneBot Express Error]:', err.message);
  res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
});

// Start Express Server
const server = app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 OneBot Express Server listening on http://${HOST}:${PORT}`);
  console.log(`📊 Health Endpoint: http://${HOST}:${PORT}/health`);
  console.log(`====================================================`);
});

// Boot Discord Bot Client safely in the same process
try {
  const { default: client } = await import('./index.js');
  app.set('discordClient', client);
} catch (err) {
  console.error('❌ Failed to boot Discord Bot client:', err.message);
}

export { app, server };
export default app;
