/**
 * OneBot by HyperSoft
 * Multi-Guild Protection Rate-Limit & Action Tracker (ES Module)
 * 
 * CRITICAL FIX: All In-Memory tracking uses composite key: `${guildId}:${userId}`
 * guaranteeing that rate limits and action counters never leak across Discord servers.
 */

import { guildDb } from '../utils/guildDb.js';

export class ProtectionHelper {
  constructor() {
    this.actionCounters = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 2 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  getCompositeKey(guildId, userId, actionType) {
    if (!guildId || !userId) {
      throw new Error("ProtectionHelper: Both guildId and userId are required to generate composite key.");
    }
    return `${String(guildId).trim()}:${String(userId).trim()}:${String(actionType).trim()}`;
  }

  async trackAndCheck(guildId, userId, actionType, limit, windowMs = 60000) {
    const safeGuildId = String(guildId).trim();
    const safeUserId = String(userId).trim();

    const settings = await guildDb.get(safeGuildId);
    const whitelist = settings.protection?.whitelistUsers || [];
    if (whitelist.includes(safeUserId)) {
      return { exceeded: false, currentCount: 0, limit, isWhitelisted: true };
    }

    const key = this.getCompositeKey(safeGuildId, safeUserId, actionType);
    const now = Date.now();

    let entry = this.actionCounters.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      this.actionCounters.set(key, entry);
      return { exceeded: 1 > limit, currentCount: 1, limit };
    }

    entry.count += 1;
    this.actionCounters.set(key, entry);

    const exceeded = entry.count > limit;
    return {
      exceeded,
      currentCount: entry.count,
      limit,
      resetInMs: Math.max(0, entry.resetAt - now)
    };
  }

  getCurrentCount(guildId, userId, actionType) {
    const key = this.getCompositeKey(guildId, userId, actionType);
    const entry = this.actionCounters.get(key);
    if (!entry || Date.now() > entry.resetAt) return 0;
    return entry.count;
  }

  resetCounter(guildId, userId, actionType) {
    const key = this.getCompositeKey(guildId, userId, actionType);
    this.actionCounters.delete(key);
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.actionCounters.entries()) {
      if (now > entry.resetAt) {
        this.actionCounters.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

export const protectionHelper = new ProtectionHelper();
export default protectionHelper;
