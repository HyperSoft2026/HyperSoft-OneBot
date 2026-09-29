/**
 * OneBot by HyperSoft
 * System: auto_role (ES Module)
 */

import { guildDb } from '../utils/guildDb.js';

export async function onGuildMemberAdd(member) {
  if (!member || !member.guild) return;

  const guild = member.guild;
  const settings = await guildDb.get(guild.id);
  const rolesConfig = settings.roles;

  if (!rolesConfig) return;

  try {
    if (member.user.bot) {
      const botRoleId = rolesConfig.autoRoleBotId;
      if (botRoleId) {
        const botRole = guild.roles.cache.get(botRoleId);
        if (botRole && botRole.guild.id === guild.id) {
          await member.roles.add(botRole).catch(() => {});
        } else {
          console.warn(`[AutoRole] Bot role ID ${botRoleId} not found in guild ${guild.id}`);
        }
      }
    } else {
      const humanRoleId = rolesConfig.autoRoleHumanId;
      if (humanRoleId) {
        const humanRole = guild.roles.cache.get(humanRoleId);
        if (humanRole && humanRole.guild.id === guild.id) {
          await member.roles.add(humanRole).catch(() => {});
        } else {
          console.warn(`[AutoRole] Human role ID ${humanRoleId} not found in guild ${guild.id}`);
        }
      }
    }
  } catch (err) {
    console.error(`[AutoRole] Error assigning role in guild ${guild.id}:`, err);
  }
}

export default { onGuildMemberAdd };
