/**
 * OneBot by HyperSoft
 * Global Config Schema
 * Restricted STRICTLY to system-wide bot infrastructure.
 * Per-guild settings MUST go into GuildSchema.
 */

import mongoose from 'mongoose';

const GlobalConfigSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  globalDevelopers: {
    type: [String],
    default: []
  },
  blacklistedGuilds: {
    type: [String],
    default: []
  },
  blacklistedUsers: {
    type: [String],
    default: []
  },
  globalNotice: {
    type: String,
    default: ""
  }
}, {
  timestamps: true,
  collection: 'global_config'
});

export const GlobalConfig = mongoose.models.GlobalConfig || mongoose.model('GlobalConfig', GlobalConfigSchema);
export default GlobalConfig;
