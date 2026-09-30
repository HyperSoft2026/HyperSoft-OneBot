/**
 * OneBot by HyperSoft
 * System: tickets (ES Module)
 */

import { EmbedBuilder, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { guildDb } from '../utils/guildDb.js';

export async function createTicket(guild, user, categoryId = 'support') {
  if (!guild || !user) throw new Error("Guild and User are required.");

  const settings = await guildDb.get(guild.id);
  const ticketConfig = settings.tickets;

  if (!ticketConfig?.enabled) {
    throw new Error("نظام التذاكر معطّل في هذا السيرفر.");
  }

  // 1. Get atomic ticket number strictly isolated for this specific guild
  const ticketNum = await guildDb.getNextTicketNumber(guild.id);
  const ticketChannelName = `ticket-${String(ticketNum).padStart(3, '0')}`;

  // 2. Resolve Category & Category Channel strictly within this Guild
  const categorySpec = ticketConfig.categories?.find(c => c.id === categoryId) || 
    ticketConfig.categories?.[0] || {
      name: "دعم عام",
      welcomeMessage: "أهلاً بك، سيتواصل معك أحد أعضاء الإدارة قريباً."
    };

  let parentCategory = null;
  if (categorySpec.channelCategoryId) {
    const foundCategory = guild.channels.cache.get(categorySpec.channelCategoryId);
    if (foundCategory && foundCategory.type === ChannelType.GuildCategory && foundCategory.guild.id === guild.id) {
      parentCategory = foundCategory.id;
    }
  }

  let staffRole = null;
  if (categorySpec.staffRoleId) {
    const foundRole = guild.roles.cache.get(categorySpec.staffRoleId);
    if (foundRole && foundRole.guild.id === guild.id) {
      staffRole = foundRole;
    }
  }

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
      ]
    }
  ];

  if (guild.members.me) {
    permissionOverwrites.push({
      id: guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.EmbedLinks
      ]
    });
  }

  if (staffRole) {
    permissionOverwrites.push({
      id: staffRole.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    });
  }

  const channel = await guild.channels.create({
    name: ticketChannelName,
    type: ChannelType.GuildText,
    parent: parentCategory,
    permissionOverwrites,
    topic: `تذكرة تابعة لـ: ${user.tag} (ID: ${user.id}) | سيرفر: ${guild.name}`
  });

  const embed = new EmbedBuilder()
    .setTitle(`تذكرة جديدة: ${ticketChannelName}`)
    .setDescription(categorySpec.welcomeMessage || "مرحباً بك! يرجى توضيح استفسارك أو مشكلتك بالتفصيل وسيقوم الطاقم بالرد عليك.")
    .setColor(ticketConfig.embedColor || "#E53935")
    .addFields(
      { name: "صاحب التذكرة", value: `<@${user.id}>`, inline: true },
      { name: "القسم", value: categorySpec.name || "عام", inline: true },
      { name: "رقم التذكرة", value: `#${ticketNum}`, inline: true }
    )
    .setFooter({ text: `OneBot by HyperSoft • ${guild.name}`, iconURL: "/icon/Logo.png" })
    .setTimestamp();

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close:${user.id}`)
      .setLabel('إغلاق التذكرة')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [closeRow] });

  return {
    success: true,
    ticketNumber: ticketNum,
    channelId: channel.id,
    channelName: ticketChannelName
  };
}

export default { createTicket };
