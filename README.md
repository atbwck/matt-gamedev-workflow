# Matt × UE／Unity／Godot 游戏开发工作流

**Matt 正式技能全量保留，围绕游戏开发适配；awesome-gamedev 提供引擎和领域知识，本地层补齐真实验证。**

这是独立发行版，位于新文件夹中。它保留 Matt 的完整技能入口与配套资源，优先保留 **`grill-with-docs`** 和 **`wayfinder`**，提供简短命令，并把玩法设计、实现、引擎测试、打包和性能证据接起来。它不会安装完整上游插件、hooks、引擎或测试框架。

- [安装与使用手册](INSTALL.md)
- [完整技能目录](CATALOG.md)
- [同步、覆盖保护与维护](MAINTENANCE.md)
- [游戏适配与方法论取舍](ADAPTATIONS.md)
- [实际验证记录](VALIDATION.md)
- [来源与许可证](THIRD-PARTY.md)

## 当前组成

| 层次 | 数量 | 内容 |
| --- | --- | --- |
| Matt 正式技能 | **27** | engineering 20、productivity 7；保留原名及全部同目录资源，排除 misc／in-progress |
| awesome-gamedev | **44** | UE 6、Unity 8、Godot 16，以及跨引擎领域 14 |
| 本地游戏支持 | **14** | 流程与路由、质量契约、可选反证审查、三引擎 testing／runtime-safety、安全、诊断、CI、性能 |
| 附加短入口 | **8** | spec、game-plan、build、test、debug、game-review、perf、constraints |
| 合计 | **93** | 当前锁定提交下的快照，实际以生成清单为准 |

Matt 的 27 项正式技能全部保留；按用户要求，不收录 misc 的 4 项低频技能和 in-progress 的 8 项实验技能。同步只扫描 engineering／productivity，后续更新不会把排除项重新带回。完整安装不要求一次加载全部技能。

五个安装档位都保留 Matt 全部正式技能：`all` 93、`core` 43、`unreal` 65、`unity` 67、`godot` 75。core 适合只使用工程／规划能力；实际游戏工作推荐对应引擎档位，包含跨引擎领域和该引擎的验证层。

## 从设计到可运行证据

### 设计能在当前讨论中讲清楚：`/grill-with-docs`

这是项目设计的首要入口。它同时使用 `grilling` 与 `domain-modeling`：持续追问实际设计分支，用具体场景暴露矛盾，逐步统一术语并记录有价值的 ADR。

例如讨论战斗时，先说清“命中”和“伤害”是否相同、“Buff 配置”和“Buff 实例”如何区分、谁拥有结算权、死亡状态如何进入存档。已有 GDD、术语表、代码和 ADR 是输入；不重复询问已经确定的答案。

### 目标太大、路线还不清楚：`/wayfinder`

完整保留决策地图：目的地、research／prototype／grilling／task 票据、依赖 frontier、已定结论、尚不能具体化的 fog 和范围边界。它默认规划决策，每会话最多解决一项非研究票据；人参与的票据需要真实的人类回答。

路线清晰后，用户再选择规格和实现阶段。地图不自动变成实现待办，也不自动推送研究分支。

### 明确范围后：规格、切片、实现与审查

- `/to-spec`（或 `/spec`）将已经讨论的内容整理成规格。
- `/to-tickets`（或 `/game-plan`）拆成有依赖关系、能独立验收的行为切片。
- `/implement`（或 `/build`）执行一个明确范围；`/implement-spec` 用于有条件支持隔离并行的完整规格。
- `/tdd` 使用约定的公开行为 seam，先 red 后 green、逐个垂直切片。本版保留 Matt 当前“结构重构在审查阶段进行”的选择。
- `/code-review`（或 `/game-review`）分别检查 Standards 与 Spec；游戏生命周期、线程、资产／存档、权威边界和性能约束进入对应审查。

这些是可选择的阶段，不要求小 bug 也新建 GDD、地图和完整访谈。用户调用某个阶段只请求该阶段；后续 user-only 技能保留显式调用边界。

**两层是串联的，不只是并列。** 当 Matt 阶段落到真实游戏代码或资产上时，会经 `router` 确定引擎，再读取所属引擎技能与对应的 `*-testing`、`*-runtime-safety` 或 `performance-optimization`：

- 审查：Standards 轴必须引用实际读取的引擎技能与已执行的报告，不能只用通用文字断言“符合游戏规范”。
- 行为测试：引擎行为 seam 走该引擎测试技能的真实调用与报告契约。
- 排错：按症状加载测试、运行时安全或性能技能，跨子系统时加载对应领域技能。

若这些技能不在已安装档位，会明确报告缺口，而不是拿通用期望冒充引擎审查。

## 常用命令

以下命令在完成安装、宿主发现技能后使用；它们不是当前聊天已经新增的内置工具。

| 命令 | 用途 |
| --- | --- |
| `/grill-with-docs` | 项目设计追问＋术语表／ADR |
| `/wayfinder` | 跨会话的大目标决策地图 |
| `/ask-matt` | 查看完整 Matt 流程如何选择 |
| `/spec` | 整理已讨论的设计规格，对应 to-spec |
| `/game-plan` | 拆实现任务，对应 to-tickets |
| `/build` | 实现明确功能或票据，对应 implement |
| `/test` | 运行当前引擎适用的验证层，核对实际报告 |
| `/debug` | 可复现问题、根因定位、修复和回归 |
| `/game-review` | 双轴审查，对应 code-review |
| `/perf` | 实测帧时间、加载、内存瓶颈与预算 |
| `/constraints` | 建立或调整质量契约并证明门禁有效 |

Cindy 自带 `/review` 和 `/plan`，本版用 `/game-review`、`/game-plan` 保留其原生行为。不同 CLI 的调用语法可能是 `/skill:name` 或其他形式；以实际发现的技能名称和宿主支持为准，详见使用手册。

## 快速安装

需要 Node.js 22+。安装生成成品不需要 npm 依赖，也不需要拉取两个上游。

在终端进入此发行版目录后，先检查：

```bash
node sync-upstreams.mjs --check
node scripts/catalog.mjs --check
```

给一个**已经存在**的游戏项目安装，例如 Godot：

```bash
node install-skills.mjs --scope project --project "D:/Games/MyGame" --profile godot --dry-run
node install-skills.mjs --scope project --project "D:/Games/MyGame" --profile godot
```

将路径替换成实际项目；`unreal`、`unity` 可换成对应档位。默认覆盖六客户端的两个技能根，`--clients pi` 等可限制客户端。已有同名文件时先阅读 [覆盖与备份规则](INSTALL.md)，不要直接删除目录来绕过保护。

安装器只分发文件并验证内容，不更改项目规则、配置引擎、安装框架或启动任何游戏。项目第一次需要工单／领域文档配置时，显式调用 `/setup-matt-pocock-skills`；已有配置直接复用，支持纯本地 Markdown。

## 游戏适配的边界

- 识别实际任务子项目、引擎版本、目标平台和 renderer；根目录有 Node 工具不代表游戏是网站。
- 保留 Matt 方法论，替换游戏不适用的执行默认值：真实引擎原型优先；强制提交／推送改为遵循用户授权；WIP 审查涵盖未提交改动；缺少宿主工具时诚实降级。
- 三引擎测试与运行时安全分别覆盖实际报告、生命周期、资源、异步／线程、旧资产与存档兼容。
- 质量和性能预算由项目确定。缺失报告、超时、意外零测试不能算通过；headless 不证明 GPU，导出成功不证明 Player 可玩。
- 正式技能内的 TypeScript 教学示例和 HTML 报告资源保留并注明适用性；低频／实验技能本身不发布、不安装。
- 本地质量、安全、诊断、CI 和性能指南复用旧版已游戏化的成果并保留来源，未引入第三套 Addy 主流程。

## 同步如何保留改动

本地适配放在 `adapters/` 和精确补丁，生成物放在 `skills/`、`references/`、`LICENSES/`。同步重新应用这些适配；补丁匹配不上或新 Matt 技能缺少适配说明就停下。

本版还会在覆盖前检查生成物：**直接改过、删除过或新增未知文件都会阻断发布**。应将长期修改迁回适配源，再重新生成。安装更新也保护已记录的人工修改；允许覆盖的未知同名目标会先备份。

默认同步只生成候选，不发布、不安装；远端工作流文件只提供审核 PR 机制，不自动合并。仓库发布、版本发布与实际安装是相互独立的操作，均由维护者明确发起。

## 验证与示例

实际执行情况见 [VALIDATION.md](VALIDATION.md)。仓库工具测试和隔离安装验证证明发行工具与文件分发；它们不能证明真实游戏运行、Cook／导出、Player smoke 或设备性能。

- [三类游戏任务推演](examples/三类游戏任务推演.md)
- [游戏项目规则示例](examples/游戏项目规则示例.md)

这些示例不自动写入你的游戏项目。未安装额外引擎、框架、hooks、MCP、遥测服务；旧技能库及现有全局安装未改动。
