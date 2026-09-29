/**
 * OneBot by HyperSoft
 * Command: court_set_logo
 * Updates Court Logo for the current Guild.
 */

const guildDb = require('../utils/guildDb');
const { canExecute } = require('../utils/cmdGuard');

module.exports = {
  name: 'court_set_logo',
  description: 'تحديد شعار المحكمة لهذا السيرفر',
  userPermissions: ['Administrator'],

  async execute(message, args) {
    const check = await canExecute(message, { userPermissions: ['Administrator'] });
    if (!check.allowed) return message.reply(check.reason);

    const guildId = message.guild.id;
    const logoUrl = args[0]?.trim() || "/icon/Logo.png";

    const current = await guildDb.get(guildId);
    await guildDb.set(guildId, {
      moderation: {
        ...current.moderation,
        courtLogo: logoUrl
      }
    });

    return message.reply(`✅ تم تحديث شعار محكمة سيرفر **${message.guild.name}**.`);
  }
};
