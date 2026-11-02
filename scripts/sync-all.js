#!/usr/bin/env node
/** Run all sync scripts in sequence, without a shell. */
const { spawnSync } = require('child_process');
const path = require('path');

const scripts = [
  'sync-awesome-lists.js',
  'sync-mcp-registry.js',
  'sync-clawhub.js',
  'sync-agentskills.js',
  'sync-github-stars.js',
];

function runSync({ scriptNames = scripts, directory = __dirname, spawn = spawnSync, logger = console } = {}) {
  let failed = false;
  logger.log('=== Awesome Agent Skills: Full Sync ===');
  for (const script of scriptNames) {
    logger.log(`--- Running ${script} ---`);
    try {
      const result = spawn(process.execPath, [path.join(directory, script)], {
        stdio: 'inherit', timeout: 300000,
      });
      if (result.error || result.signal || result.status !== 0) {
        failed = true;
        logger.error(`${script} failed (exit ${result.status ?? 'unavailable'}${result.signal ? `, signal ${result.signal}` : ''}).`);
      }
    } catch (_error) {
      failed = true;
      logger.error(`${script} failed to start.`);
    }
  }
  logger.log(failed ? '=== Sync finished with failures ===' : '=== Sync complete ===');
  return failed ? 1 : 0;
}

if (require.main === module) process.exitCode = runSync();
module.exports = { runSync };
