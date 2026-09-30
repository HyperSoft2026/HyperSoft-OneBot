/**
 * OneBot by HyperSoft
 * Command: ticket
 * Full Multi-Guild Support & Ticket Lifecycle Management
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
  description: 'إدارة التذاكر، إرسال اللوحة التفاعلية، وإنشاء تذاكر الدعم',
  category: 'Tickets',
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('إدارة التذاكر ونظام الدعم الفني')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('إنشاء تذكرة دعم فني جديدة مباشرة')
        .addStringOption(opt =>
          opt.setName('category')
            .setDescription('قسم التذكرة المطلوب')
            .setRequired(false)
        )
    )
    .addSubcommand(sub => 
      sub.setName('panel')
        .setDescription('إرسال لوحة فتح التذاكر التفاعلية في القناة الحالية (للإدارة فقط)')
    )
    .addSubcommand(sub =>
      sub.setName('close')
        .setDescription('إغلاق تذكرة الدعم الفني الحالية')
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('سبب إغلاق التذكرة')
            .setRequired(false)
        )
    ),

  async execute(message, args) {
    if (!message.guild) return;
    const action = args[0]?.toLowerCase();

    if (action === 'panel') {
      if (!message.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
        return message.reply("❌ هذا الخيار متاح فقط لإدارة السيرفر (Administrator).");
      }
      return this.sendTicketPanel(message.channel, message.guild);
    }

    if (action === 'close') {
      return this.closeTicketChannel(message.channel, message.member, message.guild, args.slice(1).join(' '));
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
        return interaction.reply({ content: "❌ أنت تفتقر إلى صلاحية Administrator لإرسال لوحة التذاكر.", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      await this.sendTicketPanel(interaction.channel, interaction.guild);
      return interaction.editReply({ content: "✅ تم إرسال لوحة التذاكر التفاعلية بنجاح!" });
    }

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      const categoryId = interaction.options.getString('category') || 'support';
      try {
        const res = await createTicket(interaction.guild, interaction.user, categoryId);
        return interaction.editReply({ content: `✅ تم فتح تذكرتك بنجاح: <#${res.channelId}>` });
      } catch (err) {
        return interaction.editReply({ content: `❌ خطأ في فتح التذكرة: ${err.message}` });
      }
    }

    if (sub === 'close') {
      await interaction.deferReply();
      const reason = interaction.options.getString('reason') || 'تم حل المشكلة بواسطة العضو أو الإدارة';
      return this.closeTicketInteraction(interaction, reason);
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
  },

  async closeTicketInteraction(interaction, reason) {
    const channel = interaction.channel;
    const guild = interaction.guild;
    const member = interaction.member;

    if (!channel?.name?.startsWith('ticket-')) {
      return interaction.editReply({ content: "❌ هذا الأمر يُستخدم فقط داخل قنوات التذاكر (ticket-xxx)." });
    }

    const settings = await guildDb.get(guild.id);
    const staffRoleId = settings.tickets?.categories?.[0]?.staffRoleId;
    const isStaff = staffRoleId && member.roles.cache.has(staffRoleId);
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageChannels);
    const isOwner = channel.topic?.includes(interaction.user.id);

    if (!isAdmin && !isStaff && !isOwner) {
      return interaction.editReply({ content: "❌ ليس لديك الصلاحية لإغلاق هذه التذكرة." });
    }

    const closeEmbed = new EmbedBuilder()
      .setTitle("🔒 إغلاق التذكرة")
      .setDescription(`تم إغلاق التذكرة بواسطة <@${interaction.user.id}>.\n**السبب:** ${reason}\nسيتم حذف القناة خلال 5 ثوانٍ.`)
      .setColor("#E53935")
      .setTimestamp();

    await interaction.editReply({ embeds: [closeEmbed] });

    setTimeout(async () => {
      try {
        if (channel.deletable) await channel.delete(`Ticket closed by ${interaction.user.tag}: ${reason}`);
      } catch (e) {
        console.error(`[Ticket Close Error in ${guild.id}]:`, e.message);
      }
    }, 5000);
  },

  async closeTicketChannel(channel, member, guild, reason = 'تم الإغلاق بواسطة العضو أو الإدارة') {
    if (!channel?.name?.startsWith('ticket-')) {
      return channel.send("❌ هذا الأمر يُستخدم فقط داخل قنوات التذاكر (ticket-xxx).");
    }

    const settings = await guildDb.get(guild.id);
    const staffRoleId = settings.tickets?.categories?.[0]?.staffRoleId;
    const isStaff = staffRoleId && member.roles.cache.has(staffRoleId);
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageChannels);
    const isOwner = channel.topic?.includes(member.id);

    if (!isAdmin && !isStaff && !isOwner) {
      return channel.send("❌ ليس لديك الصلاحية لإغلاق هذه التذكرة.");
    }

    const closeEmbed = new EmbedBuilder()
      .setTitle("🔒 إغلاق التذكرة")
      .setDescription(`تم إغلاق التذكرة بواسطة <@${member.id}>.\n**السبب:** ${reason}\nسيتم حذف القناة خلال 5 ثوانٍ.`)
      .setColor("#E53935")
      .setTimestamp();

    await channel.send({ embeds: [closeEmbed] });

    setTimeout(async () => {
      try {
        if (channel.deletable) await channel.delete(`Ticket closed by ${member.user.tag}: ${reason}`);
      } catch (e) {
        console.error(`[Ticket Close Error in ${guild.id}]:`, e.message);
      }
    }, 5000);
  }
};
