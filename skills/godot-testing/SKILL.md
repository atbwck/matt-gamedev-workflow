---
name: godot-testing
description: >
  Validate Godot projects using their existing GUT, gdUnit4, or project test entry,
  with reliable headless results, clean import/build checks, and export smoke tests.
  Use for Godot CI gates, lifecycle/data regressions, or C# test compatibility.
---

# Godot Testing

Extend the project's testing path and prove the intended imported and exported behavior.
This locally authored production workflow adds gates around existing runners.

## Establish the project and versions

- Inspect `project.godot`, enabled addons, test directories and launch scripts,
  `export_presets.cfg`, existing CI, and `.csproj`/SDK pinning when C# is present.
- Record the declared engine series separately from a verified executable version.
  Identify renderer, standard versus .NET build, target platform, and export templates.
- Match Godot documentation, addon release, and .NET/SDK requirements to the project.
  Do not inherit a fixed version or successful-run claim from a neighboring skill.
- Reuse existing authorized tooling; do not install an addon, change engine version,
  or introduce a parallel test framework just to follow this workflow.

## Reuse the test entry point

1. Prefer the project's working GUT, gdUnit4, or established test scene/script/CI entry.
   Read its pinned release documentation for CLI, result format, exit, and timeout rules.
2. Check that the chosen runner supports the project's Godot version and test language.
   Do not assume a GDScript addon executes C# fixtures or every gdUnit4 release does.
3. If no runner exists and lightweight GDScript tests are needed, use the existing
   [GDScript headless testing skill](../../skills/godot-gdscript-headless-testing/SKILL.md).
   Extend that approach with project-specific completion evidence; do not create
   another runner here or copy an alternate assertion implementation into this skill.
4. Separate pure-data checks from SceneTree integration requiring frames, physics,
   autoloads, input, or signals. A script parser pass is not an integration test.
5. Read [runner and export gate details](references/test-gates.md) only as needed.

## Define regressions and completion

- Assert an observable outcome, use deterministic fixtures, and isolate temporary
  `user://` data from developer/player saves. Restore autoload and shared Resource state.
- Wait for actual conditions/signals with deadlines, including a route when the emitter
  is freed or a scene changes. A fixed frame count is not evidence that work completed.
- Test freeing/removing the owner during a pending signal, threaded load, or C# task;
  repeat scene entry/exit and service start/stop, then unload/reload affected resources.
- Load representative prior `.tscn`/`.tres` assets and supported old save fixtures.
  Preserve UID relationships and verify re-save/reload behavior when data changes.
- Use [runtime safety](../godot-runtime-safety/SKILL.md) for lifecycle/thread ownership.

## Make headless results authoritative

- Resolve the exact invocation from the existing runner's installed-version docs
  and project scripts. Do not invent universal GUT/gdUnit4/C# flags or result schemas.
- Use a fresh report location and record the expected test set/count. Capture stdout,
  stderr, engine/runner identity, elapsed time, native status, and completion summary.
- Parse structured results when the runner supports them. Otherwise require its existing
  explicit machine-readable counts and completion contract; do not accept logs alone.
- Fail on failed/incomplete required tests, zero required tests, missing/malformed/stale
  results, crash, script/parse errors, or timeout even if the native process exits zero.
- `assert()`/`push_error()` alone do not establish a nonzero process status. Runtime
  errors can abort a function before a naive runner counts failure or reaches shutdown.
- Require an explicit nonzero CI wrapper result on failed evidence. Validate a new gate
  with a deliberate failing case, an empty selection, and interrupted completion.
- Set bounded async waits and an outer wall-clock timeout; retain diagnostics and
  terminate only processes owned by this run. Report timeout as failure.

## Verify clean import, build, and export

- In an isolated clean checkout/cache location, import with the project's engine before
  tests so generated imports and class registrations do not depend on a developer cache.
  Preserve source `.uid`/`.import` metadata; do not delete a developer workspace cache.
- For C#, verify the .NET engine, Godot.NET.Sdk, target frameworks, SDK, test runner,
  and export-platform support together. Build through the existing project path;
  a successful GDScript run does not establish managed compilation or runtime support.
- Export using an existing preset and exactly matching templates. Check logs/status,
  expected artifact and resource inclusion, then run the exported artifact's smoke path.
- Require the correct main scene, representative imported resources and dynamic data,
  a bounded action, and clean completion. Successful export alone is insufficient.
- Treat `--quit-after` as a frame-count shutdown aid, not a wall-clock deadline or
  a success assertion. Require a scenario completion marker/result before accepting exit.
- Headless can establish supported CPU/SceneTree behavior; it cannot prove GPU rendering,
  shader correctness, visual quality, or GPU performance. Use a rendered target run.
- Exercise authority/disconnect/adverse-network cases only for an actual multiplayer
  task using the project's existing networking implementation.

## Acceptance and handoff

Report engine/addon/.NET versions, selected entry and filter, counts and outcomes,
validated invocation, stdout/stderr/report paths, timeout and failure propagation,
clean import/build outcome, preset/artifact identity, and export smoke evidence.
Include affected destruction, repeated start/stop, resource release, and old data cases.
Separate executed evidence from static procedures; state missing runtime/GPU coverage.

## Official sources

Select the project's Godot documentation version; `stable` may refer to a different
release. These links do not imply an engine, addon, build, or export was run.

- [Command line tutorial](https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html)
- [C# basics and compatibility](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_basics.html)
- [Exporting projects](https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html)
- [Thread-safe APIs](https://docs.godotengine.org/en/stable/tutorials/performance/thread_safe_apis.html)
