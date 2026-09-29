/**
 * OneBot by HyperSoft
 * Command: court_set_color
 * Strictly updates the Court Embed Color for the current Discord Guild.
 */

const guildDb = require('../utils/guildDb');
const { canExecute } = require('../utils/cmdGuard');

module.exports = {
  name: 'court_set_color',
  description: 'تحديد لون رسائل المحكمة لهذا السيرفر',
  userPermissions: ['Administrator'],

  async execute(message, args) {
    const check = await canExecute(message, { userPermissions: ['Administrator'] });
    if (!check.allowed) return message.reply(check.reason);

    const guildId = message.guild.id;
    const hexColor = args[0]?.trim();

    if (!hexColor || !/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) {
      return message.reply("يرجى إدخال كود لون صالح (HEX). اللون الأساسي لـ OneBot هو `#E53935`.");
    }

    const current = await guildDb.get(guildId);
    await guildDb.set(guildId, {
      moderation: {
        ...current.moderation,
        courtColor: hexColor
      }
    });

    return message.reply(`✅ تم تحديث لون محكمة سيرفر **${message.guild.name}** إلى: \`${hexColor}\``);
  }
};
