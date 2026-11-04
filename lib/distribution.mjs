import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertNoSymlinks, copyFile, copyTree, digest, exists, fileDigest, filesUnder, hashesUnder, jsonText, posix, put, readJson, readText, relativePath, replaceWithRollback, sameRecord, within } from './files.mjs';
import { disableInvocation, frontmatter, NAME, rewriteLinks, validateLinks } from './markdown.mjs';

export const ENGINES = ['unreal', 'unity', 'godot'];
export const MATT_GROUPS = ['engineering', 'productivity'];
export const OUTPUT_ROOTS = ['skills', 'references', 'LICENSES'];
const MANIFEST = '.distribution.json';
function requireName(name) { if (!NAME.test(name ?? '')) throw new Error(`Invalid skill name: ${name}`); return name; }
function adapterPath(value) {
  relativePath(value);
  if (!value.startsWith('adapters/')) throw new Error(`Adapter input must be inside adapters/: ${value}`);
  return value;
}
export function validateConfig(config) {
  if (config?.schema !== 1 || !config.repositories || Object.keys(config.repositories).sort().join(',') !== 'gamedev,matt') throw new Error('Expected schema 1 and matt/gamedev repositories');
  for (const [name, repo] of Object.entries(config.repositories)) {
    if (!repo || typeof repo.url !== 'string' || !/^(?:https:\/\/|ssh:\/\/|git@)/.test(repo.url) || /[\r\n\0]/.test(repo.url)) throw new Error(`Invalid repository URL: ${name}`);
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(repo.commit ?? '')) throw new Error(`Repository ${name} requires a full commit pin`);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(repo.branch ?? '') || repo.branch.includes('..') || repo.branch.endsWith('/')) throw new Error(`Invalid branch for ${name}`);
    relativePath(repo.skillsRoot);
  }
  if (config.repositories.matt.discover !== 'recursive') throw new Error('Matt discovery must be recursive');
  const groups = config.repositories.matt.groups;
  if (!Array.isArray(groups) || groups.length !== MATT_GROUPS.length || new Set(groups).size !== groups.length || groups.some(group => !MATT_GROUPS.includes(group))) throw new Error('Matt groups must be exactly engineering and productivity; misc and in-progress are excluded');
  const game = config.repositories.gamedev;
  if (!Array.isArray(game.categories) || new Set(game.categories).size !== game.categories.length || game.categories.some(value => !ENGINES.includes(value))) throw new Error('Invalid gamedev categories');
  if (!Array.isArray(game.skills)) throw new Error('Explicit gamedev skills list required');
  for (const skill of game.skills) relativePath(skill);
  if (!Array.isArray(config.localSkills)) throw new Error('localSkills must be an array');
  const locals = new Set();
  for (const local of config.localSkills) {
    requireName(local.name);
    if (locals.has(local.name)) throw new Error(`Duplicate local skill: ${local.name}`);
    locals.add(local.name);
    adapterPath(local.source);
    if (!['core', ...ENGINES].includes(local.category)) throw new Error(`Invalid local category: ${local.name}`);
    if (local.requires !== undefined && !Array.isArray(local.requires)) throw new Error(`requires must be an array: ${local.name}`);
    for (const name of local.requires ?? []) requireName(name);
  }
  for (const field of ['patches', 'sharedReferences', 'notes']) adapterPath(config[field]);
  if (!config.dependencies || Array.isArray(config.dependencies) || typeof config.dependencies !== 'object') throw new Error('dependencies must be an object');
  for (const [name, dependencies] of Object.entries(config.dependencies)) {
    requireName(name);
    if (!Array.isArray(dependencies)) throw new Error(`Dependencies must be an array: ${name}`);
    dependencies.forEach(requireName);
  }
  return config;
}
export function inputHashes(root, { configText } = {}) {
  assertNoSymlinks(root);
  assertNoSymlinks(within(root, 'upstreams.json'));
  const inputs = { 'upstreams.json': configText === undefined ? fileDigest(within(root, 'upstreams.json')) : digest(configText) };
  for (const file of filesUnder(within(root, 'adapters'))) inputs[`adapters/${file}`] = fileDigest(within(root, `adapters/${file}`));
  return inputs;
}
function managedHashes(root) {
  const result = {};
  for (const base of OUTPUT_ROOTS) for (const [file, hash] of Object.entries(hashesUnder(within(root, base), { optional: true }))) result[`${base}/${file}`] = hash;
  return result;
}
function managedModes(root, hashes) {
  return Object.fromEntries(Object.keys(hashes).map(file => [file, fs.statSync(within(root, file)).mode & 0o111]));
}
export function validateProfiles(manifest, { allowExcludedMattGroups = false } = {}) {
  const skills = new Map(manifest.skills.map(skill => [requireName(skill.name), skill]));
  if (skills.size !== manifest.skills.length) throw new Error('Duplicate inventory skill');
  for (const skill of skills.values()) if (!allowExcludedMattGroups && skill.origin === 'matt' && !MATT_GROUPS.includes(skill.group)) throw new Error(`Excluded Matt group in inventory: ${skill.group}/${skill.name}`);
  for (const profile of ['all', 'core', ...ENGINES]) {
    const names = manifest.profiles?.[profile];
    if (!Array.isArray(names) || new Set(names).size !== names.length) throw new Error(`Invalid profile ${profile}`);
    const selected = new Set(names);
    for (const name of names) {
      const skill = skills.get(name);
      if (!skill) throw new Error(`${profile}: unknown skill ${name}`);
      for (const dependency of skill.dependencies) if (!selected.has(dependency)) throw new Error(`${profile}: ${name} requires missing dependency ${dependency}`);
    }
    for (const skill of skills.values()) {
      if (skill.origin === 'matt' && !selected.has(skill.name)) throw new Error(`${profile}: missing Matt skill ${skill.name}`);
      const wanted = profile === 'all' || skill.origin === 'matt' || skill.group === 'core' || (profile !== 'core' && (skill.group === 'disciplines' || skill.group === profile));
      if (wanted !== selected.has(skill.name)) throw new Error(`${profile}: incorrect membership for ${skill.name}`);
    }
  }
}
function validateManifest(manifest, options) {
  if (manifest?.schema !== 1 || !Array.isArray(manifest.skills) || !manifest.generatedHashes || !manifest.inputHashes) throw new Error('Invalid distribution manifest');
  for (const [file, hash] of Object.entries(manifest.generatedHashes)) {
    relativePath(file);
    if (!OUTPUT_ROOTS.includes(file.split('/')[0]) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid managed file: ${file}`);
  }
  for (const [file, hash] of Object.entries(manifest.inputHashes)) {
    relativePath(file);
    if ((file !== 'upstreams.json' && !file.startsWith('adapters/')) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid input hash: ${file}`);
  }
  validateProfiles(manifest, options);
}
// Offline verification intentionally never reads the upstream cache or calls Git.
export function verifyDistribution({ root, inputs = true, links = true, allowExcludedMattGroups = false } = {}) {
  root = assertNoSymlinks(path.resolve(root));
  const manifest = readJson(within(root, MANIFEST));
  validateManifest(manifest, { allowExcludedMattGroups });
  sameRecord(managedHashes(root), manifest.generatedHashes, 'Published distribution');
  if (process.platform !== 'win32' && manifest.generatedModes) sameRecord(managedModes(root, manifest.generatedHashes), manifest.generatedModes, 'Published executable modes');
  if (inputs) sameRecord(inputHashes(root), manifest.inputHashes, 'Distribution inputs changed; regenerate');
  for (const skill of manifest.skills) {
    const meta = frontmatter(readText(within(root, `skills/${requireName(skill.name)}/SKILL.md`)), skill.name);
    if (meta.fields.name !== skill.name || meta.userOnly !== skill.userOnly) throw new Error(`Inventory metadata mismatch: ${skill.name}`);
    const resources = filesUnder(within(root, `skills/${skill.name}`));
    if (JSON.stringify(resources) !== JSON.stringify(skill.resources)) throw new Error(`Inventory resources mismatch: ${skill.name}`);
  }
  if (links) validateLinks(root);
  return manifest;
}
export function preflightPublished(root) {
  assertNoSymlinks(root);
  // Legacy output may contain now-excluded groups. Verify every original hash
  // before a reviewed removal; new candidates and installations remain strict.
  if (exists(within(root, MANIFEST))) return verifyDistribution({ root, inputs: false, links: false, allowExcludedMattGroups: true });
  if (Object.keys(managedHashes(root)).length) throw new Error('Unmanaged output files exist without .distribution.json; back them up before publishing');
  return null;
}
function discover(root, config, sourceRoots) {
  const entries = [], mappings = new Map(), claimed = new Map();
  function add(origin, sourcePath, group) {
    const repoRoot = sourceRoots[origin];
    const dir = within(repoRoot, sourcePath);
    const meta = frontmatter(readText(within(dir, 'SKILL.md')), `${origin}:${sourcePath}`);
    const name = meta.fields.name;
    if (origin === 'gamedev' && ['router', 'performance-optimization'].includes(name)) throw new Error(`Use local adapter instead of upstream ${name}`);
    const collisionKey = name.toLowerCase();
    if (claimed.has(collisionKey)) throw new Error(`Local/upstream skill collision: ${name} (${claimed.get(collisionKey)}, ${origin}:${sourcePath})`);
    claimed.set(collisionKey, `${origin}:${sourcePath}`);
    const sourceFiles = hashesUnder(dir);
    const maturity = origin === 'matt' && ['misc', 'in-progress'].includes(group) ? group : 'stable';
    const entry = { name, description: meta.fields.description, origin, sourcePath, group, maturity, userOnly: meta.userOnly || maturity !== 'stable', sourceFiles, rawFingerprint: digest(JSON.stringify(sourceFiles)), dependencies: [], resources: [] };
    entries.push(entry);
    mappings.set(dir, `skills/${name}`);
    for (const file of Object.keys(sourceFiles)) {
      mappings.set(within(dir, file), `skills/${name}/${file}`);
      let parent = path.dirname(file);
      while (parent !== '.') { mappings.set(path.join(dir, parent), `skills/${name}/${posix(parent)}`); parent = path.dirname(parent); }
    }
  }
  const mattBase = within(sourceRoots.matt, config.repositories.matt.skillsRoot);
  for (const group of config.repositories.matt.groups) {
    const groupRoot = within(mattBase, group);
    for (const file of filesUnder(groupRoot).filter(file => path.posix.basename(file) === 'SKILL.md')) {
      const rel = path.posix.dirname(file);
      if (rel === '.') throw new Error('Matt skill must have its own directory');
      add('matt', `${config.repositories.matt.skillsRoot}/${group}/${rel}`, group);
    }
  }
  if (!entries.length) throw new Error('No Matt skills discovered');
  const game = config.repositories.gamedev;
  const base = within(sourceRoots.gamedev, game.skillsRoot);
  const selected = new Map();
  for (const category of game.categories) {
    const dir = within(base, category);
    filesUnder(dir);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) if (entry.isDirectory() && exists(path.join(dir, entry.name, 'SKILL.md'))) selected.set(`${category}/${entry.name}`, category);
  }
  for (const skill of game.skills) {
    if (!skill.startsWith('disciplines/')) throw new Error(`Explicit gamedev skill must be a discipline: ${skill}`);
    selected.set(skill, 'disciplines');
  }
  for (const [skill, category] of [...selected].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) add('gamedev', `${game.skillsRoot}/${skill}`, category);
  for (const local of config.localSkills) {
    const dir = within(root, local.source);
    const meta = frontmatter(readText(within(dir, 'SKILL.md')), local.name);
    if (meta.fields.name !== local.name) throw new Error(`Local skill name mismatch: ${local.name}`);
    if (claimed.has(local.name)) throw new Error(`Local/upstream skill collision: ${local.name}`);
    claimed.set(local.name, local.source);
    const sourceFiles = hashesUnder(dir);
    entries.push({ name: local.name, description: meta.fields.description, origin: 'local', sourcePath: local.source, group: local.category, maturity: 'local', userOnly: meta.userOnly, sourceFiles, rawFingerprint: digest(JSON.stringify(sourceFiles)), dependencies: [], resources: [] });
  }
  for (const key of Object.keys(config.dependencies)) if (!claimed.has(key)) throw new Error(`Dependencies declared for unselected skill: ${key}`);
  for (const entry of entries) entry.dependencies = [...new Set([...(config.dependencies[entry.name] ?? []), ...(config.localSkills.find(local => local.name === entry.name)?.requires ?? [])])].sort();
  return { entries: entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0), mappings };
}
function applyPatches(root, candidate, config) {
  const patches = readJson(within(root, config.patches));
  if (!Array.isArray(patches)) throw new Error('Patches must be a JSON array');
  for (const patch of patches) {
    relativePath(patch.file);
    if (!/^skills\/[a-z0-9-]+\/.+$/.test(patch.file) || !Array.isArray(patch.edits)) throw new Error(`Invalid patch target / edits: ${patch.file}`);
    const file = within(candidate, patch.file);
    let text = readText(file);
    for (const edit of patch.edits) {
      const expected = edit.expectedMatches ?? 1;
      const oldText = typeof edit.oldText === 'string' ? edit.oldText.replace(/\r\n/g, '\n') : '';
      if (!oldText || typeof edit.newText !== 'string' || !Number.isInteger(expected) || expected < 1 || text.split(oldText).length - 1 !== expected) throw new Error(`Patch drift in ${patch.file}: expected ${expected} exact match(es); review upstream and update the adapter patch`);
      text = text.split(oldText).join(edit.newText.replace(/\r\n/g, '\n'));
    }
    fs.writeFileSync(file, text);
  }
}
function profilesFor(skills) {
  return Object.fromEntries(['all', 'core', ...ENGINES].map(profile => [profile, skills.filter(skill => profile === 'all' || skill.origin === 'matt' || skill.group === 'core' || (profile !== 'core' && (skill.group === 'disciplines' || skill.group === profile))).map(skill => skill.name)]));
}
function diffHashes(previous, next) {
  return {
    added: Object.keys(next).filter(file => !(file in previous)).sort(),
    removed: Object.keys(previous).filter(file => !(file in next)).sort(),
    changed: Object.keys(next).filter(file => file in previous && previous[file] !== next[file]).sort(),
  };
}
function rejectMattRemovals(previous, skills, acceptRemovals) {
  const names = new Set(skills.filter(skill => skill.origin === 'matt').map(skill => skill.name));
  const removed = (previous?.skills ?? []).filter(skill => skill.origin === 'matt' && !names.has(skill.name)).map(skill => skill.name);
  if (removed.length && !acceptRemovals) throw new Error(`Removed previous Matt skills: ${removed.join(', ')}. Review and use --accept-removals explicitly`);
  return removed;
}
// Offline fixture seam: accepts a supplied repository root map and never calls Git.
export function buildCandidate({ root, config, sourceRoots, acceptRemovals = false } = {}) {
  root = assertNoSymlinks(path.resolve(root));
  const currentInputs = inputHashes(root);
  const diskConfig = readJson(within(root, 'upstreams.json'));
  config = validateConfig(config ?? diskConfig);
  const nextConfigText = JSON.stringify(config) === JSON.stringify(diskConfig) ? undefined : jsonText(config);
  sourceRoots ??= Object.fromEntries(Object.keys(config.repositories).map(name => [name, within(root, `upstream/${name}`)]));
  for (const name of ['matt', 'gamedev']) assertNoSymlinks(sourceRoots[name]);
  const previous = exists(within(root, MANIFEST)) ? readJson(within(root, MANIFEST)) : null;
  const { entries, mappings } = discover(root, config, sourceRoots);
  for (const entry of entries.filter(entry => entry.origin === 'matt')) {
    const note = within(root, `${config.notes}/${entry.name}.md`);
    assertNoSymlinks(note);
    if (!exists(note) || !fs.lstatSync(note).isFile()) throw new Error(`Missing Matt adaptation review note: ${config.notes}/${entry.name}.md; review the newly discovered skill before publishing`);
  }
  const removedMattSkills = rejectMattRemovals(previous, entries, acceptRemovals);
  const buildRoot = assertNoSymlinks(within(root, '.build'));
  fs.mkdirSync(buildRoot, { recursive: true });
  const candidate = fs.mkdtempSync(path.join(buildRoot, 'candidate-'));
  for (const output of OUTPUT_ROOTS) fs.mkdirSync(within(candidate, output));
  for (const entry of entries) {
    const sourceRoot = entry.origin === 'local' ? root : sourceRoots[entry.origin];
    const source = within(sourceRoot, entry.sourcePath);
    copyTree(source, within(candidate, `skills/${entry.name}`));
  }
  // Match patches against raw source text before automatic link adaptation.
  applyPatches(root, candidate, config);
  for (const entry of entries) {
    const sourceRoot = entry.origin === 'local' ? root : sourceRoots[entry.origin];
    const source = within(sourceRoot, entry.sourcePath);
    if (entry.origin !== 'local') {
      for (const file of Object.keys(entry.sourceFiles).filter(file => /\.md$/i.test(file))) {
        const outputFile = `skills/${entry.name}/${file}`;
        const rewritten = rewriteLinks(readText(within(candidate, outputFile)), { sourceFile: within(source, file), outputFile, sourceRoot, repository: config.repositories[entry.origin], mapping: mappings });
        fs.writeFileSync(within(candidate, outputFile), rewritten);
      }
    }
  }
  copyTree(within(root, config.sharedReferences), within(candidate, 'references/game-workflow'));
  for (const [origin, files] of [['matt', ['LICENSE']], ['gamedev', ['LICENSE', 'NOTICE']]]) {
    for (const file of files) {
      const source = within(sourceRoots[origin], file);
      const licenseName = `${origin}-${file}`;
      copyFile(source, within(candidate, `LICENSES/${licenseName}`));
      const reference = within(candidate, `references/game-workflow/licenses/${licenseName}`);
      if (exists(reference)) throw new Error(`Shared license collision: ${licenseName}`);
      copyFile(source, reference);
    }
  }
  for (const entry of entries) {
    const skillFile = within(candidate, `skills/${entry.name}/SKILL.md`);
    let text = readText(skillFile);
    if (entry.origin !== 'local') {
      const note = within(root, `${config.notes}/${entry.name}.md`);
      let notice = '\n> Local modification: game workflow policy and link adaptation applied; upstream license retained. Read [game policy](../../references/game-workflow/game-policy.md).';
      if (exists(note)) {
        const destination = within(candidate, `skills/${entry.name}/GAME-ADAPTATION.md`);
        if (exists(destination)) throw new Error(`Upstream GAME-ADAPTATION.md collision: ${entry.name}`);
        copyFile(note, destination);
        notice += ' Read [game adaptation notes](GAME-ADAPTATION.md).';
      }
      if (entry.origin === 'matt' && ['misc', 'in-progress'].includes(entry.maturity)) text = disableInvocation(text);
      const meta = frontmatter(text, entry.name);
      text = text.slice(0, meta.end) + notice + '\n\n' + text.slice(meta.end);
    }
    const meta = frontmatter(text, entry.name);
    if (meta.fields.name !== entry.name) throw new Error(`Patch changed skill name: ${entry.name}`);
    if (entry.userOnly && !meta.userOnly) throw new Error(`Patch enabled user-only skill: ${entry.name}`);
    entry.userOnly = meta.userOnly;
    entry.description = meta.fields.description;
    fs.writeFileSync(skillFile, text);
    const openai = within(candidate, `skills/${entry.name}/agents/openai.yaml`);
    if (entry.userOnly && exists(openai)) fs.writeFileSync(openai, readText(openai).replace(/^(\s*allow_implicit_invocation:\s*)true\b/gm, '$1false'));
    entry.resources = filesUnder(within(candidate, `skills/${entry.name}`));
    for (const file of Object.keys(entry.sourceFiles)) if (!entry.resources.includes(file)) throw new Error(`Lost raw source resource: ${entry.name}/${file}`);
    sameRecord(hashesUnder(within(entry.origin === 'local' ? root : sourceRoots[entry.origin], entry.sourcePath)), entry.sourceFiles, 'Source changed while building');
  }
  sameRecord(inputHashes(root), currentInputs, 'Inputs changed while building');
  const generatedHashes = managedHashes(candidate);
  const manifest = {
    schema: 1, repositories: config.repositories, skills: entries,
    sourceInventory: Object.fromEntries(['matt', 'gamedev', 'local'].map(origin => [origin, entries.filter(entry => entry.origin === origin).map(({ name, sourcePath, sourceFiles, rawFingerprint }) => ({ name, sourcePath, sourceFiles, rawFingerprint }))])),
    rawResourceCounts: Object.fromEntries(['matt', 'gamedev', 'local'].map(origin => [origin, entries.filter(entry => entry.origin === origin).reduce((count, entry) => count + Object.keys(entry.sourceFiles).length, 0)])),
    profiles: profilesFor(entries), inputHashes: inputHashes(root, { configText: nextConfigText }),
    generatedHashes, generatedModes: managedModes(candidate, generatedHashes),
  };
  validateManifest(manifest);
  validateLinks(candidate);
  for (const names of Object.values(manifest.profiles)) validateLinks(candidate, { selectedSkills: names });
  put(candidate, MANIFEST, jsonText(manifest));
  const diff = { ...diffHashes(previous?.generatedHashes ?? {}, generatedHashes), removedMattSkills };
  put(candidate, 'diff.json', jsonText(diff));
  if (nextConfigText) put(candidate, 'next-upstreams.json', nextConfigText);
  return { candidate, manifest, diff, currentInputs, nextConfigText, acceptRemovals };
}
export function publishCandidate({ root, candidate, manifest, currentInputs, nextConfigText, acceptRemovals = false, beforeMove } = {}) {
  root = assertNoSymlinks(path.resolve(root));
  assertNoSymlinks(candidate);
  if (!path.resolve(candidate).startsWith(path.resolve(root, '.build') + path.sep)) throw new Error('Candidate must be under distribution .build/');
  const previous = preflightPublished(root);
  const candidateManifest = verifyDistribution({ root: candidate, inputs: false });
  if (manifest && JSON.stringify(candidateManifest) !== JSON.stringify(manifest)) throw new Error('Candidate manifest changed');
  manifest = candidateManifest;
  rejectMattRemovals(previous, manifest.skills, acceptRemovals);
  sameRecord(inputHashes(root), currentInputs ?? manifest.inputHashes, 'Inputs changed since candidate build');
  const expectedInputs = inputHashes(root, { configText: nextConfigText });
  sameRecord(expectedInputs, manifest.inputHashes, 'Candidate inputs');
  for (const names of Object.values(manifest.profiles)) validateLinks(candidate, { selectedSkills: names });
  if (JSON.stringify(preflightPublished(root)) !== JSON.stringify(previous)) throw new Error('Published distribution changed during preflight; retry');
  const backup = fs.mkdtempSync(path.join(root, '.build', 'publish-backup-'));
  const replacements = [...OUTPUT_ROOTS, MANIFEST].map(file => ({ source: within(candidate, file), target: within(root, file) }));
  if (nextConfigText) {
    put(candidate, 'next-upstreams.json', nextConfigText);
    replacements.push({ source: within(candidate, 'next-upstreams.json'), target: within(root, 'upstreams.json') });
  }
  put(backup, 'receipt.json', jsonText({ schema: 1, operation: 'publish', paths: replacements.map(({ target }, index) => ({ path: target, backup: String(index), existed: exists(target) })) }));
  replaceWithRollback({ replacements, backup, beforeMove, afterReplace: () => verifyDistribution({ root }) });
  return { manifest, backup };
}
function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.error?.message ?? result.stderr.trim()}`);
  return result.stdout.trim();
}
function materializePinnedTree(cache, pin, destination, skillsRoot) {
  // Read raw blobs, rather than a checkout: filters, CRLF settings and the cache
  // worktree cannot alter bytes attributed to this pin. Git replacements are off.
  const records = git(['--no-replace-objects', 'ls-tree', '-r', '-z', '--full-tree', pin], cache).split('\0').filter(Boolean);
  const files = records.flatMap(record => {
    const match = record.match(/^(\d+) (blob|commit) ([a-f0-9]+)\t([\s\S]+)$/);
    if (!match) throw new Error(`Unsupported pinned Git entry: ${record}`);
    const [, mode, type, object, rawPath] = match;
    const file = relativePath(rawPath);
    if (mode === '120000' && type === 'blob') {
      if (file === skillsRoot || file.startsWith(`${skillsRoot}/`) || skillsRoot.startsWith(`${file}/`)) throw new Error(`Pinned skill resource symlink forbidden: ${file}`);
      // Root instructions and other out-of-package symlinks are not distributed.
      // Omit them without reading or following their targets.
      return [];
    }
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) throw new Error(`Unsupported pinned Git entry (submodule or mode): ${record}`);
    return [{ mode: mode === '100755' ? 0o755 : 0o644, object, file }];
  });
  if (!files.length) throw new Error(`Pinned Git tree is empty: ${pin}`);
  const result = spawnSync('git', ['--no-replace-objects', 'cat-file', '--batch'], {
    cwd: cache, input: files.map(file => file.object + '\n').join(''), windowsHide: true, maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(`Cannot read pinned Git blobs: ${result.error?.message ?? result.stderr.toString('utf8').trim()}`);
  let offset = 0;
  for (const file of files) {
    const end = result.stdout.indexOf(10, offset);
    const header = result.stdout.subarray(offset, end).toString('ascii').match(/^([a-f0-9]+) blob (\d+)$/);
    const size = Number(header?.[2]);
    if (end < 0 || header?.[1] !== file.object || !Number.isSafeInteger(size) || size < 0 || end + 1 + size >= result.stdout.length || result.stdout[end + 1 + size] !== 10) throw new Error(`Invalid pinned Git blob response for ${file.file}`);
    put(destination, file.file, result.stdout.subarray(end + 1, end + 1 + size), file.mode);
    offset = end + size + 2;
  }
  if (offset !== result.stdout.length) throw new Error('Unexpected trailing pinned Git blob data');
}
export function prepareRepositories({ root, config, offline = false, updatePins = false } = {}) {
  const next = structuredClone(config), sourceRoots = {};
  for (const [name, repo] of Object.entries(next.repositories)) {
    const cache = assertNoSymlinks(within(root, `upstream/${name}`));
    if (!exists(cache)) {
      if (offline) throw new Error(`Offline cache missing: ${name}`);
      fs.mkdirSync(path.dirname(cache), { recursive: true });
      git(['clone', '--no-checkout', '--', repo.url, cache], root);
      git(['checkout', '--detach', repo.commit], cache);
    }
    const top = fs.realpathSync.native(git(['rev-parse', '--show-toplevel'], cache));
    const physicalCache = fs.realpathSync.native(cache);
    const canonical = value => process.platform === 'win32' ? value.toLowerCase() : value;
    if (canonical(top) !== canonical(physicalCache)) throw new Error(`Cache is not a repository root: ${cache}`);
    // Status deliberately trusts these index flags, so reject them without
    // clearing flags or changing the user's index, even if the flagged file is clean.
    const hidden = git(['ls-files', '-v', '-z'], cache).split('\0').find(record => /^[a-zS] /.test(record));
    if (hidden) throw new Error(`Dirty upstream cache ${name}: hidden index flags (assume-unchanged or skip-worktree) on ${hidden.slice(2)}; preserve edits and clear the flags before syncing`);
    if (git(['status', '--porcelain', '--untracked-files=all'], cache)) throw new Error(`Dirty upstream cache ${name}; preserve changes before syncing`);
    const head = git(['rev-parse', 'HEAD'], cache);
    if (updatePins) {
      const answer = git(['ls-remote', '--exit-code', repo.url, `refs/heads/${repo.branch}`], root);
      const pin = answer.split(/\s+/)[0];
      if (!/^[a-f0-9]{40,64}$/i.test(pin)) throw new Error(`Cannot resolve branch ${name}:${repo.branch}`);
      repo.commit = pin;
    }
    if (offline && head !== repo.commit) throw new Error(`Offline HEAD pin mismatch for ${name}: expected ${repo.commit}, got ${head}`);
    if (head !== repo.commit) git(['fetch', '--no-tags', repo.url, repo.commit], cache);
    const buildRoot = assertNoSymlinks(within(root, '.build'));
    fs.mkdirSync(buildRoot, { recursive: true });
    const snapshot = fs.mkdtempSync(path.join(buildRoot, `source-${name}-`));
    materializePinnedTree(cache, repo.commit, snapshot, repo.skillsRoot);
    sourceRoots[name] = snapshot;
  }
  return { config: next, sourceRoots };
}
export function syncDistribution({ root, apply = false, check = false, offline = false, updatePins = false, acceptRemovals = false } = {}) {
  root = assertNoSymlinks(path.resolve(root));
  if (check && (apply || updatePins || acceptRemovals)) throw new Error('--check cannot be combined with mutation options');
  if (updatePins && (!apply || offline)) throw new Error('--update-pins requires --apply and network access');
  if (check) return { manifest: verifyDistribution({ root }), checked: true };
  if (apply) preflightPublished(root);
  const config = validateConfig(readJson(within(root, 'upstreams.json')));
  const prepared = prepareRepositories({ root, config, offline, updatePins });
  const result = buildCandidate({ root, ...prepared, acceptRemovals });
  if (apply) return { ...result, ...publishCandidate({ root, ...result }), applied: true };
  return result;
}
