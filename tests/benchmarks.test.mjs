import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../adapters/performance-optimization/scripts/compare-benchmarks.mjs', import.meta.url));

function benchmark(overrides = {}) {
  return {
    schemaVersion: 1,
    scenarioId: 'synthetic-arena',
    environment: {
      hardware: 'Synthetic target; CPU A; GPU B; 16 GiB RAM',
      engineVersion: 'Synthetic engine 1.0.0',
      buildConfiguration: 'Shipping',
      renderingBackend: 'Vulkan',
      resolution: '1920x1080',
      quality: 'High',
      cacheState: 'warm',
      extra: { os: 'Synthetic OS', flags: ['fixed-seed', 'vsync-off'] },
    },
    metrics: {
      frameTime: {
        unit: 'ms', direction: 'lower', samples: [10, 8, 12],
        statistic: 'median', maxRegressionPercent: 5, absoluteLimit: 12,
      },
    },
    ...overrides,
  };
}

function pair(metricOverrides = {}) {
  const baseline = benchmark();
  Object.assign(baseline.metrics.frameTime, metricOverrides);
  return [baseline, structuredClone(baseline)];
}

function cli(t, baseline, candidate, { baselineText, candidateText, args } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'benchmark-contract-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const baselineFile = path.join(root, 'baseline.json');
  const candidateFile = path.join(root, 'candidate.json');
  fs.writeFileSync(baselineFile, baselineText ?? JSON.stringify(baseline));
  fs.writeFileSync(candidateFile, candidateText ?? JSON.stringify(candidate));
  const before = [fs.readFileSync(baselineFile), fs.readFileSync(candidateFile)];
  const result = spawnSync(process.execPath, [script, ...(args ?? [baselineFile, candidateFile])], {
    encoding: 'utf8', timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.stderr, '', 'CLI must not print parser excerpts, paths, or stack traces');
  assert.deepEqual(fs.readFileSync(baselineFile), before[0]);
  assert.deepEqual(fs.readFileSync(candidateFile), before[1]);
  assert.deepEqual(fs.readdirSync(root).sort(), ['baseline.json', 'candidate.json']);
  assert.equal(result.stdout.trim().split('\n').length, 1, 'one compact JSON record');
  return { ...result, report: JSON.parse(result.stdout) };
}

function invalid(t, baseline, candidate, expectedPath) {
  const result = cli(t, baseline, candidate);
  assert.equal(result.status, 2);
  assert.equal(result.report.status, 'invalid');
  assert.deepEqual(result.report.summary, {});
  if (expectedPath) assert.equal(result.report.error.path, expectedPath);
  return result;
}

test('CLI passes with explicit budgets and reports independent metric values', (t) => {
  const [baseline, candidate] = pair();
  baseline.metrics.gpuTime = { ...baseline.metrics.frameTime, samples: [7], absoluteLimit: 9 };
  candidate.metrics.gpuTime = structuredClone(baseline.metrics.gpuTime);
  candidate.metrics.frameTime.samples = [10.5];
  const result = cli(t, baseline, candidate);
  assert.equal(result.status, 0);
  assert.equal(result.report.status, 'passed');
  assert.deepEqual(Object.keys(result.report.summary).sort(), ['frameTime', 'gpuTime']);
  const frame = result.report.summary.frameTime;
  assert.equal(frame.baselineValue, 10);
  assert.equal(frame.candidateValue, 10.5);
  assert.equal(frame.regressionPercent, 5);
  assert.deepEqual(frame.budget, { maxRegressionPercent: 5, absoluteLimit: 12 });
  assert.equal(frame.passed, true);
  assert.equal(result.report.summary.gpuTime.candidateValue, 7);
  assert.equal(JSON.stringify(result.report).includes('Synthetic target'), false);
});

for (const [direction, candidateValue, percent] of [['lower', 11, 10], ['higher', 9, 10]]) {
  test(`${direction} regression fails with exit 1`, (t) => {
    const [baseline, candidate] = pair({ direction });
    delete baseline.metrics.frameTime.absoluteLimit;
    delete candidate.metrics.frameTime.absoluteLimit;
    candidate.metrics.frameTime.samples = [candidateValue];
    const result = cli(t, baseline, candidate);
    assert.equal(result.status, 1);
    assert.equal(result.report.status, 'failed');
    assert.equal(result.report.summary.frameTime.regressionPercent, percent);
    assert.equal(result.report.summary.frameTime.regressionPassed, false);
    assert.equal(result.report.summary.frameTime.passed, false);
  });
}

for (const [direction, limit, value, passed] of [
  ['lower', 11, 11, true], ['lower', 11, 12, false],
  ['higher', 9, 9, true], ['higher', 9, 8, false],
]) {
  test(`${direction} absolute limit ${limit} with value ${value} is ${passed}`, (t) => {
    const [baseline, candidate] = pair({ direction, absoluteLimit: limit, maxRegressionPercent: 100 });
    candidate.metrics.frameTime.samples = [value];
    const result = cli(t, baseline, candidate);
    assert.equal(result.status, passed ? 0 : 1);
    assert.equal(result.report.summary.frameTime.absolutePassed, passed);
  });
}

test('candidate must meet the absolute limit even when improving an over-limit baseline', (t) => {
  const [baseline, candidate] = pair({ samples: [20], absoluteLimit: 12 });
  candidate.metrics.frameTime.samples = [15];
  const result = cli(t, baseline, candidate);
  assert.equal(result.status, 1);
  assert.equal(result.report.summary.frameTime.regressionPassed, true);
  assert.equal(result.report.summary.frameTime.absolutePassed, false);
});

for (const [field, value] of [
  ['unit', 's'], ['direction', 'higher'], ['statistic', 'p95'],
  ['maxRegressionPercent', 6], ['maxRegressionPercent', 4],
  ['absoluteLimit', 13], ['absoluteLimit', 11],
]) {
  test(`rejects candidate change to ${field}=${value}`, (t) => {
    const [baseline, candidate] = pair();
    candidate.metrics.frameTime[field] = value;
    invalid(t, baseline, candidate, `/candidate/metrics/frameTime/${field}`);
  });
}

test('rejects removing or adding an absolute limit', (t) => {
  const [baseline, candidate] = pair();
  delete candidate.metrics.frameTime.absoluteLimit;
  invalid(t, baseline, candidate, '/candidate/metrics/frameTime/absoluteLimit');
  candidate.metrics.frameTime.absoluteLimit = 12;
  delete baseline.metrics.frameTime.absoluteLimit;
  invalid(t, baseline, candidate, '/candidate/metrics/frameTime/absoluteLimit');
});

test('rejects missing and new candidate metrics', (t) => {
  const [baseline, candidate] = pair();
  delete candidate.metrics.frameTime;
  candidate.metrics.other = structuredClone(baseline.metrics.frameTime);
  invalid(t, baseline, candidate, '/candidate/metrics/frameTime');
  candidate.metrics.frameTime = structuredClone(baseline.metrics.frameTime);
  invalid(t, baseline, candidate, '/candidate/metrics/other');
});

test('environment equality ignores nested object key order but preserves array order', (t) => {
  const [baseline, candidate] = pair();
  candidate.environment = Object.fromEntries(Object.entries(candidate.environment).reverse());
  candidate.environment.extra = { flags: ['fixed-seed', 'vsync-off'], os: 'Synthetic OS' };
  assert.equal(cli(t, baseline, candidate).status, 0);
  candidate.environment.extra.flags.reverse();
  invalid(t, baseline, candidate, '/candidate/environment/extra/flags/0');
});

test('environment drift, removed and added fields fail without echoing secret values', (t) => {
  const [baseline, candidate] = pair();
  baseline.environment.extra.privateLabel = 'baseline-secret-value';
  candidate.environment.extra.privateLabel = 'candidate-secret-value';
  const result = invalid(t, baseline, candidate, '/candidate/environment/extra/privateLabel');
  assert.doesNotMatch(result.stdout, /baseline-secret-value|candidate-secret-value|Synthetic target/);
  delete baseline.environment.extra.privateLabel;
  invalid(t, baseline, candidate, '/candidate/environment/extra/privateLabel');
  delete candidate.environment.extra.privateLabel;
  delete candidate.environment.extra.os;
  invalid(t, baseline, candidate, '/candidate/environment/extra/os');
});

test('rejects a changed scenario', (t) => {
  const [baseline, candidate] = pair();
  candidate.scenarioId = 'another-scenario';
  invalid(t, baseline, candidate, '/candidate/scenarioId');
});

for (const [label, mutate] of [
  ['missing schema', (b) => { delete b.schemaVersion; }],
  ['unknown schema', (b) => { b.schemaVersion = 2; }],
  ['string schema', (b) => { b.schemaVersion = '1'; }],
  ['extra root field', (b) => { b.unreviewed = true; }],
  ['empty scenario', (b) => { b.scenarioId = ' '; }],
  ['missing environment', (b) => { delete b.environment; }],
  ['empty environment', (b) => { b.environment = {}; }],
  ['array environment', (b) => { b.environment = []; }],
  ['missing metrics', (b) => { delete b.metrics; }],
  ['empty metrics', (b) => { b.metrics = {}; }],
  ['array metrics', (b) => { b.metrics = []; }],
  ['null metric', (b) => { b.metrics.frameTime = null; }],
  ['unknown metric field', (b) => { b.metrics.frameTime.tolerance = 99; }],
  ['missing unit', (b) => { delete b.metrics.frameTime.unit; }],
  ['empty unit', (b) => { b.metrics.frameTime.unit = ''; }],
  ['missing direction', (b) => { delete b.metrics.frameTime.direction; }],
  ['invalid direction', (b) => { b.metrics.frameTime.direction = 'smaller'; }],
  ['missing statistic', (b) => { delete b.metrics.frameTime.statistic; }],
  ['invalid statistic', (b) => { b.metrics.frameTime.statistic = 'mean'; }],
  ['missing budget', (b) => { delete b.metrics.frameTime.maxRegressionPercent; }],
  ['negative budget', (b) => { b.metrics.frameTime.maxRegressionPercent = -1; }],
  ['string budget', (b) => { b.metrics.frameTime.maxRegressionPercent = '5'; }],
  ['negative absolute budget', (b) => { b.metrics.frameTime.absoluteLimit = -1; }],
  ['null absolute budget', (b) => { b.metrics.frameTime.absoluteLimit = null; }],
  ['missing samples', (b) => { delete b.metrics.frameTime.samples; }],
  ['empty samples', (b) => { b.metrics.frameTime.samples = []; }],
  ['string samples', (b) => { b.metrics.frameTime.samples = ['10']; }],
  ['null sample', (b) => { b.metrics.frameTime.samples = [null]; }],
  ['boolean sample', (b) => { b.metrics.frameTime.samples = [true]; }],
]) {
  test(`fails closed for ${label} in either input`, (t) => {
    for (const side of [0, 1]) {
      const inputs = pair();
      mutate(inputs[side]);
      invalid(t, ...inputs);
    }
  });
}

for (const field of ['hardware', 'engineVersion', 'buildConfiguration', 'renderingBackend', 'resolution', 'quality', 'cacheState']) {
  test(`requires explicit environment.${field}`, (t) => {
    const [baseline, candidate] = pair();
    delete candidate.environment[field];
    invalid(t, baseline, candidate, `/candidate/environment/${field}`);
  });
}

test('rejects malformed JSON without parser excerpts from either input', (t) => {
  const [baseline, candidate] = pair();
  for (const field of ['baselineText', 'candidateText']) {
    for (const text of ['', '{"secret":"do-not-echo"', 'NaN', 'Infinity', 'null', '[]']) {
      const result = cli(t, baseline, candidate, { [field]: text });
      assert.equal(result.status, 2);
      assert.equal(result.report.status, 'invalid');
      assert.doesNotMatch(result.stdout, /do-not-echo|SyntaxError|Unexpected/);
    }
  }
});

test('rejects JSON numeric overflow in samples, budgets, and environment', (t) => {
  const [baseline, candidate] = pair();
  for (const mutate of [
    (b) => { b.metrics.frameTime.samples = ['NONFINITE']; },
    (b) => { b.metrics.frameTime.maxRegressionPercent = 'NONFINITE'; },
    (b) => { b.metrics.frameTime.absoluteLimit = 'NONFINITE'; },
    (b) => { b.environment.extra.overflow = 'NONFINITE'; },
  ]) {
    const bad = structuredClone(candidate);
    mutate(bad);
    const result = cli(t, baseline, candidate, {
      candidateText: JSON.stringify(bad).replace('"NONFINITE"', '1e400'),
    });
    assert.equal(result.status, 2);
  }
});

for (const [direction, value, passed] of [
  ['lower', 0, true], ['lower', 1, false], ['lower', -1, true],
  ['higher', 0, true], ['higher', -1, false], ['higher', 1, true],
]) {
  test(`zero baseline ${direction} to ${value} uses conservative normalization`, (t) => {
    const [baseline, candidate] = pair({ direction, samples: [0], maxRegressionPercent: 999999 });
    delete baseline.metrics.frameTime.absoluteLimit;
    delete candidate.metrics.frameTime.absoluteLimit;
    candidate.metrics.frameTime.samples = [value];
    const result = cli(t, baseline, candidate);
    assert.equal(result.status, passed ? 0 : 1);
    const metric = result.report.summary.frameTime;
    assert.equal(metric.regressionPassed, passed);
    assert.equal(metric.regressionPercent, value === 0 ? 0 : null);
    assert.equal(metric.normalization, 'zeroBaseline');
  });
}

test('negative baseline normalizes by absolute baseline magnitude', (t) => {
  const [baseline, candidate] = pair({ samples: [-10] });
  candidate.metrics.frameTime.samples = [-9];
  const result = cli(t, baseline, candidate);
  assert.equal(result.status, 1);
  assert.equal(result.report.summary.frameTime.regressionPercent, 10);
});

for (const [statistic, samples, expected] of [
  ['median', [9, 1, 5], 5], ['median', [8, 2, 6, 4], 5],
  ['p95', [1, 2, 100], 100], ['p95', Array.from({ length: 20 }, (_, i) => 20 - i), 19],
  ['p99', Array.from({ length: 100 }, (_, i) => 100 - i), 99],
  ['p99', [8], 8], ['median', [Number.MAX_VALUE, Number.MAX_VALUE], Number.MAX_VALUE],
  ['median', [-Number.MAX_VALUE, Number.MAX_VALUE], 0],
  ['median', [Number.MIN_VALUE, Number.MIN_VALUE], Number.MIN_VALUE],
  ['median', [Number.MIN_VALUE, 2 * Number.MIN_VALUE], 2 * Number.MIN_VALUE],
]) {
  test(`${statistic} for ${samples.length} samples yields ${expected}`, (t) => {
    const [baseline, candidate] = pair({ statistic, samples });
    delete baseline.metrics.frameTime.absoluteLimit;
    delete candidate.metrics.frameTime.absoluteLimit;
    const result = cli(t, baseline, candidate);
    assert.equal(result.status, 0);
    assert.equal(result.report.summary.frameTime.baselineValue, expected);
    assert.equal(result.report.summary.frameTime.candidateValue, expected);
  });
}

test('does not supply an implicit tolerance', (t) => {
  const [baseline, candidate] = pair({ maxRegressionPercent: 0 });
  candidate.metrics.frameTime.samples = [10.00000001];
  assert.equal(cli(t, baseline, candidate).status, 1);
});

test('rejects unrepresentable percentage arithmetic instead of passing nonfinite output', (t) => {
  const [baseline, candidate] = pair({ samples: [Number.MIN_VALUE] });
  candidate.metrics.frameTime.samples = [1];
  invalid(t, baseline, candidate);
});

test('handles special object keys without prototype pollution', (t) => {
  const [baseline, candidate] = pair();
  for (const input of [baseline, candidate]) {
    input.metrics = JSON.parse(`{"__proto__":${JSON.stringify(input.metrics.frameTime)}}`);
    input.environment.extra = JSON.parse('{"__proto__":{"polluted":true},"constructor":"context"}');
  }
  const result = cli(t, baseline, candidate);
  assert.equal(result.status, 0);
  assert.equal(Object.hasOwn(result.report.summary, '__proto__'), true);
  assert.equal({}.polluted, undefined);
});

test('pure comparison leaves frozen inputs, environment, and sample order unchanged', async () => {
  const { compareBenchmarks } = await import(new URL('../adapters/performance-optimization/scripts/compare-benchmarks.mjs', import.meta.url));
  const [baseline, candidate] = pair();
  const before = structuredClone([baseline, candidate]);
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  freeze(baseline);
  freeze(candidate);
  assert.equal(compareBenchmarks(baseline, candidate).status, 'passed');
  assert.deepEqual([baseline, candidate], before);
  for (const sample of [NaN, Infinity, -Infinity]) {
    const bad = benchmark();
    bad.metrics.frameTime.samples = [sample];
    assert.throws(() => compareBenchmarks(baseline, bad), { code: 'INVALID_NUMBER' });
  }
});

test('CLI rejects missing, extra, and unreadable file arguments with exit 2', (t) => {
  const [baseline, candidate] = pair();
  for (const args of [[], ['one'], ['one', 'two', 'three'], ['missing-baseline.json', 'missing-candidate.json']]) {
    const result = cli(t, baseline, candidate, { args });
    assert.equal(result.status, 2);
    assert.equal(result.report.status, 'invalid');
    assert.deepEqual(result.report.summary, {});
    assert.doesNotMatch(result.stdout, /missing-baseline\.json|ENOENT|stack/);
  }
});
