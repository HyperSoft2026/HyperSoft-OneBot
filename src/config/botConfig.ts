/**
 * OneBot by HyperSoft
 * Official Configuration & Branding
 */

export const BOT_CONFIG = {
  name: "OneBot",
  developer: "HyperSoft",
  get displayName() {
    return `${this.name} by ${this.developer}`;
  },
  logoUrl: "/icon/Logo.png",
  colors: {
    primary: "#E53935", // Official OneBot Crimson Red
    primaryHover: "#D32F2F",
    primaryDark: "#B71C1C",
    primaryLight: "#EF5350",
    bgDark: "#0A0A0C",
    bgSurface: "#121215",
    bgCard: "#18181D",
    bgCardHover: "#202027",
    border: "#26262E",
    borderActive: "#E53935",
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    discordDark: "#2B2D31",
    discordEmbedBg: "#1E1F22",
  },
  version: "2.4.0",
  releaseDate: "2026",
  get discordDefaultInvite() {
    const clientId = import.meta.env?.VITE_DISCORD_CLIENT_ID || process.env?.DISCORD_CLIENT_ID || "1234567890";
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8`;
  },
  get privacyPolicyUrl() {
    return import.meta.env?.VITE_PRIVACY_POLICY_URL || process.env?.PRIVACY_POLICY_URL || "#";
  },
  get termsOfServiceUrl() {
    return import.meta.env?.VITE_TERMS_OF_SERVICE_URL || process.env?.TERMS_OF_SERVICE_URL || "#";
  },
  supportServer: "https://discord.gg/hypersoft",
  website: "https://hypersoft.onebot.io"
};
