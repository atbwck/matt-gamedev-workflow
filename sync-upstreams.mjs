#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { syncDistribution } from './lib/distribution.mjs';

export function parseSyncArgs(args) {
  const { values } = parseArgs({ args, strict: true, allowPositionals: false, options: {
    apply: { type: 'boolean' }, check: { type: 'boolean' }, offline: { type: 'boolean' },
    'update-pins': { type: 'boolean' }, 'accept-removals': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  } });
  return { apply: values.apply, check: values.check, offline: values.offline, updatePins: values['update-pins'], acceptRemovals: values['accept-removals'], help: values.help };
}
export function main(args = process.argv.slice(2), root = path.dirname(fileURLToPath(import.meta.url))) {
  const options = parseSyncArgs(args);
  if (options.help) {
    console.log(`Usage: node sync-upstreams.mjs [--apply] [--offline] [--accept-removals]
       node sync-upstreams.mjs --check
       node sync-upstreams.mjs --update-pins --apply

No arguments: build and validate a candidate and diff in .build/ only.
--apply: preflight existing managed files, then publish with recovery backups.
--offline: use existing clean caches; each HEAD must match its configured pin.
--check: verify published outputs and adapter/config hashes without upstream or Git.
--update-pins --apply: query configured branches and publish pins only after validation.
--accept-removals: explicitly accept reviewed removals of previous Matt skills.
Publication uses staged backups and rollback on errors, not a disk-atomic swap.`);
    return;
  }
  const result = syncDistribution({ root, ...options });
  if (result.checked) console.log(`Verified ${result.manifest.skills.length} skills offline.`);
  else {
    console.log(`Validated ${result.manifest.skills.length} skills. Candidate: ${result.candidate}`);
    console.log(`Diff: ${result.diff.added.length} added, ${result.diff.changed.length} changed, ${result.diff.removed.length} removed files.`);
    if (result.applied) console.log(`Published. Recovery backup: ${result.backup}`);
    else console.log('Review diff.json in the candidate; publish with --apply.');
  }
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`error: ${error.message}`); process.exitCode = 1; }
}
