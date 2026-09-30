/**
 * OneBot by HyperSoft
 * Command: temprole
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { tempRoleSystem } from '../systems/temp_role.js';
import { canExecute } from '../utils/cmdGuard.js';

export default {
  name: 'temprole',
  description: 'إعطاء رتبة مؤقتة لعضو لفترة زمنية محددة',
  category: 'Administration',
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  data: new SlashCommandBuilder()
    .setName('temprole')
    .setDescription('إعطاء رتبة مؤقتة لعضو لفترة زمنية محددة')
    .addUserOption(opt => opt.setName('user').setDescription('العضو المستهدف').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('المدة بالدقائق').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(message, args) {
    const check = await canExecute(message, { 
      userPermissions: ['ManageRoles'],
      botPermissions: ['ManageRoles']
    });
    if (!check.allowed) return message.reply(check.reason);

    const targetUser = message.mentions.members.first();
    const role = message.mentions.roles.first();
    const minutes = parseInt(args[2] || args[1], 10);

    if (!targetUser || !role || isNaN(minutes) || minutes <= 0) {
      return message.reply("يرجى استخدام الصيغة الصحيحة: `!temprole @user @role 10` (المدة بالدقائق)");
    }

    try {
      await tempRoleSystem.grantTempRole(message.guild, targetUser, role.id, minutes * 60 * 1000);
      return message.reply(`✅ تم إعطاء رتبة **${role.name}** للعضو **${targetUser.user.tag}** لمدة **${minutes}** دقيقة.`);
    } catch (err) {
      return message.reply(`❌ خطأ: ${err.message}`);
    }
  },

  async executeInteraction(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: "هذا الأمر متاح فقط داخل السيرفرات.", ephemeral: true });
    }

    const member = interaction.options.getMember('user');
    const role = interaction.options.getRole('role');
    const minutes = interaction.options.getInteger('minutes');

    if (!member || !role || !minutes || minutes <= 0) {
      return interaction.reply({ content: "يرجى تحديد البيانات بشكل صحيح.", ephemeral: true });
    }

    try {
      await tempRoleSystem.grantTempRole(interaction.guild, member, role.id, minutes * 60 * 1000);
      return interaction.reply({
        content: `✅ تم إعطاء رتبة **${role.name}** للعضو **${member.user.tag}** لمدة **${minutes}** دقيقة.`,
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({ content: `❌ خطأ: ${err.message}`, ephemeral: true });
    }
  }
};
