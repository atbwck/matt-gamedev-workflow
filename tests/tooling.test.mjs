import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildCandidate, publishCandidate, verifyDistribution, syncDistribution, prepareRepositories } from '../lib/distribution.mjs';
import { installSkills, INSTALL_RECEIPT, verifyInstall } from '../lib/installer.mjs';
import { assertNoSymlinks, digest, fileDigest } from '../lib/files.mjs';

const toolingRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// OS temp paths can contain system aliases (notably on macOS). Resolve the
// fixture-owned parent once; production paths must still reject linked parents.
const tempRoot = fs.realpathSync.native(os.tmpdir());
function put(root, file, text) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}
function json(root, file) { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
function fixture(t) {
  const root = fs.mkdtempSync(path.join(tempRoot, 'game-workflow-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const config = {
    schema: 1,
    repositories: {
      matt: { url: 'https://github.com/example/matt', commit: 'a'.repeat(40), branch: 'main', skillsRoot: 'skills', discover: 'recursive', groups: ['engineering', 'productivity'] },
      gamedev: { url: 'https://github.com/example/gamedev', commit: 'b'.repeat(40), branch: 'main', skillsRoot: 'skills', categories: ['unreal', 'unity', 'godot'], skills: ['disciplines/feel'] },
    },
    localSkills: [{ name: 'router', source: 'adapters/router', category: 'core', requires: ['one'] }],
    patches: 'adapters/patches.json', sharedReferences: 'adapters/shared-references', notes: 'adapters/notes',
    dependencies: { one: ['two'] },
  };
  put(root, 'upstreams.json', JSON.stringify(config, null, 2) + '\n');
  for (const [source, name] of [['engineering/one', 'one'], ['productivity/two', 'two'], ['engineering/three', 'three']]) {
    put(root, `upstream/matt/skills/${source}/SKILL.md`, `---\nname: ${name}\ndescription: >-\n  Useful ${name}\n  skill.\n---\n\n# ${name}\n`);
    put(root, `upstream/matt/skills/${source}/assets/data.bin`, Buffer.from([0, 1, 255, 13, 10]));
  }
  put(root, 'upstream/matt/skills/engineering/one/SKILL.md', '---\nname: one\ndescription: First skill.\n---\n\n[Two](../../productivity/two/SKILL.md)\n[Doc](../../../README.md)\n[Resource](assets/data.bin)\n`[example](missing.md)`\n```md\n[example](missing.md)\n```\n');
  put(root, 'upstream/matt/README.md', '# Upstream docs\n');
  put(root, 'upstream/matt/skills/engineering/one/tracker.md', 'Original tracker instructions.\n');
  put(root, 'upstream/matt/skills/productivity/two/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: true\n');
  const twoFile = path.join(root, 'upstream/matt/skills/productivity/two/SKILL.md');
  fs.writeFileSync(twoFile, fs.readFileSync(twoFile, 'utf8').replace('---\n', '---\ndisable-model-invocation: true\n'));
  for (const [group, name] of [['misc', 'excluded-low-use'], ['in-progress', 'excluded-beta']]) {
    put(root, `upstream/matt/skills/${group}/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Excluded source.\n---\n# Not shipped\n`);
  }
  for (const name of ['unreal', 'unity', 'godot']) put(root, `upstream/gamedev/skills/${name}/${name}-basic/SKILL.md`, `---\nname: ${name}-basic\ndescription: Engine skill.\n---\n# Engine\n`);
  put(root, 'upstream/gamedev/skills/disciplines/feel/SKILL.md', '---\nname: feel\ndescription: Feel skill.\n---\n# Feel\n');
  put(root, 'adapters/router/SKILL.md', '---\nname: router\ndescription: Local router.\n---\n[Policy](../../references/game-workflow/game-policy.md)\n');
  put(root, 'adapters/shared-references/game-policy.md', '# Game policy\n');
  put(root, 'adapters/shared-references/licenses/addy-LICENSE', 'Derivative license\n');
  for (const name of ['one', 'two', 'three']) put(root, `adapters/notes/${name}.md`, '# Adaptation\n');
  put(root, 'adapters/patches.json', JSON.stringify([
    { file: 'skills/one/SKILL.md', edits: [{ oldText: 'First skill.', newText: 'Adapted first skill.' }] },
    { file: 'skills/one/tracker.md', edits: [{ oldText: 'Original tracker instructions.', newText: 'Adapted tracker instructions.' }] },
  ]));
  put(root, 'upstream/matt/LICENSE', 'Matt license\n');
  put(root, 'upstream/gamedev/LICENSE', 'Gamedev license\n');
  put(root, 'upstream/gamedev/NOTICE', 'Gamedev notice\n');
  return { root, config };
}

test('fixture temp roots are physical while linked client paths remain forbidden', (t) => {
  const { root } = fixture(t);
  const home = tempHome(t);
  assert.equal(root, fs.realpathSync.native(root));
  assert.equal(home, fs.realpathSync.native(home));
  const linked = path.join(home, 'linked-parent');
  fs.symlinkSync(root, linked, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => assertNoSymlinks(linked), /Symlink/);
  assert.throws(() => assertNoSymlinks(path.join(linked, 'new-client')), /Symlink/);
});

test('candidate retains all promoted Matt skills/resources, excludes low-use/beta, and preserves patches/licenses/profiles', (t) => {
  const { root } = fixture(t);
  const result = buildCandidate({ root });
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
  const inventory = result.manifest;
  assert.deepEqual(inventory.skills.filter(s => s.origin === 'matt').map(s => s.name), ['one', 'three', 'two']);
  for (const name of ['one', 'two', 'three']) {
    for (const profile of Object.values(inventory.profiles)) assert.ok(profile.includes(name));
    assert.deepEqual(fs.readFileSync(path.join(result.candidate, `skills/${name}/assets/data.bin`)), Buffer.from([0, 1, 255, 13, 10]));
  }
  assert.equal(inventory.skills.find(s => s.name === 'three').maturity, 'stable');
  for (const name of ['excluded-low-use', 'excluded-beta']) {
    assert.ok(!inventory.skills.some(skill => skill.name === name));
    assert.ok(!fs.existsSync(path.join(result.candidate, 'skills', name)));
    for (const profile of Object.values(inventory.profiles)) assert.ok(!profile.includes(name));
  }
  assert.equal(inventory.skills.find(s => s.name === 'two').userOnly, true);
  assert.match(fs.readFileSync(path.join(result.candidate, 'skills/two/agents/openai.yaml'), 'utf8'), /allow_implicit_invocation: false/);
  const one = fs.readFileSync(path.join(result.candidate, 'skills/one/SKILL.md'), 'utf8');
  assert.match(one, /Adapted first skill/);
  assert.equal(fs.readFileSync(path.join(result.candidate, 'skills/one/tracker.md'), 'utf8'), 'Adapted tracker instructions.\n');
  assert.match(one, /\.\.\/two\/SKILL\.md/);
  assert.match(one, /github.com\/example\/matt\/blob\/a{40}\/README.md/);
  assert.match(one, /GAME-ADAPTATION.md/);
  assert.match(one, /\.\.\/\.\.\/references\/game-workflow\/game-policy.md/);
  assert.ok(fs.existsSync(path.join(result.candidate, 'references/game-workflow/licenses/addy-LICENSE')));
  assert.ok(fs.existsSync(path.join(result.candidate, 'LICENSES/gamedev-NOTICE')));
  assert.ok(inventory.profiles.unity.includes('feel'));
  assert.ok(!inventory.profiles.core.includes('feel'));
  assert.ok(!inventory.profiles.unity.includes('godot-basic'));
  publishCandidate({ root, ...result });
  assert.equal(verifyDistribution({ root }).skills.length, 8);
});

test('excluded Matt groups never reappear and unsupported group configuration fails closed', (t) => {
  const { root, config } = fixture(t);
  const candidate = buildCandidate({ root });
  assert.ok(candidate.manifest.skills.filter(skill => skill.origin === 'matt').every(skill => ['engineering', 'productivity'].includes(skill.group)));
  config.repositories.matt.groups.push('misc');
  put(root, 'upstreams.json', JSON.stringify(config));
  assert.throws(() => buildCandidate({ root }), /exactly engineering and productivity/);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
});

test('reviewed legacy-group removal verifies original hashes and removes old installed skills with backups', (t) => {
  const { root } = fixture(t);
  publishCandidate({ root, ...buildCandidate({ root }) });
  const home = tempHome(t);
  installSkills({ source: root, home, clients: 'pi' });
  const legacy = json(root, '.distribution.json');
  legacy.skills.find(skill => skill.name === 'three').group = 'in-progress';
  put(root, '.distribution.json', JSON.stringify(legacy));
  fs.mkdirSync(path.join(root, 'upstream/matt/skills/in-progress'), { recursive: true });
  fs.renameSync(path.join(root, 'upstream/matt/skills/engineering/three'), path.join(root, 'upstream/matt/skills/in-progress/three'));
  assert.throws(() => verifyDistribution({ root }), /Excluded Matt group/);
  assert.throws(() => buildCandidate({ root }), /accept-removals/);
  const candidate = buildCandidate({ root, acceptRemovals: true });
  assert.deepEqual(candidate.diff.removedMattSkills, ['three']);
  const original = fs.readFileSync(path.join(root, 'skills/one/SKILL.md'));
  fs.appendFileSync(path.join(root, 'skills/one/SKILL.md'), '\nUser edit\n');
  assert.throws(() => publishCandidate({ root, ...candidate }), /locally modified/);
  fs.writeFileSync(path.join(root, 'skills/one/SKILL.md'), original);
  publishCandidate({ root, ...candidate });
  const installed = installSkills({ source: root, home, clients: 'pi' });
  assert.ok(fs.existsSync(path.join(installed.backup, 'receipt.json')));
  assert.ok(!fs.existsSync(path.join(home, '.agents/skills/three')));
  verifyInstall({ destination: path.join(home, '.agents') });
});

test('published drift blocks regeneration for changed, deleted and extra files', async (t) => {
  for (const kind of ['changed', 'deleted', 'extra']) await t.test(kind, t => {
    const { root } = fixture(t);
    publishCandidate({ root, ...buildCandidate({ root }) });
    const next = buildCandidate({ root });
    const target = path.join(root, 'skills/one/SKILL.md');
    if (kind === 'changed') fs.appendFileSync(target, '\nDirect edit\n');
    if (kind === 'deleted') fs.unlinkSync(target);
    if (kind === 'extra') put(root, 'references/unknown.txt', 'Unknown\n');
    const before = fs.readFileSync(path.join(root, '.distribution.json'));
    assert.throws(() => publishCandidate({ root, ...next }), /modified|missing|extra|unknown/);
    assert.deepEqual(fs.readFileSync(path.join(root, '.distribution.json')), before);
  });
});

test('patch drift preserves published outputs and proposed pins; publication rolls back on write error', (t) => {
  const { root, config } = fixture(t);
  publishCandidate({ root, ...buildCandidate({ root }) });
  const before = fs.readFileSync(path.join(root, '.distribution.json'));
  const configBefore = fs.readFileSync(path.join(root, 'upstreams.json'));
  put(root, 'adapters/patches.json', JSON.stringify([{ file: 'skills/one/SKILL.md', edits: [{ oldText: 'absent text', newText: 'changed' }] }]));
  const updated = structuredClone(config);
  updated.repositories.matt.commit = 'c'.repeat(40);
  assert.throws(() => buildCandidate({ root, config: updated }), /Patch drift/);
  assert.deepEqual(fs.readFileSync(path.join(root, '.distribution.json')), before);
  assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
  put(root, 'adapters/patches.json', '[]\n');
  const next = buildCandidate({ root, config: updated });
  assert.throws(() => publishCandidate({ root, ...next, beforeMove: (_target, index) => { if (index === 2) throw new Error('Simulated write failure'); } }), /previous files restored/);
  assert.deepEqual(fs.readFileSync(path.join(root, '.distribution.json')), before);
  assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
  verifyDistribution({ root, inputs: false });
});

test('installer includes all Matt in engine profiles, preserves unrelated paths and verifies receipts', (t) => {
  const { root } = fixture(t);
  publishCandidate({ root, ...buildCandidate({ root }) });
  const home = fs.mkdtempSync(path.join(tempRoot, 'game-workflow-home-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  put(home, '.agents/skills/unrelated/SKILL.md', 'Keep this\n');
  put(home, '.agents/references/game-workflow/unrelated.md', 'Keep this too\n');
  const result = installSkills({ source: root, home, clients: 'all', profile: 'unity' });
  assert.equal(result.destinations.length, 2);
  for (const client of ['.agents', '.claude']) {
    for (const name of ['one', 'two', 'three', 'unity-basic', 'feel', 'router']) assert.ok(fs.existsSync(path.join(home, client, `skills/${name}/SKILL.md`)));
    assert.equal(fs.existsSync(path.join(home, client, 'skills/godot-basic')), false);
    assert.ok(fs.existsSync(path.join(home, client, 'references/game-workflow/licenses/addy-LICENSE')));
  }
  assert.equal(fs.readFileSync(path.join(home, '.agents/skills/unrelated/SKILL.md'), 'utf8'), 'Keep this\n');
  assert.equal(fs.readFileSync(path.join(home, '.agents/references/game-workflow/unrelated.md'), 'utf8'), 'Keep this too\n');
  installSkills({ source: root, home, clients: 'all', profile: 'core' });
  assert.equal(fs.existsSync(path.join(home, '.agents/skills/unity-basic')), false);
  fs.appendFileSync(path.join(home, '.agents/skills/one/SKILL.md'), '\nMy edit\n');
  assert.throws(() => installSkills({ source: root, home, clients: 'all', force: true }), /modified.*back up|back up.*source/);
});

function tempHome(t) {
  const home = fs.mkdtempSync(path.join(tempRoot, 'game-workflow-client-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}
function copyTooling(root) {
  fs.cpSync(path.join(toolingRoot, 'lib'), path.join(root, 'lib'), { recursive: true });
  for (const file of ['sync-upstreams.mjs', 'install-skills.mjs']) fs.copyFileSync(path.join(toolingRoot, file), path.join(root, file));
}
function cli(root, script, args = []) { return spawnSync(process.execPath, [path.join(root, script), ...args], { encoding: 'utf8', timeout: 20_000 }); }
function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 20_000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function pinFixture(root, config) {
  for (const name of ['matt', 'gamedev']) {
    const cache = path.join(root, 'upstream', name);
    git(cache, ['init', '-q']);
    git(cache, ['config', 'user.name', 'Fixture']);
    git(cache, ['config', 'user.email', 'fixture@example.test']);
    git(cache, ['config', 'core.autocrlf', 'false']);
    git(cache, ['add', '.']);
    git(cache, ['commit', '-qm', 'Fixture']);
    config.repositories[name].commit = git(cache, ['rev-parse', 'HEAD']);
  }
  put(root, 'upstreams.json', JSON.stringify(config, null, 2) + '\n');
}

test('27 promoted Matt skills retain all sibling files and executable scripts in every profile', (t) => {
  const { root } = fixture(t);
  for (let index = 0; index < 24; index++) {
    const name = `extra-${index}`;
    const group = ['engineering', 'productivity'][index % 2];
    put(root, `upstream/matt/skills/${group}/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Extra skill.\n---\n# Extra\n`);
    put(root, `adapters/notes/${name}.md`, '# Reviewed adaptation\n');
    put(root, `upstream/matt/skills/${group}/${name}/scripts/nested/tool.sh`, '#!/bin/sh\necho okay\n');
    fs.chmodSync(path.join(root, `upstream/matt/skills/${group}/${name}/scripts/nested/tool.sh`), 0o755);
  }
  const result = buildCandidate({ root });
  const matt = result.manifest.skills.filter(skill => skill.origin === 'matt');
  assert.equal(matt.length, 27);
  for (const skill of matt) {
    for (const profile of Object.values(result.manifest.profiles)) assert.ok(profile.includes(skill.name));
    for (const file of Object.keys(skill.sourceFiles)) assert.ok(skill.resources.includes(file));
  }
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(result.candidate, 'skills/extra-0/scripts/nested/tool.sh')).mode & 0o111, 0o111);
});

test('profile dependency closure, local collisions and metadata errors fail before publication', async (t) => {
  for (const kind of ['dependency', 'collision', 'empty-description', 'note-collision', 'missing-note', 'broken-link', 'broken-upstream-link']) await t.test(kind, t => {
    const { root, config } = fixture(t);
    if (kind === 'dependency') config.localSkills[0].requires.push('unity-basic');
    if (kind === 'collision') config.localSkills.push({ name: 'one', source: 'adapters/one', category: 'core' });
    if (kind === 'collision') put(root, 'adapters/one/SKILL.md', '---\nname: one\ndescription: Collision.\n---\n');
    if (kind === 'empty-description') put(root, 'adapters/router/SKILL.md', '---\nname: router\ndescription: >\n  \n---\n');
    if (kind === 'note-collision') put(root, 'upstream/matt/skills/engineering/one/GAME-ADAPTATION.md', '# Upstream\n');
    if (kind === 'missing-note') fs.unlinkSync(path.join(root, 'adapters/notes/three.md'));
    if (kind === 'broken-link') fs.appendFileSync(path.join(root, 'adapters/router/SKILL.md'), '\n[Broken](missing.md)\n');
    if (kind === 'broken-upstream-link') fs.appendFileSync(path.join(root, 'upstream/matt/skills/engineering/one/SKILL.md'), '\n[Missing resource](missing-resource.md)\n');
    put(root, 'upstreams.json', JSON.stringify(config));
    assert.throws(() => buildCandidate({ root }), /requires missing|collision|nonempty description|Dangling (?:relative|upstream) link|Missing Matt adaptation review note/);
    assert.equal(fs.existsSync(path.join(root, 'skills')), false);
  });
});

test('config path escapes and symlink sources/outputs are rejected', (t) => {
  const { root, config } = fixture(t);
  config.localSkills[0].source = '../outside';
  put(root, 'upstreams.json', JSON.stringify(config));
  assert.throws(() => buildCandidate({ root }), /path escape|Unsafe relative/);
  config.localSkills[0].source = 'adapters/router';
  put(root, 'upstreams.json', JSON.stringify(config));
  const external = tempHome(t);
  const link = path.join(root, 'adapters', 'linked');
  fs.symlinkSync(external, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => buildCandidate({ root }), /Symlink/);
  fs.unlinkSync(link);
  const result = buildCandidate({ root });
  fs.symlinkSync(external, path.join(root, 'skills'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => publishCandidate({ root, ...result }), /Symlink/);
  assert.deepEqual(fs.readdirSync(external), []);
});

test('source and output CRLF hash as LF, while binary bytes remain significant', (t) => {
  const { root } = fixture(t);
  const first = buildCandidate({ root });
  publishCandidate({ root, ...first });
  for (const file of ['upstreams.json', 'adapters/router/SKILL.md', 'adapters/notes/one.md', 'adapters/shared-references/game-policy.md', 'skills/one/SKILL.md']) {
    const target = path.join(root, file);
    fs.writeFileSync(target, fs.readFileSync(target, 'utf8').replace(/\r?\n/g, '\r\n'));
  }
  verifyDistribution({ root });
  const sourceSkill = path.join(root, 'upstream/matt/skills/engineering/one/SKILL.md');
  fs.writeFileSync(sourceSkill, fs.readFileSync(sourceSkill, 'utf8').replace(/\n/g, '\r\n'));
  const second = buildCandidate({ root });
  assert.deepEqual(second.manifest.generatedHashes, first.manifest.generatedHashes);
  assert.deepEqual(second.manifest.sourceInventory, first.manifest.sourceInventory);
  fs.appendFileSync(path.join(root, 'skills/one/assets/data.bin'), Buffer.from([13, 10]));
  assert.throws(() => verifyDistribution({ root }), /modified/);
});

test('dependency cycles remain intact and proposed pins publish only with the validated candidate', (t) => {
  const { root, config } = fixture(t);
  config.dependencies.two = ['one'];
  put(root, 'upstreams.json', JSON.stringify(config));
  const first = buildCandidate({ root });
  assert.deepEqual(first.manifest.skills.find(skill => skill.name === 'two').dependencies, ['one']);
  publishCandidate({ root, ...first });
  const updated = structuredClone(config);
  updated.repositories.matt.commit = 'c'.repeat(40);
  const next = buildCandidate({ root, config: updated });
  assert.equal(json(root, 'upstreams.json').repositories.matt.commit, 'a'.repeat(40));
  publishCandidate({ root, ...next });
  assert.equal(json(root, 'upstreams.json').repositories.matt.commit, 'c'.repeat(40));
  assert.equal(verifyDistribution({ root }).rawResourceCounts.matt, 8);
});

test('source edits regenerate; previous Matt removals require explicit review option', (t) => {
  const { root } = fixture(t);
  publishCandidate({ root, ...buildCandidate({ root }) });
  put(root, 'adapters/notes/one.md', '# Updated source\n');
  publishCandidate({ root, ...buildCandidate({ root }) });
  verifyDistribution({ root });
  fs.rmSync(path.join(root, 'upstream/matt/skills/engineering/three'), { recursive: true });
  assert.throws(() => buildCandidate({ root }), /accept-removals/);
  const reviewed = buildCandidate({ root, acceptRemovals: true });
  assert.deepEqual(reviewed.diff.removedMattSkills, ['three']);
  publishCandidate({ root, ...reviewed });
  assert.equal(fs.existsSync(path.join(root, 'skills/three')), false);
});

test('installer preflights every client, dry-runs without writes, and force keeps recoverable backups', (t) => {
  const { root } = fixture(t);
  publishCandidate({ root, ...buildCandidate({ root }) });
  const home = tempHome(t);
  put(home, '.agents/skills/one/custom.txt', 'Existing unknown skill\n');
  const before = fs.readdirSync(home);
  assert.throws(() => installSkills({ source: root, home, clients: 'all' }), /Unknown skill target/);
  assert.equal(fs.existsSync(path.join(home, '.claude')), false);
  assert.deepEqual(fs.readdirSync(home), before);
  const dry = installSkills({ source: root, home, force: true, dryRun: true });
  assert.equal(dry.dryRun, true);
  assert.deepEqual(fs.readdirSync(home), before);
  const result = installSkills({ source: root, home, force: true });
  const saved = result.overwritten.find(entry => entry.path.endsWith(path.join('skills', 'one')));
  assert.ok(saved);
  assert.equal(fs.readFileSync(path.join(result.backup, saved.backup, 'custom.txt'), 'utf8'), 'Existing unknown skill\n');
  assert.equal(json(result.backup, 'receipt.json').operation, 'install');
  for (const entry of result.destinations) verifyInstall({ destination: entry.destination });
  assert.ok(fs.existsSync(path.join(home, '.agents', INSTALL_RECEIPT)));
});

test('installer rejects added/missing managed resources and reference edits even with force', async (t) => {
  for (const kind of ['added', 'missing', 'reference']) await t.test(kind, t => {
    const { root } = fixture(t);
    publishCandidate({ root, ...buildCandidate({ root }) });
    const home = tempHome(t);
    installSkills({ source: root, home, clients: 'codex' });
    if (kind === 'added') put(home, '.agents/skills/one/new-resource.md', '# Added\n');
    if (kind === 'missing') fs.unlinkSync(path.join(home, '.agents/skills/one/assets/data.bin'));
    if (kind === 'reference') fs.appendFileSync(path.join(home, '.agents/references/game-workflow/game-policy.md'), 'Edit\n');
    assert.throws(() => installSkills({ source: root, home, clients: 'all', force: true }), /back up|missing managed|modified/);
    assert.equal(fs.existsSync(path.join(home, '.claude')), false);
  });
});

test('installer rejects source overlap and linked parents, and rolls all clients back on failure', (t) => {
  const { root } = fixture(t);
  publishCandidate({ root, ...buildCandidate({ root }) });
  assert.throws(() => installSkills({ source: root, home: root }), /overlap|alias/);
  const home = tempHome(t);
  fs.symlinkSync(root, path.join(home, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => installSkills({ source: root, home, clients: 'codex', force: true }), /overlap|alias|Symlink/);
  fs.unlinkSync(path.join(home, '.agents'));
  installSkills({ source: root, home });
  const before = fs.readFileSync(path.join(home, '.claude', INSTALL_RECEIPT));
  const firstSkill = fs.readFileSync(path.join(home, '.claude/skills/one/SKILL.md'));
  assert.throws(() => installSkills({ source: root, home, profile: 'core', beforeMove: (target) => { if (target.includes(`${path.sep}.agents${path.sep}`)) throw new Error('Write failed'); } }), /previous files restored/);
  assert.deepEqual(fs.readFileSync(path.join(home, '.claude', INSTALL_RECEIPT)), before);
  assert.deepEqual(fs.readFileSync(path.join(home, '.claude/skills/one/SKILL.md')), firstSkill);
  verifyInstall({ destination: path.join(home, '.agents') });
  verifyInstall({ destination: path.join(home, '.claude') });
});

test('real offline CLI builds candidate, applies, checks without cache, installs only into fixture roots and rejects unknown args', (t) => {
  const { root, config } = fixture(t);
  pinFixture(root, config);
  copyTooling(root);
  let result = cli(root, 'sync-upstreams.mjs', ['--offline']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
  result = cli(root, 'sync-upstreams.mjs', ['--offline', '--apply']);
  assert.equal(result.status, 0, result.stderr);
  fs.rmSync(path.join(root, 'upstream'), { recursive: true });
  result = cli(root, 'sync-upstreams.mjs', ['--check']);
  assert.equal(result.status, 0, result.stderr);
  const home = tempHome(t);
  result = cli(root, 'install-skills.mjs', ['--source', root, '--home', home, '--clients', 'all', '--profile', 'godot']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(home, '.agents/skills/godot-basic/SKILL.md')));
  const project = tempHome(t);
  result = cli(root, 'install-skills.mjs', ['--source', root, '--scope', 'project', '--project', project, '--clients', 'pi', '--profile', 'core']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/three/SKILL.md')));
  for (const script of ['sync-upstreams.mjs', 'install-skills.mjs']) {
    result = cli(root, script, ['--typo']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unknown option|unknown/i);
  }
  put(root, 'adapters/unconfigured-input.txt', 'Changed input\n');
  result = cli(root, 'sync-upstreams.mjs', ['--check']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /inputs changed|extra file/i);
});

test('offline sync requires exact HEAD pins and refuses dirty caches; update-pins requires apply', (t) => {
  const { root, config } = fixture(t);
  pinFixture(root, config);
  assert.throws(() => syncDistribution({ root, updatePins: true }), /requires --apply/);
  assert.throws(() => syncDistribution({ root, updatePins: true, apply: true, offline: true }), /requires --apply|network/);
  config.repositories.matt.commit = 'd'.repeat(40);
  put(root, 'upstreams.json', JSON.stringify(config));
  assert.throws(() => syncDistribution({ root, offline: true }), /HEAD pin mismatch/);
  config.repositories.matt.commit = git(path.join(root, 'upstream/matt'), ['rev-parse', 'HEAD']);
  put(root, 'upstreams.json', JSON.stringify(config));
  put(root, 'upstream/matt/skills/engineering/one/untracked.md', 'New file\n');
  assert.throws(() => syncDistribution({ root, offline: true }), /Dirty upstream cache/);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
});

test('offline sync snapshots ignored artifacts locally without altering the cache or shipping them', (t) => {
  const { root, config } = fixture(t);
  put(root, 'upstream/gamedev/.gitignore', '.fixture-cache/\n');
  pinFixture(root, config);
  const artifact = 'upstream/gamedev/skills/disciplines/feel/.fixture-cache/result.txt';
  put(root, artifact, 'Ignored tool output\n');
  const headBefore = git(path.join(root, 'upstream/gamedev'), ['rev-parse', 'HEAD']);
  const result = syncDistribution({ root, offline: true });
  assert.equal(fs.readFileSync(path.join(root, artifact), 'utf8'), 'Ignored tool output\n');
  assert.equal(git(path.join(root, 'upstream/gamedev'), ['rev-parse', 'HEAD']), headBefore);
  assert.equal(result.manifest.skills.find(skill => skill.name === 'feel').resources.includes('.fixture-cache/result.txt'), false);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
});

test('file hashes normalize only explicit text types and keep valid UTF8 binary bytes exact', (t) => {
  const root = tempHome(t);
  const crlf = Buffer.from([1, 2, 13, 10]);
  const lf = Buffer.from([1, 2, 10]);
  for (const extension of ['bin', 'unknown']) {
    put(root, `crlf.${extension}`, crlf);
    put(root, `lf.${extension}`, lf);
    assert.equal(fileDigest(path.join(root, `crlf.${extension}`)), createHash('sha256').update(crlf).digest('hex'));
    assert.notEqual(fileDigest(path.join(root, `crlf.${extension}`)), fileDigest(path.join(root, `lf.${extension}`)));
  }
  for (const [first, second] of [['a.md', 'b.md'], ['a.json', 'b.json'], ['a.sh', 'b.sh'], ['LICENSE', 'gamedev-LICENSE']]) {
    put(root, first, 'Text\r\n');
    put(root, second, 'Text\n');
    assert.equal(fileDigest(path.join(root, first)), fileDigest(path.join(root, second)));
  }
  assert.equal(digest('Text\r\n'), digest('Text\n'));
  assert.notEqual(digest(crlf), digest(lf));
  const executable = path.join(root, 'a.sh');
  const beforeModeChange = fileDigest(executable);
  fs.chmodSync(executable, 0o755);
  assert.equal(fileDigest(executable), beforeModeChange);
});

test('valid UTF8 binary line-ending edits block sync, source installation and managed installation', (t) => {
  const { root } = fixture(t);
  const relative = 'skills/one/assets/data.bin';
  const crlf = Buffer.from([1, 2, 13, 10]);
  const lf = Buffer.from([1, 2, 10]);
  put(root, 'upstream/matt/skills/engineering/one/assets/data.bin', crlf);
  const original = buildCandidate({ root });
  assert.equal(original.manifest.skills.find(skill => skill.name === 'one').sourceFiles['assets/data.bin'], createHash('sha256').update(crlf).digest('hex'));
  publishCandidate({ root, ...original });
  const home = tempHome(t);
  installSkills({ source: root, home, clients: 'codex' });
  const installedSkill = path.join(home, '.agents/skills/one/SKILL.md');
  fs.writeFileSync(installedSkill, fs.readFileSync(installedSkill, 'utf8').replace(/\r?\n/g, '\r\n'));
  verifyInstall({ destination: path.join(home, '.agents') });
  const configBefore = fs.readFileSync(path.join(root, 'upstreams.json'));
  const manifestBefore = fs.readFileSync(path.join(root, '.distribution.json'));
  put(root, relative, lf);
  assert.throws(() => syncDistribution({ root, offline: true, apply: true }), /locally modified.*data\.bin/);
  assert.throws(() => installSkills({ source: root, home: tempHome(t), clients: 'codex' }), /locally modified.*data\.bin/);
  assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
  assert.deepEqual(fs.readFileSync(path.join(root, '.distribution.json')), manifestBefore);
  assert.deepEqual(fs.readFileSync(path.join(root, relative)), lf);
  put(root, relative, crlf);
  verifyDistribution({ root });
  put(home, `.agents/${relative}`, lf);
  assert.throws(() => installSkills({ source: root, home, clients: 'all', force: true }), /locally modified.*data\.bin/);
  assert.equal(fs.existsSync(path.join(home, '.claude')), false);
  assert.deepEqual(fs.readFileSync(path.join(home, `.agents/${relative}`)), lf);
  put(root, 'upstream/matt/skills/engineering/one/assets/data.bin', lf);
  const changed = buildCandidate({ root });
  assert.notEqual(changed.manifest.skills.find(skill => skill.name === 'one').sourceFiles['assets/data.bin'], original.manifest.skills.find(skill => skill.name === 'one').sourceFiles['assets/data.bin']);
});

test('hidden Git index flags cannot publish changed cache bytes under an unchanged pin', async (t) => {
  for (const flag of ['--assume-unchanged', '--skip-worktree']) await t.test(flag, t => {
    const { root, config } = fixture(t);
    pinFixture(root, config);
    publishCandidate({ root, ...buildCandidate({ root }) });
    const published = json(root, '.distribution.json');
    const outputsBefore = Object.fromEntries(Object.keys(published.generatedHashes).map(file => [file, fs.readFileSync(path.join(root, file))]));
    const configBefore = fs.readFileSync(path.join(root, 'upstreams.json'));
    const manifestBefore = fs.readFileSync(path.join(root, '.distribution.json'));
    const cache = path.join(root, 'upstream/matt');
    const resource = 'skills/engineering/one/assets/data.bin';
    git(cache, ['update-index', flag, '--', resource]);
    put(cache, resource, Buffer.from([7, 8, 9, 10]));
    assert.equal(git(cache, ['rev-parse', 'HEAD']), config.repositories.matt.commit);
    assert.equal(git(cache, ['status', '--porcelain', '--untracked-files=all', '--ignored=matching']), '');
    assert.throws(() => syncDistribution({ root, offline: true, apply: true }), /Dirty upstream cache.*hidden index|assume-unchanged|skip-worktree/);
    assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
    assert.deepEqual(fs.readFileSync(path.join(root, '.distribution.json')), manifestBefore);
    for (const [file, before] of Object.entries(outputsBefore)) assert.deepEqual(fs.readFileSync(path.join(root, file)), before, file);
    assert.deepEqual(fs.readFileSync(path.join(cache, resource)), Buffer.from([7, 8, 9, 10]));
  });
});

test('matching clean HEAD builds from a separate pinned Git snapshot instead of the cache worktree', (t) => {
  const { root, config } = fixture(t);
  pinFixture(root, config);
  for (const name of ['matt', 'gamedev']) assert.equal(git(path.join(root, 'upstream', name), ['status', '--porcelain', '--untracked-files=all', '--ignored=matching']), '');
  const configBefore = fs.readFileSync(path.join(root, 'upstreams.json'));
  const prepared = prepareRepositories({ root, config, offline: true });
  for (const name of ['matt', 'gamedev']) assert.notEqual(path.resolve(prepared.sourceRoots[name]), path.resolve(root, 'upstream', name));
  put(root, 'upstream/matt/skills/engineering/one/assets/data.bin', Buffer.from([9, 8, 7]));
  const result = buildCandidate({ root, ...prepared });
  assert.deepEqual(fs.readFileSync(path.join(result.candidate, 'skills/one/assets/data.bin')), Buffer.from([0, 1, 255, 13, 10]));
  assert.equal(result.manifest.repositories.matt.commit, config.repositories.matt.commit);
  assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
});

function commitSymlinkEntries(root, config, links) {
  const cache = path.join(root, 'upstream/matt');
  // Represent link text as ordinary worktree files so this test also works on
  // Windows without filesystem symlink privileges; the pinned modes are real.
  git(cache, ['config', 'core.symlinks', 'false']);
  for (const [file, target] of Object.entries(links)) {
    put(cache, file, target);
    git(cache, ['add', '--', file]);
    const object = git(cache, ['rev-parse', `:${file}`]);
    git(cache, ['update-index', '--cacheinfo', `120000,${object},${file}`]);
  }
  git(cache, ['commit', '-qm', 'Record fixture symlink entries']);
  config.repositories.matt.commit = git(cache, ['rev-parse', 'HEAD']);
  put(root, 'upstreams.json', JSON.stringify(config, null, 2) + '\n');
  assert.equal(git(cache, ['status', '--porcelain', '--untracked-files=all']), '');
}

test('pinned root symlinks are omitted without following targets while normal skills remain complete', (t) => {
  const { root, config } = fixture(t);
  put(root, 'upstream/matt/CLAUDE.md', '# Ordinary upstream instructions\n');
  pinFixture(root, config);
  const external = tempHome(t);
  put(external, 'private.txt', 'External contents must remain untouched\n');
  commitSymlinkEntries(root, config, { 'AGENTS.md': 'CLAUDE.md', 'EXTERNAL.md': path.join(external, 'private.txt') });
  const configBefore = fs.readFileSync(path.join(root, 'upstreams.json'));
  const prepared = prepareRepositories({ root, config, offline: true });
  assert.equal(fs.existsSync(path.join(prepared.sourceRoots.matt, 'AGENTS.md')), false);
  assert.equal(fs.existsSync(path.join(prepared.sourceRoots.matt, 'EXTERNAL.md')), false);
  assert.equal(fs.readFileSync(path.join(prepared.sourceRoots.matt, 'CLAUDE.md'), 'utf8'), '# Ordinary upstream instructions\n');
  const result = buildCandidate({ root, ...prepared });
  assert.deepEqual(result.manifest.skills.filter(skill => skill.origin === 'matt').map(skill => skill.name), ['one', 'three', 'two']);
  assert.equal(result.manifest.rawResourceCounts.matt, 8);
  assert.deepEqual(fs.readFileSync(path.join(result.candidate, 'skills/one/assets/data.bin')), Buffer.from([0, 1, 255, 13, 10]));
  assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
  assert.equal(fs.readFileSync(path.join(external, 'private.txt'), 'utf8'), 'External contents must remain untouched\n');
});

test('pinned symlinks inside the skills root remain forbidden even when their target is a normal retained resource', (t) => {
  const { root, config } = fixture(t);
  pinFixture(root, config);
  const link = 'skills/engineering/one/assets/linked.md';
  commitSymlinkEntries(root, config, { [link]: '../tracker.md' });
  const configBefore = fs.readFileSync(path.join(root, 'upstreams.json'));
  assert.throws(() => syncDistribution({ root, offline: true }), /[Ss]kill.*symlink.*forbidden|[Ss]ymlink.*skills/);
  assert.deepEqual(fs.readFileSync(path.join(root, 'upstreams.json')), configBefore);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
  assert.equal(fs.existsSync(path.join(root, '.distribution.json')), false);
  assert.equal(fs.readFileSync(path.join(root, 'upstream/matt', link), 'utf8'), '../tracker.md');
});

test('pinned submodule entries remain unsupported outside the skills root', (t) => {
  const { root, config } = fixture(t);
  pinFixture(root, config);
  const cache = path.join(root, 'upstream/matt');
  fs.mkdirSync(path.join(cache, 'vendor/module'), { recursive: true });
  git(cache, ['update-index', '--add', '--cacheinfo', `160000,${config.repositories.matt.commit},vendor/module`]);
  git(cache, ['commit', '-qm', 'Record fixture gitlink']);
  config.repositories.matt.commit = git(cache, ['rev-parse', 'HEAD']);
  put(root, 'upstreams.json', JSON.stringify(config, null, 2) + '\n');
  assert.equal(git(cache, ['status', '--porcelain', '--untracked-files=all']), '');
  assert.throws(() => syncDistribution({ root, offline: true }), /Unsupported pinned Git entry.*submodule/);
  assert.equal(fs.existsSync(path.join(root, 'skills')), false);
});

export { fixture, put, json, toolingRoot };

