# 同步、覆盖保护与维护

本版的长期改动位于 `adapters/`、`adapters/patches.json` 和 `upstreams.json`。已生成的 `skills/`、`references/`、`LICENSES/` 与 `.distribution.json` 是可安装成品。维护要求 Node.js 22+ 和 Git，无 npm 依赖。

## 1. 两个主要上游

`upstreams.json.repositories` 锁定两个上游提交与更新分支：

- Matt：只在配置的 `skills/engineering/` 与 `skills/productivity/` 中递归发现 SKILL.md，当前全部 27 项正式技能，并保留每项的原始配套文件、名称和分组。misc、in-progress 及其他未批准分组不扫描、不发布；配置和回归测试共同保护这一范围。
- awesome-gamedev：自动发现 Unreal／Unity／Godot 三类别的直接技能目录，加配置中的 14 项跨引擎领域。原上游 router／性能入口由独立本地版本承担，不重复发布。

`localSkills` 声明本地游戏支持和短入口。`dependencies` 与各项 `requires` 声明依赖，检查每个安装档位都闭合。Matt 在所有档位完整保留。

新增 Matt 技能会被发现；缺少 `adapters/notes/<name>.md` 时要求先完成适配审核。上游删除／改名也需要明确审核，默认拒绝静默移除原有 Matt 技能。

## 2. 目录

```text
upstreams.json                  上游 pins、收录与依赖配置
sync-upstreams.mjs              候选、发布和离线校验入口
install-skills.mjs              六客户端 copy 安装入口
lib/                            文件、Markdown、同步与安装实现
adapters/
  patches.json                  精确补丁与匹配次数
  notes/<Matt-name>.md          每个 Matt 技能的游戏适配说明
  <local-name>/                本地技能与配套资源
  shared-references/           发布到 references/game-workflow/
skills/                         扁平技能生成树
references/game-workflow/       命名空间共享策略、检查表、许可与上游背景
LICENSES/                       原始上游许可和 NOTICE
.distribution.json              生成指纹、原始身份／资源和各档位
scripts/catalog.mjs             生成／校验人类可读完整目录
scripts/record-matt-inventory.mjs  显式审核后记录 Matt 原始文件身份
CATALOG.md                      人类可读技能目录
ADAPTATIONS.md                  方法论与行为差异
INSTALL.md                     安装、覆盖与使用
VALIDATION.md                  本次实际执行证据与限制
tests/                          工具保护、内容保留和比较器回归
upstream/                       Git 克隆缓存，不进入交付包
.build/                         候选与恢复备份，不进入交付包
.validation/                    隔离验证产物，不进入交付包
```

## 3. 日常修改与重新生成

修改本地技能源、策略或精确补丁后：

```bash
# 使用已有干净缓存，只生成候选与差异
node sync-upstreams.mjs --offline
# 审核后重新生成并发布
node sync-upstreams.mjs --offline --apply
node scripts/catalog.mjs
node sync-upstreams.mjs --check
node scripts/catalog.mjs --check
node --test tests/*.test.mjs
```

缓存不存在时去掉 `--offline`，脚本按锁定提交获取源。无参数命令只在 `.build/` 中生成候选与 diff，不覆盖成品，不安装，也不提交。`--apply` 会从源重新生成候选，手改 candidate 不会成为长期适配源。

离线 `--check` 不读缓存、不联网、不运行 Git 或引擎；交付包不带 upstream 仍可验证和安装。`--check` 与 `--apply`、`--update-pins` 等冲突组合会报错；未知参数不会被静默忽略。

## 4. 更新上游 pins

需要跟随配置分支的最新提交时：

```bash
node sync-upstreams.mjs --update-pins --apply
node scripts/catalog.mjs
node --test tests/*.test.mjs
```

脚本先构造候选、应用精确补丁、检查原始资源保留和依赖／链接，再预检现有成品。通过后才发布新输出和 pins。脏缓存、补丁漂移、未知同名技能、缺资源／依赖／适配说明或无效链接会停止；不会通过强制 reset、跳过补丁或减少收录来继续。

上游变化需要人工阅读，特别是执行权限、用户调用边界、外部传输、工具链、原型类型和引擎版本。相同 pin 的再次生成应产生相同内容；上游示例版本不自动升级实际游戏工程。

若审核确认 Matt 原有技能确实删除／改名：先处理依赖与说明，再使用 `--accept-removals`。这只接受来源删除，不绕过补丁、链接或生成物修改保护。

独立的完整保留基线在 `tests/fixtures/matt-retention.json`，记录原始技能身份与资源路径，不把源正文冻结为永不更新。对新增／删除／资源变化完成审核后，才运行：

```bash
node scripts/record-matt-inventory.mjs --record
```

它要求缓存 HEAD 等于当前 pin；审核这个 fixture 的变化后再接受。不要为了让测试通过而删掉条目。

## 5. 生成目录直接手改会怎样

本版在 `--apply` 写入前检查原受管文件的集合与指纹：

- 手工修改：拒绝覆盖。
- 手工删除：拒绝发布。
- 在受管输出中新增未知文件：拒绝发布。
- 输出根或父路径为链接：拒绝。
- 本地适配源／配置改变：允许在适配和候选检查通过后重新生成。

遇到直接修改时，先将改动备份并迁回 `adapters/` 或精确补丁，再按原回执恢复生成物到已记录状态，重新运行同步。不要删除 `.distribution.json` 来解除保护。整个输出目录由本发行版管理，自有技能也应声明为本地源，未知文件会先阻断而不是被悄悄删除。

发布使用目标卷内的恢复备份与回滚，记录 `.build/publish-backup-*/receipt.json`。这是可恢复操作，不是磁盘级原子事务；进程中断、文件占用、磁盘或权限故障仍需按回执确认实际状态。不要无检查地清理恢复目录。

明确的文本扩展名／文件名才归一化 CRLF／LF；其余资源默认按字节精确，即使内容碰巧是合法 UTF-8。脚本执行位也记录并在适用平台验证。每个输入适配文件、配置和生成文件都有摘要。源文件始终从锁定提交的原始 Git blob 构造，不使用可能受 checkout 过滤器或隐藏索引标记影响的工作区字节。

宿主检查缓存由根 ruff.toml 导向 .build/；不要在生成目录运行会写入缓存的分析器。意外缓存同样触发未知文件保护，应先核对并只清理本次缓存，不放宽完整性门禁。

## 6. 适配完整性

生成顺序：

1. 按 pin 读取完整 Matt 与游戏选集，复制整项资源。
2. 复制本地技能；冲突必须明确处理，不能静默覆盖另一个来源。
3. 对原始文本应用精确 oldText／newText 补丁，匹配次数不符失败。
4. 根据实际发布映射重定位跨技能 Markdown 链接；包外上游文件使用锁定提交 permalink。
5. 注入 game-policy 和每技能适配说明，保留正式技能名称与调用限制；misc／in-progress 完全排除。
6. 合入共享策略及全部许可，核对原资源保留、frontmatter、档位闭合和真实链接。
7. 预检原输出未被直接编辑，再发布并读回校验。

Markdown 示例中的占位链接不当作资源；真实资源链接不能以“这是示例”为由忽略。正式技能内的示例 TypeScript 和 HTML 报告仍完整保存，并在适配说明中标明适用条件；低频／实验技能及其专用资源不进入成品。

## 7. 远端工作流

`.github/workflows/validate.yml` 配置 Node 22 的 Linux／Windows／macOS 测试和离线校验。它是配置文件，不代表本次已经在三个平台通过。

`sync-upstreams.yml` 每日 UTC 03:17／北京时间 11:17，或手动触发：先运行测试，更新候选并发布、刷新目录、重跑新产物的游戏内容检查，成功后创建／更新审核 PR。它不自动合并、不安装到开发机、不运行真实游戏。

仓库默认分支包含工作流且 GitHub Actions 与相关权限可用后，工作流才会按配置触发；创建审核 PR 还需要仓库允许工作流执行对应操作。仓库已公开不等于所有 CI 已通过，实际结果以该提交的 Actions 记录为准。

上游变化触发补丁／新技能适配失败时，需要维护者先审核适配源，再重跑。内置 GITHUB_TOKEN 创建的 PR 可能不会触发其他工作流，必需 CI 的触发方式要按 GitHub 实际规则配置，不能据此关闭保护。

## 8. 发布前核对

- 完整 Matt 源身份、原资源、grill-with-docs／wayfinder 与调用边界仍在。
- 生成、目录与内容测试通过，资源没有漏装，安装预检和恢复备份已核实。
- 许可、NOTICE、sources.md 与显著修改说明齐全。
- 未执行的引擎／设备／宿主发现验证如实记录。
- 只在用户要求时更新真实全局安装、提交、推送、创建 PR 或发布版本。
