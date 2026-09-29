/**
 * OneBot by HyperSoft
 * Official Discord.js Entry Point
 * 
 * Multi-Guild Production Ready Bot Client
 */

import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
import { guildDb } from './utils/guildDb.js';
import { canExecute } from './utils/cmdGuard.js';
import { onGuildMemberAdd } from './systems/auto_role.js';
import globalConfig from './settings.json' with { type: 'json' };

// Load environment variables
dotenv.config();

// 1. Startup Environment Validation
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ [OneBot Startup Error] Missing required environment variable: DISCORD_TOKEN.");
  console.error("👉 Please define DISCORD_TOKEN in your environment variables or .env file before running the bot.");
  process.exit(1);
}

// 2. Initialize Discord Client with precisely required intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Collection of commands
client.commands = new Collection();

// 3. Connect to Database (MongoDB if MONGODB_URI provided, otherwise local JSON fallback)
await guildDb.connectMongo(process.env.MONGODB_URI);

// 4. Bot Ready Event
client.once('ready', async () => {
  console.log(`====================================================`);
  console.log(`🤖 ${globalConfig.branding || 'OneBot by HyperSoft'} is ONLINE!`);
  console.log(`👤 Logged in as: ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`🌐 Active Guilds: ${client.guilds.cache.size}`);
  console.log(`⚡ Multi-Guild Architecture: ENABLED`);
  console.log(`====================================================`);

  client.user.setPresence({
    activities: [
      {
        name: `OneBot by HyperSoft | !help`,
        type: ActivityType.Custom,
        state: `OneBot by HyperSoft`
      }
    ],
    status: 'online'
  });
});

// 5. Guild Member Add Event (Auto-Role, Welcome, Anti-Bots)
client.on('guildMemberAdd', async (member) => {
  try {
    await onGuildMemberAdd(member);
  } catch (err) {
    console.error(`[guildMemberAdd Error in guild ${member.guild?.id}]:`, err.message);
  }
});

// 6. Message Create Event (Dynamic Per-Guild Prefix Execution)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const guildSettings = await guildDb.get(message.guild.id);
    const prefix = guildSettings.prefix || globalConfig.defaultPrefix || "!";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!commandName) return;

    // Command dispatch
    if (commandName === 'ping') {
      const ping = client.ws.ping;
      return message.reply(`🏓 Pong! تأخير البوت: **${ping}ms** (سيرفر: **${message.guild.name}**)`);
    }

    if (commandName === 'prefix') {
      if (!args[0]) {
        return message.reply(`البريفكس الحالي لسيرفر **${message.guild.name}** هو: \`${prefix}\``);
      }
      
      const check = await canExecute(message, { userPermissions: ['Administrator'] });
      if (!check.allowed) return message.reply(check.reason);

      const newPrefix = args[0].trim();
      await guildDb.set(message.guild.id, { prefix: newPrefix });
      return message.reply(`✅ تم تحديث بريفكس سيرفر **${message.guild.name}** إلى: \`${newPrefix}\``);
    }
  } catch (err) {
    console.error(`[messageCreate Error in guild ${message.guild?.id}]:`, err.message);
  }
});

// 7. Error Handling & Unhandled Process Safety
process.on('unhandledRejection', (reason, promise) => {
  console.error('[OneBot Anti-Crash] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[OneBot Anti-Crash] Uncaught Exception:', err.message);
});

// 8. Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[OneBot] Received ${signal}. Starting graceful shutdown...`);
  try {
    client.destroy();
    console.log('[OneBot] Discord client disconnected.');
  } catch (e) {
    // Ignore disconnect error
  }
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// 9. Login to Discord Gateway (only when DISCORD_TOKEN is defined)
if (process.env.DISCORD_TOKEN && process.env.NODE_ENV !== 'test') {
  client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error("❌ [OneBot Login Error] Failed to login to Discord Gateway:", err.message);
  });
}

export default client;
