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

    const expiresAt = Date.now() + durationMs;
    const key = `${guild.id}:${member.id}:${roleId}`;

    if (this.activeTimeouts.has(key)) {
      clearTimeout(this.activeTimeouts.get(key));
    }

    // Persist to database so timer survives restarts
    await guildDb.saveTempRole(guild.id, member.id, roleId, expiresAt);

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
        await guildDb.removeTempRole(guild.id, member.id, roleId);
      }
    }, durationMs);

    this.activeTimeouts.set(key, timeout);
    return { success: true, role, durationMs, expiresAt };
  }

  /**
   * Called on bot ready event to restore active temporary roles from database across process restarts
   */
  async initializeRestoration(client) {
    try {
      const activeRoles = await guildDb.getAllActiveTempRoles();
      const now = Date.now();

      for (const item of activeRoles) {
        const { guildId, userId, roleId, expiresAt } = item;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const remainingMs = expiresAt - now;

        if (remainingMs <= 0) {
          // Expired while bot was offline
          try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member && member.roles.cache.has(roleId)) {
              const role = guild.roles.cache.get(roleId);
              if (role) await member.roles.remove(role).catch(() => {});
            }
          } catch (e) {
            // Ignore fetch errors
          } finally {
            await guildDb.removeTempRole(guildId, userId, roleId);
          }
        } else {
          // Schedule remaining timer
          const key = `${guildId}:${userId}:${roleId}`;
          if (this.activeTimeouts.has(key)) {
            clearTimeout(this.activeTimeouts.get(key));
          }

          const timeout = setTimeout(async () => {
            try {
              const member = await guild.members.fetch(userId).catch(() => null);
              if (member && member.roles.cache.has(roleId)) {
                const role = guild.roles.cache.get(roleId);
                if (role) await member.roles.remove(role).catch(() => {});
              }
            } catch (err) {
              console.error(`[TempRole] Error removing restored role ${roleId} in ${guildId}:`, err);
            } finally {
              this.activeTimeouts.delete(key);
              await guildDb.removeTempRole(guildId, userId, roleId);
            }
          }, remainingMs);

          this.activeTimeouts.set(key, timeout);
        }
      }
      console.log(`[TempRole] Restored and synchronized active temp roles across all guilds.`);
    } catch (err) {
      console.error(`[TempRole] Startup restoration error:`, err.message);
    }
  }
}

export const tempRoleSystem = new TempRoleSystem();
export default tempRoleSystem;
