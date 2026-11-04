# Runtime policy for native game work

This policy applies whenever a selected game-development or Addy workflow is used for Unreal Engine, Unity, or Godot source. It keeps the workflows inside native-game engineering rather than generic application examples. It does not replace the engine's official documentation, the project's build/test commands, or the user's authorization.

## 1. Establish the real target before choosing a workflow

- Read project evidence: `.uproject` and module/build files for Unreal; `Assets/` plus `ProjectSettings/ProjectVersion.txt` and package manifest/lock for Unity; `project.godot`, export presets, and language/project files for Godot.
- Read project rules and version metadata before proposing APIs. A skill's example version is an authoring baseline, not the installed version. Preserve the project's pinned engine, packages, render pipeline, and target platforms unless migration is explicitly requested.
- In a mixed repository, judge the subproject named by the task. A tooling manifest does not establish the game runtime; if the task is actually outside Unreal, Unity or Godot, report that this game workflow does not apply.
- State the evidence path, engine/version, platform, build configuration, renderer, and measured scenario when those affect the recommendation.

## 2. Keep the rules game-specific

- Use frame/GPU/load/memory/asset budgets, not non-game metrics or package limits.
- Use the engine build/test/package commands, not a non-engine toolchain.
- Use game authority/network/save/mod/plugin boundaries, not unrelated HTTP controls.
- Use engine logs, crash dumps/symbols, frame/memory/loading counters, save/network failure codes, and sampled snapshots, not an always-on telemetry stack.
- Use the project's build/test/cook/export pipeline, not a non-game deployment or preview environment.
- Coverage is useful for pure logic modules; it is not proof for rendering, physics, animation, feel, or performance.

A separate backend or store service, if the project has one, follows its own security, telemetry, and deployment rules. Do not import those controls into the game client or treat them as game evidence. If a requested task is outside Unreal, Unity or Godot, say so and use that project's own workflow; do not invent a game mechanism to satisfy it.

## 3. Quality and performance budgets are project decisions

- A target frame rate converts to a frame budget: `1000 / target_fps` ms. Record the intended platform/device, resolution, quality/renderer settings, build configuration, scene, cold/warm cache, and sample method.
- Report distributions (at least median and a tail such as p95/p99) and hitches, not only average FPS. Keep CPU and GPU measurements separate; they overlap and must not be added into one frame time.
- Editor/development builds are diagnostic, not shipping evidence. A headless run can prove logic and some import/exit behavior; it cannot prove GPU rendering or visual quality.
- Budgets and thresholds are chosen by the project owner. Do not impose a default FPS, resolution, memory ceiling, coverage number, or package size. If no number is agreed, record a baseline and a "must not regress" direction, and label it unenforced.
- Performance work starts from a reproducible baseline and a measured bottleneck. A budget written before implementation is a design constraint, not a measured optimization result.

## 4. Verification is layered

1. **Edit loop:** compile/type/static checks and the narrowest relevant logic tests. Keep this cheap; do not rebuild the whole engine project after every line.
2. **Task/PR gate:** affected unit and engine integration tests, deterministic failure exit codes, test reports, and a build that matches the project's configuration.
3. **Packaged/device gate:** cook/export/package the real target where feasible, run a smoke scenario, and verify the player starts and the critical path works. Build success alone is not a passed gate.
4. **Performance gate:** a fixed benchmark scene on representative hardware, the same build settings, and a before/after comparison with the same sampling method. Keep fast checks in the PR path and expensive device runs in a scheduled or opt-in job.

A missing test report, a zero-test run, a crash, a timeout, or a skipped suite is a failure unless the project explicitly documents why that evidence cannot exist. Never claim a pass from a process that only printed logs.

## 5. Tool and dependency rules

- Use the repository's checked-in build/test wrappers and engine version; do not introduce a new test framework, profiler, telemetry SDK, or package without an explicit project decision.
- Engine tests: Unreal Automation/Functional/Gauntlet, Unity Test Framework/Performance Testing, and Godot's project test runner or existing GUT/gdUnit4 setup. Exact commands are version- and project-specific.
- Source control: keep binary assets and engine-generated folders out of ordinary text diffs where the project uses LFS/Perforce; preserve `.meta`/GUID/UID references. Never run `git reset --hard`, delete assets, or discard uncommitted work as a "cleanup" without explicit authorization.
- Security: validate network input at the server/authority, cap message size/rate, protect save data and platform credentials, and review plugins/assets as supply-chain inputs.
- Diagnostics: prefer engine logs, crash/symbol evidence, frame/memory/loading counters, and sampled state. Do not add a telemetry vendor, request-ID scheme, or per-frame JSON logging merely because a workflow mentions observability.
- CI: use a runner that can build the engine project; cache engine artifacts, keep build identity, and isolate signing/platform credentials from untrusted changes. Do not copy a non-game pipeline or a fixed-time target.

## 6. Skill loading and orchestration

- Discover installed skills from the host's actual skill index/location. Do not construct a source-repository path such as `skills/<category>/<name>/SKILL.md` from a routing table; the installed collection is flat.
- If a referenced skill is not installed, say so and use the closest installed skill or the project's own documentation. Do not pretend it ran.
- `game-production-workflow` is the phase orchestrator; the game `router` selects engine/discipline skills. Do not load all three engines. A skill's suggested order is not permission to skip the user's requested phase.
- Explicit invocation is more reliable than automatic matching. Important gates should be named in the request or the project rules.
