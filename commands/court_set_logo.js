/**
 * OneBot by HyperSoft
 * Command: court_set_logo
 * Updates Court Logo for the current Guild.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { guildDb } from '../utils/guildDb.js';
import { canExecute } from '../utils/cmdGuard.js';

export default {
  name: 'court_set_logo',
  description: 'تحديد شعار المحكمة لهذا السيرفر',
  category: 'Moderation',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('court_set_logo')
    .setDescription('تحديد شعار المحكمة لهذا السيرفر')
    .addStringOption(opt => opt.setName('url').setDescription('رابط صورة الشعار').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "❌ أنت تفتقر إلى صلاحية Administrator.", ephemeral: true });
    }
    const logoUrl = interaction.options.getString('url')?.trim() || "/icon/Logo.png";
    const current = await guildDb.get(interaction.guild.id);
    await guildDb.set(interaction.guild.id, {
      moderation: {
        ...current.moderation,
        courtLogo: logoUrl
      }
    });
    return interaction.reply({
      content: `✅ تم تحديث شعار محكمة سيرفر **${interaction.guild.name}**.`,
      ephemeral: true
    });
  }
};
