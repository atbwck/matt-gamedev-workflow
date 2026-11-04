#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyDistribution } from '../lib/distribution.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check')) {
  console.error('Usage: node scripts/catalog.mjs [--check]');
  process.exitCode = 1;
} else {
  try {
    const manifest = verifyDistribution({ root });
    const skills = manifest.skills;
    const counts = Object.fromEntries(['matt', 'gamedev', 'local'].map(origin => [origin, skills.filter(skill => skill.origin === origin).length]));
    const lines = [
      '# 完整技能目录', '',
      '由 `node scripts/catalog.mjs` 从已验证的 `.distribution.json` 生成；不要手工改此文件。', '',
      `当前共 **${skills.length}** 项：Matt **${counts.matt}**、awesome-gamedev **${counts.gamedev}**、本地游戏支持与短入口 **${counts.local}**。`, '',
      '**grill-with-docs** 为首要设计入口；**wayfinder** 为跨会话决策地图入口。全部技能保留，按实际阶段和引擎加载。', '',
      '| 档位 | 数量 |', '| --- | --- |',
      ...Object.entries(manifest.profiles).map(([name, names]) => `| ${name} | ${names.length} |`), '',
      '每个档位都包含 Matt engineering／productivity 全部正式技能，排除 misc／in-progress。core 不包含引擎知识和跨引擎领域知识；执行引擎任务宜选择对应引擎档位。', '',
    ];
    const sections = [
      ['Matt 工程技能', skill => skill.origin === 'matt' && skill.group === 'engineering'],
      ['Matt 生产力技能', skill => skill.origin === 'matt' && skill.group === 'productivity'],
      ['awesome-gamedev 引擎与领域知识', skill => skill.origin === 'gamedev'],
      ['本地游戏支持与短入口', skill => skill.origin === 'local'],
    ];
    const cell = value => String(value).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
    for (const [title, filter] of sections) {
      const entries = skills.filter(filter);
      if (!entries.length) continue;
      lines.push(`## ${title}：${entries.length} 项`, '', '| 技能 | 调用 | 用途 |', '| --- | --- | --- |');
      for (const skill of entries) {
        lines.push(`| [${skill.name}](skills/${skill.name}/SKILL.md) | ${skill.userOnly ? '用户显式' : '用户／模型按需'} | ${cell(skill.description)} |`);
      }
      lines.push('');
    }
    lines.push('## 来源与资源', '',
      '每项原始身份、分组、成熟度、源文件指纹、配套资源和依赖记录在 `.distribution.json`。同目录模板、脚本及既有 agents/openai.yaml 全部保留；游戏适配见 GAME-ADAPTATION.md 与 ADAPTATIONS.md。', '',
      'Matt 低频 misc 与实验 in-progress 项不进入发行版，后续同步也不自动收录。正式技能内的示例和配套资源保持完整。', '');
    const content = lines.join('\n');
    const file = path.join(root, 'CATALOG.md');
    if (args.includes('--check')) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== content) throw new Error('CATALOG.md drift; run node scripts/catalog.mjs and review');
      console.log(`Catalog verified: ${skills.length} skills, ${counts.matt} Matt.`);
    } else {
      fs.writeFileSync(file, content);
      console.log(`Generated CATALOG.md: ${skills.length} skills, ${counts.matt} Matt.`);
    }
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  }
}
