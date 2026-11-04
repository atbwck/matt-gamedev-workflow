---
name: performance-optimization
description: >
  Diagnose and improve measured performance in Unreal Engine, Unity and Godot.
  Use for low FPS, frame drops, stutter, loading delays, memory growth, GC spikes,
  engine profiling and game performance budgets.
  Also use for 性能优化、掉帧、卡顿、加载慢、内存增长。
  After activation, inspect the task's project or subproject and choose its
  runtime-specific profiling workflow before proposing changes.
---

# Performance optimization

A standalone, locally maintained workflow for native game performance.
It combines the measurement discipline of Addy's engineering skills with the
engine-specific focus of gamedev-skills, and adds task-scoped project routing.
Its diagnosis workflow has no required sibling skill or external tool dependency.
For a reproducible regression gate, this skill also bundles an optional Node.js
comparator and its input contract; use them only when that verification is in scope.

## Activation and boundaries

- Use when investigating a reported slowdown, a measured regression, or an
  explicit performance budget. An explicit request for this skill also activates it.
- This file is instructions read by an agent, not an executable project detector
  or a background monitor. Automatic activation depends on the host and model.
- Follow the user's task and project rules. Do not optimize unrelated systems,
  migrate engines/frameworks, or install profiling/telemetry dependencies merely
  because this workflow mentions them.
- Treat suspected causes as hypotheses until a trace or measurement supports them.

## 1. Identify the actual target

1. Start from the game project, file, directory, scene, or runtime named in the request.
   If none is named, start from the current working directory and relevant project rules.
2. Inspect nearby manifests and source entry points; walk ancestors only as needed.
   Avoid bulk scans of generated assets, build outputs, dependency folders, and caches.
   Targeted inspection of a generated runtime entry or export manifest is allowed
   when that is the surface named by the task; do not scan the whole output tree.
3. Use the closest relevant game project boundary. A root-level `package.json`
   used only for tooling does not establish the game's runtime. If the task is
   actually outside Unreal, Unity or Godot, state that it is outside this skill's
   game-profiling scope and use that project's own workflow without guessing.
4. Read project rules and version metadata. Prefer an explicit project routing
   policy when consistent with the actual target; report stale/conflicting rules.
   If source metadata disagrees with the running/exported build, establish which
   build is being measured before selecting version-sensitive profiling steps.
5. Choose the primary branch by the reported symptom and runtime surface. If the
   cause may cross a boundary, collect a small baseline on both sides to locate it;
   do not assume which side is responsible before measuring.
6. If no runtime can be established after inspecting available project evidence,
   or several projects remain equally plausible without a task target, report
   the evidence gap and ask one question identifying the runtime/target and symptom.
   Do not guess an engine or stop unrelated read-only investigation.

| Branch | Evidence to inspect | Measurement focus |
| --- | --- | --- |
| Unreal | Relevant `*.uproject`, gameplay modules, `.Build.cs`; engine association/build metadata | Frame pacing, game/render/RHI threads, GPU passes, loading, memory |
| Unity | `Assets/` together with `ProjectSettings/ProjectVersion.txt`; `Packages/manifest.json` | Main/render threads, GPU, managed allocations, assets, loading |
| Godot | Relevant `project.godot`, scenes/scripts and export configuration | Script/physics/render time, draw calls, memory, loading |
| Other/unknown | Existing runtime/toolchain and source evidence | State the coverage gap; do not invent a supported engine |

Godot C# scripts alone do not imply Unity. For an exported game, distinguish
engine initialization, asset decoding, gameplay, physics and rendering stages.
A transport or distribution problem is not automatically an engine frame-time
bottleneck; investigate it through the project's own relevant tooling.

Before profiling, state the chosen branch, evidence path, relevant version, and
primary metric. Report a numeric Unreal association such as `5.6` as the declared
major/minor association, not proof of a particular patch/custom build. Resolve a
custom identifier from the installed engine/build metadata when needed. Likewise,
Godot feature tags can establish a declared series without an exact patch version.
Verify the running executable/build metadata when the distinction matters, and
check version-sensitive APIs and profiler steps against official documentation.

## 2. Establish a reproducible baseline

- Record target hardware/device, OS, build configuration, scene/workload,
  workload, resolution, rendering settings, and cold/warm-cache conditions.
- Read existing performance budgets. For games, derive the frame budget from
  the intended target: `frame_budget_ms = 1000 / target_fps`. Do not impose a
  default FPS, memory or package limit, or generic subsystem budget.
- Measure the symptom the player experiences, not just a convenient proxy:
  frame-time distribution and hitches, cold/warm loading, memory residency,
  simulation/input latency, or the relevant gameplay/server tick cost.
- Capture enough repeated runs or samples to estimate variability. Preserve raw
  trace/report paths and units so the comparison can be reproduced.
- Use the actual target device and representative build where practical. Editor
  and development-build traces are useful for diagnosis; label their overhead
  and do not present their numbers as shipping-build performance.
- If runtime access is unavailable, request an existing trace or produce a
  concrete capture procedure. Static inspection can identify hypotheses, not a
  measured bottleneck or a verified speedup.

## 3. Select the profiling branch

### Unreal Engine

- Use `stat unit` for initial timing triage and Unreal Insights for thread, loading,
  and hitch investigation. Use GPU/render-pass profiling for a measured GPU issue.
- Distinguish game, render, RHI, GPU, I/O, and synchronization/wait costs.
  Check VSync and frame caps before treating idle/wait time as wasted computation.
- Follow measured costs into tick/AI/physics, asset loading, resource residency,
  draw submission, shaders, shadows, geometry, or overdraw as applicable.
- Respect UObject lifetime/GC, render/game-thread boundaries, streaming behavior,
  and the project's networking requirements when evaluating a change.

### Unity

- Use the Unity Profiler on the relevant player; use Frame Debugger for draw
  submission questions and memory tooling when memory/asset retention is the symptom.
- Distinguish main thread, render thread, GPU, allocations/GC, asset loading, and
  waits. Record the render pipeline and relevant package versions before changes.
- Consider caching, buffer reuse, pooling, batching/instancing, culling, or asset
  changes only when the trace identifies their cost. Do not prescribe pooling
  or DOTS simply because the project is Unity.
- Preserve object/component lifecycle, serialization, `.meta` GUID references,
  physics behavior, and the chosen render pipeline's compatibility constraints.

### Godot

- Use the debugger Profiler, render/visual profiling where supported, and
  performance monitors appropriate to the project's Godot version and renderer.
- Separate script, physics, rendering, allocations/resource retention, and I/O.
  Investigate repeated scene-tree work or resource instantiation only if measured.
- Consider MultiMesh, visibility/LOD, fewer allocations, or scheduling changes
  only for the identified bottleneck; preserve signal and node lifecycle behavior.
- For C# projects, include managed allocations/GC when relevant; do not describe
  GDScript object lifetimes as though they were Unity's managed GC.

For all game branches: CPU and GPU stages overlap; do not add their timings as
though they were fully serial. Draw-call reduction can address CPU submission
cost as well as rendering cost; it is not automatically a GPU optimization.
Pooling can retain more memory and requires correct reset/collision/process state.
Do not trade visual quality, resolution, simulation fidelity, or correctness for
speed without making that tradeoff explicit and obtaining task authorization.

## 4. Change one cause and verify

1. Name the measured bottleneck, proposed change, expected metric, and correctness
   invariants. Prefer reducing work before adding an architectural mechanism.
2. Make the smallest change that addresses it. Keep unrelated user changes intact.
3. Exercise the affected runtime path and existing relevant correctness checks.
4. Re-measure with the same workload, settings, sampling method, and cache state.
   Report baseline, result, units, variability, and build/device limitations.
5. Retain the optimization only if it addresses the agreed goal without breaking
   behavior. Remove only this attempt's changes if it regresses or adds complexity
   without measurable benefit; do not reset the user's working tree.
6. Record useful conclusions, including rejected attempts, in the project's
   existing change record. Add a regression budget/check only when justified by
   the task and sufficiently stable; do not create a monitoring project by default.

## 5. Preserve a benchmark and compare it reproducibly

For an agreed regression budget, preserve a fixed benchmark scenario with target
hardware, exact engine/build version, renderer/pipeline, resolution and quality,
cache/prewarm protocol, scene/seed/workload, sampling method, and raw trace paths.
Record multiple comparable runs and variability. Frame-time percentiles need
sufficient original frame samples; do not calculate p95 from a few run averages.
The sample comparator can enforce a chosen numerical budget; it does not collect
traces or prove statistical significance or the truth of the supplied environment.

Read [the benchmark contract](references/benchmark-contract.md) before using
`scripts/compare-benchmarks.mjs` from this skill's actual installed location.
The CLI takes two JSON file arguments (baseline, candidate), reads them without
mutation, and returns exit 0 for a comparable pass, 1 for a budget violation, and
2 for missing/malformed/incomparable data or a tool/contract error. Both 1 and 2
must fail the CI gate. A candidate cannot remove metrics, change units/direction,
or edit the baseline's budgets. Protect the approved baseline separately from
the candidate branch; changing both files can bypass any comparator.

Do not call the gate enforced until the actual project wrapper is exercised with
a deliberate violation, a clean control, a missing report, and a producer error.
Synthetic comparator fixtures prove its arithmetic/validation, not an engine
measurement. If the project has no representative build/device/trace access,
record a capture procedure and leave its runtime-performance gate unverified.

## Completion report

Report: selected runtime and evidence; reproducible scenario and environment;
measured bottleneck; change made; before/after metric with variability; behavior
verification; remaining limitations. If only a static review was possible, label
findings as hypotheses and do not claim that performance improved.

## Sources and maintenance

This is a local synthesis, not an official release of either upstream project.
Review upstream changes deliberately; do not overwrite this file during bulk updates.

- Addy engineering performance workflow (MIT):
  https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md
- Game performance workflow (Apache-2.0):
  https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/performance-optimization/SKILL.md
