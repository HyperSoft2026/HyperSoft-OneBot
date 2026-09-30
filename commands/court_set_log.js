/**
 * OneBot by HyperSoft
 * Command: court_set_log
 * Strictly binds Court Logs to a channel inside the current Discord Guild.
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { guildDb } from '../utils/guildDb.js';
import { canExecute } from '../utils/cmdGuard.js';

export default {
  name: 'court_set_log',
  description: 'تحديد روم سجلات المحكمة لهذا السيرفر',
  category: 'Moderation',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('court_set_log')
    .setDescription('تحديد روم سجلات المحكمة لهذا السيرفر')
    .addChannelOption(opt => 
      opt.setName('channel')
        .setDescription('روم السجلات')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "❌ أنت تفتقر إلى صلاحية Administrator.", ephemeral: true });
    }
    const targetChannel = interaction.options.getChannel('channel');
    if (!targetChannel || targetChannel.guild.id !== interaction.guild.id) {
      return interaction.reply({ content: "❌ القناة المحددة غير صالحة أو لا تنتمي لهذا السيرفر.", ephemeral: true });
    }
    const current = await guildDb.get(interaction.guild.id);
    await guildDb.set(interaction.guild.id, {
      moderation: {
        ...current.moderation,
        courtLogChannelId: targetChannel.id
      }
    });
    return interaction.reply({
      content: `✅ تم تعيين روم سجلات محكمة سيرفر **${interaction.guild.name}** إلى: <#${targetChannel.id}>`,
      ephemeral: true
    });
  }
};
