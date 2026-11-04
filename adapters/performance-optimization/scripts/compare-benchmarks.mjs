#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const environmentFields = [
  'hardware', 'engineVersion', 'buildConfiguration', 'renderingBackend',
  'resolution', 'quality', 'cacheState',
];
const metricFields = ['unit', 'direction', 'samples', 'statistic', 'maxRegressionPercent'];
const contractFields = ['unit', 'direction', 'statistic', 'maxRegressionPercent', 'absoluteLimit'];
const own = (object, key) => Object.hasOwn(object, key);
const record = (value) => value !== null && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const child = (location, key) => `${location}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;

function invalid(code, location) {
  throw Object.assign(new Error(code), { code, path: location });
}

function shape(value, required, optional, location) {
  if (!record(value)) invalid('INVALID_OBJECT', location);
  for (const key of required) {
    if (!own(value, key)) invalid('MISSING_FIELD', child(location, key));
  }
  for (const key of Object.keys(value)) {
    if (![...required, ...optional].includes(key)) invalid('UNKNOWN_FIELD', child(location, key));
  }
}

function text(value, location) {
  if (typeof value !== 'string' || !value.trim()) invalid('INVALID_STRING', location);
}

function finite(value, location, nonnegative = false) {
  if (!Number.isFinite(value)) invalid('INVALID_NUMBER', location);
  if (nonnegative && value < 0) invalid('NEGATIVE_BUDGET', location);
}

function json(value, location) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') return finite(value, location);
  if (!Array.isArray(value) && !record(value)) invalid('INVALID_JSON_VALUE', location);
  for (const [key, entry] of Object.entries(value)) json(entry, child(location, key));
}

function validate(input, location) {
  shape(input, ['schemaVersion', 'scenarioId', 'environment', 'metrics'], [], location);
  if (input.schemaVersion !== 1) invalid('UNSUPPORTED_SCHEMA', child(location, 'schemaVersion'));
  text(input.scenarioId, child(location, 'scenarioId'));
  const environmentPath = child(location, 'environment');
  if (!record(input.environment)) invalid('INVALID_OBJECT', environmentPath);
  for (const key of environmentFields) text(input.environment[key], child(environmentPath, key));
  json(input.environment, environmentPath);
  const metricsPath = child(location, 'metrics');
  if (!record(input.metrics) || !Object.keys(input.metrics).length) invalid('INVALID_METRICS', metricsPath);
  for (const [name, metric] of Object.entries(input.metrics)) {
    const metricPath = child(metricsPath, name);
    text(name, metricPath);
    shape(metric, metricFields, ['absoluteLimit'], metricPath);
    text(metric.unit, child(metricPath, 'unit'));
    if (!['lower', 'higher'].includes(metric.direction)) invalid('INVALID_DIRECTION', child(metricPath, 'direction'));
    if (!['median', 'p95', 'p99'].includes(metric.statistic)) invalid('INVALID_STATISTIC', child(metricPath, 'statistic'));
    finite(metric.maxRegressionPercent, child(metricPath, 'maxRegressionPercent'), true);
    if (own(metric, 'absoluteLimit')) finite(metric.absoluteLimit, child(metricPath, 'absoluteLimit'), true);
    if (!Array.isArray(metric.samples) || !metric.samples.length) invalid('INVALID_SAMPLES', child(metricPath, 'samples'));
    for (let i = 0; i < metric.samples.length; i++) finite(metric.samples[i], `${metricPath}/samples/${i}`);
  }
}

// Values are validated JSON. Object order is irrelevant; array order is significant.
function difference(left, right, location) {
  if (left === right) return null;
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return location;
    for (let i = 0; i < left.length; i++) {
      const mismatch = difference(left[i], right[i], child(location, i));
      if (mismatch) return mismatch;
    }
    return null;
  }
  if (record(left) && record(right)) {
    for (const key of Object.keys(left)) {
      if (!own(right, key)) return child(location, key);
      const mismatch = difference(left[key], right[key], child(location, key));
      if (mismatch) return mismatch;
    }
    for (const key of Object.keys(right)) {
      if (!own(left, key)) return child(location, key);
    }
    return null;
  }
  return location;
}

function aggregate({ samples, statistic }) {
  const sorted = [...samples].sort((a, b) => a - b);
  if (statistic !== 'median') {
    const percentile = statistic === 'p95' ? 95 : 99;
    return sorted[Math.ceil(sorted.length * percentile / 100) - 1];
  }
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  const a = sorted[middle - 1];
  const b = sorted[middle];
  const sum = a + b;
  // Add before dividing to preserve tiny midpoints; halve first only on overflow.
  return Number.isFinite(sum) ? sum / 2 : a / 2 + b / 2;
}

/** Compare parsed JSON without modifying inputs. Invalid contracts throw { code, path }. */
export function compareBenchmarks(baseline, candidate) {
  validate(baseline, '/baseline');
  validate(candidate, '/candidate');
  if (baseline.scenarioId !== candidate.scenarioId) invalid('SCENARIO_MISMATCH', '/candidate/scenarioId');
  const environmentMismatch = difference(baseline.environment, candidate.environment, '/candidate/environment');
  if (environmentMismatch) invalid('ENVIRONMENT_MISMATCH', environmentMismatch);

  // Reject additions as well as deletions: every reported metric needs a reviewed baseline.
  for (const name of Object.keys(baseline.metrics)) {
    if (!own(candidate.metrics, name)) invalid('MISSING_METRIC', child('/candidate/metrics', name));
  }
  for (const name of Object.keys(candidate.metrics)) {
    if (!own(baseline.metrics, name)) invalid('NEW_METRIC', child('/candidate/metrics', name));
    const before = baseline.metrics[name];
    const after = candidate.metrics[name];
    for (const key of contractFields) {
      if (own(before, key) !== own(after, key) || before[key] !== after[key]) {
        invalid('CONTRACT_MISMATCH', child(child('/candidate/metrics', name), key));
      }
    }
  }

  const summary = Object.fromEntries(Object.keys(baseline.metrics).sort().map((name) => {
    const metric = baseline.metrics[name];
    const baselineValue = aggregate(metric);
    const candidateValue = aggregate(candidate.metrics[name]);
    const delta = metric.direction === 'lower' ? candidateValue - baselineValue : baselineValue - candidateValue;
    const zeroBaseline = baselineValue === 0;
    const regressionPercent = zeroBaseline ? (delta === 0 ? 0 : null) : delta / Math.abs(baselineValue) * 100;
    if (!Number.isFinite(delta) || (!zeroBaseline && !Number.isFinite(regressionPercent))) {
      invalid('ARITHMETIC_OVERFLOW', child('/candidate/metrics', name));
    }
    // With no nonzero denominator, any worsening fails regardless of the percentage budget.
    const regressionPassed = zeroBaseline ? delta <= 0 : regressionPercent <= metric.maxRegressionPercent;
    const hasAbsoluteLimit = own(metric, 'absoluteLimit');
    const absolutePassed = hasAbsoluteLimit
      ? (metric.direction === 'lower' ? candidateValue <= metric.absoluteLimit : candidateValue >= metric.absoluteLimit)
      : null;
    return [name, {
      unit: metric.unit,
      direction: metric.direction,
      statistic: metric.statistic,
      baselineValue,
      candidateValue,
      regressionPercent,
      normalization: zeroBaseline ? 'zeroBaseline' : 'absoluteBaseline',
      budget: {
        maxRegressionPercent: metric.maxRegressionPercent,
        ...(hasAbsoluteLimit ? { absoluteLimit: metric.absoluteLimit } : {}),
      },
      regressionPassed,
      absolutePassed,
      passed: regressionPassed && absolutePassed !== false,
    }];
  }));
  return { schemaVersion: 1, status: Object.values(summary).every((metric) => metric.passed) ? 'passed' : 'failed', summary };
}

function load(file, location) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    invalid('READ_ERROR', location);
  }
  try {
    return JSON.parse(source);
  } catch {
    // JSON.parse errors may contain excerpts of secret environment values.
    invalid('INVALID_JSON', location);
  }
}

function main(args) {
  try {
    if (args.length !== 2) invalid('USAGE', '/');
    const report = compareBenchmarks(load(args[0], '/baseline'), load(args[1], '/candidate'));
    console.log(JSON.stringify(report));
    process.exitCode = report.status === 'passed' ? 0 : 1;
  } catch (error) {
    const detail = typeof error?.code === 'string' && typeof error?.path === 'string'
      ? { code: error.code, path: error.path }
      : { code: 'INVALID_INPUT', path: '/' };
    console.log(JSON.stringify({ schemaVersion: 1, status: 'invalid', summary: {}, error: detail }));
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2));
