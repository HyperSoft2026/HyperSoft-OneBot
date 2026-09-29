/**
 * OneBot by HyperSoft
 * Mongoose Guild Schema
 * Strictly partitions all bot systems by guildId.
 */

import mongoose from 'mongoose';

const GuildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  guildName: {
    type: String,
    default: "Discord Server"
  },
  guildIcon: {
    type: String,
    default: null
  },
  prefix: {
    type: String,
    default: "!"
  },
  language: {
    type: String,
    enum: ["ar", "en"],
    default: "ar"
  },
  // Ticket sequence counter strictly isolated per guild
  ticketCount: {
    type: Number,
    default: 0
  },
  protection: {
    antiBan: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: 3 },
      action: { type: String, enum: ["ban", "kick", "remove_roles"], default: "ban" }
    },
    antiKick: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: 3 },
      action: { type: String, enum: ["ban", "kick", "remove_roles"], default: "ban" }
    },
    antiBots: {
      enabled: { type: Boolean, default: true },
      action: { type: String, enum: ["kick", "ban"], default: "kick" }
    },
    antiChannelCreate: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: 3 },
      action: { type: String, default: "remove_roles" }
    },
    antiChannelDelete: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: 2 },
      action: { type: String, default: "remove_roles" }
    },
    antiRoleCreate: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: 3 },
      action: { type: String, default: "remove_roles" }
    },
    antiRoleDelete: {
      enabled: { type: Boolean, default: true },
      limit: { type: Number, default: 2 },
      action: { type: String, default: "remove_roles" }
    },
    antiWebhooks: {
      enabled: { type: Boolean, default: true },
      action: { type: String, default: "delete" }
    },
    whitelistUsers: {
      type: [String],
      default: []
    },
    logChannelId: {
      type: String,
      default: ""
    },
    actionColor: {
      type: String,
      default: "#E53935"
    }
  },
  moderation: {
    muteRoleId: { type: String, default: "" },
    jailRoleId: { type: String, default: "" },
    jailRoomId: { type: String, default: "" },
    courtLogChannelId: { type: String, default: "" },
    courtName: { type: String, default: "محكمة السيرفر" },
    courtLogo: { type: String, default: "/icon/Logo.png" },
    courtColor: { type: String, default: "#E53935" },
    maxWarningsBeforeAction: { type: Number, default: 3 },
    warnAction: { type: String, enum: ["mute", "jail", "kick", "ban"], default: "mute" }
  },
  tickets: {
    enabled: { type: Boolean, default: true },
    panelChannelId: { type: String, default: "" },
    transcriptChannelId: { type: String, default: "" },
    feedbackChannelId: { type: String, default: "" },
    maxOpenTicketsPerUser: { type: Number, default: 1 },
    embedColor: { type: String, default: "#E53935" },
    categories: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        emoji: { type: String, default: "📩" },
        staffRoleId: { type: String, default: "" },
        channelCategoryId: { type: String, default: "" },
        welcomeMessage: { type: String, default: "أهلاً بك، سيتواصل معك فريق الإدارة قريباً." }
      }
    ]
  },
  autoResponder: [
    {
      id: { type: String, required: true },
      trigger: { type: String, required: true },
      response: { type: String, required: true },
      matchType: { type: String, enum: ["exact", "contains", "startsWith"], default: "contains" },
      enabled: { type: Boolean, default: true },
      embedResponse: { type: Boolean, default: false }
    }
  ],
  roles: {
    autoRoleHumanId: { type: String, default: "" },
    autoRoleBotId: { type: String, default: "" },
    tempRoleAllowed: { type: Boolean, default: true },
    multipleRolePresets: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        roleIds: { type: [String], default: [] }
      }
    ]
  },
  welcome: {
    enabled: { type: Boolean, default: true },
    welcomeChannelId: { type: String, default: "" },
    leaveChannelId: { type: String, default: "" },
    boostChannelId: { type: String, default: "" },
    boostRoleId: { type: String, default: "" },
    welcomeMessage: { type: String, default: "أهلاً بك {user} في سيرفر {server}!" },
    leaveMessage: { type: String, default: "وداعاً {user}!" },
    boostMessage: { type: String, default: "شكراً {user} على بوست السيرفر 🚀!" },
    sendAsEmbed: { type: Boolean, default: true },
    embedColor: { type: String, default: "#E53935" },
    showAvatarCard: { type: Boolean, default: true },
    cardBackgroundTheme: { type: String, default: "dark_red" }
  },
  levels: {
    enabled: { type: Boolean, default: true },
    levelUpChannelId: { type: String, default: "current" },
    xpRate: { type: Number, default: 1.0 },
    levelUpMessage: { type: String, default: "مبروك {user}! لقد وصلت إلى المستوى {level} 🎉" },
    roleRewards: [
      {
        level: { type: Number, required: true },
        roleId: { type: String, required: true }
      }
    ]
  },
  logs: {
    modLogChannelId: { type: String, default: "" },
    messageLogChannelId: { type: String, default: "" },
    memberLogChannelId: { type: String, default: "" },
    roleLogChannelId: { type: String, default: "" },
    channelLogChannelId: { type: String, default: "" },
    voiceLogChannelId: { type: String, default: "" }
  }
}, {
  timestamps: true,
  collection: 'guilds'
});

export const Guild = mongoose.models.Guild || mongoose.model('Guild', GuildSchema);
export default Guild;
