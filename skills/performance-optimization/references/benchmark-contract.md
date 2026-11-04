# 性能样本比较契约（schemaVersion 1）

这是可选的、无第三方依赖的 Node ESM 比较器，不采集性能、不启动引擎、不验证测量真实性。
使用 Node.js 22+。从**已安装技能的实际目录**运行，而不是假定游戏仓库里有本发行版的
`adapters/` 路径：

```bash
node <skill-dir>/scripts/compare-benchmarks.mjs baseline.json candidate.json
```

`<skill-dir>` 是宿主发现并返回的 `performance-optimization` 技能物理目录（例如
`$HOME/.agents/skills/performance-optimization`）。如果项目没有 Node.js，这是项目门禁的
一个未满足前置条件；不要仅为运行比较器自动安装运行时。

维护本技能源码时才在发行版源码仓库运行其自测：

```bash
node --test tests/benchmarks.test.mjs
```

该自测验证比较器的算术和契约，不是游戏项目的性能验收，也不能证明某个引擎或设备测量通过。

只读两个 UTF-8 JSON 文件，不改写输入、不生成报告文件、不访问网络。只有两个位置参数，
不支持自动接受新基线或修改预算。所有路径（包括带空格的路径）按 shell 规则加引号。

## 输入契约

根对象必须且只能包含：

| 字段 | 要求 |
| --- | --- |
| `schemaVersion` | 数字 `1`，不能是字符串或其他版本 |
| `scenarioId` | 非空字符串，双方完全一致；代表固定场景、工作负载和采集协议 |
| `environment` | 下述可扩展 JSON 对象；双方深度相等 |
| `metrics` | 非空对象，以非空指标名映射到指标对象；双方指标集合完全相同 |

`environment` 必须明确包含以下七个**非空字符串**，不能依赖工具推断或隐式默认值：

| 字段 | 应记录的内容 |
| --- | --- |
| `hardware` | 真实目标设备型号、CPU/GPU、RAM 等；不要包含设备序列号等秘密 |
| `engineVersion` | 引擎的确切版本/自定义构建标识；非引擎任务写实际运行时版本 |
| `buildConfiguration` | 例如 Shipping、Release、Development；包含影响测量的编译/分析选项 |
| `renderingBackend` | 例如 Vulkan、D3D12、Metal；确实无渲染时明确写 `not-applicable` |
| `resolution` | 实际渲染分辨率；动态分辨率策略也应明确记录 |
| `quality` | 实际画质预设及覆盖项，不能只写一个未定义的“默认” |
| `cacheState` | 明确冷/暖 cache 状态及重置/预热协议 |

可增加任意 JSON 字段，包括嵌套对象、数组、字符串、布尔值、有限数字和 `null`。
推荐补充 OS/驱动版本、渲染管线及包版本、功耗/温控模式、帧率上限/VSync、场景种子、
采样时长、轮次数、预热/冷启动规则和分析器选项。对象键序不影响比较，数组顺序有意义；
新增、移除、类型变化或任意值漂移都拒绝比较。相同的描述只是自报信息，不证明实测条件相同。
输入不得包含秘密；输出不回显环境值，但错误路径会包含环境字段名。

每项指标必须且只能包含：

| 字段 | 要求 |
| --- | --- |
| `unit` | 非空字符串，双方完全一致；不做单位换算 |
| `direction` | `lower` 或 `higher`，越小/越大越好 |
| `samples` | 至少一个有限数字的数组；不接受字符串、`null`、`NaN`、`Infinity` 或溢出的 `1e400` |
| `statistic` | `median`、`p95` 或 `p99` |
| `maxRegressionPercent` | 必填、有限、非负数字；`0` 表示不允许恶化，不是缺省容差 |
| `absoluteLimit` | 可选、有限、非负数字；`lower` 时是上限，`higher` 时是下限 |

样本允许负值以支持一般有符号指标；预算不允许负值。根对象和指标对象拒绝未知字段，
避免把拼错的门槛当成有效输入。新候选指标也**拒绝**（exit 2），不默默忽略；先由人工
审核建立相应的 baseline，再进入正常比较。候选不能删除指标。

### 人审控制预算

`unit`、`direction`、`statistic`、`maxRegressionPercent`、`absoluteLimit` 的存在性和值
都必须与 baseline **完全一致**；无论放宽还是收紧、添加还是删除门槛，候选都不能改动。
实际判断只使用 baseline 的预算。没有默认 FPS、帧预算、绝对上限或变化容差，示例数字也
不是推荐值。帧预算如需从目标帧率推导，应由项目负责人明确目标后以 `1000 / target_fps`
计算并人工批准，不能借此自动给 CPU/GPU 分配固定子预算。

工具不能阻止同时篡改两个文件。baseline 必须由代码审查/受保护的 CI 来源管理，不从
候选分支自动覆盖或自动放宽。基线更新需保留人工决策、原始 trace/report 路径、采样协议
和预算理由。代码版本、报告路径、采集时间等有意不同的运行元数据保留在外部审计记录，
不要放入必须相同的 `environment` 后再要求比较器忽略它们。

## 统计、预算及零基线

每个指标分别排序副本，不修改原样本，不合并不同指标：

- `median`：奇数取中间值，偶数取两个中间值的中点。
- `p95`/`p99`：采用 **nearest-rank**，升序后取从 1 开始的第
  `ceil(n * 95 / 100)` / `ceil(n * 99 / 100)` 项，不插值、不取 `floor`。
  例如 `[1, 2, 100]` 的 p95 是 `100`；`1..20` 的 p95 是 `19`；`1..100` 的 p99 是 `99`。
- 至少一个样本是语法要求，**不是测量充分性保证**。少量数据的高分位往往就是最大值；
  必须采集足够多且具代表性的分位数据，评估尾部稳定性，不应拿这些极短示例当实测协议。

令 `B`、`C` 为 baseline/candidate 的统计值。方向调整后的恶化量：

```text
lower: D = C - B
higher: D = B - C
B != 0: regressionPercent = D / abs(B) * 100
```

正值表示恶化，负值表示改善；相对检查为
`regressionPercent <= baseline.maxRegressionPercent`，边界等于预算时通过。
不额外舍入或添加 epsilon，遵循 JavaScript 数字精度；计算发生不可表示的非有限结果则
fail-closed（exit 2），不会让 `Infinity`/`NaN` 被 JSON 序列化成 `null` 后误通过。

**零基线明确保守处理**：`B == 0` 时，没有可解释的有限百分比。

- `C == B`：百分比报告为 `0`，相对检查通过。
- 改善：百分比报告为 `null`，相对检查通过。
- 任何恶化：百分比报告为 `null`，相对检查失败（exit 1），即使批准的百分比预算很大。
- 三种情况均标记 `normalization: "zeroBaseline"`；其他基线标记 `"absoluteBaseline"`。

若配置 absoluteLimit，则候选的 `C <= absoluteLimit`（lower）或
`C >= absoluteLimit`（higher）也必须满足，**两种预算是 AND**。绝对预算检查候选值，
即使基线本身已经超出预算，候选仅改善但仍超绝对预算也不能通过。

CPU 和 GPU 流水阶段可能重叠，比较器**不会把 CPU/GPU 相加**，也不会生成“总帧时间”。
总帧时间必须是独立采集的原始 `samples` 指标。不要用 CPU/GPU 均值、相加值、FPS 的均值
或其他代理量伪造总帧时间样本，也不要把多轮各自的 p95 再当原始帧样本计算 p95。

## 输出与退出码

stdout 始终输出一行紧凑 JSON，stderr 不输出输入片段或堆栈：

| exit | `status` | 含义 |
| --- | --- | --- |
| `0` | `passed` | 输入可比，所有指标符合批准的预算 |
| `1` | `failed` | 输入可比，至少一个指标超预算 |
| `2` | `invalid` | 用法/读取/JSON/schema/环境/指标契约错误，或算术溢出；未得出预算结论 |

有效输出的 `summary` 按指标名排列，每项包含 `unit`、`direction`、`statistic`、
`baselineValue`、`candidateValue`、`regressionPercent`、`normalization`、baseline 的
`budget`、`regressionPassed`、`absolutePassed` 和总 `passed`。
未配置绝对预算时 `absolutePassed` 为 `null`，不是缺失检查。
不输出 `environment`、原始 samples、scenarioId、输入文件路径或 JSON 解析器原始报错。

无效输出的 `summary` 为空，不输出半份成功结果。例如：

```json
{"schemaVersion":1,"status":"invalid","summary":{},"error":{"code":"ENVIRONMENT_MISMATCH","path":"/candidate/environment/cacheState"}}
```

`error.path` 是逻辑 JSON Pointer（`~`/`/` 转义为 `~0`/`~1`），只定位输入角色和字段，
不包含环境值；读取/解析失败仅定位 `/baseline` 或 `/candidate`。错误码不代表测量的可信度。
作为模块导入时仅提供无副作用的 `compareBenchmarks(baseline, candidate)`；成功返回相同
报告对象，输入无效则抛出带 `code`/`path` 的错误。CLI 将该错误转换为 exit 2 JSON。

## 合成示例（不是实测）

下面两份 JSON **全部为合成数据**，只演示输入格式，不来自任何真实硬件或 profiler。
样本数不足以证明 p95 稳定性，示例预算也不是游戏目标或默认门槛。

`baseline.json`：

```json
{
  "schemaVersion": 1,
  "scenarioId": "synthetic-arena-fixed-seed",
  "environment": {
    "hardware": "Synthetic target; CPU A; GPU B; 16 GiB RAM",
    "engineVersion": "Synthetic engine 1.0.0",
    "buildConfiguration": "Shipping",
    "renderingBackend": "Vulkan",
    "resolution": "1920x1080",
    "quality": "High; dynamic resolution off",
    "cacheState": "warm; synthetic protocol",
    "capture": { "warmupSeconds": 30, "runs": 3, "vsync": false }
  },
  "metrics": {
    "frameTime": {
      "unit": "ms", "direction": "lower", "samples": [10, 12, 11, 13, 12],
      "statistic": "median", "maxRegressionPercent": 5, "absoluteLimit": 14
    },
    "gpuTime": {
      "unit": "ms", "direction": "lower", "samples": [7, 9, 8, 10, 8],
      "statistic": "p95", "maxRegressionPercent": 5, "absoluteLimit": 12
    }
  }
}
```

`candidate.json`（只改变 samples）：

```json
{
  "schemaVersion": 1,
  "scenarioId": "synthetic-arena-fixed-seed",
  "environment": {
    "hardware": "Synthetic target; CPU A; GPU B; 16 GiB RAM",
    "engineVersion": "Synthetic engine 1.0.0",
    "buildConfiguration": "Shipping",
    "renderingBackend": "Vulkan",
    "resolution": "1920x1080",
    "quality": "High; dynamic resolution off",
    "cacheState": "warm; synthetic protocol",
    "capture": { "warmupSeconds": 30, "runs": 3, "vsync": false }
  },
  "metrics": {
    "frameTime": {
      "unit": "ms", "direction": "lower", "samples": [11, 12, 12, 13, 12],
      "statistic": "median", "maxRegressionPercent": 5, "absoluteLimit": 14
    },
    "gpuTime": {
      "unit": "ms", "direction": "lower", "samples": [7, 8, 8, 9, 8],
      "statistic": "p95", "maxRegressionPercent": 5, "absoluteLimit": 12
    }
  }
}
```

此合成对比 exit 0：frameTime 的 median 为 `12 → 12 ms`，gpuTime 的 p95 为 `10 → 9 ms`。
这只是算术结果，不能写成“实测提升”或“优化已验证”。

## 采集与解释限制

1. 在**真实目标设备**和有代表性的场景/工作负载上采样。固定输入、场景种子、分辨率、
   画质、驱动、功耗、温控、VSync/帧率上限、cache 和分析选项，避免拿不同环境的结果比较。
2. 明确预热协议：稳定 JIT、shader、资源缓存后再采暖态样本；冷启动则每轮按同一协议重置。
   不要把预热样本混入稳定态，也不要为隐藏 hitch 而删去有效的慢样本。
3. 做多轮独立采集，保留每轮原始 trace/report、样本、采集顺序和变异信息；考虑交错运行
   baseline/candidate 以观察温漂、后台负载和热降频。记录样本来自逐帧、请求还是整轮测量。
   工具只计算输入分布，不替你验证独立性、代表性、采样变异或跨轮合并是否合理。
4. Editor、Development build、Deep Profile 和 profiler 连接可能产生额外开销。
   Development overhead 必须显式标记并保持双方一致；诊断数据不等于 Shipping 表现，
   不要用它替代目标发布构建复测。
5. Node 测试/headless CI 只验证此比较器的逻辑。**不能用 GPU headless 验证渲染性能或总帧时间**；
   无渲染、软件渲染或不同 GPU 的 headless 结果不能证明目标设备 GPU/画面性能通过。
   没有目标运行条件时，只交付采集步骤或已有数据的预算比较，不声称已完成性能实测。
6. exit 0 仅说明所给数字满足人审门槛，不证明统计显著性、测量可信、视觉一致、功能正确，
   或真实性能改善。比较器不计算置信区间、噪声阈值或显著性；采样变异与预算适当性由人评估，
   正确性仍需现有功能测试与运行时验证。
