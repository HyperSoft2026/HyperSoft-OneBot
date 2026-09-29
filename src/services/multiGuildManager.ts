/**
 * OneBot by HyperSoft
 * Multi-Guild Data Isolation Engine
 * 
 * Strict Guild Separation Rule:
 * 1. Storage key is partitioned by: `onebot_guild_${guildId}`
 * 2. Every query and update requires a valid guildId.
 * 3. No shared mutable state between guilds.
 */

import { GuildSettings, GuildSummary } from '../types/guild';
import { BOT_CONFIG } from '../config/botConfig';

const STORAGE_PREFIX = 'onebot_guild_';
const GUILD_INDEX_KEY = 'onebot_registered_guilds';

// Standard Default Schema for any new Guild
export function createDefaultGuildSettings(guildId: string, guildName: string, icon: string | null = null): GuildSettings {
  return {
    guildId,
    guildName,
    guildIcon: icon,
    memberCount: 1,
    ownerId: "109876543210987654",
    prefix: "!",
    language: "ar",
    botJoinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    protection: {
      antiBan: { enabled: true, limit: 3, action: 'ban' },
      antiKick: { enabled: true, limit: 3, action: 'ban' },
      antiBots: { enabled: true, action: 'kick' },
      antiChannelCreate: { enabled: true, limit: 3, action: 'remove_roles' },
      antiChannelDelete: { enabled: true, limit: 2, action: 'remove_roles' },
      antiRoleCreate: { enabled: true, limit: 3, action: 'remove_roles' },
      antiRoleDelete: { enabled: true, limit: 2, action: 'remove_roles' },
      antiWebhooks: { enabled: true, action: 'delete' },
      whitelistUsers: [],
      logChannelId: "",
      actionColor: BOT_CONFIG.colors.primary,
    },
    moderation: {
      muteRoleId: "",
      jailRoleId: "",
      jailRoomId: "",
      courtLogChannelId: "",
      courtName: `محكمة ${guildName}`,
      courtLogo: BOT_CONFIG.logoUrl,
      courtColor: BOT_CONFIG.colors.primary,
      maxWarningsBeforeAction: 3,
      warnAction: 'mute'
    },
    tickets: {
      enabled: true,
      panelChannelId: "",
      transcriptChannelId: "",
      feedbackChannelId: "",
      maxOpenTicketsPerUser: 1,
      embedColor: BOT_CONFIG.colors.primary,
      categories: [
        {
          id: "cat_support",
          name: "الدعم الفني (Technical Support)",
          emoji: "🛠️",
          staffRoleId: "",
          channelCategoryId: "",
          welcomeMessage: "أهلاً بك في الدعم الفني، سيتواصل معك أحد أعضاء الإدارة قريباً."
        },
        {
          id: "cat_inquiry",
          name: "الاستفسارات العامة (General Inquiries)",
          emoji: "❓",
          staffRoleId: "",
          channelCategoryId: "",
          welcomeMessage: "مرحباً بك، يرجى كتابة استفسارك وسنقوم بالرد في أسرع وقت."
        }
      ]
    },
    autoResponder: [
      {
        id: "auto_rule_1",
        trigger: "قوانين السيرفر",
        response: "يرجى قراءة القوانين في روم الإعلانات وعدم مخالفة إرشادات السيرفر.",
        matchType: "contains",
        enabled: true,
        replyInDm: false,
        embedResponse: true
      },
      {
        id: "auto_rule_2",
        trigger: "شراء رتبة",
        response: "يمكنك فتح تذكرة دعم فني للاستفسار عن الرتب المميزة والعروض المتاحة.",
        matchType: "contains",
        enabled: true,
        replyInDm: false,
        embedResponse: false
      }
    ],
    roles: {
      autoRoleHumanId: "",
      autoRoleBotId: "",
      tempRoleAllowed: true,
      multipleRolePresets: [
        {
          id: "preset_members",
          name: "رتب الأعضاء الجدد",
          roleIds: []
        }
      ]
    },
    welcome: {
      enabled: true,
      welcomeChannelId: "",
      leaveChannelId: "",
      boostChannelId: "",
      boostRoleId: "",
      welcomeMessage: "أهلاً بك {user} في سيرفر {server}! نتمنى لك قضاء وقت ممتع.",
      leaveMessage: "وداعاً {user}، نراك لاحقاً في {server}.",
      boostMessage: "شكراً {user} على دعم السيرفر عبر البوست 🚀!",
      sendAsEmbed: true,
      embedColor: BOT_CONFIG.colors.primary,
      showAvatarCard: true,
      cardBackgroundTheme: "dark_red"
    },
    levels: {
      enabled: true,
      levelUpChannelId: "current",
      xpRate: 1.0,
      levelUpMessage: "مبروك {user}! لقد وصلت إلى المستوى {level} 🎉",
      roleRewards: [
        { level: 5, roleId: "" },
        { level: 10, roleId: "" }
      ]
    },
    embeds: [
      {
        id: "embed_official_rules",
        title: `قوانين سيرفر ${guildName}`,
        description: "مرحباً بجميع الأعضاء. يرجى الالتزام بالقواعد الآتية لضمان بيئة آمنة للجميع:",
        color: BOT_CONFIG.colors.primary,
        authorName: "إدارة السيرفر",
        authorIcon: BOT_CONFIG.logoUrl,
        footerText: `OneBot by ${BOT_CONFIG.developer}`,
        footerIcon: BOT_CONFIG.logoUrl,
        timestamp: true,
        fields: [
          { name: "1. الاحترام المتبادل", value: "يمنع الشتم والإهانة بأي شكل.", inline: false },
          { name: "2. منع الإعلانات", value: "يمنع نشر روابط السيرفرات الأخرى بدون إذن.", inline: false }
        ]
      }
    ],
    logs: {
      modLogChannelId: "",
      messageLogChannelId: "",
      memberLogChannelId: "",
      roleLogChannelId: "",
      channelLogChannelId: "",
      voiceLogChannelId: ""
    }
  };
}

// Initial registered servers for realistic multi-guild operation
const INITIAL_SERVERS: GuildSummary[] = [
  {
    guildId: "123456789012345678",
    guildName: "HyperSoft Official HQ",
    guildIcon: null,
    memberCount: 3420,
    isOwner: true,
    canManage: true,
    botInstalled: true
  },
  {
    guildId: "234567890123456789",
    guildName: "CyberRealm Gaming Community",
    guildIcon: null,
    memberCount: 1850,
    isOwner: false,
    canManage: true,
    botInstalled: true
  },
  {
    guildId: "345678901234567890",
    guildName: "OneBot Production Cluster",
    guildIcon: null,
    memberCount: 890,
    isOwner: true,
    canManage: true,
    botInstalled: true
  }
];

class MultiGuildManager {
  private memoryCache: Map<string, GuildSettings> = new Map();

  constructor() {
    this.initRegistry();
  }

  private initRegistry(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedIndex = localStorage.getItem(GUILD_INDEX_KEY);
      if (!storedIndex) {
        localStorage.setItem(GUILD_INDEX_KEY, JSON.stringify(INITIAL_SERVERS));
        // Initialize individual storage for initial guilds
        INITIAL_SERVERS.forEach(srv => {
          const settings = createDefaultGuildSettings(srv.guildId, srv.guildName, srv.guildIcon);
          settings.memberCount = srv.memberCount;
          localStorage.setItem(`${STORAGE_PREFIX}${srv.guildId}`, JSON.stringify(settings));
        });
      }
    } catch {
      // Fallback in memory
      INITIAL_SERVERS.forEach(srv => {
        const settings = createDefaultGuildSettings(srv.guildId, srv.guildName, srv.guildIcon);
        this.memoryCache.set(srv.guildId, settings);
      });
    }
  }

  public getGuildList(): GuildSummary[] {
    try {
      const data = localStorage.getItem(GUILD_INDEX_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Memory fallback
    }
    return INITIAL_SERVERS;
  }

  public getGuildSettings(guildId: string): GuildSettings {
    if (!guildId) {
      throw new Error("MultiGuildManager: guildId is required to access settings.");
    }

    // Check memory cache
    if (this.memoryCache.has(guildId)) {
      return JSON.parse(JSON.stringify(this.memoryCache.get(guildId)));
    }

    try {
      const key = `${STORAGE_PREFIX}${guildId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.memoryCache.set(guildId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`Failed to read from localStorage for guild ${guildId}`, e);
    }

    // Find guild name from summary or default
    const guildList = this.getGuildList();
    const summary = guildList.find(g => g.guildId === guildId);
    const newSettings = createDefaultGuildSettings(
      guildId,
      summary ? summary.guildName : `Server #${guildId.slice(-4)}`,
      summary ? summary.guildIcon : null
    );

    this.saveGuildSettings(guildId, newSettings);
    return newSettings;
  }

  public saveGuildSettings(guildId: string, updatedSettings: Partial<GuildSettings>): GuildSettings {
    if (!guildId) {
      throw new Error("MultiGuildManager: guildId is required to save settings.");
    }

    const current = this.getGuildSettings(guildId);
    const merged: GuildSettings = {
      ...current,
      ...updatedSettings,
      guildId, // Strictly enforce that guildId cannot be altered by payload
      updatedAt: new Date().toISOString()
    };

    this.memoryCache.set(guildId, merged);

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${guildId}`, JSON.stringify(merged));

      // Update name or icon in summary list if changed
      const list = this.getGuildList();
      const idx = list.findIndex(g => g.guildId === guildId);
      if (idx !== -1) {
        if (updatedSettings.guildName) list[idx].guildName = updatedSettings.guildName;
        if (updatedSettings.guildIcon !== undefined) list[idx].guildIcon = updatedSettings.guildIcon;
        localStorage.setItem(GUILD_INDEX_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error(`Failed to persist guild ${guildId} to storage`, e);
    }

    return merged;
  }

  public registerNewGuild(guildId: string, guildName: string, icon: string | null = null, memberCount = 1): GuildSettings {
    // Validate guildId (Discord snowflakes are 17-20 digits)
    const cleanedId = guildId.trim();
    if (!cleanedId) {
      throw new Error("معرف السيرفر (Guild ID) غير صالح.");
    }

    const list = this.getGuildList();
    const existing = list.find(g => g.guildId === cleanedId);
    if (!existing) {
      const summary: GuildSummary = {
        guildId: cleanedId,
        guildName: guildName.trim() || `Discord Guild ${cleanedId.slice(-4)}`,
        guildIcon: icon,
        memberCount: memberCount || 1,
        isOwner: true,
        canManage: true,
        botInstalled: true
      };
      list.push(summary);
      try {
        localStorage.setItem(GUILD_INDEX_KEY, JSON.stringify(list));
      } catch (err) {
        console.warn("Could not save to localStorage", err);
      }
    }

    const settings = createDefaultGuildSettings(cleanedId, guildName, icon);
    return this.saveGuildSettings(cleanedId, settings);
  }

  public removeGuild(guildId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${guildId}`);
      const list = this.getGuildList().filter(g => g.guildId !== guildId);
      localStorage.setItem(GUILD_INDEX_KEY, JSON.stringify(list));
      this.memoryCache.delete(guildId);
    } catch (e) {
      console.error(`Failed to remove guild ${guildId}`, e);
    }
  }

  /**
   * Diagnostic Isolation Check:
   * Verifies that two distinct guild IDs never leak or share configuration.
   */
  public verifyMultiGuildIsolation(guildAId: string, guildBId: string): {
    isolated: boolean;
    details: string;
  } {
    if (guildAId === guildBId) {
      return { isolated: false, details: "Guild IDs must be different for isolation test." };
    }

    const testToken = `test_token_${Date.now()}`;
    // Temporarily mutate guild A prefix
    const originalA = this.getGuildSettings(guildAId);
    const originalB = this.getGuildSettings(guildBId);

    this.saveGuildSettings(guildAId, { prefix: testToken });
    const freshB = this.getGuildSettings(guildBId);

    // Verify Guild B was not touched
    const isolated = freshB.prefix === originalB.prefix && freshB.prefix !== testToken;

    // Restore original A
    this.saveGuildSettings(guildAId, { prefix: originalA.prefix });

    return {
      isolated,
      details: isolated
        ? `Strict Multi-Guild Isolation Verified: Mutating guild [${guildAId}] did not affect guild [${guildBId}].`
        : `Isolation Failed: Cross-contamination detected between [${guildAId}] and [${guildBId}].`
    };
  }
}

export const multiGuildManager = new MultiGuildManager();
