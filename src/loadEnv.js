/**
 * OneBot by HyperSoft
 * Multi-path Environment Loader
 * Supports cwd, __dirname, and Code Nexus container path (/home/container/.env)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load from process.cwd() .env
dotenv.config();

// 2. Load from project root .env
try {
  const rootEnv = path.resolve(__dirname, '../.env');
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv, override: false });
  }
} catch (e) {}

// 3. Load from Code Nexus Pterodactyl container path
try {
  const containerEnv = '/home/container/.env';
  if (fs.existsSync(containerEnv)) {
    dotenv.config({ path: containerEnv, override: true });
  }
} catch (e) {}

export default process.env;
