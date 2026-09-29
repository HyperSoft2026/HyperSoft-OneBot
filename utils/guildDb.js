/**
 * OneBot by HyperSoft
 * Unified Multi-Guild Database Layer
 * 
 * Primary Data Source: MongoDB / Mongoose
 * Cache Strategy: In-Memory cache keyed strictly by `guildId` with explicit invalidation
 * Legacy Compatibility: Safely reads and migrates legacy JSON files from `database/guilds/*.json`
 */

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let GuildModel;
try {
  const mod = await import('../systems/schemas/Guild.js');
  GuildModel = mod.Guild || mod.default;
} catch (e) {
  GuildModel = null;
}

const JSON_DIR = path.resolve(__dirname, '../database/guilds');

// Ensure JSON directory exists for safe fallback without deleting
if (!fs.existsSync(JSON_DIR)) {
  fs.mkdirSync(JSON_DIR, { recursive: true });
}

export class UnifiedGuildDatabase extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes TTL
  }

  /**
   * Connect to MongoDB using MONGODB_URI environment variable
   */
  async connectMongo(uri = process.env.MONGODB_URI) {
    if (!uri) {
      return false;
    }
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('[guildDb] Connected to MongoDB persistent store.');
      return true;
    } catch (err) {
      console.warn('[guildDb] MongoDB connection failed, using local database fallback:', err.message);
      return false;
    }
  }

  /**
   * Safe JSON file path helper
   */
  getJsonPath(guildId) {
    const safeId = String(guildId).replace(/[^0-9]/g, '');
    return path.join(JSON_DIR, `${safeId}.json`);
  }

  /**
   * Read legacy JSON if available
   */
  readLegacyJson(guildId) {
    try {
      const p = this.getJsonPath(guildId);
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Safely backup to JSON without breaking any system
   */
  writeBackupJson(guildId, data) {
    try {
      const p = this.getJsonPath(guildId);
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Non-blocking fallback
    }
  }

  /**
   * Get Guild Settings (Primary: Mongo -> Cache -> Legacy JSON -> Default)
   */
  async get(guildId) {
    if (!guildId) {
      throw new Error("GuildDb.get: guildId is strictly required.");
    }
    const safeGuildId = String(guildId).trim();

    // 1. Check in-memory cache
    if (this.cache.has(safeGuildId)) {
      const entry = this.cache.get(safeGuildId);
      if (Date.now() - entry.timestamp < this.cacheTTL) {
        return JSON.parse(JSON.stringify(entry.data));
      }
    }

    let guildDoc = null;

    // 2. Query MongoDB if connected
    if (mongoose.connection.readyState === 1 && GuildModel) {
      try {
        guildDoc = await GuildModel.findOne({ guildId: safeGuildId }).lean();
      } catch (err) {
        console.warn(`[guildDb] MongoDB query failed for ${safeGuildId}:`, err.message);
      }
    }

    // 3. Fallback to Legacy JSON migration if not in Mongo
    if (!guildDoc) {
      const legacyData = this.readLegacyJson(safeGuildId);
      if (legacyData) {
        guildDoc = { ...legacyData, guildId: safeGuildId };

        // Auto-migrate to Mongo
        if (mongoose.connection.readyState === 1 && GuildModel) {
          try {
            await GuildModel.findOneAndUpdate(
              { guildId: safeGuildId },
              { $set: guildDoc },
              { upsert: true, new: true }
            );
          } catch {
            // Non-blocking
          }
        }
      }
    }

    // 4. If new Guild, initialize with default schema
    if (!guildDoc) {
      guildDoc = {
        guildId: safeGuildId,
        guildName: "Discord Server",
        prefix: "!",
        language: "ar",
        ticketCount: 0,
        protection: {
          antiBan: { enabled: true, limit: 3, action: "ban" },
          antiKick: { enabled: true, limit: 3, action: "ban" },
          antiBots: { enabled: true, action: "kick" },
          antiChannelCreate: { enabled: true, limit: 3, action: "remove_roles" },
          antiChannelDelete: { enabled: true, limit: 2, action: "remove_roles" },
          antiRoleCreate: { enabled: true, limit: 3, action: "remove_roles" },
          antiRoleDelete: { enabled: true, limit: 2, action: "remove_roles" },
          antiWebhooks: { enabled: true, action: "delete" },
          whitelistUsers: [],
          logChannelId: "",
          actionColor: "#E53935"
        },
        moderation: {
          muteRoleId: "",
          jailRoleId: "",
          jailRoomId: "",
          courtLogChannelId: "",
          courtName: "محكمة السيرفر",
          courtLogo: "/icon/Logo.png",
          courtColor: "#E53935",
          maxWarningsBeforeAction: 3,
          warnAction: "mute"
        },
        tickets: {
          enabled: true,
          panelChannelId: "",
          transcriptChannelId: "",
          feedbackChannelId: "",
          maxOpenTicketsPerUser: 1,
          embedColor: "#E53935",
          categories: [
            {
              id: "support",
              name: "الدعم الفني",
              emoji: "📩",
              welcomeMessage: "أهلاً بك، سيتواصل معك فريق الإدارة قريباً."
            }
          ]
        },
        roles: {
          autoRoleHumanId: "",
          autoRoleBotId: "",
          tempRoleAllowed: true,
          multipleRolePresets: []
        },
        welcome: {
          enabled: true,
          welcomeChannelId: "",
          leaveChannelId: "",
          boostChannelId: "",
          boostRoleId: "",
          welcomeMessage: "أهلاً بك {user} في سيرفر {server}!",
          leaveMessage: "وداعاً {user}!",
          boostMessage: "شكراً {user} على بوست السيرفر 🚀!",
          sendAsEmbed: true,
          embedColor: "#E53935",
          showAvatarCard: true,
          cardBackgroundTheme: "dark_red"
        },
        levels: {
          enabled: true,
          levelUpChannelId: "current",
          xpRate: 1.0,
          levelUpMessage: "مبروك {user}! لقد وصلت إلى المستوى {level} 🎉",
          roleRewards: []
        },
        autoResponder: []
      };

      if (mongoose.connection.readyState === 1 && GuildModel) {
        try {
          await GuildModel.create(guildDoc);
        } catch {
          // ignore duplicate
        }
      }
      this.writeBackupJson(safeGuildId, guildDoc);
    }

    // Cache result
    this.cache.set(safeGuildId, {
      data: guildDoc,
      timestamp: Date.now()
    });

    return JSON.parse(JSON.stringify(guildDoc));
  }

  /**
   * Save / Update Guild Settings
   */
  async set(guildId, updateData) {
    if (!guildId) {
      throw new Error("GuildDb.set: guildId is strictly required.");
    }
    const safeGuildId = String(guildId).trim();

    const existing = await this.get(safeGuildId);
    const merged = {
      ...existing,
      ...updateData,
      guildId: safeGuildId
    };

    // 1. Save to MongoDB
    if (mongoose.connection.readyState === 1 && GuildModel) {
      try {
        await GuildModel.findOneAndUpdate(
          { guildId: safeGuildId },
          { $set: merged },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`[guildDb] MongoDB save failed for ${safeGuildId}:`, err.message);
      }
    }

    // 2. Safe JSON backup
    this.writeBackupJson(safeGuildId, merged);

    // 3. Invalidate & update memory cache
    this.cache.set(safeGuildId, {
      data: merged,
      timestamp: Date.now()
    });

    // 4. Emit update event for real-time Discord Bot synchronization
    this.emit('guildUpdate', safeGuildId, merged);

    return merged;
  }

  /**
   * Atomic Ticket Counter isolated strictly per Guild
   */
  async getNextTicketNumber(guildId) {
    if (!guildId) throw new Error("Guild ID required for ticket counter.");
    const safeGuildId = String(guildId).trim();

    if (mongoose.connection.readyState === 1 && GuildModel) {
      try {
        const doc = await GuildModel.findOneAndUpdate(
          { guildId: safeGuildId },
          { $inc: { ticketCount: 1 } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        this.invalidate(safeGuildId);
        return doc.ticketCount || 1;
      } catch (err) {
        console.warn(`[guildDb] Mongo ticketCount increment error:`, err.message);
      }
    }

    // Fallback: in-memory / JSON counter
    const current = await this.get(safeGuildId);
    const newCount = (current.ticketCount || 0) + 1;
    await this.set(safeGuildId, { ticketCount: newCount });
    return newCount;
  }

  /**
   * Invalidate in-memory cache for a guild
   */
  invalidate(guildId) {
    if (guildId) {
      this.cache.delete(String(guildId).trim());
    } else {
      this.cache.clear();
    }
  }
}

export const guildDb = new UnifiedGuildDatabase();
export default guildDb;
