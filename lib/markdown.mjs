import fs from 'node:fs';
import path from 'node:path';
import { assertNoSymlinks, exists, filesUnder, posix, readText } from './files.mjs';

export const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function scalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) { try { return JSON.parse(trimmed); } catch { throw new Error(`Invalid quoted YAML scalar: ${value}`); } }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed.replace(/\s+#.*$/, '').trim();
}
export function frontmatter(text, label = 'SKILL.md') {
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`${label}: missing YAML frontmatter`);
  const fields = {};
  const lines = match[1].split('\n');
  for (let index = 0; index < lines.length; index++) {
    const field = lines[index].match(/^([\w-]+):[ \t]*(.*)$/);
    if (!field) continue;
    const [, key, raw] = field;
    if (Object.hasOwn(fields, key)) throw new Error(`${label}: duplicate frontmatter key ${key}`);
    if (/^[>|][+-]?\s*(?:#.*)?$/.test(raw)) {
      const parts = [];
      while (index + 1 < lines.length && (/^[ \t]/.test(lines[index + 1]) || !lines[index + 1].trim())) parts.push(lines[++index].trim());
      fields[key] = parts.join(raw.startsWith('>') ? ' ' : '\n').trim();
    } else fields[key] = scalar(raw);
  }
  if (!NAME.test(fields.name ?? '')) throw new Error(`${label}: invalid or missing name`);
  if (typeof fields.description !== 'string' || !fields.description.trim()) throw new Error(`${label}: nonempty description required`);
  return { fields, header: match[0], end: match[0].length, userOnly: ['true', true].includes(fields['disable-model-invocation']) };
}
export function disableInvocation(text) {
  const meta = frontmatter(text);
  if (Object.hasOwn(meta.fields, 'disable-model-invocation')) {
    return text.replace(/^(disable-model-invocation:)[^\n]*$/m, '$1 true');
  }
  return text.replace(/^---\n/, '---\ndisable-model-invocation: true\n');
}
function maskExamples(text) {
  let fence = null;
  const masked = text.split(/(?<=\n)/).map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && /^\s*$/.test(line.slice(marker[0].length))) fence = null;
      return line.replace(/[^\n]/g, ' ');
    }
    if (marker) { fence = marker[1]; return line.replace(/[^\n]/g, ' '); }
    // Indented code is an example too.
    if (/^(?: {4}|\t)/.test(line)) return line.replace(/[^\n]/g, ' ');
    return line;
  }).join('');
  return masked.replace(/(`+)([\s\S]*?)\1(?!`)/g, value => value.replace(/[^\n]/g, ' '));
}
// Return offsets in the original text. Balanced destinations cover filenames with
// parentheses; reference definitions are rewritten along with inline links.
export function markdownLinks(text) {
  const masked = maskExamples(text);
  const links = [];
  const inline = /!?\[[^\]\n]*\]\([ \t]*/g;
  let match;
  while ((match = inline.exec(masked))) {
    let start = inline.lastIndex, end = start;
    if (masked[start] === '<') {
      start++; end = masked.indexOf('>', start);
      if (end < 0) continue;
    } else {
      let depth = 0;
      while (end < masked.length) {
        const char = masked[end];
        if (char === '\\') { end += 2; continue; }
        if (char === '(') depth++;
        else if (char === ')') { if (!depth) break; depth--; }
        else if (/\s/.test(char) && !depth) break;
        end++;
      }
    }
    if (end > start) links.push({ start, end, href: text.slice(start, end) });
    inline.lastIndex = Math.max(inline.lastIndex, end);
  }
  const definition = /^ {0,3}\[[^\]\n]+\]:[ \t]*(?:<([^>\n]+)>|([^\s]+))/gm;
  while ((match = definition.exec(masked))) {
    const value = match[1] ?? match[2];
    const start = match.index + match[0].indexOf(value, match[0].indexOf(']:') + 2);
    links.push({ start, end: start + value.length, href: text.slice(start, start + value.length) });
  }
  const html = /\b(?:href|src)=["']([^"'\n]+)["']/g;
  while ((match = html.exec(masked))) {
    const start = match.index + match[0].indexOf(match[1]);
    links.push({ start, end: start + match[1].length, href: text.slice(start, start + match[1].length) });
  }
  return links.sort((a, b) => a.start - b.start).filter((link, index, all) => !index || link.start >= all[index - 1].end);
}
export function relativeLink(href) {
  if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(href)) return null;
  const suffixAt = href.search(/[?#]/);
  const raw = suffixAt < 0 ? href : href.slice(0, suffixAt);
  let decoded;
  try { decoded = decodeURIComponent(raw).replace(/\\([() ])/g, '$1'); }
  catch { throw new Error(`Invalid URL encoding: ${href}`); }
  if (!decoded) return null;
  if (decoded.includes('\\') || decoded.includes('\0') || /^[a-z]:/i.test(decoded)) throw new Error(`Unsafe markdown link: ${href}`);
  return { pathname: decoded, suffix: suffixAt < 0 ? '' : href.slice(suffixAt) };
}
function githubUrl(url) {
  const cleaned = url.replace(/^git@github.com:/, 'https://github.com/').replace(/^ssh:\/\/git@github.com\//, 'https://github.com/').replace(/\.git$/, '').replace(/\/$/, '');
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(cleaned)) throw new Error(`Cannot create pinned GitHub permalink for ${url}`);
  return cleaned;
}
export function rewriteLinks(text, { sourceFile, outputFile, sourceRoot, repository, mapping }) {
  let result = text;
  for (const link of markdownLinks(text).reverse()) {
    const relative = relativeLink(link.href);
    if (!relative) continue;
    const target = relative.pathname.startsWith('/') ? path.resolve(sourceRoot, `.${relative.pathname}`) : path.resolve(path.dirname(sourceFile), relative.pathname);
    const inside = path.relative(sourceRoot, target);
    if (inside === '..' || inside.startsWith(`..${path.sep}`) || path.isAbsolute(inside)) throw new Error(`Link escapes source repository in ${sourceFile}: ${link.href}`);
    assertNoSymlinks(target);
    let destination = mapping.get(target);
    if (destination) {
      destination = path.posix.relative(path.posix.dirname(outputFile), destination) || '.';
      destination = destination.split('/').map(encodeURIComponent).join('/');
    } else {
      if (!exists(target)) throw new Error(`Dangling upstream link in ${sourceFile}: ${link.href}`);
      const kind = fs.statSync(target).isDirectory() ? 'tree' : 'blob';
      destination = `${githubUrl(repository.url)}/${kind}/${repository.commit}/${posix(inside).split('/').map(encodeURIComponent).join('/')}`;
    }
    result = result.slice(0, link.start) + destination + relative.suffix + result.slice(link.end);
  }
  return result;
}
export function validateLinks(root, { selectedSkills } = {}) {
  const selected = selectedSkills && new Set(selectedSkills);
  const markdownFiles = ['skills', 'references', 'LICENSES'].flatMap(base => filesUnder(path.join(root, base), { optional: true }).map(file => `${base}/${file}`)).filter(file => /\.md$/i.test(file));
  for (const file of markdownFiles) {
    if (selected && file.startsWith('skills/') && !selected.has(file.split('/')[1])) continue;
    for (const link of markdownLinks(readText(path.join(root, file)))) {
      const relative = relativeLink(link.href);
      if (!relative) continue;
      if (relative.pathname.startsWith('/')) throw new Error(`Absolute markdown link in ${file}: ${link.href}`);
      const target = path.resolve(root, path.dirname(file), relative.pathname);
      const rel = posix(path.relative(root, target));
      if (rel === '..' || rel.startsWith('../') || path.isAbsolute(rel) || !exists(target)) throw new Error(`Dangling relative link in ${file}: ${link.href}`);
      if (selected && rel.startsWith('skills/') && !selected.has(rel.split('/')[1])) throw new Error(`Profile has dangling cross-skill link in ${file}: ${link.href}`);
    }
  }
}
