/**
 * OneBot by HyperSoft
 * Command: court_set_name
 * Strictly updates the Court Name for the current Discord Guild.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { guildDb } from '../utils/guildDb.js';
import { canExecute } from '../utils/cmdGuard.js';

export default {
  name: 'court_set_name',
  description: 'تحديد اسم المحكمة لهذا السيرفر',
  category: 'Moderation',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('court_set_name')
    .setDescription('تحديد اسم المحكمة لهذا السيرفر')
    .addStringOption(opt => opt.setName('name').setDescription('اسم المحكمة الجديد').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message, args) {
    const check = await canExecute(message, { userPermissions: ['Administrator'] });
    if (!check.allowed) return message.reply(check.reason);

    const guildId = message.guild.id;
    const newCourtName = args.join(' ').trim();

    if (!newCourtName) {
      return message.reply("يرجى كتابة اسم المحكمة الجديد. مثال: `!court_set_name محكمة العدل` ");
    }

    const current = await guildDb.get(guildId);
    const updated = await guildDb.set(guildId, {
      moderation: {
        ...current.moderation,
        courtName: newCourtName
      }
    });

    return message.reply(`✅ تم تحديث اسم محكمة سيرفر **${message.guild.name}** إلى: **${updated.moderation.courtName}**`);
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "❌ أنت تفتقر إلى صلاحية Administrator.", ephemeral: true });
    }
    const newCourtName = interaction.options.getString('name')?.trim();
    if (!newCourtName) {
      return interaction.reply({ content: "يرجى كتابة اسم المحكمة الجديد.", ephemeral: true });
    }
    const current = await guildDb.get(interaction.guild.id);
    const updated = await guildDb.set(interaction.guild.id, {
      moderation: {
        ...current.moderation,
        courtName: newCourtName
      }
    });
    return interaction.reply({
      content: `✅ تم تحديث اسم محكمة سيرفر **${interaction.guild.name}** إلى: **${updated.moderation.courtName}**`,
      ephemeral: true
    });
  }
};
