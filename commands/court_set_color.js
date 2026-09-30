/**
 * OneBot by HyperSoft
 * Command: court_set_color
 * Strictly updates the Court Embed Color for the current Discord Guild.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { guildDb } from '../utils/guildDb.js';
import { canExecute } from '../utils/cmdGuard.js';

export default {
  name: 'court_set_color',
  description: 'تحديد لون رسائل المحكمة لهذا السيرفر',
  category: 'Moderation',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('court_set_color')
    .setDescription('تحديد لون رسائل المحكمة لهذا السيرفر')
    .addStringOption(opt => opt.setName('color').setDescription('كود اللون HEX (مثال: #E53935)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "❌ أنت تفتقر إلى صلاحية Administrator.", ephemeral: true });
    }
    const hexColor = interaction.options.getString('color')?.trim();
    if (!hexColor || !/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) {
      return interaction.reply({ content: "يرجى إدخال كود لون صالح (HEX). مثال: `#E53935`.", ephemeral: true });
    }
    const current = await guildDb.get(interaction.guild.id);
    await guildDb.set(interaction.guild.id, {
      moderation: {
        ...current.moderation,
        courtColor: hexColor
      }
    });
    return interaction.reply({
      content: `✅ تم تحديث لون محكمة سيرفر **${interaction.guild.name}** إلى: \`${hexColor}\``,
      ephemeral: true
    });
  }
};
