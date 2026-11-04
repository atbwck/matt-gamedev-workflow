---
name: unity-testing
description: >
  Build Unity EditMode, PlayMode, and target Player test evidence with correct test
  assemblies, parsed batch results, and packaged smoke coverage. Use for Unity CI
  test gates, IL2CPP/stripping regressions, and measured performance tests.
---

# Unity Testing

Choose tests by the behavior and runtime being proved, then validate their result contract.
This locally authored workflow complements the existing Unity scripting and build skills.

## Establish versions and scope

- Inspect `ProjectSettings/ProjectVersion.txt`, `Packages/manifest.json`, the package
  lock, existing test `.asmdef` files, build profiles/scripts, and current CI commands.
- Record Editor and Test Framework package versions, platform, scripting backend,
  API compatibility, stripping level, render pipeline, and Development Build state.
- Use documentation for those exact Editor/package versions. Package manuals have
  their own version selector; an Editor version does not establish a package version.
- Extend the existing test arrangement. Do not install packages, replace test runners,
  or add platform tooling solely because a possible test layer is listed here.

## Select assemblies and execution mode

| Layer | Use it to establish |
| --- | --- |
| EditMode | Pure logic, editor utilities, import/serialization and asset validation |
| PlayMode in Editor | Scene/component lifecycle, frame/physics integration, gameplay |
| Target Player tests | Backend/AOT, platform, native plugins, stripping and runtime assets |
| Packaged smoke | Actual production startup, built content, a bounded action, shutdown |

- Put tests in test assemblies using the installed Test Framework's `.asmdef`
  conventions; reference runtime assemblies and required test APIs explicitly.
- Restrict EditMode assemblies to Editor. Player-capable test assemblies must not
  depend on `UnityEditor` or an Editor-only assembly; check platform/define constraints.
- Keep runtime assembly dependencies independent of tests, and verify ordinary player
  builds exclude test code while test-player builds discover the required fixtures.
- Check discovery before interpreting a filtered run. A directory named `Tests` alone
  does not establish assembly references, isolation, or Player compatibility.
- Read [assembly and gate details](references/test-gates.md) for the chosen mode.

## Implement a meaningful regression

1. Assert the changed outcome; use EditMode for isolated logic and PlayMode/Player
   when engine frames, native lifetime, or platform behavior are part of the contract.
2. Restore scenes, time scale, static events/state, created objects, temporary files,
   and shared ScriptableObject mutations in teardown, including failed/aborted tests.
3. Give asynchronous waits deadlines and observable conditions; avoid fixed sleeps
   and tests whose expected result is copied from the implementation.
4. For lifetime changes, destroy/disable the owner during pending work, repeat
   enable/disable and Play sessions, and unload/reload relevant content.
5. For serialized changes, load representative existing scenes/prefabs/assets and
   supported old save fixtures, then save/reload. Preserve `.meta` GUID identity.
   Use [runtime safety](../unity-runtime-safety/SKILL.md) for ownership details.

## Make batch results trustworthy

- Derive flags, test platform/filter, result destination, and completion/exit behavior
  from this project's Test Framework version and existing working invocation.
- Test Framework runs are asynchronous. Do not copy build-only `-quit` patterns into
  tests without verifying the runner's documented completion behavior for that version.
- Capture the Editor/Player log, native exit status, build identity, and current XML
  results in a fresh directory. Set a wall-clock deadline for Editor and any child Player.
- Parse the installed version's NUnit-style XML: required test results and counts,
  not only the process exit code or a top-level success log line.
- Fail on test failure, crash, timeout, required incomplete/unexpectedly skipped tests,
  zero required tests, or a missing/malformed/stale report even if exit status is zero.
- A batch wrapper must return nonzero on these failures and preserve diagnostic files.
  Verify a new wrapper with a controlled failure and an empty selection.
- Treat import, compilation, licensing, or Player-connect failures as gate failures,
  never as an empty passing suite. Do not install/activate tooling without authorization.

## Cover built-runtime differences

- BuildReport success and test-player success are separate from production-player smoke.
  Launch the actual artifact using the existing harness; require startup, expected scene,
  representative asset/reflection path, a small action, and bounded clean shutdown.
- Run affected reflection/generic/serializer paths on the intended IL2CPP/AOT target
  and stripping level. Add narrowly justified preservation only for proven missing paths.
- Keep the Performance Testing package optional: use it only when installed/supported
  or the measured task justifies adding it within the user's scope.
- Define metric, units, warmup, repetitions, variability, workload, device, and budget.
  Label Editor, Development, and non-Development player data separately; profiler and
  safety-check overhead make Development results different from the shipping player.
- Unity does not have Unreal's Shipping configuration; identify the actual production
  Build Profile/options. Headless or `-nographics` cannot prove rendering/GPU behavior.
- Authority/reconnect/adverse-network tests apply only to an actual multiplayer task
  and its existing networking stack; they do not justify a new network framework.

## Acceptance and handoff

Report versions, assembly/mode and filter, discovered/executed counts, parsed outcomes,
platform/backend/stripping/configuration, exact validated invocation, logs/XML paths,
wrapper failure/timeout behavior, and production-player smoke evidence.
Include affected interruption, repeated sessions, resource unload, and old data fixtures.
Distinguish a static plan from executed tests; record unavailable device/GPU evidence.

## Official sources

Use these official entry points, then select the project's Editor/package versions.
Their inclusion does not claim this workflow was executed in an Editor or Player.

- [Unity Test Framework manual](https://docs.unity3d.com/Packages/com.unity.test-framework@1.1/manual/index.html)
- [Assembly definitions](https://docs.unity3d.com/Manual/assembly-definitions.html)
- [Performance Testing package](https://docs.unity3d.com/Packages/com.unity.test-framework.performance@3.0/manual/index.html)
- [Managed code stripping](https://docs.unity3d.com/Manual/managed-code-stripping.html)
- [BuildPipeline.BuildPlayer](https://docs.unity3d.com/ScriptReference/BuildPipeline.BuildPlayer.html)
