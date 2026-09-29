/**
 * OneBot by HyperSoft
 * System: temp_role (ES Module)
 */

import { guildDb } from '../utils/guildDb.js';

export class TempRoleSystem {
  constructor() {
    this.activeTimeouts = new Map();
  }

  async grantTempRole(guild, member, roleId, durationMs) {
    if (!guild || !member) throw new Error("guild and member are required.");

    const role = guild.roles.cache.get(roleId);
    if (!role) {
      throw new Error(`الرتبة غير موجودة في سيرفر ${guild.name}.`);
    }

    if (role.guild.id !== guild.id) {
      throw new Error("❌ خرق أمني: الرتبة تنتمي إلى سيرفر آخر!");
    }

    const settings = await guildDb.get(guild.id);
    if (!settings.roles?.tempRoleAllowed) {
      throw new Error("نظام الرتب المؤقتة غير مفعّل في هذا السيرفر.");
    }

    await member.roles.add(role);

    const key = `${guild.id}:${member.id}:${roleId}`;
    if (this.activeTimeouts.has(key)) {
      clearTimeout(this.activeTimeouts.get(key));
    }

    const timeout = setTimeout(async () => {
      try {
        const freshMember = await guild.members.fetch(member.id).catch(() => null);
        if (freshMember && freshMember.roles.cache.has(roleId)) {
          await freshMember.roles.remove(role).catch(() => {});
        }
      } catch (err) {
        console.error(`[TempRole] Error removing temp role ${roleId} in ${guild.id}:`, err);
      } finally {
        this.activeTimeouts.delete(key);
      }
    }, durationMs);

    this.activeTimeouts.set(key, timeout);
    return { success: true, role, durationMs };
  }
}

export const tempRoleSystem = new TempRoleSystem();
export default tempRoleSystem;
