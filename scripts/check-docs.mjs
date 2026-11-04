#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownLinks, relativeLink } from '../lib/markdown.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = ['README.md', 'INSTALL.md', 'CATALOG.md', 'ADAPTATIONS.md', 'MAINTENANCE.md', 'THIRD-PARTY.md', 'AGENTS.md', 'VALIDATION.md'];
for (const name of fs.readdirSync(path.join(root, 'examples'))) if (name.endsWith('.md')) files.push(`examples/${name}`);
let checked = 0;
try {
  if (process.argv.length > 2) throw new Error('Usage: node scripts/check-docs.mjs');
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    for (const link of markdownLinks(content)) {
      const local = relativeLink(link.href);
      if (!local) continue;
      const target = path.resolve(root, path.dirname(file), local.pathname);
      const relative = path.relative(root, target);
      if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !fs.existsSync(target)) throw new Error(`${file}: invalid local documentation link ${link.href}`);
      checked++;
    }
  }
  console.log(`Documentation links verified: ${files.length} files, ${checked} local links. External links and anchor semantics were not checked.`);
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}
