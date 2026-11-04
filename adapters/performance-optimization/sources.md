# performance-optimization 适配说明

本技能是本地维护的融合版，不是任一上游仓库的官方发布。

## 来源

- Addy Osmani, `agent-skills`, MIT：
  https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md
  采用：先测量后优化的流程、基线/复测/噪声判断、保留或回退的纪律、性能预算与回归守卫思路。未采用其 Web 指标、浏览器、前端/后端示例。
- awesome-gamedev-agent-skills, Apache-2.0：
  https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/performance-optimization/SKILL.md
  采用：帧预算计算方法、CPU/GPU 分流、按引擎选择 profiler 的方法、对象池/绘制调用/GC 与资源预算思路。
  该仓库的 NOTICE 和 Apache-2.0 许可证随个人仓库保存在 `LICENSES/`。

## 本地改动

- 合并为一个游戏专用入口技能，只覆盖 Unreal、Unity、Godot，不再安装两个同名技能。
- 引擎识别依赖任务位置和项目证据，不依据固定优先级；混合仓库按子项目判断。
- 删除上游的固定 FPS、包体、延迟和默认子系统预算，改为先读取项目既有目标。
- 删除小程序、网站、后端数据库、Core Web Vitals、Lighthouse 和浏览器示例；非三引擎任务明确报告超出本技能范围。
- 保留帧预算、CPU/GPU 分流、目标设备、冷/暖缓存、打包/Development 证据和可选 benchmark 比较器。
- 诊断流程不依赖上游同级技能或外部脚本；新增可选的本地 `scripts/compare-benchmarks.mjs` 和 `references/benchmark-contract.md`，将已约定的预算变成可重复运行的比较。比较器不采集数据，不产生真实引擎性能证明。
- 比较器拒绝场景/环境漂移、单位或预算变化、删除指标、空/无效样本；回归返回 1，输入/执行错误返回 2，两者都阻断门禁。没有默认 FPS 或容差。

## 维护

- 上游两个原版性能目录和被本地替换的入口目录都由 `distribution.watchSkills` 计算摘要，变化会进入 `.sync-manifest.json` 和同步日志，提醒人工核对；不自动把其内容合进融合版。
- 合并上游新内容时，优先补充“来源”和“本地改动”，不要静默删除与当前实现不符的上游建议。
- 修改本技能后，在个人仓库运行 `node sync-upstreams.mjs --apply` 重新生成 `skills/performance-optimization/`，再运行 `node sync-upstreams.mjs --check`；比较器的回归验证用 `node --test tests/benchmarks.test.mjs`。
