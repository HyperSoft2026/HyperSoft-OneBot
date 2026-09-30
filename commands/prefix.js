/**
 * OneBot by HyperSoft
 * Command: prefix
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { guildDb } from '../utils/guildDb.js';
import { canExecute } from '../utils/cmdGuard.js';

export default {
  name: 'prefix',
  description: 'عرض أو تغيير بريفكس الأوامر لهذا السيرفر',
  category: 'Administration',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('عرض أو تغيير بريفكس الأوامر لهذا السيرفر')
    .addStringOption(option => 
      option.setName('new_prefix')
        .setDescription('البريفكس الجديد')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message, args) {
    if (!message.guild) return;
    const currentSettings = await guildDb.get(message.guild.id);
    const currentPrefix = currentSettings.prefix || "!";

    if (!args[0]) {
      return message.reply(`البريفكس الحالي لسيرفر **${message.guild.name}** هو: \`${currentPrefix}\``);
    }

    const check = await canExecute(message, { userPermissions: ['Administrator'] });
    if (!check.allowed) return message.reply(check.reason);

    const newPrefix = args[0].trim();
    await guildDb.set(message.guild.id, { prefix: newPrefix });
    return message.reply(`✅ تم تحديث بريفكس سيرفر **${message.guild.name}** إلى: \`${newPrefix}\``);
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }

    const newPrefix = interaction.options.getString('new_prefix')?.trim();
    const currentSettings = await guildDb.get(interaction.guild.id);

    if (!newPrefix) {
      return interaction.reply({
        content: `البريفكس الحالي لسيرفر **${interaction.guild.name}** هو: \`${currentSettings.prefix || "!"}\``,
        ephemeral: true
      });
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "أنت تفتقر إلى صلاحية Administrator لتغيير البريفكس.", ephemeral: true });
    }

    await guildDb.set(interaction.guild.id, { prefix: newPrefix });
    return interaction.reply({
      content: `✅ تم تحديث بريفكس سيرفر **${interaction.guild.name}** إلى: \`${newPrefix}\``,
      ephemeral: true
    });
  }
};
