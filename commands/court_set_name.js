/**
 * OneBot by HyperSoft
 * Command: court_set_name
 * Strictly updates the Court Name for the current Discord Guild.
 */

const guildDb = require('../utils/guildDb');
const { canExecute } = require('../utils/cmdGuard');

module.exports = {
  name: 'court_set_name',
  description: 'تحديد اسم المحكمة لهذا السيرفر',
  userPermissions: ['Administrator'],

  async execute(message, args) {
    const check = await canExecute(message, { userPermissions: ['Administrator'] });
    if (!check.allowed) return message.reply(check.reason);

    const guildId = message.guild.id;
    const newCourtName = args.join(' ').trim();

    if (!newCourtName) {
      return message.reply("يرجى كتابة اسم المحكمة الجديد. مثال: `!court_set_name محكمة العدل`");
    }

    const current = await guildDb.get(guildId);
    const updated = await guildDb.set(guildId, {
      moderation: {
        ...current.moderation,
        courtName: newCourtName
      }
    });

    return message.reply(`✅ تم تحديث اسم محكمة سيرفر **${message.guild.name}** إلى: **${updated.moderation.courtName}**`);
  }
};
