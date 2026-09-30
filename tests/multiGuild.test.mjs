/**
 * OneBot by HyperSoft
 * Multi-Guild Verification Test Suite (ES Module)
 * 
 * Verifies strict separation across:
 * 1. Guild Settings (Prefix & Configuration)
 * 2. Protection In-Memory Rate Limit Counters
 * 3. Ticket Counters
 * 4. Channel and Role Scope Checking
 * 5. Cache Invalidation
 */

import assert from 'node:assert';
import { guildDb } from '../utils/guildDb.js';
import { protectionHelper } from '../commands/_protectionHelper.js';
import { tempRoleSystem } from '../systems/temp_role.js';
import { isDuplicateWebhookAuditLog, extractWebhookAuditChannelId, processedWebhookAuditLogs } from '../index.js';

async function runTests() {
  console.log("==================================================");
  console.log("🚀 Starting OneBot Multi-Guild Verification Tests");
  console.log("==================================================\n");

  const GUILD_A = "111111111111111111";
  const GUILD_B = "222222222222222222";
  const TEST_USER = "999888777666555444";

  // ----------------------------------------------------
  // TEST 1: Guild Settings & Prefix Isolation
  // ----------------------------------------------------
  console.log("👉 Test 1: Testing Prefix & Settings Isolation between Guild A and Guild B...");
  
  await guildDb.set(GUILD_A, { prefix: "!", guildName: "Alpha Server" });
  await guildDb.set(GUILD_B, { prefix: "?", guildName: "Beta Server" });

  let settingsA = await guildDb.get(GUILD_A);
  let settingsB = await guildDb.get(GUILD_B);

  assert.strictEqual(settingsA.prefix, "!", "Guild A prefix should be '!'");
  assert.strictEqual(settingsB.prefix, "?", "Guild B prefix should be '?'");
  console.log("  [PASS] Initial prefixes are isolated: Guild A = '!', Guild B = '?'");

  // Mutate Guild A
  await guildDb.set(GUILD_A, { prefix: "#" });
  settingsA = await guildDb.get(GUILD_A);
  settingsB = await guildDb.get(GUILD_B);

  assert.strictEqual(settingsA.prefix, "#", "Guild A prefix should be updated to '#'");
  assert.strictEqual(settingsB.prefix, "?", "Guild B prefix MUST remain '?' without any mutation");
  console.log("  [PASS] Mutating Guild A to '#' did not affect Guild B ('?')\n");

  // ----------------------------------------------------
  // TEST 2: Protection Rate-Limit Composite Key Isolation
  // ----------------------------------------------------
  console.log("👉 Test 2: Testing Protection Rate Limit Counters (guildId + userId)...");

  // User performs 3 bans in Guild A (limit = 3)
  const resA1 = await protectionHelper.trackAndCheck(GUILD_A, TEST_USER, 'ban', 3);
  const resA2 = await protectionHelper.trackAndCheck(GUILD_A, TEST_USER, 'ban', 3);
  const resA3 = await protectionHelper.trackAndCheck(GUILD_A, TEST_USER, 'ban', 3);
  const resA4 = await protectionHelper.trackAndCheck(GUILD_A, TEST_USER, 'ban', 3); // Should exceed

  assert.strictEqual(resA3.exceeded, false, "3rd ban in Guild A should be within limit");
  assert.strictEqual(resA4.exceeded, true, "4th ban in Guild A must be flagged as exceeded");
  console.log("  [PASS] User reached limit in Guild A (Counter = 4, Exceeded = true)");

  // Now, the EXACT SAME USER performs an action in Guild B
  const resB1 = await protectionHelper.trackAndCheck(GUILD_B, TEST_USER, 'ban', 3);

  assert.strictEqual(resB1.exceeded, false, "1st ban in Guild B must NOT exceed limit");
  assert.strictEqual(resB1.currentCount, 1, "Guild B counter for user must start at 1, not 5");
  console.log("  [PASS] Guild B counter for same user is isolated (Counter = 1, Exceeded = false)\n");

  // ----------------------------------------------------
  // TEST 3: Independent Per-Guild Ticket Counters
  // ----------------------------------------------------
  console.log("👉 Test 3: Testing Independent Ticket Counters (ticket-001 per guild)...");

  // Reset ticketCount for clean test
  await guildDb.set(GUILD_A, { ticketCount: 0 });
  await guildDb.set(GUILD_B, { ticketCount: 0 });

  const ticketA1 = await guildDb.getNextTicketNumber(GUILD_A);
  const ticketA2 = await guildDb.getNextTicketNumber(GUILD_A);

  assert.strictEqual(ticketA1, 1, "Guild A first ticket should be 1");
  assert.strictEqual(ticketA2, 2, "Guild A second ticket should be 2");
  console.log(`  [PASS] Guild A tickets: #${ticketA1} (ticket-001), #${ticketA2} (ticket-002)`);

  // Now Guild B requests tickets
  const ticketB1 = await guildDb.getNextTicketNumber(GUILD_B);
  const ticketB2 = await guildDb.getNextTicketNumber(GUILD_B);

  assert.strictEqual(ticketB1, 1, "Guild B first ticket MUST start at 1 independently");
  assert.strictEqual(ticketB2, 2, "Guild B second ticket MUST be 2");
  console.log(`  [PASS] Guild B tickets: #${ticketB1} (ticket-001), #${ticketB2} (ticket-002) - completely independent!\n`);

  // ----------------------------------------------------
  // TEST 4: Roles & Channels Scope Checking
  // ----------------------------------------------------
  console.log("👉 Test 4: Testing Role & Channel Cross-Guild Rejection...");

  // Mock Discord Guild A and Guild B objects
  const mockGuildA = {
    id: GUILD_A,
    name: "Guild Alpha",
    roles: {
      cache: new Map([
        ["role_a_admin", { id: "role_a_admin", name: "Alpha Admin", guild: { id: GUILD_A } }]
      ])
    }
  };

  const mockGuildB = {
    id: GUILD_B,
    name: "Guild Beta",
    roles: {
      cache: new Map([
        ["role_b_mod", { id: "role_b_mod", name: "Beta Mod", guild: { id: GUILD_B } }]
      ])
    }
  };

  const mockMemberB = {
    id: TEST_USER,
    roles: {
      cache: new Map(),
      add: async () => {},
      remove: async () => {}
    }
  };

  // Attempt to assign role from Guild A in Guild B
  let crossGuildCaught = false;
  try {
    await tempRoleSystem.grantTempRole(mockGuildB, mockMemberB, "role_a_admin", 5000);
  } catch (err) {
    crossGuildCaught = true;
    console.log(`  [PASS] Cross-guild role access correctly rejected: "${err.message}"\n`);
  }
  assert.strictEqual(crossGuildCaught, true, "Assigning foreign guild role must be blocked");

  // ----------------------------------------------------
  // TEST 5: Cache Invalidation & Dashboard Synchronization
  // ----------------------------------------------------
  console.log("👉 Test 5: Testing Cache Invalidation & Dashboard Synchronization...");

  // Force cache population
  const cachedSettings = await guildDb.get(GUILD_A);
  assert.strictEqual(cachedSettings.prefix, "#");

  // Simulate Dashboard updating settings via DB
  await guildDb.set(GUILD_A, { prefix: "!" });

  // Invalidate cache
  guildDb.invalidate(GUILD_A);

  const reloaded = await guildDb.get(GUILD_A);
  assert.strictEqual(reloaded.prefix, "!", "Cache invalidation must reload fresh data immediately");
  console.log("  [PASS] Invalidation successfully reloaded fresh prefix '!' without server restart.\n");

  // ----------------------------------------------------
  // TEST 6: Temporary Role Database Persistence
  // ----------------------------------------------------
  console.log("👉 Test 6: Testing Temporary Role Database Persistence...");

  const testExp = Date.now() + 60000;
  await guildDb.saveTempRole(GUILD_A, TEST_USER, "role_temp_vip", testExp);

  const activeTempRoles = await guildDb.getAllActiveTempRoles();
  const savedRole = activeTempRoles.find(r => r.guildId === GUILD_A && r.userId === TEST_USER && r.roleId === "role_temp_vip");

  assert.ok(savedRole, "Temporary role must be persisted to database store");
  assert.strictEqual(savedRole.roleId, "role_temp_vip");
  console.log("  [PASS] Temp role persisted successfully to database and retrievable on startup.\n");

  await guildDb.removeTempRole(GUILD_A, TEST_USER, "role_temp_vip");

  // ----------------------------------------------------
  // TEST 7: Webhook Audit-Log Deduplication & Channel Matching
  // ----------------------------------------------------
  console.log("👉 Test 7: Testing Webhook Audit-Log Deduplication & Channel Matching...");

  // 7.1 Deduplication on duplicate event reception
  const logId1 = "900000000000000001";
  const logId2 = "900000000000000002";
  const isDupFirst = isDuplicateWebhookAuditLog(GUILD_A, logId1);
  const isDupSecond = isDuplicateWebhookAuditLog(GUILD_A, logId1); // Immediate duplicate
  assert.strictEqual(isDupFirst, false, "First webhook audit log must not be flagged as duplicate");
  assert.strictEqual(isDupSecond, true, "Second identical webhook audit log must be flagged as duplicate and ignored");
  console.log("  [PASS] 7.1 Same webhook audit-log ID received twice is counted once.");

  // 7.2 Different log ID is counted independently
  const isDupDifferent = isDuplicateWebhookAuditLog(GUILD_A, logId2);
  assert.strictEqual(isDupDifferent, false, "Distinct webhook audit log must be processed independently");
  console.log("  [PASS] 7.2 Different webhook audit-log IDs counted independently.");

  // 7.3 Different guild isolation for deduplication
  const isDupGuildB = isDuplicateWebhookAuditLog(GUILD_B, logId1);
  assert.strictEqual(isDupGuildB, false, "Same audit log ID in different guild must not collide");
  console.log("  [PASS] 7.3 Different guilds never share deduplication state.");

  // 7.4 Extract channel ID from audit log
  const mockChannelId = "555555555555555555";
  const mockLogWithExtraChannel = { extra: { channel: { id: mockChannelId } } };
  const mockLogWithChannelId = { extra: { channelId: mockChannelId } };
  const mockLogWithTargetChannel = { target: { channelId: mockChannelId } };
  assert.strictEqual(extractWebhookAuditChannelId(mockLogWithExtraChannel), mockChannelId);
  assert.strictEqual(extractWebhookAuditChannelId(mockLogWithChannelId), mockChannelId);
  assert.strictEqual(extractWebhookAuditChannelId(mockLogWithTargetChannel), mockChannelId);
  console.log("  [PASS] 7.4 Correctly extracts channel information from various Discord.js v14 shapes.");

  // 7.5 Missing channel metadata fails safe
  const mockLogMissingChannel = { extra: {}, target: {} };
  assert.strictEqual(extractWebhookAuditChannelId(mockLogMissingChannel), null, "Missing channel metadata must return null to fail safe");
  console.log("  [PASS] 7.5 Missing channel metadata returns null and fails safe without false positive.\n");

  console.log("==================================================");
  console.log("✅ ALL MULTI-GUILD VERIFICATION TESTS PASSED!");
  console.log("==================================================");

  protectionHelper.destroy();
  process.exit(0);
}

runTests().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
