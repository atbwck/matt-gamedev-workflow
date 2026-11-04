import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyDistribution } from '../lib/distribution.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const text = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const inventory = () => verifyDistribution({ root });

test('the reviewed complete Matt identity and every original sibling resource survive publication', () => {
  const expected = JSON.parse(text('tests/fixtures/matt-retention.json'));
  const published = inventory();
  const actual = published.skills.filter(skill => skill.origin === 'matt');
  assert.deepEqual(actual.map(skill => skill.name).sort(), expected.skills.map(skill => skill.name).sort());
  for (const original of expected.skills) {
    const skill = actual.find(skill => skill.name === original.name);
    assert.equal(skill.sourcePath, original.sourcePath);
    assert.deepEqual(Object.keys(skill.sourceFiles).sort(), original.files);
    for (const file of original.files) {
      assert.ok(skill.resources.includes(file), `${skill.name} lost ${file}`);
      assert.ok(fs.statSync(path.join(root, 'skills', skill.name, file)).isFile());
    }
    assert.ok(skill.resources.includes('GAME-ADAPTATION.md'), `${skill.name} has no game adaptation`);
  }
});

test('every install profile retains all Matt skills and their required collaborators', () => {
  const manifest = inventory();
  const matt = manifest.skills.filter(skill => skill.origin === 'matt').map(skill => skill.name);
  for (const [profile, names] of Object.entries(manifest.profiles)) {
    for (const name of matt) assert.ok(names.includes(name), `${profile} lost ${name}`);
    for (const name of names) {
      for (const required of manifest.skills.find(skill => skill.name === name).dependencies) {
        assert.ok(names.includes(required), `${profile}: ${name} cannot load ${required}`);
      }
    }
  }
});

test('the two required design entries preserve interview composition and decision-map boundaries', () => {
  const grill = text('skills/grill-with-docs/SKILL.md');
  assert.match(grill, /grilling/);
  assert.match(grill, /domain-modeling/);
  const way = text('skills/wayfinder/SKILL.md');
  assert.match(way, /planning\*\* by default/);
  assert.match(way, /never resolve more than one ticket per session/);
  assert.match(way, /exception of research tickets/);
  assert.match(way, /Not yet specified/);
  assert.match(way, /Out of scope/);
  assert.match(way, /does not authorize a push/);
  for (const name of ['grill-with-docs', 'wayfinder']) {
    assert.match(text(`skills/${name}/SKILL.md`), /disable-model-invocation: true/);
    assert.match(text(`skills/${name}/agents/openai.yaml`), /allow_implicit_invocation: false/);
  }
});

test('Matt TDD semantics remain explicit and low-use/beta skills are absent from outputs and every profile', () => {
  assert.match(text('skills/tdd/SKILL.md'), /Refactoring is not part of the loop/);
  const manifest = inventory();
  const matt = manifest.skills.filter(skill => skill.origin === 'matt');
  assert.equal(matt.length, 27);
  assert.ok(matt.every(skill => ['engineering', 'productivity'].includes(skill.group)));
  const removed = ['git-guardrails-claude-code', 'migrate-to-shoehorn', 'scaffold-exercises', 'setup-pre-commit', 'chief-of-staff', 'claude-handoff', 'loop-me', 'setup-ts-deep-modules', 'software-factory', 'writing-beats', 'writing-fragments', 'writing-shape'];
  for (const name of removed) {
    assert.ok(!fs.existsSync(path.join(root, 'skills', name)), `excluded skill remains: ${name}`);
    assert.ok(!fs.existsSync(path.join(root, 'adapters/notes', name + '.md')));
    for (const names of Object.values(manifest.profiles)) assert.ok(!names.includes(name));
  }
});

test('short entries resolve actual retained workflows without replacing native review or plan commands', () => {
  const manifest = inventory();
  for (const [alias, target] of Object.entries({ spec: 'to-spec', 'game-plan': 'to-tickets', build: 'implement', debug: 'diagnosing-bugs', 'game-review': 'code-review', perf: 'performance-optimization', constraints: 'constraint-driven-development' })) {
    const skill = manifest.skills.find(skill => skill.name === alias);
    assert.equal(skill.origin, 'local');
    assert.equal(skill.userOnly, true);
    assert.ok(skill.dependencies.includes(target));
    assert.ok(manifest.skills.some(candidate => candidate.name === target));
  }
  assert.ok(manifest.skills.some(skill => skill.name === 'test'));
  assert.ok(!manifest.skills.some(skill => ['review', 'plan'].includes(skill.name)));
});

test('game-layer runtime coverage is native and the performance entry remains unique', () => {
  const manifest = inventory();
  assert.equal(manifest.skills.filter(skill => skill.name === 'performance-optimization').length, 1);
  assert.equal(manifest.skills.find(skill => skill.name === 'performance-optimization').origin, 'local');
  for (const name of ['security-and-hardening', 'observability-and-instrumentation', 'ci-cd-and-automation', 'performance-optimization']) {
    const body = text(`skills/${name}/SKILL.md`);
    assert.match(body, /Unreal|Unity|Godot/);
    assert.doesNotMatch(body, /\b(?:LCP|INP|CLS|CORS|OpenTelemetry|Vercel|Netlify)\b/);
  }
  for (const engine of ['unreal', 'unity', 'godot']) {
    for (const suffix of ['testing', 'runtime-safety']) assert.ok(manifest.profiles[engine].includes(`${engine}-${suffix}`));
  }
  assert.match(text('skills/unreal-blueprints/SKILL.md'), /spawned during play/);
  assert.doesNotMatch(text('skills/unreal-cpp-gameplay/SKILL.md'), /Automation RunTest MyGame;Quit/);
});

test('Matt working phases route into the selected engine knowledge instead of only describing it', () => {
  const routing = [
    ['code-review', /router/], ['code-review', /\*-testing/], ['code-review', /\*-runtime-safety/],
    ['tdd', /\*-testing/], ['tdd', /\*-runtime-safety/],
    ['diagnosing-bugs', /\*-testing/], ['diagnosing-bugs', /\*-runtime-safety/], ['diagnosing-bugs', /performance-optimization/],
    ['ask-matt', /router/],
  ];
  for (const [name, pattern] of routing) {
    assert.match(text(`skills/${name}/GAME-ADAPTATION.md`), pattern, `${name} does not route into engine knowledge`);
  }
  const review = text('skills/code-review/SKILL.md');
  assert.match(review, /3a\. Resolve the game review context/);
  assert.match(review, /load `router`/);
  assert.match(review, /Engine review packet/);
  assert.match(review, /Standards reviewer, which must read those skill files/);
  assert.match(review, /unreal-cpp-gameplay/);
  assert.match(review, /unity-csharp-scripting/);
  assert.match(review, /godot-nodes-scenes/);
  const manifest = inventory();
  for (const name of ['code-review', 'tdd', 'diagnosing-bugs', 'implement', 'ask-matt']) assert.ok(manifest.skills.find(skill => skill.name === name).dependencies.includes('router'));
  const policy = text('references/game-workflow/game-policy.md');
  assert.match(policy, /Cross-wiring/);
  assert.match(policy, /not only to the coordinator entry/);
  assert.match(policy, /is not a Standards pass/);
  // The router must itself stay a selector, not become the phase owner.
  assert.match(text('skills/router/SKILL.md'), /does not own Matt's engineering phase transitions/);
});

test('installed shared resources carry all third-party notices and runtime limits', () => {
  for (const file of ['matt-LICENSE', 'gamedev-LICENSE', 'gamedev-NOTICE', 'addy-MIT.txt']) {
    const body = text(`references/game-workflow/licenses/${file}`);
    assert.ok(body.trim().length > 80, `${file} is missing or empty`);
  }
  assert.match(text('references/game-workflow/game-policy.md'), /Headless is not GPU evidence/i);
});
