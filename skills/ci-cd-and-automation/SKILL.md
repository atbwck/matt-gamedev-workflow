---
name: ci-cd-and-automation
description: Design Unreal, Unity and Godot CI gates for compile/static checks, engine tests, cook/export/package smoke, artifacts, caches and scheduled device or performance runs. Use for game build pipelines, test reports and signing isolation; native-game pipelines only.
license: MIT
---

# Game CI/CD and automation

This is a substantially modified local game adaptation of Addy Osmani's
MIT-licensed CI workflow. It is not an upstream release. Read
[sources and local changes](sources.md) for provenance and the license notice.

## Scope

Use this workflow to make game changes verifiable without turning a laptop into
a CI system. It covers Unreal, Unity, and Godot build/test/package gates. A
separate backend or store service uses its own deployment pipeline; its preview
deployments and request-level rollouts are not game build gates.

Read [runtime policy](../../references/game-workflow/runtime-policy.md) and the installed
engine testing skill before choosing commands. Do not install an engine, SDK,
test framework, signing key, or hosted runner merely because this workflow is
active.

## 1. Design the pipeline in layers

| Layer | What it proves | Typical cost |
| --- | --- | --- |
| Fast | Compile/static checks, focused logic tests, data validation | Seconds to a few minutes |
| PR/task | Affected engine integration/PlayMode tests, test reports, a build of the project | Minutes |
| Packaged | Cook/export/package the intended target and run a bounded player smoke | Long; scheduled or opt-in |
| Device/performance | Representative hardware, fixed scenario, approved budget | Expensive; scheduled/nightly |

Keep the fast layer close to the edit loop. Do not run a full engine build,
cook, or device benchmark after every line. Do not silently drop a required
layer because it is slow; schedule it or report it as blocked.

## 2. Use a runner that can actually build the game

- Prefer the project's existing CI runner and engine installation. A hosted
  runner that cannot install the licensed engine/target SDK is not a game build
  runner.
- Cache engine-derived artifacts where the project supports it (for example
  Unreal DDC/DerivedDataCache, Unity `Library`, Godot import cache). Cache keys
  must include engine version, platform, and relevant project/package inputs;
  do not share a mutable cache across incompatible branches.
- Keep build identity in every report: engine/build version, target platform,
  configuration (Development/Shipping or the project's equivalent), renderer,
  and source revision.
- Reserve enough disk and time for engine installs, cook/export, and artifacts.
  Set a project-specific timeout; there is no universal ten-minute target.

## 3. Hand off engine specifics

Use the installed engine testing skill for test discovery, filters, reports,
exit behavior, and packaged smoke:

- `unreal-testing` for Automation/Spec, Functional Tests, version-supported
  CQTest, and Gauntlet/session smoke.
- `unity-testing` for EditMode/PlayMode/Player tests, asmdefs, XML results,
  IL2CPP/stripping, and player smoke.
- `godot-testing` for the project's GUT/gdUnit4 or existing runner, clean
  import, C# build, export preset, and export smoke.

Do not invent one universal command across engines. Each runner has its own
completion, report, and exit contract. A build command that returns zero is not
a test result.

## 4. Make failures authoritative

- Require the expected test set/count and a current structured report. Fail on
  failed/incomplete/skipped-required tests, zero discovered tests, a missing,
  malformed, or stale report, a crash, or a timeout even when the process exits
  zero.
- Translate runner/report failures to a nonzero CI wrapper exit. Preserve native
  logs and result files for diagnosis.
- Validate a new gate with a deliberate failing case, a clean control, an empty
  selection, and a producer error. A gate that has only been seen green is not
  proven.
- Keep unit/logic checks separate from engine integration and packaged smoke;
  one layer's green result does not substitute for another.
- Treat test data as untrusted input: redact secrets and personal data, and do
  not print full save or network payloads.

## 5. Package and smoke the real artifact

- Use the project's existing build/cook/export profile and the intended target.
  Record the configuration and whether the artifact is Development, Test, or
  Shipping/production-equivalent.
- Run the packaged artifact on a bounded scenario: expected map/scene, a small
  gameplay action, representative assets/reflection paths, and clean shutdown.
  A successful cook/export or process launch is not a smoke pass.
- Test the shipping startup path where relevant; editor-only commands, logging,
  or test modules may not exist in a production player.
- Headless/NullRHI runs cover supported CPU/gameplay paths only. Rendering,
  visual quality, and GPU performance need a rendered target run.
- Retain the artifact, its build identity, logs, and smoke result according to
  the project's retention policy.

## 6. Protect credentials and releases

- Isolate untrusted pull-request jobs from store/platform signing keys, engine
  license credentials, production upload rights, and release branches.
- Do not echo secrets in logs, artifacts, test reports, or benchmark files.
  Scope tokens to the minimum repository/environment and rotate them.
- Sign or checksum release artifacts through the platform's process; do not
  hand-edit a lockfile or bypass a required check to make a release.
- A release gate is not a preview deployment. If the project has a separate
  backend/store service, its deployment and rollback policy belongs to that
  service, not to the game client pipeline.

## 7. Report

Report the selected layers, exact commands/wrappers, engine/build identity,
expected/executed test counts, report paths, packaged artifact identity, smoke
result, timeout behavior, cache assumptions, and any layer that was not run.
A configured workflow file is not evidence that a remote job ran or passed.
