/**
 * OneBot by HyperSoft
 * Command: ping
 */

import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'ping',
  description: 'فحص سرعة استجابة وتأخير البوت',
  category: 'General',
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('فحص سرعة استجابة وتأخير البوت'),

  async execute(message) {
    const ping = message.client.ws.ping;
    return message.reply(`🏓 Pong! تأخير البوت: **${ping}ms** (سيرفر: **${message.guild?.name || 'DM'}**)`);
  },

  async executeInteraction(interaction) {
    const ping = interaction.client.ws.ping;
    return interaction.reply({
      content: `🏓 Pong! تأخير البوت: **${ping}ms** (سيرفر: **${interaction.guild?.name || 'DM'}**)`,
      ephemeral: true
    });
  }
};
