#!/usr/bin/env node
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { CLIENTS, installSkills } from './lib/installer.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
export function parseInstallArgs(args) {
  const { values } = parseArgs({ args, strict: true, allowPositionals: false, options: {
    source: { type: 'string', default: ROOT }, scope: { type: 'string', default: 'user' },
    project: { type: 'string' }, home: { type: 'string', default: os.homedir() },
    clients: { type: 'string', default: 'all' }, profile: { type: 'string', default: 'all' },
    force: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  } });
  return { source: values.source, scope: values.scope, project: values.project, home: values.home, clients: values.clients, profile: values.profile, force: values.force, dryRun: values['dry-run'], help: values.help };
}
export function main(args = process.argv.slice(2)) {
  const options = parseInstallArgs(args);
  if (options.help) {
    console.log(`Usage: node install-skills.mjs [options]

--scope user|project     Base directory: --home (default user) or --project.
--home <existing>        User home override; defaults to the current home.
--project <existing>     Required for project scope.
--source <distribution>  Defaults to the directory containing this script.
--clients comma|all     ${CLIENTS.join(', ')} (default all).
--profile <name>        all, core, unreal, unity, godot (default all).
--dry-run               Validate source and all destinations without writes.
--force                 Back up conflicting unknown targets before replacing.
-h, --help              Show help.

Copies skills to <base>/.claude/skills for Claude and <base>/.agents/skills
for the other five clients. References go to each client's sibling
references/game-workflow/. All profiles retain every Matt skill.
Previously managed direct edits always block, including with --force.
Recovery backups and a backup receipt are written under the selected base.`);
    return;
  }
  const result = installSkills(options);
  console.log(`${result.dryRun ? 'Validated dry run' : 'Installed'} profile ${result.profile}:`);
  for (const entry of result.destinations) console.log(`  ${entry.destination} (${entry.receipt.skills.length} skills)`);
  if (result.backup) console.log(`Recovery backup and receipt: ${result.backup}`);
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`error: ${error.message}`); process.exitCode = 1; }
}
