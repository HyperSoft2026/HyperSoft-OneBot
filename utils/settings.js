/**
 * OneBot by HyperSoft
 * Multi-Guild Settings Manager (ES Module)
 */

import { guildDb } from './guildDb.js';
import globalConfig from '../settings.json' with { type: 'json' };

export async function getGuildSettings(guildId) {
  if (!guildId) throw new Error("getGuildSettings requires a valid guildId.");
  return await guildDb.get(guildId);
}

export async function updateGuildSettings(guildId, updates) {
  if (!guildId) throw new Error("updateGuildSettings requires a valid guildId.");
  return await guildDb.set(guildId, updates);
}

export async function getPrefix(guildId) {
  if (!guildId) return globalConfig.defaultPrefix || "!";
  const settings = await guildDb.get(guildId);
  return settings.prefix || globalConfig.defaultPrefix || "!";
}

export async function setPrefix(guildId, newPrefix) {
  if (!guildId || !newPrefix) throw new Error("guildId and newPrefix are required.");
  return await guildDb.set(guildId, { prefix: String(newPrefix).trim() });
}

export async function getLanguage(guildId) {
  if (!guildId) return "ar";
  const settings = await guildDb.get(guildId);
  return settings.language || "ar";
}

export default {
  getGuildSettings,
  updateGuildSettings,
  getPrefix,
  setPrefix,
  getLanguage
};
