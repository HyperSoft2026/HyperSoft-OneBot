/**
 * OneBot by HyperSoft
 * Unified Production Express Server & Discord Bot Process
 * 
 * Order of execution:
 * 1. Load environment (.env, /home/container/.env)
 * 2. Create Express app & register routes/static files
 * 3. Start HTTP server on 0.0.0.0:14713 & confirm listening
 * 4. Initialize Discord bot client (isolated, non-blocking)
 * 5. Initialize MongoDB connection (isolated, non-blocking)
 */

// 1. Load environment before all else
import './src/loadEnv.js';

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './dashboard/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Anti-Crash Handlers with safe logging (no secrets exposed)
process.on('uncaughtException', (err) => {
  console.error('[OneBot Anti-Crash] Uncaught Exception:', err.name, '-', err.message);
  if (err.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[OneBot Anti-Crash] Unhandled Promise Rejection:', reason);
});

// 3. Diagnostic Startup Logging
const HOST = '0.0.0.0';
const PORT = 14713;

console.log('[OneBot] =====================================');
console.log('[OneBot] STARTUP');
console.log(`[OneBot] Node: ${process.version}`);
console.log(`[OneBot] CWD: ${process.cwd()}`);
console.log(`[OneBot] Host: ${HOST}`);
console.log(`[OneBot] Port: ${PORT}`);
console.log('[OneBot] =====================================');

// 4. Create Express Application
const app = express();

// Security Headers & Native Cookie Parser
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
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  req.cookies = parseCookies(req.headers.cookie);

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

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 5. Global Health Check Endpoint
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "OneBot",
    version: "1.0.0"
  });
});

// 6. Mount Dashboard REST API Routes
app.use('/api', apiRouter);

// 7. Serve Production Frontend Assets (Vite dist) or Dynamic Fallback
const distPath = path.resolve(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head><meta charset="UTF-8"><title>OneBot Dashboard</title></head>
        <body style="background:#0a0a0c;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
          <h1 style="color:#E53935;">OneBot by HyperSoft v1.0.0</h1>
          <p>لوحة التحكم قيد التشغيل على المنفذ ${PORT}.</p>
          <p>يرجى تشغيل <code>npm run build</code> لبناء واجهة لوحة التحكم.</p>
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

// 8. Start HTTP Server First
const server = app.listen(PORT, HOST, () => {
  console.log('[OneBot] HTTP SERVER READY');
  console.log(`[OneBot] Listening on ${HOST}:${PORT}`);
  console.log(`[OneBot] Health endpoint: http://${HOST}:${PORT}/health`);

  // 9. Asynchronously & Safely Boot Subsystems AFTER HTTP server is confirmed listening
  bootSubsystems();
});

server.on('error', (err) => {
  console.error('[OneBot] HTTP SERVER ERROR');
  console.error(`[OneBot] Code: ${err.code}`);
  console.error(`[OneBot] Message: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.error(`[OneBot] Port ${PORT} is already bound by another process.`);
  }
});

// 10. Graceful Shutdown Handlers
let isShuttingDown = false;
const handleServerShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[OneBot] Received ${signal}. Closing HTTP server...`);
  
  try {
    const client = app.get('discordClient');
    if (client && typeof client.destroy === 'function') {
      await client.destroy();
      console.log('[OneBot] Discord client disconnected.');
    }
  } catch (e) {}

  server.close(() => {
    console.log('[OneBot] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 4000).unref();
};

process.on('SIGINT', () => handleServerShutdown('SIGINT'));
process.on('SIGTERM', () => handleServerShutdown('SIGTERM'));

// 11. Subsystems Initialization (Discord Bot & MongoDB)
async function bootSubsystems() {
  try {
    console.log('[OneBot] Starting Discord...');
    const { default: client, startDiscordBot, initMongo } = await import('./index.js');
    app.set('discordClient', client);

    // Initialize Discord Bot
    const hasToken = Boolean(process.env.DISCORD_TOKEN && String(process.env.DISCORD_TOKEN).trim());
    if (!hasToken) {
      console.log('[OneBot] Discord: OFFLINE (DISCORD_TOKEN is missing or empty)');
      console.log('[OneBot] Dashboard remains online');
    } else {
      const loginSuccess = await startDiscordBot(process.env.DISCORD_TOKEN);
      if (loginSuccess) {
        console.log(`[OneBot] Discord: ONLINE (Logged in as: ${client.user?.tag || 'Bot'})`);
      } else {
        console.log('[OneBot] Dashboard remains online');
      }
    }

    // Initialize MongoDB
    console.log('[OneBot] Starting MongoDB...');
    if (!process.env.MONGODB_URI || !String(process.env.MONGODB_URI).trim()) {
      console.log('[OneBot] MongoDB: No MONGODB_URI provided, using local JSON database fallback');
      console.log('[OneBot] HTTP server remains ONLINE');
    } else {
      try {
        const mongoConnected = await initMongo(process.env.MONGODB_URI);
        if (mongoConnected) {
          console.log('[OneBot] MongoDB: CONNECTED');
        } else {
          console.log('[OneBot] MongoDB: FAILED, using local database fallback');
          console.log('[OneBot] HTTP server remains ONLINE');
        }
      } catch (mongoErr) {
        console.warn(`[OneBot] MongoDB: FAILED (${mongoErr.message}), using fallback`);
        console.log('[OneBot] HTTP server remains ONLINE');
      }
    }
  } catch (subsystemErr) {
    console.error('[OneBot] Non-fatal Subsystem Error:', subsystemErr.message);
    console.log('[OneBot] Dashboard remains online');
  }
}

export { app, server };
export default app;
