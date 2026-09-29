/**
 * OneBot by HyperSoft
 * Command Guard & Permission Validator (ES Module)
 */

import { getPrefix } from './settings.js';

export async function canExecute(message, commandSpec = {}) {
  if (!message.guild) {
    if (commandSpec.guildOnly !== false) {
      return {
        allowed: false,
        reason: "هذا الأمر متاح فقط داخل السيرفرات."
      };
    }
    return { allowed: true, prefix: "!" };
  }

  const guildId = message.guild.id;
  const prefix = await getPrefix(guildId);

  if (commandSpec.botPermissions && message.guild.members.me) {
    for (const perm of commandSpec.botPermissions) {
      if (!message.guild.members.me.permissions.has(perm)) {
        return {
          allowed: false,
          reason: `البوت يفتقر إلى الصلاحية المطلوبة في هذا السيرفر: ${perm}`
        };
      }
    }
  }

  if (commandSpec.userPermissions && message.member) {
    if (message.guild.ownerId !== message.author.id) {
      for (const perm of commandSpec.userPermissions) {
        if (!message.member.permissions.has(perm)) {
          return {
            allowed: false,
            reason: `أنت تفتقر إلى الصلاحية المطلوبة لتنفيذ هذا الأمر: ${perm}`
          };
        }
      }
    }
  }

  return {
    allowed: true,
    prefix,
    guildId
  };
}

export default { canExecute };
