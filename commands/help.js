/**
 * OneBot by HyperSoft
 * Command: help
 * Dynamically organizes and renders all registered OneBot commands by category.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  name: 'help',
  description: 'عرض قائمة بجميع أوامر OneBot المتاحة وطريقة استخدامها',
  category: 'General',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض قائمة بجميع أوامر OneBot المتاحة وطريقة استخدامها')
    .addStringOption(opt =>
      opt.setName('command')
        .setDescription('اسم الأمر للاستعلام عن تفاصيله')
        .setRequired(false)
    ),

  async execute(message, args) {
    const specificCmdName = args[0]?.toLowerCase();
    const embed = buildHelpEmbed(message.client, specificCmdName, message.guild?.name);
    return message.reply({ embeds: [embed] });
  },

  async executeInteraction(interaction) {
    const specificCmdName = interaction.options.getString('command')?.toLowerCase();
    const embed = buildHelpEmbed(interaction.client, specificCmdName, interaction.guild?.name);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

/**
 * Dynamically builds help embed from registered commands in client.commands
 */
function buildHelpEmbed(client, specificCmdName, guildName = 'OneBot Server') {
  const commands = client?.commands;

  if (specificCmdName && commands?.has(specificCmdName)) {
    const cmd = commands.get(specificCmdName);
    const perms = cmd.userPermissions ? `🔒 ${cmd.userPermissions.join(', ')}` : '🔓 متاح للجميع';
    const category = cmd.category || 'عام';

    return new EmbedBuilder()
      .setTitle(`📖 تفاصيل الأمر: /${cmd.name}`)
      .setDescription(cmd.description || 'لا يوجد وصف متاح.')
      .setColor('#E53935')
      .addFields(
        { name: 'القسم', value: category, inline: true },
        { name: 'الصلاحيات المطلوبة', value: perms, inline: true },
        { name: 'الاستخدام', value: `\`/${cmd.name}\` أو \`!${cmd.name}\``, inline: false }
      )
      .setFooter({ text: `OneBot by HyperSoft • ${guildName}`, iconURL: '/icon/Logo.png' })
      .setTimestamp();
  }

  // Category mapping with icons
  const categoryMeta = {
    General: { title: '🤖 الأوامر العامة (General)', emoji: '🤖', order: 1 },
    Moderation: { title: '🛡️ نظام الإشراف والمحكمة (Moderation)', emoji: '🛡️', order: 2 },
    Tickets: { title: '🎫 نظام التذاكر والدعم الفني (Tickets)', emoji: '🎫', order: 3 },
    Administration: { title: '⚙️ إدارة السيرفر والإعدادات (Administration)', emoji: '⚙️', order: 4 }
  };

  const categorized = new Map();

  if (commands) {
    commands.forEach(cmd => {
      if (!cmd.name) return;
      const cat = cmd.category || 'General';
      if (!categorized.has(cat)) {
        categorized.set(cat, []);
      }
      categorized.get(cat).push(cmd);
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📖 قائمة أوامر OneBot by HyperSoft')
    .setDescription(
      `مرحباً بك في دليل أوامر **OneBot** لسيرفر **${guildName}**.\n` +
      `يمكنك استخدام الأوامر عبر سلاش كوماندز \`/\` أو باستخدام البريفكس المسجل.\n` +
      `للحصول على تفاصيل أي أمر: \`/help command:<اسم_الأمر>\``
    )
    .setColor('#E53935')
    .setThumbnail('/icon/Logo.png')
    .setFooter({ text: 'OneBot by HyperSoft • لوحة التحكم: http://51.83.6.7:20360', iconURL: '/icon/Logo.png' })
    .setTimestamp();

  // Sort categories by predefined order
  const sortedCategories = Array.from(categorized.keys()).sort((a, b) => {
    const orderA = categoryMeta[a]?.order || 99;
    const orderB = categoryMeta[b]?.order || 99;
    return orderA - orderB;
  });

  for (const catKey of sortedCategories) {
    const list = categorized.get(catKey);
    const meta = categoryMeta[catKey] || { title: `📂 ${catKey}`, emoji: '📂' };
    
    const lines = list.map(cmd => {
      let permBadge = '';
      if (cmd.userPermissions?.includes('Administrator')) {
        permBadge = ' `🔒 Admin`';
      } else if (cmd.userPermissions?.includes('ManageRoles')) {
        permBadge = ' `🔒 Manage Roles`';
      } else if (cmd.userPermissions?.includes('ManageGuild')) {
        permBadge = ' `🔒 Manage Server`';
      }
      return `• **\`/${cmd.name}\`**${permBadge} — ${cmd.description || 'أمر نظام'}`;
    });

    embed.addFields({
      name: meta.title,
      value: lines.join('\n') || 'لا توجد أوامر مسجلة حالياً.',
      inline: false
    });
  }

  return embed;
}
