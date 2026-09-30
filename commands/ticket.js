/**
 * OneBot by HyperSoft
 * Command: ticket
 */

import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { guildDb } from '../utils/guildDb.js';
import { createTicket } from '../systems/tickets.js';

export default {
  name: 'ticket',
  description: 'إرسال لوحة التذاكر أو إنشاء تذكرة دعم فني',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('إدارة التذاكر وإنشاء لوحة الدعم')
    .addSubcommand(sub => 
      sub.setName('panel')
        .setDescription('إرسال لوحة فتح التذاكر التفاعلية في القناة الحالية')
    )
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('إنشاء تذكرة دعم جديدة مباشرة')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message, args) {
    if (!message.guild) return;
    const action = args[0]?.toLowerCase();

    if (action === 'panel') {
      return this.sendTicketPanel(message.channel, message.guild);
    }

    // Default to create ticket
    try {
      const res = await createTicket(message.guild, message.author, 'support');
      return message.reply(`✅ تم فتح التذكرة بنجاح: <#${res.channelId}>`);
    } catch (err) {
      return message.reply(`❌ خطأ: ${err.message}`);
    }
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "أنت تفتقر إلى صلاحية Administrator.", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      await this.sendTicketPanel(interaction.channel, interaction.guild);
      return interaction.editReply({ content: "✅ تم إرسال لوحة التذاكر التفاعلية بنجاح!" });
    }

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const res = await createTicket(interaction.guild, interaction.user, 'support');
        return interaction.editReply({ content: `✅ تم فتح التذكرة بنجاح: <#${res.channelId}>` });
      } catch (err) {
        return interaction.editReply({ content: `❌ خطأ: ${err.message}` });
      }
    }
  },

  async sendTicketPanel(channel, guild) {
    const settings = await guildDb.get(guild.id);
    const ticketConfig = settings.tickets || {};
    const categories = ticketConfig.categories && ticketConfig.categories.length > 0 
      ? ticketConfig.categories 
      : [{ id: 'support', name: 'الدعم الفني', emoji: '📩' }];

    const embed = new EmbedBuilder()
      .setTitle(`🎫 مركز الدعم الفني - ${guild.name}`)
      .setDescription("اضغط على الزر أدناه لفتح تذكرة دعم فني جديدة والتواصل مباشرة مع طاقم الإدارة.")
      .setColor(ticketConfig.embedColor || "#E53935")
      .setFooter({ text: `OneBot by HyperSoft • ${guild.name}`, iconURL: "/icon/Logo.png" })
      .setTimestamp();

    const row = new ActionRowBuilder();
    categories.slice(0, 5).forEach(cat => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_open:${cat.id}`)
          .setLabel(cat.name)
          .setEmoji(cat.emoji || '📩')
          .setStyle(ButtonStyle.Primary)
      );
    });

    await channel.send({ embeds: [embed], components: [row] });
  }
};
