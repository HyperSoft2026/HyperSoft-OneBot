# OneBot by HyperSoft 🛡️

[![CI Status](https://github.com/HyperSoft/OneBot/actions/workflows/ci.yml/badge.svg)](https://github.com/HyperSoft/OneBot/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Discord.js Version](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![Branding](https://img.shields.io/badge/Branding-OneBot%20by%20HyperSoft-%23E53935.svg)](https://hypersoft.onebot.io)

**OneBot** is a high-performance, enterprise-grade **Multi-Guild Discord Bot & Management Dashboard** developed by **HyperSoft**. Engineered for high concurrency, zero cross-server data leakage, and rigorous server isolation.

---

## 🌟 Key Features

- **🛡️ Advanced Anti-Raid & Protection:**
  - In-memory rate limits isolated by composite key (`guildId + userId`).
  - Anti-Ban, Anti-Kick, Anti-Bots, Anti-Channel and Anti-Role creation/deletion protections.
  - Per-guild whitelisting system.

- **⚖️ Moderation & Court System:**
  - Automated warning counters with customizable progressive penalties (Mute, Jail, Kick, Ban).
  - Isolated server court system with custom names, logos, colors, and audit log channels.

- **🎫 Independent Ticket System:**
  - Atomic ticket sequencing isolated per guild (`ticket-001`, `ticket-002`).
  - Categorized support panels, staff role bindings, and transcript channels.

- **🤖 Smart Auto-Responder:**
  - Keyword and phrase triggers with exact, contains, or prefix matching.
  - Rich Discord Embed responses styled in OneBot's signature `#E53935` crimson red.

- **👥 Roles & Automation:**
  - Human and bot auto-roles on join, validated strictly against the guild's local roles cache.
  - Temporary roles with automated duration timers.
  - Multiple roles batch-assignment presets.

- **👋 Welcome & Server Boosts:**
  - Dynamic welcome card previews with customizable dark cyberpunk crimson themes.
  - Boost alert notifications and booster role distribution.

- **📈 Levels & XP Engine:**
  - Configurable XP multiplier per guild.
  - Level-up notification channels and automated milestone role rewards.

- **🎛️ Live Multi-Guild Web Dashboard:**
  - Real-time guild switcher and Discord Snowflake ID validator.
  - Live side-by-side Isolation Inspector verifying 100% data partition between servers.

---

## 📋 System Requirements

- **Node.js:** `>= 20.0.0` (LTS recommended)
- **Package Manager:** `npm` (v10+), `pnpm`, or `bun`
- **Database:** MongoDB (v6.0+) or automated local JSON persistence fallback
- **Discord Bot Token:** Discord Application with privileged Gateway Intents enabled

---

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_ORGANIZATION/OneBot.git
cd OneBot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `DISCORD_TOKEN` | Discord Bot Token from Developer Portal | **Yes** |
| `DISCORD_CLIENT_ID` | Application Client ID | Recommended |
| `DISCORD_CLIENT_SECRET` | OAuth2 Client Secret for Dashboard | For Dashboard |
| `MONGODB_URI` | MongoDB Connection String (fallback to JSON if omitted) | Optional |
| `PRIVACY_POLICY_URL` | URL to your Privacy Policy document | Optional |
| `TERMS_OF_SERVICE_URL` | URL to your Terms of Service document | Optional |
| `PORT` | Web Dashboard Port (Default: `3000`) | Optional |
| `SESSION_SECRET` | Secret key for signing dashboard cookies | Optional |

> ⚠️ **SECURITY WARNING:** Never commit your `.env` file or expose your `DISCORD_TOKEN` publicly.

---

## 🏃‍♂️ Running OneBot

### Start the Discord Bot Backend
```bash
npm start
```

### Start the Web Management Dashboard
```bash
npm run dev
```

### Run Multi-Guild Verification Test Suite
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 🤖 Discord Gateway Setup & Intents

In the [Discord Developer Portal](https://discord.com/developers/applications):
1. Navigate to **Bot** -> **Privileged Gateway Intents**.
2. Enable:
   - ✅ **Server Members Intent** (`GuildMembers`)
   - ✅ **Message Content Intent** (`MessageContent`)
   - ✅ **Presence Intent** (Optional, for status tracking)
3. Under **OAuth2** -> **URL Generator**, select `bot` and `applications.commands` scopes with Administrator permissions.

---

## 🔒 Security & Multi-Guild Architecture

- **Composite Key Isolation:** All protection maps, cooldowns, and rate limits use `${guildId}:${userId}:${actionType}` ensuring zero cross-contamination.
- **Resource Ownership Verification:** All role assignments, channel lookups, and category bindings enforce `resource.guild.id === targetGuild.id`.
- **Sanitized Secrets:** Process monitors and global error handlers (`unhandledRejection`, `uncaughtException`) sanitize stack traces to prevent credential leakage.
- **Safe Database Tier:** Dual MongoDB + JSON persistence layer automatically reconciles legacy server files without breaking changes.

---

## 📜 Legal & Compliance

- **Privacy Policy:** Configurable via `PRIVACY_POLICY_URL`. OneBot only stores server configurations necessary for bot functionality and does not harvest private messages.
- **Terms of Service:** Configurable via `TERMS_OF_SERVICE_URL`. By using OneBot, communities agree to adhere to the Discord Developer Terms of Service.

---

## 📄 License & Attribution

- **Product:** OneBot
- **Developer & Owner:** HyperSoft
- **Formula:** OneBot by HyperSoft
- **Primary Color:** `#E53935`
- **Icon Path:** `/icon/Logo.png`

Developed with pride by **HyperSoft**.
