/**
 * OneBot by HyperSoft
 * Dashboard REST API Router (ES Module)
 * 
 * Implements real Discord OAuth2, Session Management, Capability Matrix,
 * Resource Discovery, and Strict Resource Ownership Verification.
 */

import express from 'express';
import { guildDb } from '../../utils/guildDb.js';
import { 
  authenticateUser, 
  authorizeGuildAccess, 
  validateResourceOwnership,
  generateOAuthState,
  verifyOAuthState,
  exchangeOAuthCode,
  createSession,
  destroySession,
  generateGuildCapabilities,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI
} from '../utils/auth.js';

const router = express.Router();

// ---------------------------------------------------------------------
// Rate Limiter for Authentication & Sensitive Operations
// ---------------------------------------------------------------------
const rateLimitMap = new Map(); // ip:action -> { count, resetAt }
function checkRateLimit(key, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  let record = rateLimitMap.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(key, record);
    return true;
  }
  record.count += 1;
  return record.count <= maxRequests;
}

// ---------------------------------------------------------------------
// 1. Health & Public Check
// ---------------------------------------------------------------------
router.get('/health', (req, res) => {
  return res.json({
    status: "ok",
    service: "OneBot",
    version: "1.0.0"
  });
});

// ---------------------------------------------------------------------
// 2. Discord OAuth2 Flow Endpoints
// ---------------------------------------------------------------------

/**
 * Initiates Discord OAuth2 Login Flow
 */
router.get('/auth/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(`login:${ip}`, 20, 60000)) {
    return res.status(429).json({ error: "تجاوزت حد محاولات تسجيل الدخول، يرجى المحاولة لاحقاً." });
  }

  if (!DISCORD_CLIENT_SECRET) {
    return res.status(500).json({
      error: "إعدادات Discord OAuth (Client Secret) غير متوفرة في بيئة التشغيل.",
      code: "OAUTH_CONFIG_MISSING"
    });
  }

  const state = generateOAuthState();
  const isHttps = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SECURE === 'true');
  res.cookie('onebot_oauth_state', state, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/'
  });

  const authUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds&state=${state}`;

  return res.redirect(authUrl);
});

/**
 * Discord OAuth2 Callback Handler
 */
router.get('/auth/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    console.warn(`[OAuth Callback Cancelled]: ${oauthError}`);
    return res.redirect('/?auth=cancelled');
  }

  // Verify State parameter (CSRF Protection)
  const stateCookie = req.cookies?.onebot_oauth_state;
  const isStateValid = verifyOAuthState(state) || (stateCookie && stateCookie === state);

  if (!state || !isStateValid) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head><meta charset="utf-8"><title>خطأ في المصادقة</title></head>
        <body style="background:#0F0F12;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
          <h2 style="color:#E53935;">❌ خطأ في التحقق الأمني (OAuth State Mismatch)</h2>
          <p>انتهت صلاحية جلسة تسجيل الدخول أو تم رفض التحقق ضد هجمات CSRF.</p>
          <a href="/api/auth/login" style="color:#fff;background:#E53935;padding:0.75rem 1.5rem;text-decoration:none;border-radius:8px;">إعادة المحاولة</a>
        </body>
      </html>
    `);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Missing authorization code from Discord." });
  }

  try {
    const { userData, guildsData, accessToken } = await exchangeOAuthCode(code);
    const sessionId = createSession(userData, guildsData, accessToken);

    // Set secure HttpOnly session cookie (dynamically adapts to HTTP vs HTTPS)
    const isHttps = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SECURE === 'true');
    res.cookie('onebot_session', sessionId, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.clearCookie('onebot_oauth_state', { path: '/' });
    return res.redirect('/');
  } catch (err) {
    console.error('[OAuth Callback Error]:', err.message);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head><meta charset="utf-8"><title>فشل تسجيل الدخول</title></head>
        <body style="background:#0F0F12;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
          <h2 style="color:#E53935;">❌ فشل إتمام تسجيل الدخول عبر ديسكورد</h2>
          <p>${err.message}</p>
          <a href="/" style="color:#fff;background:#202028;padding:0.75rem 1.5rem;text-decoration:none;border-radius:8px;">العودة</a>
        </body>
      </html>
    `);
  }
});

/**
 * Destroys current session and logs out user
 */
const handleLogout = (req, res) => {
  const sessionId = req.cookies?.onebot_session || req.sessionId;
  if (sessionId) {
    destroySession(sessionId);
  }
  res.clearCookie('onebot_session', { path: '/' });
  return res.json({ success: true, message: "تم تسجيل الخروج بنجاح." });
};

router.post('/auth/logout', handleLogout);
router.get('/auth/logout', handleLogout);

/**
 * Returns current authenticated user profile and raw guild memberships
 */
router.get('/auth/me', authenticateUser, (req, res) => {
  return res.json({
    success: true,
    user: req.user,
    guilds: req.userGuilds || []
  });
});

// ---------------------------------------------------------------------
// 3. Guild Discovery & Management Endpoints
// ---------------------------------------------------------------------

/**
 * Returns user's manageable Discord guilds merged with OneBot bot installation status
 */
router.get('/guilds', authenticateUser, (req, res) => {
  const discordClient = req.app.get('discordClient');

  const formattedGuilds = (req.userGuilds || []).map(g => {
    const perms = BigInt(g.permissions || '0');
    const isOwner = g.owner === true;
    const isAdmin = (perms & 0x8n) === 0x8n;
    const canManageGuild = (perms & 0x20n) === 0x20n;
    const manageable = isOwner || isAdmin || canManageGuild;

    const botInstalled = Boolean(discordClient && discordClient.isReady?.() && discordClient.guilds.cache.has(g.id));

    return {
      guildId: g.id,
      guildName: g.name,
      guildIcon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      isOwner,
      canManage: manageable,
      botInstalled,
      permissions: g.permissions
    };
  }).filter(g => g.canManage); // Return only manageable guilds

  return res.json({ success: true, guilds: formattedGuilds });
});

// Parameter Sanitization Middleware
router.param('guildId', (req, res, next, guildId) => {
  if (!guildId || !/^\d{16,20}$/.test(guildId)) {
    return res.status(400).json({ error: "معرف السيرفر غير صالح (Invalid Guild ID)" });
  }
  req.guildId = String(guildId).trim();
  next();
});

/**
 * GET /api/guilds/:guildId/capabilities
 * Returns server-calculated capability & permission matrix
 */
router.get('/guilds/:guildId/capabilities', authenticateUser, authorizeGuildAccess, (req, res) => {
  const discordClient = req.app.get('discordClient');
  const botGuild = discordClient?.guilds?.cache?.get(req.guildId) || null;
  const capabilities = generateGuildCapabilities(req.targetGuild, botGuild);

  return res.json({ success: true, capabilities });
});

/**
 * GET /api/guilds/:guildId/resources
 * Returns verified channels and roles belonging exclusively to the target guild
 */
router.get('/guilds/:guildId/resources', authenticateUser, authorizeGuildAccess, (req, res) => {
  const discordClient = req.app.get('discordClient');
  if (!discordClient || !discordClient.isReady?.()) {
    return res.status(503).json({ error: "Discord Bot Client is initializing, please retry.", code: "BOT_CONNECTING" });
  }

  const botGuild = discordClient.guilds.cache.get(req.guildId);
  if (!botGuild) {
    return res.status(404).json({ error: "OneBot is not installed in this server.", code: "BOT_NOT_INSTALLED" });
  }

  const channels = botGuild.channels.cache.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentId: c.parentId || null
  })).sort((a, b) => a.name.localeCompare(b.name));

  const roles = botGuild.roles.cache.map(r => ({
    id: r.id,
    name: r.name,
    position: r.position,
    color: r.hexColor,
    managed: r.managed
  })).sort((a, b) => b.position - a.position);

  return res.json({
    success: true,
    guildId: req.guildId,
    channels,
    roles
  });
});

/**
 * GET /api/guilds/:guildId/settings
 * Retrieves persistent settings for the target guild
 */
router.get('/guilds/:guildId/settings', authenticateUser, authorizeGuildAccess, async (req, res) => {
  try {
    const settings = await guildDb.get(req.guildId);
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/guilds/:guildId/settings
 * Mutates persistent settings with strict resource ownership validation and MongoDB operator sanitization
 */
router.post('/guilds/:guildId/settings', authenticateUser, authorizeGuildAccess, async (req, res) => {
  try {
    const discordClient = req.app.get('discordClient');

    // 1. Sanitize payload: strip any keys containing MongoDB operators ($)
    const rawPayload = req.body;
    if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
      return res.status(400).json({ error: "Invalid JSON payload structure." });
    }

    const ALLOWED_ROOT_KEYS = [
      'prefix', 'language', 'protection', 'moderation', 'tickets', 
      'autoResponder', 'roles', 'welcome', 'levels', 'embeds', 'logs'
    ];

    const cleanPayload = {};
    for (const key of ALLOWED_ROOT_KEYS) {
      if (key in rawPayload) {
        cleanPayload[key] = rawPayload[key];
      }
    }

    // 2. Strict Resource Ownership Validation (Fail-Closed)
    if (discordClient && discordClient.isReady?.()) {
      const validation = validateResourceOwnership(discordClient, req.guildId, cleanPayload);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: validation.error, 
          code: validation.code || "FOREIGN_RESOURCE_REJECTED" 
        });
      }
    }

    // 3. Persist to MongoDB / JSON storage
    const updated = await guildDb.set(req.guildId, cleanPayload);

    return res.json({ 
      success: true, 
      message: `تم حفظ وتحديث إعدادات السيرفر (${req.guildId}) بنجاح.`,
      settings: updated 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/guilds/:guildId/invalidate-cache
 */
router.post('/guilds/:guildId/invalidate-cache', authenticateUser, authorizeGuildAccess, (req, res) => {
  guildDb.invalidate(req.guildId);
  return res.json({ success: true, message: `Cache invalidated for guild ${req.guildId}` });
});

export default router;
