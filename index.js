/**
 * OneBot by HyperSoft
 * Official Discord.js Entry Point
 * 
 * Multi-Guild Production Ready Bot Client with Slash Commands,
 * Protection Event Wiring, Ticket Interactions, and Temp Role Restoration.
 */

import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection, 
  ActivityType,
  REST,
  Routes,
  EmbedBuilder,
  AuditLogEvent,
  PermissionFlagsBits
} from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guildDb } from './utils/guildDb.js';
import { canExecute } from './utils/cmdGuard.js';
import { onGuildMemberAdd } from './systems/auto_role.js';
import { tempRoleSystem } from './systems/temp_role.js';
import { protectionHelper } from './commands/_protectionHelper.js';
import { createTicket } from './systems/tickets.js';
import globalConfig from './settings.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (supports standard process.cwd() and Code Nexus container path)
dotenv.config();
const containerEnvPath = '/home/container/.env';
try {
  if (fs.existsSync(containerEnvPath)) {
    dotenv.config({ path: containerEnvPath, override: true });
  }
} catch (e) {
  // Silent fallback to standard process.cwd() .env
}

// 1. Startup Environment Validation
if (!process.env.DISCORD_TOKEN && process.env.NODE_ENV !== 'test') {
  console.warn("⚠️ [OneBot Startup Warning] DISCORD_TOKEN is omitted. Bot Gateway login skipped.");
}

// 2. Initialize Discord Client with required intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildWebhooks
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Collection of loaded commands
client.commands = new Collection();

// Safe error listener to prevent unhandled EventEmitter error crashes
client.on('error', (err) => {
  console.error('[OneBot Discord Client Error]:', err.message);
});

// 3. Connect to Database (MongoDB if MONGODB_URI provided, otherwise local JSON fallback)
export async function initMongo(uri = process.env.MONGODB_URI) {
  return await guildDb.connectMongo(uri);
}

// 4. Dynamic Command Loader (ESM)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js') && !f.startsWith('_'));
  for (const file of commandFiles) {
    try {
      const mod = await import(`./commands/${file}`);
      const command = mod.default || mod;
      if (command && command.name) {
        client.commands.set(command.name, command);
      }
    } catch (err) {
      console.error(`[Command Loader] Failed to load command ${file}:`, err.message);
    }
  }
}

// 5. Bot Ready Event
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

  // Restore Active Temporary Roles across process restarts
  await tempRoleSystem.initializeRestoration(client);

  // Deploy Slash Commands to Discord REST API if client ID available
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_CLIENT_ID) {
    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      const slashPayloads = [];
      client.commands.forEach(cmd => {
        if (cmd.data) {
          slashPayloads.push(cmd.data.toJSON());
        }
      });

      if (slashPayloads.length > 0) {
        await rest.put(
          Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
          { body: slashPayloads }
        );
        console.log(`✅ [OneBot Slash Commands] Successfully registered ${slashPayloads.length} global slash commands.`);
      }
    } catch (err) {
      console.warn(`[OneBot Slash Commands Warning] Could not deploy slash commands:`, err.message);
    }
  }
});

// 6. Interaction Create Event (Slash Commands & Ticket Buttons)
client.on('interactionCreate', async (interaction) => {
  try {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (command.executeInteraction) {
        await command.executeInteraction(interaction);
      } else if (command.execute) {
        // Fallback for legacy message-style commands
        await interaction.deferReply({ ephemeral: true });
        await command.execute({
          guild: interaction.guild,
          author: interaction.user,
          member: interaction.member,
          channel: interaction.channel,
          client: interaction.client,
          reply: (msg) => interaction.editReply(msg)
        }, []);
      }
      return;
    }

    // Handle Ticket Button Clicks
    if (interaction.isButton()) {
      const customId = interaction.customId;
      if (customId.startsWith('ticket_open:')) {
        const categoryId = customId.split(':')[1] || 'support';
        await interaction.deferReply({ ephemeral: true });

        try {
          const ticketRes = await createTicket(interaction.guild, interaction.user, categoryId);
          return interaction.editReply({
            content: `✅ تم فتح تذكرتك بنجاح في القناة: <#${ticketRes.channelId}>`
          });
        } catch (err) {
          return interaction.editReply({ content: `❌ خطأ في فتح التذكرة: ${err.message}` });
        }
      }
    }
  } catch (err) {
    console.error(`[interactionCreate Error in guild ${interaction.guildId}]:`, err.message);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ content: `❌ حدث خطأ أثناء تنفيذ الطلب.`, ephemeral: true }).catch(() => {});
    }
  }
});

// 7. Guild Member Add Event (Auto-Role, Welcome, Anti-Bots)
client.on('guildMemberAdd', async (member) => {
  try {
    await onGuildMemberAdd(member);
  } catch (err) {
    console.error(`[guildMemberAdd Error in guild ${member.guild?.id}]:`, err.message);
  }
});

// 8. Protection Gateway Event Listeners & Enforcement Engine

/**
 * Reusable server-side protection enforcement helper.
 * Validates bot permissions, guild owner safety, bot self-safety, and role hierarchy.
 */
async function enforceProtectionAction(guild, executor, action = 'remove_roles', reason = 'OneBot Protection') {
  if (!guild || !executor || executor.id === client.user?.id || executor.id === guild.ownerId) return;
  const me = guild.members.me;
  if (!me) return;

  const executorMember = await guild.members.fetch(executor.id).catch(() => null);
  if (!executorMember) return;

  // Bot role hierarchy check: Cannot punish members with higher or equal role position unless owner
  if (me.roles.highest.position <= executorMember.roles.highest.position && guild.ownerId !== me.id) {
    console.warn(`[Protection Hierarchy Check] Cannot punish ${executor.tag} (higher or equal role position).`);
    return;
  }

  try {
    if (action === 'ban' && me.permissions.has(PermissionFlagsBits.BanMembers) && executorMember.bannable) {
      await executorMember.ban({ reason }).catch(() => {});
      console.warn(`[Protection Action] Banned executor ${executor.tag} in guild ${guild.id}: ${reason}`);
    } else if (action === 'kick' && me.permissions.has(PermissionFlagsBits.KickMembers) && executorMember.kickable) {
      await executorMember.kick(reason).catch(() => {});
      console.warn(`[Protection Action] Kicked executor ${executor.tag} in guild ${guild.id}: ${reason}`);
    } else if (action === 'remove_roles' && me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      const rolesToRemove = executorMember.roles.cache.filter(r => r.id !== guild.roles.everyone.id && me.roles.highest.position > r.position);
      if (rolesToRemove.size > 0) {
        await executorMember.roles.remove(rolesToRemove, reason).catch(() => {});
        console.warn(`[Protection Action] Stripped dangerous roles from executor ${executor.tag} in guild ${guild.id}: ${reason}`);
      }
    }
  } catch (err) {
    console.error(`[Protection Action Error in guild ${guild.id}]:`, err.message);
  }
}

// 8.1 Anti-Ban Protection
client.on('guildBanAdd', async (ban) => {
  try {
    const settings = await guildDb.get(ban.guild.id);
    const antiBanConfig = settings.protection?.antiBan;
    if (!antiBanConfig?.enabled) return;

    if (!ban.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
    const banLog = fetchedLogs?.entries.first();
    if (!banLog) return;

    if (banLog.target?.id !== ban.user.id) return;
    if (Date.now() - banLog.createdTimestamp > 10000) return;

    const executor = banLog.executor;
    if (!executor || executor.id === client.user?.id || executor.id === ban.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      ban.guild.id, 
      executor.id, 
      'antiBan', 
      antiBanConfig.limit || 3
    );

    if (check.exceeded && !check.isWhitelisted) {
      await enforceProtectionAction(ban.guild, executor, antiBanConfig.action || 'ban', 'OneBot Protection: Exceeded Anti-Ban limit.');
    }
  } catch (err) {
    console.error(`[guildBanAdd Protection Error]:`, err.message);
  }
});

// 8.2 Anti-Kick Protection
client.on('guildMemberRemove', async (member) => {
  try {
    if (!member.guild) return;
    const settings = await guildDb.get(member.guild.id);
    const antiKickConfig = settings.protection?.antiKick;
    if (!antiKickConfig?.enabled) return;

    if (!member.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
    const kickLog = fetchedLogs?.entries.first();
    if (!kickLog) return;

    // Verify kick target and timeliness
    if (kickLog.target?.id !== member.id) return;
    if (Date.now() - kickLog.createdTimestamp > 10000) return;

    const executor = kickLog.executor;
    if (!executor || executor.id === client.user?.id || executor.id === member.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      member.guild.id,
      executor.id,
      'antiKick',
      antiKickConfig.limit || 3
    );

    if (check.exceeded && !check.isWhitelisted) {
      await enforceProtectionAction(member.guild, executor, antiKickConfig.action || 'ban', 'OneBot Protection: Exceeded Anti-Kick limit.');
    }
  } catch (err) {
    console.error(`[guildMemberRemove Protection Error]:`, err.message);
  }
});

// 8.3 Anti-Channel-Create Protection
client.on('channelCreate', async (channel) => {
  try {
    if (!channel.guild) return;
    const settings = await guildDb.get(channel.guild.id);
    const antiChannelConfig = settings.protection?.antiChannelCreate;
    if (!antiChannelConfig?.enabled) return;

    if (!channel.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate }).catch(() => null);
    const log = fetchedLogs?.entries.first();
    if (!log) return;

    if (log.target?.id !== channel.id) return;
    if (Date.now() - log.createdTimestamp > 10000) return;

    const executor = log.executor;
    if (!executor || executor.id === client.user?.id || executor.id === channel.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      channel.guild.id,
      executor.id,
      'antiChannelCreate',
      antiChannelConfig.limit || 3
    );

    if (check.exceeded && !check.isWhitelisted) {
      if (channel.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels) && channel.deletable) {
        await channel.delete('OneBot Protection: Unauthorized channel creation threshold exceeded.').catch(() => {});
      }
      await enforceProtectionAction(channel.guild, executor, antiChannelConfig.action || 'remove_roles', 'OneBot Protection: Exceeded Anti-Channel-Create limit.');
    }
  } catch (err) {
    console.error(`[channelCreate Protection Error]:`, err.message);
  }
});

// 8.4 Anti-Channel-Delete Protection
client.on('channelDelete', async (channel) => {
  try {
    if (!channel.guild) return;
    const settings = await guildDb.get(channel.guild.id);
    const antiChannelConfig = settings.protection?.antiChannelDelete;
    if (!antiChannelConfig?.enabled) return;

    if (!channel.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete }).catch(() => null);
    const log = fetchedLogs?.entries.first();
    if (!log) return;

    if (log.target?.id !== channel.id) return;
    if (Date.now() - log.createdTimestamp > 10000) return;

    const executor = log.executor;
    if (!executor || executor.id === client.user?.id || executor.id === channel.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      channel.guild.id,
      executor.id,
      'antiChannelDelete',
      antiChannelConfig.limit || 2
    );

    if (check.exceeded && !check.isWhitelisted) {
      await enforceProtectionAction(channel.guild, executor, antiChannelConfig.action || 'remove_roles', 'OneBot Protection: Exceeded Anti-Channel-Delete limit.');
    }
  } catch (err) {
    console.error(`[channelDelete Protection Error]:`, err.message);
  }
});

// 8.5 Anti-Role-Create Protection
client.on('roleCreate', async (role) => {
  try {
    if (!role.guild) return;
    const settings = await guildDb.get(role.guild.id);
    const antiRoleConfig = settings.protection?.antiRoleCreate;
    if (!antiRoleConfig?.enabled) return;

    if (!role.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate }).catch(() => null);
    const log = fetchedLogs?.entries.first();
    if (!log) return;

    if (log.target?.id !== role.id) return;
    if (Date.now() - log.createdTimestamp > 10000) return;

    const executor = log.executor;
    if (!executor || executor.id === client.user?.id || executor.id === role.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      role.guild.id,
      executor.id,
      'antiRoleCreate',
      antiRoleConfig.limit || 3
    );

    if (check.exceeded && !check.isWhitelisted) {
      if (role.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles) && role.editable) {
        await role.delete('OneBot Protection: Unauthorized role creation threshold exceeded.').catch(() => {});
      }
      await enforceProtectionAction(role.guild, executor, antiRoleConfig.action || 'remove_roles', 'OneBot Protection: Exceeded Anti-Role-Create limit.');
    }
  } catch (err) {
    console.error(`[roleCreate Protection Error]:`, err.message);
  }
});

// 8.6 Anti-Role-Delete Protection
client.on('roleDelete', async (role) => {
  try {
    if (!role.guild) return;
    const settings = await guildDb.get(role.guild.id);
    const antiRoleConfig = settings.protection?.antiRoleDelete;
    if (!antiRoleConfig?.enabled) return;

    if (!role.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete }).catch(() => null);
    const log = fetchedLogs?.entries.first();
    if (!log) return;

    if (log.target?.id !== role.id) return;
    if (Date.now() - log.createdTimestamp > 10000) return;

    const executor = log.executor;
    if (!executor || executor.id === client.user?.id || executor.id === role.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      role.guild.id,
      executor.id,
      'antiRoleDelete',
      antiRoleConfig.limit || 2
    );

    if (check.exceeded && !check.isWhitelisted) {
      await enforceProtectionAction(role.guild, executor, antiRoleConfig.action || 'remove_roles', 'OneBot Protection: Exceeded Anti-Role-Delete limit.');
    }
  } catch (err) {
    console.error(`[roleDelete Protection Error]:`, err.message);
  }
});

// Webhook Audit-Log Deduplication Cache (Short-lived, guild-scoped)
export const processedWebhookAuditLogs = new Map(); // key: `${guildId}:${logId}` -> expiresAt

/**
 * Checks and records webhook audit-log deduplication.
 * Returns true if the audit log entry has already been processed for this guild.
 */
export function isDuplicateWebhookAuditLog(guildId, logId, ttlMs = 45000) {
  if (!guildId || !logId) return false;
  const key = `${String(guildId).trim()}:${String(logId).trim()}`;
  const now = Date.now();
  const expiresAt = processedWebhookAuditLogs.get(key);
  if (expiresAt && now < expiresAt) {
    return true; // Duplicate entry
  }
  processedWebhookAuditLogs.set(key, now + ttlMs);
  return false;
}

// Periodic cleanup of expired deduplication keys
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of processedWebhookAuditLogs.entries()) {
    if (now > expiresAt) {
      processedWebhookAuditLogs.delete(key);
    }
  }
}, 60000);

/**
 * Safely extracts and verifies the target channel ID of a webhook audit-log entry.
 * Evaluates Discord.js v14 AuditLogEntry channel properties and fails safe with null if unresolvable.
 */
export function extractWebhookAuditChannelId(log) {
  if (!log) return null;
  // 1. Direct channel object on extra
  if (log.extra?.channel?.id) return String(log.extra.channel.id);
  // 2. Direct channelId property on extra
  if (log.extra?.channelId) return String(log.extra.channelId);
  // 3. Extra itself as channel snowflake (or extra.id)
  if (typeof log.extra === 'string' && /^\d{16,20}$/.test(log.extra)) return String(log.extra);
  if (log.extra?.id && /^\d{16,20}$/.test(log.extra.id)) return String(log.extra.id);
  // 4. Target webhook channelId if populated on Webhook object
  if (log.target?.channelId) return String(log.target.channelId);
  if (log.target?.channel?.id) return String(log.target.channel.id);
  // 5. Channel property directly on log if present
  if (log.channel?.id) return String(log.channel.id);
  return null;
}

// 8.7 Anti-Webhooks Protection
client.on('webhookUpdate', async (channel) => {
  try {
    if (!channel.guild) return;
    const settings = await guildDb.get(channel.guild.id);
    const antiWebhookConfig = settings.protection?.antiWebhooks;
    if (!antiWebhookConfig?.enabled) return;

    if (!channel.guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

    const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1 }).catch(() => null);
    const log = fetchedLogs?.entries.first();
    if (!log) return;

    const isWebhookAction = [
      AuditLogEvent.WebhookCreate,
      AuditLogEvent.WebhookUpdate,
      AuditLogEvent.WebhookDelete
    ].includes(log.action);

    if (!isWebhookAction) return;
    if (Date.now() - log.createdTimestamp > 10000) return;

    // Verify same guild
    if (log.guildId && log.guildId !== channel.guild.id) return;

    // Strict channel matching: Fail safe if channel does not match or cannot be resolved
    const auditChannelId = extractWebhookAuditChannelId(log);
    if (!auditChannelId || auditChannelId !== channel.id) {
      // Action occurred in a different channel or channel metadata is unresolvable
      return;
    }

    // Deduplication check: Avoid multiple counts for the same audit-log entry
    if (log.id && isDuplicateWebhookAuditLog(channel.guild.id, log.id)) {
      return;
    }

    const executor = log.executor;
    if (!executor || executor.id === client.user?.id || executor.id === channel.guild.ownerId) return;

    const check = await protectionHelper.trackAndCheck(
      channel.guild.id,
      executor.id,
      'antiWebhooks',
      2
    );

    if (check.exceeded && !check.isWhitelisted) {
      if (antiWebhookConfig.action === 'delete' && log.action === AuditLogEvent.WebhookCreate && channel.guild.members.me?.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        const webhooks = await channel.fetchWebhooks().catch(() => null);
        if (webhooks) {
          for (const [_, webhook] of webhooks) {
            if (Date.now() - webhook.createdTimestamp < 15000) {
              await webhook.delete('OneBot Protection: Unauthorized webhook creation').catch(() => {});
            }
          }
        }
      }
      await enforceProtectionAction(channel.guild, executor, 'remove_roles', 'OneBot Protection: Unauthorized webhook manipulation threshold exceeded.');
    }
  } catch (err) {
    console.error(`[webhookUpdate Protection Error]:`, err.message);
  }
});

// 9. Message Create Event (Prefix Commands, Auto Responder, Level XP Engine)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const guildSettings = await guildDb.get(message.guild.id);

    // Auto Responder Engine
    if (guildSettings.autoResponder && guildSettings.autoResponder.length > 0) {
      for (const rule of guildSettings.autoResponder) {
        if (!rule.enabled || !rule.trigger || !rule.response) continue;

        let matched = false;
        const triggerLower = rule.trigger.toLowerCase();
        const contentLower = message.content.toLowerCase();

        if (rule.matchType === 'exact' && contentLower === triggerLower) matched = true;
        else if (rule.matchType === 'startsWith' && contentLower.startsWith(triggerLower)) matched = true;
        else if (rule.matchType === 'contains' && contentLower.includes(triggerLower)) matched = true;

        if (matched) {
          if (rule.embedResponse) {
            const embed = new EmbedBuilder()
              .setDescription(rule.response)
              .setColor(globalConfig.primaryColor || "#E53935")
              .setFooter({ text: `OneBot Auto-Responder • ${message.guild.name}` });
            await message.reply({ embeds: [embed] }).catch(() => {});
          } else {
            await message.reply(rule.response).catch(() => {});
          }
          break;
        }
      }
    }

    // Dynamic Prefix Command Execution
    const prefix = guildSettings.prefix || globalConfig.defaultPrefix || "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const command = client.commands.get(commandName);
    if (command && command.execute) {
      await command.execute(message, args);
    }
  } catch (err) {
    console.error(`[messageCreate Error in guild ${message.guild?.id}]:`, err.message);
  }
});

// 10. Process Anti-Crash & Graceful Shutdown
process.on('unhandledRejection', (reason) => {
  console.error('[OneBot Anti-Crash] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[OneBot Anti-Crash] Uncaught Exception:', err.message);
});

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

// 11. Discord Gateway Login Function
export async function startDiscordBot(token = process.env.DISCORD_TOKEN) {
  if (!token) {
    console.log('[OneBot] Discord: OFFLINE (DISCORD_TOKEN is missing or empty)');
    console.log('[OneBot] Dashboard remains online');
    return false;
  }
  const cleanToken = String(token).trim();
  if (!cleanToken) {
    console.log('[OneBot] Discord: OFFLINE (DISCORD_TOKEN is empty string)');
    console.log('[OneBot] Dashboard remains online');
    return false;
  }

  console.log('[OneBot] Starting Discord Gateway login...');
  try {
    await client.login(cleanToken);
    return true;
  } catch (err) {
    console.error('❌ [OneBot] Discord initialization failed:', err.message);
    console.log('[OneBot] Dashboard remains online');
    return false;
  }
}

// 12. Direct execution bootstrap
const isDirectRun = process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)));

if (isDirectRun) {
  await initMongo();
  if (process.env.NODE_ENV === 'test') {
    console.log('[OneBot] Test environment bootstrap complete.');
    process.exit(0);
  }
  if (process.env.DISCORD_TOKEN) {
    startDiscordBot();
  }
}

export default client;
