import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertNoSymlinks, copyFile, copyTree, digest, exists, fileDigest, filesUnder, jsonText, overlaps, put, readJson, relativePath, replaceWithRollback, sameRecord, within } from './files.mjs';
import { ENGINES, verifyDistribution } from './distribution.mjs';
import { NAME } from './markdown.mjs';

export const CLIENTS = ['claude', 'codex', 'gemini', 'pi', 'omp', 'opencode'];
export const INSTALL_RECEIPT = '.matt-gamedev-workflow-install.json';
export function normalizeClients(value = 'all') {
  const values = Array.isArray(value) ? value : value === 'all' ? CLIENTS : value.split(',').map(item => item.trim());
  if (!values.length || values.some(item => !CLIENTS.includes(item))) throw new Error(`Unknown client(s); expected all or ${CLIENTS.join(',')}`);
  return [...new Set(values)];
}
function directory(file, label) {
  assertNoSymlinks(file);
  if (!exists(file) || !fs.lstatSync(file).isDirectory()) throw new Error(`${label} must be an existing directory: ${file}`);
}
function directoryParents(file) {
  assertNoSymlinks(file);
  let parent = path.dirname(file);
  while (parent !== path.dirname(parent)) {
    if (exists(parent) && !fs.lstatSync(parent).isDirectory()) throw new Error(`Destination parent is not a directory: ${parent}`);
    parent = path.dirname(parent);
  }
}
function validateReceipt(receipt) {
  if (receipt?.schema !== 1 || !Array.isArray(receipt.skills) || !receipt.managedHashes || !receipt.sourceFingerprint) throw new Error('Invalid install receipt; preserve it and back up the installation before repairing');
  for (const name of receipt.skills) if (!NAME.test(name)) throw new Error(`Unsafe receipt skill name: ${name}`);
  if (new Set(receipt.skills).size !== receipt.skills.length) throw new Error('Duplicate install receipt skill');
  for (const [file, hash] of Object.entries(receipt.managedHashes)) {
    relativePath(file);
    if (!(/^[a-f0-9]{64}$/.test(hash)) || !(file.startsWith('references/game-workflow/') || (file.startsWith('skills/') && receipt.skills.includes(file.split('/')[1])))) throw new Error(`Unsafe receipt path/hash: ${file}`);
  }
}
export function verifyInstall({ destination, receipt } = {}) {
  assertNoSymlinks(destination);
  receipt ??= readJson(within(destination, INSTALL_RECEIPT));
  validateReceipt(receipt);
  const actual = {};
  for (const file of Object.keys(receipt.managedHashes)) {
    const target = within(destination, file);
    assertNoSymlinks(target);
    if (exists(target) && fs.lstatSync(target).isFile()) actual[file] = fileDigest(target);
  }
  sameRecord(actual, receipt.managedHashes, 'Previously managed install; back up edits and update the source');
  // Additions within a managed skill are direct edits too. Unrelated reference
  // files remain the user's property and are deliberately outside the receipt.
  for (const name of receipt.skills) {
    const prefix = `skills/${name}/`;
    const actualFiles = filesUnder(within(destination, `skills/${name}`));
    const expected = Object.keys(receipt.managedHashes).filter(file => file.startsWith(prefix)).map(file => file.slice(prefix.length)).sort();
    if (JSON.stringify(actualFiles) !== JSON.stringify(expected)) throw new Error(`Previously managed install ${name} has extra or missing files; back up edits and update the source`);
  }
  if (process.platform !== 'win32' && receipt.managedModes) {
    const actualModes = Object.fromEntries(Object.keys(receipt.managedHashes).map(file => [file, fs.statSync(within(destination, file)).mode & 0o111]));
    sameRecord(actualModes, receipt.managedModes, 'Previously managed install executable modes');
  }
  return receipt;
}
export function planInstallation({ source, scope = 'user', project, home = os.homedir(), clients = 'all', profile = 'all', force = false } = {}) {
  source = assertNoSymlinks(path.resolve(source));
  if (!['user', 'project'].includes(scope)) throw new Error('Scope must be user or project');
  if (!['all', 'core', ...ENGINES].includes(profile)) throw new Error(`Unknown profile: ${profile}`);
  if (scope === 'project' && !project) throw new Error('--scope project requires --project');
  const base = path.resolve(scope === 'project' ? project : home);
  directory(base, scope === 'project' ? 'Project' : 'Home');
  const backupsRoot = assertNoSymlinks(within(base, '.matt-gamedev-workflow-backups'));
  if (exists(backupsRoot) && !fs.lstatSync(backupsRoot).isDirectory()) throw new Error(`Backup destination is not a directory: ${backupsRoot}`);
  const selectedClients = normalizeClients(clients);
  const manifest = verifyDistribution({ root: source });
  const selected = manifest.profiles[profile];
  const selectedSet = new Set(selected);
  const managedHashes = Object.fromEntries(Object.entries(manifest.generatedHashes).filter(([file]) =>
    file.startsWith('references/game-workflow/') || (file.startsWith('skills/') && selectedSet.has(file.split('/')[1]))));
  const managedModes = Object.fromEntries(Object.keys(managedHashes).map(file => [file, fs.statSync(within(source, file)).mode & 0o111]));
  const destinations = [];
  for (const folder of [...new Set(selectedClients.map(client => client === 'claude' ? '.claude' : '.agents'))]) {
    const destination = path.join(base, folder);
    if (overlaps(source, destination)) throw new Error(`Source/destination overlap or physical alias: ${destination}`);
    assertNoSymlinks(destination);
    if (exists(destination) && !fs.lstatSync(destination).isDirectory()) throw new Error(`Client destination is not a directory: ${destination}`);
    const receiptFile = within(destination, INSTALL_RECEIPT);
    const previous = exists(receiptFile) ? verifyInstall({ destination }) : null;
    const oldSkills = new Set(previous?.skills ?? []);
    const oldFiles = previous?.managedHashes ?? {};
    const actions = [];
    for (const name of [...new Set([...selected, ...oldSkills])].sort()) {
      const relative = `skills/${name}`;
      const target = within(destination, relative);
      directoryParents(target);
      if (exists(target)) {
        if (fs.lstatSync(target).isDirectory()) filesUnder(target);
        if (!oldSkills.has(name) && !force) throw new Error(`Unknown skill target already exists: ${target}; inspect and use --force to back it up`);
      }
      actions.push({ relative, remove: !selectedSet.has(name) });
    }
    for (const file of [...new Set([...Object.keys(managedHashes), ...Object.keys(oldFiles)])].filter(file => file.startsWith('references/game-workflow/')).sort()) {
      const target = within(destination, file);
      directoryParents(target);
      if (exists(target)) {
        if (fs.lstatSync(target).isDirectory()) filesUnder(target);
        if (!Object.hasOwn(oldFiles, file) && !force) throw new Error(`Unknown reference target already exists: ${target}; inspect and use --force to back it up`);
      }
      actions.push({ relative: file, remove: !Object.hasOwn(managedHashes, file) });
    }
    directoryParents(receiptFile);
    const receipt = { schema: 1, profile, clients: selectedClients.filter(client => (client === 'claude' ? '.claude' : '.agents') === folder), skills: selected, sourceFingerprint: digest(jsonText(manifest)), managedHashes, managedModes };
    destinations.push({ destination, actions, receipt });
  }
  return { source, base, profile, clients: selectedClients, destinations, manifest };
}
// All client destinations are preflighted before any directory or backup is made.
// Staging and backups stay on the destination volume for recoverable renames.
export function installSkills(options = {}) {
  const plan = planInstallation(options);
  if (options.dryRun) return { ...plan, dryRun: true };
  const stage = fs.mkdtempSync(path.join(plan.base, '.matt-gamedev-workflow-stage-'));
  let backup;
  try {
    const replacements = [];
    for (const [index, entry] of plan.destinations.entries()) {
      const staged = within(stage, `client-${index}`);
      fs.mkdirSync(staged, { recursive: true });
      for (const action of entry.actions) {
        if (!action.remove) {
          const from = within(plan.source, action.relative);
          const to = within(staged, action.relative);
          if (action.relative.startsWith('skills/')) copyTree(from, to);
          else copyFile(from, to);
        }
        replacements.push({ source: action.remove ? null : within(staged, action.relative), target: within(entry.destination, action.relative) });
      }
      put(staged, INSTALL_RECEIPT, jsonText(entry.receipt));
      verifyInstall({ destination: staged, receipt: entry.receipt });
      replacements.push({ source: within(staged, INSTALL_RECEIPT), target: within(entry.destination, INSTALL_RECEIPT) });
    }
    // Repeat preflight just before replacing, so edits made while staging are
    // never silently consumed by a stale plan.
    const rechecked = planInstallation(options);
    if (JSON.stringify(rechecked) !== JSON.stringify(plan)) throw new Error('Source or install plan changed while staging; retry with the updated source');
    const backupsRoot = assertNoSymlinks(within(plan.base, '.matt-gamedev-workflow-backups'));
    fs.mkdirSync(backupsRoot, { recursive: true });
    backup = fs.mkdtempSync(path.join(backupsRoot, 'install-'));
    const overwritten = replacements.flatMap(({ target }, index) => exists(target) ? [{ path: target, backup: String(index) }] : []);
    put(backup, 'receipt.json', jsonText({ schema: 1, operation: 'install', profile: plan.profile, source: plan.source, overwritten }));
    replaceWithRollback({ replacements, backup, beforeMove: options.beforeMove, afterReplace: () => {
      for (const entry of plan.destinations) verifyInstall({ destination: entry.destination });
    } });
    return { ...plan, backup, overwritten };
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}
