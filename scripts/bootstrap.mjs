#!/usr/bin/env node
/**
 * OneBot by HyperSoft — Self-Healing Production Bootstrap
 * 
 * Guarantees that node_modules is healthy and complete before launching server.js.
 * Handles KataBump panel recovery if npm install previously failed with ENOTEMPTY or partial installs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CRITICAL_MODULES = [
  'express',
  'mongoose',
  'discord.js',
  'dotenv'
];

const LOCK_FILE = path.join(projectRoot, '.npm-install.lock');

/**
 * Check if node_modules is healthy and all critical dependencies exist
 */
export function checkDependenciesHealth(rootDir = projectRoot) {
  const nmPath = path.join(rootDir, 'node_modules');
  if (!fs.existsSync(nmPath)) {
    return { healthy: false, reason: 'node_modules directory does not exist' };
  }

  // Check for broken temporary/staging folders left over from failed npm renames
  try {
    const entries = fs.readdirSync(nmPath);
    const brokenStaging = entries.filter(e => {
      if (['.bin', '.package-lock.json', '.vite', '.vite-temp', '.cache'].includes(e)) return false;
      return (
        e.startsWith('.mongoose') || 
        e.startsWith('.staging') || 
        e.startsWith('.package-') || 
        e.startsWith('.tmp-')
      );
    });
    if (brokenStaging.length > 0) {
      return { 
        healthy: false, 
        reason: `Found leftover/failed npm rename staging directories: ${brokenStaging.join(', ')}` 
      };
    }
  } catch (err) {
    return { healthy: false, reason: `Cannot read node_modules: ${err.message}` };
  }

  // Check critical modules have their package.json intact
  for (const mod of CRITICAL_MODULES) {
    const pkgPath = path.join(nmPath, mod, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      return { healthy: false, reason: `Critical dependency missing: ${mod} (${pkgPath} not found)` };
    }
  }

  // Run quick import verification for express, mongoose, discord.js
  const quickTest = spawnSync(process.execPath, [
    '-e',
    `Promise.all([
      import('express'),
      import('mongoose'),
      import('discord.js')
    ]).then(() => process.exit(0)).catch(() => process.exit(1))`
  ], { cwd: rootDir, timeout: 5000 });

  if (quickTest.status !== 0) {
    return { healthy: false, reason: 'Runtime module import verification failed' };
  }

  return { healthy: true };
}

/**
 * Acquire file lock to prevent concurrent npm install processes
 */
function acquireInstallLock() {
  const maxWaitMs = 60000;
  const start = Date.now();

  while (fs.existsSync(LOCK_FILE)) {
    try {
      const lockStat = fs.statSync(LOCK_FILE);
      const ageMs = Date.now() - lockStat.mtimeMs;
      // If lock is older than 3 minutes, treat as stale from crashed process
      if (ageMs > 180000) {
        console.warn('[OneBot Bootstrap] Removing stale .npm-install.lock file...');
        try { fs.unlinkSync(LOCK_FILE); } catch {}
        break;
      }
    } catch {
      break;
    }

    if (Date.now() - start > maxWaitMs) {
      console.warn('[OneBot Bootstrap] Lock wait timed out. Clearing lock to proceed.');
      try { fs.unlinkSync(LOCK_FILE); } catch {}
      break;
    }

    console.log('[OneBot Bootstrap] Another npm installation is in progress. Waiting...');
    const sleepEnd = Date.now() + 2000;
    while (Date.now() < sleepEnd) {}
  }

  try {
    fs.writeFileSync(LOCK_FILE, `${process.pid}\n${new Date().toISOString()}`, { flag: 'wx' });
  } catch {
    // Already created
  }
}

function releaseInstallLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch {}
}

/**
 * Safely repairs node_modules using clean installation
 */
export function recoverDependencies(rootDir = projectRoot) {
  acquireInstallLock();
  try {
    const nmPath = path.join(rootDir, 'node_modules');
    console.log('[OneBot Bootstrap] =====================================');
    console.log('[OneBot Bootstrap] INITIATING SAFE DEPENDENCY RECOVERY');
    console.log('[OneBot Bootstrap] =====================================');

    if (fs.existsSync(nmPath)) {
      console.log('[OneBot Bootstrap] Removing incomplete/corrupted node_modules...');
      fs.rmSync(nmPath, { recursive: true, force: true });
      console.log('[OneBot Bootstrap] node_modules removed successfully.');
    }

    const lockPath = path.join(rootDir, 'package-lock.json');
    let installed = false;

    if (fs.existsSync(lockPath)) {
      console.log('[OneBot Bootstrap] Found package-lock.json. Attempting clean install via npm ci...');
      try {
        execSync('npm ci --prefer-offline --no-audit --no-fund', {
          cwd: rootDir,
          stdio: 'inherit',
          timeout: 180000
        });
        installed = true;
        console.log('[OneBot Bootstrap] npm ci completed successfully.');
      } catch (ciErr) {
        console.warn('[OneBot Bootstrap] npm ci failed or was interrupted, falling back to npm install...');
      }
    }

    if (!installed) {
      console.log('[OneBot Bootstrap] Running npm install --no-audit --no-fund...');
      execSync('npm install --no-audit --no-fund', {
        cwd: rootDir,
        stdio: 'inherit',
        timeout: 240000
      });
      console.log('[OneBot Bootstrap] npm install completed successfully.');
    }

    // Explicitly verify critical imports
    console.log('[OneBot Bootstrap] Verifying critical module imports...');
    const tests = [
      { name: 'express', check: "import('express').then(() => console.log('EXPRESS_OK'))" },
      { name: 'mongoose', check: "import('mongoose').then(() => console.log('MONGOOSE_OK'))" },
      { name: 'discord.js', check: "import('discord.js').then(() => console.log('DISCORD_JS_OK'))" }
    ];

    for (const test of tests) {
      const res = spawnSync(process.execPath, ['-e', test.check], {
        cwd: rootDir,
        encoding: 'utf8',
        timeout: 10000
      });
      if (res.status !== 0 || !res.stdout.includes('_OK')) {
        throw new Error(`Critical dependency verification failed for '${test.name}': ${res.stderr || res.stdout}`);
      }
    }

    console.log('[OneBot Bootstrap] All critical dependencies verified successfully.');
    console.log('[OneBot Bootstrap] =====================================');
  } finally {
    releaseInstallLock();
  }
}

/**
 * Main self-healing gatekeeper
 */
export async function ensureDependenciesReady(rootDir = projectRoot) {
  const health = checkDependenciesHealth(rootDir);
  if (!health.healthy) {
    console.warn(`[OneBot Bootstrap] Dependency issue detected: ${health.reason}`);
    recoverDependencies(rootDir);
  }
}

// If invoked directly from CLI (e.g. node scripts/bootstrap.mjs)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    await ensureDependenciesReady();
    console.log('[OneBot Bootstrap] Launching production server (server.js)...');
    await import('../server.js');
  } catch (err) {
    console.error('[OneBot Bootstrap Fatal Error]:', err.message);
    process.exit(1);
  }
}
