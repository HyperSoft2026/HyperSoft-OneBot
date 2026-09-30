/**
 * OneBot by HyperSoft
 * Dashboard Server-Side Security, Discord OAuth2, Session Management & Resource Ownership
 */

import crypto from 'node:crypto';
import { guildDb } from '../../utils/guildDb.js';

// Configuration
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1542313642060419213';
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
export const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://169.58.70.217:14713/api/auth/callback';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'onebot_hypersoft_production_secret';

// In-Memory Cryptographic OAuth State Store (TTL: 10 minutes)
const oauthStateStore = new Map(); // state -> { expiresAt }

// In-Memory Authenticated Session Store (TTL: 7 days)
export const sessionStore = new Map(); // sessionId -> { user, guilds, accessToken, expiresAt, createdAt }
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

// Periodic cleanup of expired states and sessions
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateStore.entries()) {
    if (now > data.expiresAt) oauthStateStore.delete(state);
  }
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now > session.expiresAt) sessionStore.delete(sessionId);
  }
}, 60 * 1000);

/**
 * Generates a cryptographically secure OAuth2 state token
 */
export function generateOAuthState() {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStateStore.set(state, { expiresAt: Date.now() + 10 * 60 * 1000 });
  return state;
}

/**
 * Validates and consumes an OAuth2 state token (single-use)
 */
export function verifyOAuthState(state) {
  if (!state || typeof state !== 'string') return false;
  const entry = oauthStateStore.get(state);
  if (!entry) return false;
  oauthStateStore.delete(state); // Prevent replay attacks
  return Date.now() <= entry.expiresAt;
}

/**
 * Creates a server-side session for an authenticated Discord user
 */
export function createSession(userData, guildsData, accessToken) {
  const sessionId = crypto.randomUUID();
  sessionStore.set(sessionId, {
    user: userData,
    guilds: guildsData,
    accessToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL
  });
  return sessionId;
}

/**
 * Retrieves a session by ID
 */
export function getSession(sessionId) {
  if (!sessionId) return null;
  const session = sessionStore.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return null;
  }
  return session;
}

/**
 * Destroys an active session
 */
export function destroySession(sessionId) {
  if (sessionId) {
    sessionStore.delete(sessionId);
  }
}

/**
 * Exchanges a Discord OAuth authorization code for access tokens
 */
export async function exchangeOAuthCode(code) {
  if (!DISCORD_CLIENT_SECRET) {
    throw new Error("DISCORD_CLIENT_SECRET is missing from environment variables.");
  }

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: DISCORD_REDIRECT_URI
  });

  const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text().catch(() => '');
    throw new Error(`Discord OAuth token exchange failed: ${tokenRes.status} ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Retrieve user identity
  const userRes = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userRes.ok) throw new Error("Failed to fetch Discord user profile.");
  const userData = await userRes.json();

  // Retrieve user guilds
  const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const guildsData = guildsRes.ok ? await guildsRes.json() : [];

  return { userData, guildsData, accessToken };
}

/**
 * Express Middleware: Authenticates incoming requests
 * Accepts ONLY HttpOnly session cookie or Bearer header.
 * QUERY TOKEN AUTHENTICATION (req.query.token) IS REMOVED FOR SECURITY.
 */
export async function authenticateUser(req, res, next) {
  const tokenFromCookie = req.cookies?.onebot_session;
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const sessionToken = tokenFromCookie || tokenFromHeader;

  if (!sessionToken) {
    return res.status(401).json({
      error: "غير مصرح (Unauthenticated): يتطلب تسجيل الدخول عبر Discord OAuth2.",
      code: "UNAUTHENTICATED"
    });
  }

  // 1. Check server-side sessionStore
  const session = getSession(sessionToken);
  if (session) {
    req.user = session.user;
    req.userGuilds = session.guilds;
    req.sessionId = sessionToken;
    req.accessToken = session.accessToken;
    return next();
  }

  // 2. Direct Discord access token fallback (for external Bearer API clients)
  try {
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });

    if (!userRes.ok) {
      return res.status(401).json({
        error: "جلسة غير صالحة أو منتهية الصلاحية (Invalid or Expired Session).",
        code: "INVALID_SESSION"
      });
    }

    const userData = await userRes.json();
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    const guildsData = guildsRes.ok ? await guildsRes.json() : [];

    req.user = userData;
    req.userGuilds = guildsData;
    req.accessToken = sessionToken;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: "فشل التحقق من الجلسة (Session validation failed).",
      code: "AUTH_VALIDATION_ERROR"
    });
  }
}

/**
 * Express Middleware: Authorizes user access to a specific Guild
 * Enforces server-side permissions: Owner (true), Administrator (0x8), or ManageGuild (0x20)
 * Also verifies that OneBot is installed in the target server.
 */
export async function authorizeGuildAccess(req, res, next) {
  const guildId = req.params.guildId || req.body?.guildId;

  if (!guildId || !/^\d{16,20}$/.test(guildId)) {
    return res.status(400).json({ error: "معرف السيرفر غير صالح (Invalid Guild ID)." });
  }

  const safeGuildId = String(guildId).trim();
  req.guildId = safeGuildId;

  if (!req.user || !req.userGuilds) {
    return res.status(401).json({ error: "يتطلب تسجيل الدخول أولاً." });
  }

  const targetGuild = req.userGuilds.find(g => g.id === safeGuildId);

  if (!targetGuild) {
    return res.status(403).json({
      error: `❌ رفض الوصول: أنت لست عضواً في السيرفر المطلوب (ID: ${safeGuildId}).`,
      code: "GUILD_NOT_MEMBER"
    });
  }

  // Check Discord Permissions
  const permissions = BigInt(targetGuild.permissions || '0');
  const isAdmin = (permissions & 0x8n) === 0x8n;
  const canManageGuild = (permissions & 0x20n) === 0x20n;
  const isOwner = targetGuild.owner === true;

  if (!isOwner && !isAdmin && !canManageGuild) {
    return res.status(403).json({
      error: "❌ غير مصرح: تفتقر إلى صلاحية Administrator أو ManageGuild في هذا السيرفر.",
      code: "INSUFFICIENT_PERMISSIONS"
    });
  }

  req.targetGuild = targetGuild;
  next();
}

/**
 * Server-Side Resource Ownership Validator (FAIL-CLOSED)
 * Rejects any role, channel, or category ID that does NOT belong exclusively to target Guild.
 */
export function validateResourceOwnership(client, guildId, payload) {
  if (!client || !client.isReady?.() || !client.guilds?.cache) {
    return { 
      valid: false, 
      error: "بوت ديسكورد غير جاهز للتحقق من الموارد (Discord client unready).", 
      code: "BOT_NOT_READY" 
    };
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return { 
      valid: false, 
      error: `OneBot ليس عضواً في السيرفر المطلوب (${guildId}).`, 
      code: "BOT_NOT_INSTALLED" 
    };
  }

  const checkRole = (roleId, label) => {
    if (!roleId || typeof roleId !== 'string') return null;
    const cleanId = roleId.trim();
    if (!cleanId) return null;
    const role = guild.roles.cache.get(cleanId);
    if (!role) {
      return `الرتبة المحددة لـ (${label}) لا تنتمي إلى هذا السيرفر (Role ID: ${cleanId}).`;
    }
    return null;
  };

  const checkChannel = (channelId, label) => {
    if (!channelId || typeof channelId !== 'string') return null;
    const cleanId = channelId.trim();
    if (!cleanId || cleanId === 'current') return null;
    const channel = guild.channels.cache.get(cleanId);
    if (!channel) {
      return `الروم المحددة لـ (${label}) لا تنتمي إلى هذا السيرفر (Channel ID: ${cleanId}).`;
    }
    return null;
  };

  let error = null;

  // Moderation
  if (payload.moderation) {
    error = checkRole(payload.moderation.muteRoleId, "رتبة الميوت") ||
            checkRole(payload.moderation.jailRoleId, "رتبة السجن") ||
            checkChannel(payload.moderation.jailRoomId, "روم السجن") ||
            checkChannel(payload.moderation.courtLogChannelId, "سجل المحكمة");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
  }

  // Tickets
  if (payload.tickets) {
    error = checkChannel(payload.tickets.panelChannelId, "لوحة التذاكر") ||
            checkChannel(payload.tickets.transcriptChannelId, "سجلات التذاكر") ||
            checkChannel(payload.tickets.feedbackChannelId, "تقييمات التذاكر");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };

    if (Array.isArray(payload.tickets.categories)) {
      for (const cat of payload.tickets.categories) {
        error = checkRole(cat.staffRoleId, `طاقم تذكرة ${cat.name}`) ||
                checkChannel(cat.channelCategoryId, `قسم تذكرة ${cat.name}`);
        if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
      }
    }
  }

  // Roles Automation
  if (payload.roles) {
    error = checkRole(payload.roles.autoRoleHumanId, "رتبة الأعضاء التلقائية") ||
            checkRole(payload.roles.autoRoleBotId, "رتبة البوتات التلقائية");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };

    if (Array.isArray(payload.roles.multipleRolePresets)) {
      for (const preset of payload.roles.multipleRolePresets) {
        if (Array.isArray(preset.roleIds)) {
          for (const rid of preset.roleIds) {
            error = checkRole(rid, `رتب المجموعة ${preset.name}`);
            if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
          }
        }
      }
    }
  }

  // Welcome / Leave
  if (payload.welcome) {
    error = checkChannel(payload.welcome.welcomeChannelId, "روم الترحيب") ||
            checkChannel(payload.welcome.leaveChannelId, "روم المغادرة") ||
            checkChannel(payload.welcome.boostChannelId, "روم البوست") ||
            checkRole(payload.welcome.boostRoleId, "رتبة البوست");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
  }

  // Levels
  if (payload.levels) {
    error = checkChannel(payload.levels.levelUpChannelId, "روم الترقية");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };

    if (Array.isArray(payload.levels.roleRewards)) {
      for (const reward of payload.levels.roleRewards) {
        error = checkRole(reward.roleId, `مكافأة المستوى ${reward.level}`);
        if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
      }
    }
  }

  // Logs
  if (payload.logs) {
    error = checkChannel(payload.logs.modLogChannelId, "سجل الإشراف") ||
            checkChannel(payload.logs.messageLogChannelId, "سجل الرسائل") ||
            checkChannel(payload.logs.memberLogChannelId, "سجل الأعضاء") ||
            checkChannel(payload.logs.roleLogChannelId, "سجل الرتب") ||
            checkChannel(payload.logs.channelLogChannelId, "سجل القنوات") ||
            checkChannel(payload.logs.voiceLogChannelId, "سجل الصوتيات");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
  }

  // Protection Log
  if (payload.protection) {
    error = checkChannel(payload.protection.logChannelId, "سجل الحماية");
    if (error) return { valid: false, error, code: "FOREIGN_RESOURCE_REJECTED" };
  }

  return { valid: true };
}

/**
 * Builds server capability and permission map for UI authorization
 */
export function generateGuildCapabilities(userGuild, botGuild) {
  const userPerms = BigInt(userGuild.permissions || '0');
  const isOwner = userGuild.owner === true;

  const userPermissions = {
    administrator: isOwner || (userPerms & 0x8n) === 0x8n,
    manageGuild: isOwner || (userPerms & 0x20n) === 0x20n,
    manageChannels: isOwner || (userPerms & 0x10n) === 0x10n,
    manageRoles: isOwner || (userPerms & 0x10000000n) === 0x10000000n,
    manageMessages: isOwner || (userPerms & 0x2000n) === 0x2000n,
    moderateMembers: isOwner || (userPerms & 0x10000000000n) === 0x10000000000n,
    banMembers: isOwner || (userPerms & 0x4n) === 0x4n,
    kickMembers: isOwner || (userPerms & 0x2n) === 0x2n
  };

  const botMember = botGuild?.members?.me;
  const botPerms = botMember ? botMember.permissions.bitfield : 0n;

  const botPermissions = {
    administrator: (botPerms & 0x8n) === 0x8n,
    manageGuild: (botPerms & 0x20n) === 0x20n,
    manageChannels: (botPerms & 0x10n) === 0x10n,
    manageRoles: (botPerms & 0x10000000n) === 0x10000000n,
    manageMessages: (botPerms & 0x2000n) === 0x2000n,
    moderateMembers: (botPerms & 0x10000000000n) === 0x10000000000n,
    banMembers: (botPerms & 0x4n) === 0x4n,
    kickMembers: (botPerms & 0x2n) === 0x2n
  };

  return {
    guildId: userGuild.id,
    isOwner,
    botInstalled: !!botGuild,
    userPermissions,
    botPermissions,
    features: {
      dashboard: true,
      moderation: userPermissions.manageGuild || userPermissions.moderateMembers,
      protection: userPermissions.manageGuild || userPermissions.administrator,
      tickets: userPermissions.manageGuild || userPermissions.manageChannels,
      autoRole: userPermissions.manageRoles,
      welcome: userPermissions.manageGuild || userPermissions.manageChannels,
      logs: userPermissions.manageGuild,
      commands: true
    }
  };
}
