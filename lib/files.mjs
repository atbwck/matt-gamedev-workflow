import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const posix = value => value.split(path.sep).join('/');
export const exists = file => { try { fs.lstatSync(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
export function relativePath(value) {
  if (typeof value !== 'string' || !value || /[\\:\0]/.test(value) || path.isAbsolute(value)
      || value.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part))) {
    throw new Error(`Unsafe relative path / path escape: ${value}`);
  }
  return value;
}
export function within(root, relative) { return path.join(root, relativePath(relative)); }
export function assertNoSymlinks(file) {
  const absolute = path.resolve(file);
  const { root } = path.parse(absolute);
  let current = root;
  for (const part of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!exists(current)) continue;
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink / linked parent is forbidden: ${current}`);
  }
  return absolute;
}
export function filesUnder(root, { optional = false } = {}) {
  assertNoSymlinks(root);
  if (!exists(root)) {
    if (optional) return [];
    throw new Error(`Missing directory: ${root}`);
  }
  if (!fs.lstatSync(root).isDirectory()) throw new Error(`Expected directory: ${root}`);
  const result = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      relativePath(entry.name);
      const file = path.join(dir, entry.name);
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error(`Symlink is forbidden: ${file}`);
      if (stat.isDirectory()) visit(file);
      else if (stat.isFile()) result.push(posix(path.relative(root, file)));
      else throw new Error(`Unsupported filesystem entry: ${file}`);
    }
  }
  visit(root);
  return result.sort();
}
// File content is binary unless its extension or conventional basename declares
// a text type. Valid UTF-8 alone does not make a resource safe to normalize.
const TEXT_EXTENSIONS = new Set([
  '.md', '.mdx', '.txt', '.rst', '.adoc', '.json', '.jsonc', '.json5', '.yaml', '.yml',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.pyi', '.rb', '.pl', '.sql',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1', '.bat', '.cmd',
  '.toml', '.ini', '.cfg', '.conf', '.xml', '.html', '.htm', '.css', '.scss', '.svg', '.csv', '.tsv',
  '.gd', '.gdshader', '.tscn', '.tres', '.godot', '.cs', '.csproj', '.sln', '.props', '.targets', '.resx',
  '.c', '.cc', '.cpp', '.cxx', '.h', '.hpp', '.glsl', '.hlsl', '.shader', '.compute', '.ush', '.usf', '.cginc',
  '.meta', '.uplugin', '.uproject', '.diff', '.patch',
]);
export function isTextFile(file) {
  const name = path.basename(file);
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase())
    || /(?:^|[-_])(?:LICENSE|LICENCE|NOTICE|COPYING)(?:\.(?:txt|md))?$/i.test(name)
    || ['.gitignore', '.gitattributes', '.editorconfig', '.npmrc', 'makefile', 'dockerfile'].includes(name.toLowerCase());
}
export function normalizedBytes(data, { text = typeof data === 'string' } = {}) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (!text || bytes.includes(0)) return bytes;
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes).replace(/\r\n/g, '\n'); }
  catch { return bytes; }
}
export const digest = (data, options) => createHash('sha256').update(normalizedBytes(data, options)).digest('hex');
export const fileDigest = file => digest(fs.readFileSync(file), { text: isTextFile(file) });
export function hashesUnder(root, options) {
  return Object.fromEntries(filesUnder(root, options).map(file => [file, fileDigest(within(root, file))]));
}
export const readText = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
export function readJson(file) {
  assertNoSymlinks(file);
  try { return JSON.parse(readText(file)); }
  catch (error) { throw new Error(`Cannot read JSON ${file}: ${error.message}`); }
}
export const jsonText = value => JSON.stringify(value, null, 2) + '\n';
export function put(root, relative, data, mode) {
  const target = within(root, relative);
  assertNoSymlinks(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  if (mode !== undefined) fs.chmodSync(target, mode);
}
export function copyFile(source, target) {
  assertNoSymlinks(source);
  assertNoSymlinks(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  fs.chmodSync(target, fs.statSync(source).mode & 0o777);
}
export function copyTree(source, target) {
  assertNoSymlinks(target);
  fs.mkdirSync(target, { recursive: true });
  for (const file of filesUnder(source)) copyFile(within(source, file), within(target, file));
}
export function sameRecord(actual, expected, label) {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  for (const key of [...keys].sort()) {
    relativePath(key);
    if (!(key in actual)) throw new Error(`${label}: missing managed file ${key}`);
    if (!(key in expected)) throw new Error(`${label}: unknown / extra file ${key}`);
    if (actual[key] !== expected[key]) throw new Error(`${label}: locally modified file ${key}; back up edits and update the source before retrying`);
  }
}
export function physicalPath(file) {
  let ancestor = path.resolve(file);
  const tail = [];
  while (!exists(ancestor)) { tail.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor); }
  return path.join(fs.realpathSync.native(ancestor), ...tail);
}
export function overlaps(first, second) {
  let a = physicalPath(first), b = physicalPath(second);
  if (process.platform === 'win32') { a = a.toLowerCase(); b = b.toLowerCase(); }
  const rel = path.relative(a, b);
  const inverse = path.relative(b, a);
  const inside = part => part === '' || (part !== '..' && !part.startsWith(`..${path.sep}`) && !path.isAbsolute(part));
  return inside(rel) || inside(inverse);
}

// Rename old entries into a backup on the same volume, then move replacements in.
// This is recoverable on write errors, not an atomic multi-file disk transaction.
export function replaceWithRollback({ replacements, backup, beforeMove, afterReplace }) {
  assertNoSymlinks(backup);
  fs.mkdirSync(backup, { recursive: true });
  const completed = [];
  try {
    for (const [index, { source, target }] of replacements.entries()) {
      assertNoSymlinks(target);
      const saved = path.join(backup, String(index));
      const step = { target, saved, hadOld: exists(target), movedNew: false };
      if (step.hadOld) fs.renameSync(target, saved);
      completed.push(step);
      beforeMove?.(target, index);
      if (source) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.renameSync(source, target);
        step.movedNew = true;
      }
    }
    afterReplace?.();
  } catch (error) {
    const failures = [];
    for (const step of completed.reverse()) {
      try {
        if (step.movedNew) fs.rmSync(step.target, { recursive: true, force: true });
        if (step.hadOld) fs.renameSync(step.saved, step.target);
      } catch (rollbackError) { failures.push(rollbackError.message); }
    }
    throw new Error(`Publish failed: ${error.message}; ${failures.length ? `rollback incomplete (${failures.join('; ')}), recover from ${backup}` : 'previous files restored'}`);
  }
  return backup;
}
