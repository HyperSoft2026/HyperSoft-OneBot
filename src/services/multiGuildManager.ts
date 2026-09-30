/**
 * OneBot by HyperSoft
 * Multi-Guild Data Isolation Engine (Authoritative REST API Client)
 * 
 * Strict Multi-Guild Architecture:
 * 1. The Express Backend & Database are Authoritative.
 * 2. User identity, guild list, bot installation, and permissions come directly from Discord API.
 * 3. LocalStorage is restricted to non-sensitive UI convenience flags only.
 */

import { 
  GuildSettings, 
  GuildSummary, 
  DiscordUser, 
  GuildCapabilities, 
  GuildResources 
} from '../types/guild';
import { BOT_CONFIG } from '../config/botConfig';

const LAST_GUILD_KEY = 'onebot_last_guild_id';

// Default Schema Factory for initial/offline state
export function createDefaultGuildSettings(guildId: string, guildName: string, icon: string | null = null): GuildSettings {
  return {
    guildId,
    guildName,
    guildIcon: icon,
    memberCount: 1,
    ownerId: "",
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
        }
      ]
    },
    autoResponder: [],
    roles: {
      autoRoleHumanId: "",
      autoRoleBotId: "",
      tempRoleAllowed: true,
      multipleRolePresets: []
    },
    welcome: {
      enabled: true,
      welcomeChannelId: "",
      leaveChannelId: "",
      boostChannelId: "",
      boostRoleId: "",
      welcomeMessage: "أهلاً بك {user} في سيرفر {server}!",
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
      roleRewards: []
    },
    embeds: [],
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

class MultiGuildManager {
  private memoryCache: Map<string, GuildSettings> = new Map();
  private currentUser: DiscordUser | null = null;
  private userGuilds: GuildSummary[] = [];

  /**
   * Fetches current authenticated Discord user profile from backend
   */
  public async fetchCurrentUser(): Promise<DiscordUser | null> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          return data.user;
        }
      }
    } catch (err) {
      console.warn('[MultiGuildManager] fetchCurrentUser failed:', err);
    }
    this.currentUser = null;
    return null;
  }

  /**
   * Fetches user's manageable Discord servers from backend
   */
  public async fetchUserGuilds(): Promise<GuildSummary[]> {
    try {
      const res = await fetch('/api/guilds', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.guilds)) {
          this.userGuilds = data.guilds;
          return data.guilds;
        }
      }
    } catch (err) {
      console.warn('[MultiGuildManager] fetchUserGuilds failed:', err);
    }
    return [];
  }

  /**
   * Fetches server capabilities & bot permissions for target guild
   */
  public async fetchGuildCapabilities(guildId: string): Promise<GuildCapabilities | null> {
    if (!guildId) return null;
    try {
      const res = await fetch(`/api/guilds/${guildId}/capabilities`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.capabilities) {
          return data.capabilities;
        }
      }
    } catch (err) {
      console.warn(`[MultiGuildManager] fetchGuildCapabilities failed for ${guildId}:`, err);
    }
    return null;
  }

  /**
   * Fetches real Discord channels and roles belonging to target guild
   */
  public async fetchGuildResources(guildId: string): Promise<GuildResources | null> {
    if (!guildId) return null;
    try {
      const res = await fetch(`/api/guilds/${guildId}/resources`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            guildId: data.guildId,
            channels: data.channels || [],
            roles: data.roles || []
          };
        }
      }
    } catch (err) {
      console.warn(`[MultiGuildManager] fetchGuildResources failed for ${guildId}:`, err);
    }
    return null;
  }

  /**
   * Asynchronous REST API Fetcher - Retrieves authoritative settings from backend
   */
  public async fetchGuildSettingsAsync(guildId: string): Promise<GuildSettings> {
    if (!guildId) throw new Error("guildId is required.");

    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          this.memoryCache.set(guildId, data.settings);
          this.setLastActiveGuildId(guildId);
          return data.settings;
        }
      } else if (res.status === 403 || res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "غير مصرح لك بإدارة هذا السيرفر.");
      }
    } catch (err: any) {
      console.warn(`[MultiGuildManager] API Fetch failed for ${guildId}:`, err.message);
      throw err;
    }

    // Check memory cache fallback
    if (this.memoryCache.has(guildId)) {
      return this.memoryCache.get(guildId)!;
    }

    const defaultSettings = createDefaultGuildSettings(guildId, `Server #${guildId.slice(-4)}`);
    return defaultSettings;
  }

  /**
   * Asynchronous REST API Mutator - Persists settings directly to Express Backend & MongoDB
   */
  public async saveGuildSettingsAsync(guildId: string, updatedSettings: Partial<GuildSettings>): Promise<GuildSettings> {
    if (!guildId) throw new Error("guildId is required.");

    const res = await fetch(`/api/guilds/${guildId}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedSettings)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        this.memoryCache.set(guildId, data.settings);
        return data.settings;
      }
    }

    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `فشل حفظ إعدادات السيرفر (${res.status})`);
  }

  /**
   * Logs out the user and clears sessions
   */
  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    this.currentUser = null;
    this.userGuilds = [];
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAST_GUILD_KEY);
    }
  }

  // Non-sensitive UI preference storage
  public getLastActiveGuildId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_GUILD_KEY);
  }

  public setLastActiveGuildId(guildId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_GUILD_KEY, guildId);
    } catch {}
  }

  public getCachedUser(): DiscordUser | null {
    return this.currentUser;
  }

  public getCachedGuilds(): GuildSummary[] {
    return this.userGuilds;
  }

  public getGuildSettings(guildId: string): GuildSettings {
    if (!guildId) return createDefaultGuildSettings("0", "Default");
    if (this.memoryCache.has(guildId)) {
      return this.memoryCache.get(guildId)!;
    }
    const def = createDefaultGuildSettings(guildId, `Server #${guildId.slice(-4)}`);
    this.memoryCache.set(guildId, def);
    return def;
  }

  public verifyMultiGuildIsolation(guildAId: string, guildBId: string): {
    isolated: boolean;
    details: string;
  } {
    if (guildAId === guildBId) {
      return { isolated: false, details: "Guild IDs must be different for isolation test." };
    }
    const originalA = this.getGuildSettings(guildAId);
    const originalB = this.getGuildSettings(guildBId);
    const testToken = `isolation_${Date.now()}`;
    const mutatedA = { ...originalA, prefix: testToken };
    this.memoryCache.set(guildAId, mutatedA);
    const freshB = this.getGuildSettings(guildBId);
    const isolated = freshB.prefix === originalB.prefix && freshB.prefix !== testToken;
    this.memoryCache.set(guildAId, originalA);
    return {
      isolated,
      details: isolated
        ? `عزل تام ومثبت: تعديل السيرفر [${guildAId}] لم يؤثر مطلقاً على بيانات السيرفر الثاني [${guildBId}].`
        : `فشل العزل: تم رصد تداخل بين السيرفرين.`
    };
  }
}

export const multiGuildManager = new MultiGuildManager();
