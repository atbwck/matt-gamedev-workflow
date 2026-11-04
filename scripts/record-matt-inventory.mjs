#!/usr/bin/env node
// Explicit review tool: records file identities from the pinned Matt cache.
// It never installs skills or changes upstream pins.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../lib/distribution.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
try {
  if (process.argv.slice(2).join(' ') !== '--record') throw new Error('Usage: node scripts/record-matt-inventory.mjs --record (after source review)');
  const config = validateConfig(JSON.parse(fs.readFileSync(path.join(root, 'upstreams.json'), 'utf8')));
  const repo = path.join(root, 'upstream/matt');
  const run = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' });
  if (run.status !== 0 || run.stdout.trim() !== config.repositories.matt.commit) throw new Error('Matt cache does not match configured pin');
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en')).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`Linked source is not accepted: ${entry.name}`);
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
  const base = path.join(repo, config.repositories.matt.skillsRoot);
  const entries = config.repositories.matt.groups.flatMap(group => walk(path.join(base, group))).filter(file => path.basename(file) === 'SKILL.md').map(file => {
    const text = fs.readFileSync(file, 'utf8');
    const name = text.match(/^name:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
    if (!name || name !== path.basename(path.dirname(file))) throw new Error(`Invalid skill identity: ${file}`);
    return {
      name,
      sourcePath: path.relative(repo, path.dirname(file)).split(path.sep).join('/'),
      files: walk(path.dirname(file)).map(resource => path.relative(path.dirname(file), resource).split(path.sep).join('/')).sort(),
    };
  }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const target = path.join(root, 'tests/fixtures/matt-retention.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify({ schema: 1, reviewedCommit: config.repositories.matt.commit, skills: entries }, null, 2) + '\n');
  console.log(`Recorded ${entries.length} Matt skill identities and ${entries.reduce((sum, entry) => sum + entry.files.length, 0)} original files. Review the fixture diff before acceptance.`);
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}
