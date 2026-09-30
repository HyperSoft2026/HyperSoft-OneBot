/**
 * OneBot by HyperSoft
 * Multi-Guild Core Type Definitions
 * Enforces strict per-guild isolation using unique guildId.
 */

export interface GuildProtectionSettings {
  antiBan: { enabled: boolean; limit: number; action: 'ban' | 'kick' | 'remove_roles' };
  antiKick: { enabled: boolean; limit: number; action: 'ban' | 'kick' | 'remove_roles' };
  antiBots: { enabled: boolean; action: 'kick' | 'ban' };
  antiChannelCreate: { enabled: boolean; limit: number; action: 'remove_roles' | 'ban' };
  antiChannelDelete: { enabled: boolean; limit: number; action: 'remove_roles' | 'ban' };
  antiRoleCreate: { enabled: boolean; limit: number; action: 'remove_roles' | 'ban' };
  antiRoleDelete: { enabled: boolean; limit: number; action: 'remove_roles' | 'ban' };
  antiWebhooks: { enabled: boolean; action: 'delete' | 'ban_creator' };
  whitelistUsers: string[]; // User IDs allowed to bypass protection
  logChannelId: string;
  actionColor: string; // Defaults to #E53935
}

export interface GuildModerationSettings {
  muteRoleId: string;
  jailRoleId: string;
  jailRoomId: string;
  courtLogChannelId: string;
  courtName: string;
  courtLogo: string;
  courtColor: string; // Defaults to #E53935
  maxWarningsBeforeAction: number;
  warnAction: 'mute' | 'kick' | 'jail' | 'ban';
}

export interface GuildTicketCategory {
  id: string;
  name: string;
  emoji: string;
  staffRoleId: string;
  channelCategoryId: string;
  welcomeMessage: string;
}

export interface GuildTicketSettings {
  enabled: boolean;
  panelChannelId: string;
  transcriptChannelId: string;
  feedbackChannelId: string;
  maxOpenTicketsPerUser: number;
  embedColor: string; // Defaults to #E53935
  categories: GuildTicketCategory[];
}

export interface AutoResponderTrigger {
  id: string;
  trigger: string;
  response: string;
  matchType: 'exact' | 'contains' | 'startsWith';
  enabled: boolean;
  replyInDm: boolean;
  embedResponse: boolean;
}

export interface GuildRoleAutomationSettings {
  autoRoleHumanId: string;
  autoRoleBotId: string;
  tempRoleAllowed: boolean;
  multipleRolePresets: {
    id: string;
    name: string;
    roleIds: string[];
  }[];
}

export interface GuildWelcomeSettings {
  enabled: boolean;
  welcomeChannelId: string;
  leaveChannelId: string;
  boostChannelId: string;
  boostRoleId: string;
  welcomeMessage: string;
  leaveMessage: string;
  boostMessage: string;
  sendAsEmbed: boolean;
  embedColor: string; // Defaults to #E53935
  showAvatarCard: boolean;
  cardBackgroundTheme: 'dark_red' | 'cyberpunk' | 'minimal' | 'crimson_mesh';
}

export interface GuildLevelsSettings {
  enabled: boolean;
  levelUpChannelId: string; // 'current' or specific channel ID
  xpRate: number; // e.g., 1.0x, 1.5x
  levelUpMessage: string;
  roleRewards: { level: number; roleId: string }[];
}

export interface GuildEmbedTemplate {
  id: string;
  title: string;
  description: string;
  color: string; // Defaults to #E53935
  authorName?: string;
  authorIcon?: string;
  footerText?: string;
  footerIcon?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  timestamp: boolean;
  fields: { name: string; value: string; inline: boolean }[];
}

export interface GuildLogSettings {
  modLogChannelId: string;
  messageLogChannelId: string;
  memberLogChannelId: string;
  roleLogChannelId: string;
  channelLogChannelId: string;
  voiceLogChannelId: string;
}

export interface GuildSettings {
  guildId: string; // Strict primary key
  guildName: string;
  guildIcon: string | null;
  memberCount: number;
  ownerId: string;
  prefix: string;
  language: 'ar' | 'en';
  botJoinedAt: string;
  updatedAt: string;
  protection: GuildProtectionSettings;
  moderation: GuildModerationSettings;
  tickets: GuildTicketSettings;
  autoResponder: AutoResponderTrigger[];
  roles: GuildRoleAutomationSettings;
  welcome: GuildWelcomeSettings;
  levels: GuildLevelsSettings;
  embeds: GuildEmbedTemplate[];
  logs: GuildLogSettings;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
}

export interface GuildPermissionsMap {
  administrator: boolean;
  manageGuild: boolean;
  manageChannels: boolean;
  manageRoles: boolean;
  manageMessages: boolean;
  moderateMembers: boolean;
  banMembers: boolean;
  kickMembers: boolean;
}

export interface GuildFeaturesMap {
  dashboard: boolean;
  moderation: boolean;
  protection: boolean;
  tickets: boolean;
  autoRole: boolean;
  welcome: boolean;
  logs: boolean;
  commands: boolean;
}

export interface GuildCapabilities {
  guildId: string;
  isOwner: boolean;
  botInstalled: boolean;
  userPermissions: GuildPermissionsMap;
  botPermissions: GuildPermissionsMap;
  features: GuildFeaturesMap;
}

export interface GuildChannelSummary {
  id: string;
  name: string;
  type: number; // 0 = text, 2 = voice, 4 = category, etc.
  parentId: string | null;
}

export interface GuildRoleSummary {
  id: string;
  name: string;
  position: number;
  color: string;
  managed: boolean;
}

export interface GuildResources {
  guildId: string;
  channels: GuildChannelSummary[];
  roles: GuildRoleSummary[];
}

export interface GuildSummary {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  memberCount: number;
  isOwner: boolean;
  canManage: boolean;
  botInstalled: boolean;
  permissions?: string;
}
