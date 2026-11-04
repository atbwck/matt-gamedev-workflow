# 来源与许可

本项目是独立游戏技能发行版，不是以下上游的官方发布，也不自动安装上游插件、hooks 或 agent personas。

| 来源 | 锁定快照 | 内容与许可 |
| --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` | 全部 27 项正式技能及其配套文件；不含 misc／in-progress；MIT，保留 Matt Pocock 版权 |
| [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` | UE／Unity／Godot 与选定跨引擎知识；Apache-2.0，保留 NOTICE |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `301b02b12bff98e4688e6984af6556802322bbde`（派生来源记录） | 复用旧版已游戏化的约束、可选反证、安全、诊断、CI 和性能适配；MIT，不作为第三个同步上游 |

生成时将上游原许可证复制到 LICENSES/，也随安装复制到 references/game-workflow/licenses/。本地复用适配各自保留 sources.md。pr 技能的 CREDITS.md 原样随技能分发。

新编写工具与文档适用根目录 LICENSE；上游及派生部分保留原始许可条件。局部游戏适配通过入口声明、GAME-ADAPTATION.md、adapters/patches.json 与 ADAPTATIONS.md 显著记录。

未安装上游完整插件。克隆缓存 upstream/ 仅供生成，不是安装来源或最终交付包的一部分。
