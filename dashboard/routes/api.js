/**
 * OneBot by HyperSoft
 * Dashboard REST API Router
 * 
 * Synchronizes Dashboard actions directly with Mongoose GuildDb,
 * triggering automatic in-memory cache invalidation on the Discord Bot.
 */

const express = require('express');
const router = express.Router();
const guildDb = require('../../utils/guildDb');

// Middleware to sanitize guildId
router.param('guildId', (req, res, next, guildId) => {
  if (!guildId || !/^\d{16,20}$/.test(guildId)) {
    return res.status(400).json({ error: "Invalid Discord Guild ID" });
  }
  req.guildId = String(guildId).trim();
  next();
});

// GET /api/guilds/:guildId/settings
router.get('/guilds/:guildId/settings', async (req, res) => {
  try {
    const settings = await guildDb.get(req.guildId);
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/guilds/:guildId/settings
router.post('/guilds/:guildId/settings', async (req, res) => {
  try {
    const updated = await guildDb.set(req.guildId, req.body);
    // Explicit cache invalidation is handled inside guildDb.set()
    return res.json({ 
      success: true, 
      message: `Settings for guild ${req.guildId} updated and synchronized.`,
      settings: updated 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/guilds/:guildId/invalidate-cache
router.post('/guilds/:guildId/invalidate-cache', (req, res) => {
  guildDb.invalidate(req.guildId);
  return res.json({ success: true, message: `Cache invalidated for guild ${req.guildId}` });
});

module.exports = router;
