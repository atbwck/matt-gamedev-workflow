# 维护 Matt 游戏工作流发行版

用户说明和维护文档使用中文；技能正文保留适合上游与跨宿主复用的语言。

- Matt 正式技能全量保留：只在 engineering 与 productivity 两组递归扫描 SKILL.md，连同全部配套文件，不按零散精选清单删减正式技能。用户明确排除 misc 低频与 in-progress 实验技能；不得在同步时自动加回。grill-with-docs 是首要设计入口，wayfinder 必须保留。
- awesome-gamedev 提供 Unreal/Unity/Godot 全类别及配置中的跨引擎知识；只加载当前任务需要的部分。
- 本地改动写 adapters/、精确补丁 adapters/patches.json 与 upstreams.json；skills/、references/、LICENSES/、.distribution.json 是生成物，禁止只改生成物。
- 同步不得静默覆盖生成物的手工修改、未知文件、脏上游缓存或路径链接；失败保留原输出与 pins。完整性检查不得通过降低补丁匹配次数、删除资源或放宽测试获得绿色结果。
- 安装先 dry-run、预检全部目标、保留无关文件；覆盖必须备份，已安装的人工修改需要先迁回适配源。用户未要求时不更新真实全局安装、提交、推送或发布。
- 本发行版不安装引擎、框架、hooks、MCP、模型、遥测服务或 CI 账号。不修改 Cindy 插件库和宿主配置。
- Node.js 22+、Git；工具使用 Node 标准库，无 npm 依赖。运行 node --test tests/*.test.mjs、node sync-upstreams.mjs --check 及适用语法/安装检查。用真实临时文件和故意失败用例验证保护，不以字符串断言代替执行证据。
- 技能库工具测试与合成 benchmark 不证明真实引擎运行、Cook/导出、Player smoke、GPU 或目标设备性能。明确实际执行与未执行项。
- 保留 Matt MIT、gamedev Apache-2.0/NOTICE，以及复用 Addy 派生适配的 MIT 来源与修改说明。
