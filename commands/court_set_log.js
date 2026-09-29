/**
 * OneBot by HyperSoft
 * Command: court_set_log
 * Strictly binds Court Logs to a channel inside the current Discord Guild.
 */

const guildDb = require('../utils/guildDb');
const { canExecute } = require('../utils/cmdGuard');

module.exports = {
  name: 'court_set_log',
  description: 'تحديد روم سجلات المحكمة لهذا السيرفر',
  userPermissions: ['Administrator'],

  async execute(message, args) {
    const check = await canExecute(message, { userPermissions: ['Administrator'] });
    if (!check.allowed) return message.reply(check.reason);

    const guild = message.guild;
    const targetChannel = message.mentions.channels.first() || 
      (args[0] ? guild.channels.cache.get(args[0]) : null);

    if (!targetChannel) {
      return message.reply("يرجى تحديد أو منشن قناة صالحة تابعة لهذا السيرفر.");
    }

    // STRICT CHECK: The channel MUST belong to the current guild
    if (targetChannel.guild.id !== guild.id) {
      return message.reply("❌ خطأ أمني: القناة المحددة لا تنتمي إلى هذا السيرفر!");
    }

    const current = await guildDb.get(guild.id);
    await guildDb.set(guild.id, {
      moderation: {
        ...current.moderation,
        courtLogChannelId: targetChannel.id
      }
    });

    return message.reply(`✅ تم تعيين روم سجلات محكمة سيرفر **${guild.name}** إلى: <#${targetChannel.id}>`);
  }
};
