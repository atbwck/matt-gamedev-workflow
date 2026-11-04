# Engine validation matrix

This is a cross-engine selection guide for Unreal Engine, Unity, and Godot. It tells you which evidence a task needs; it does not replace each engine's official documentation or the project's checked-in commands. Confirm the project's actual version before using an API or a command from an example.

## Choose evidence by risk

| Change | Minimum evidence | Stronger evidence |
| --- | --- | --- |
| Pure data/algorithm logic | Fast unit test with a failing case first | Property/edge-case tests, deterministic fixtures |
| Engine object/component lifecycle | Integration test or scene test that creates, uses, and destroys the object | Repeated start/stop, reload, and leak check on the target build |
| Asset/save format or serialization | Round-trip test and an old-format fixture | Migration test from the oldest supported save/asset, rollback check |
| Async/threaded work | Test for cancellation, completion, and main-thread handoff | Stress/repetition and shutdown-while-pending test |
| Input/UI flow | Scripted or manual smoke on the real input device | PlayMode/functional test plus target-device check |
| Rendering/visual change | Captured frame or scene review on the intended renderer | GPU/visual profiler comparison; headless alone is insufficient |
| Performance-sensitive change | Reproducible benchmark and a baseline comparison | Tail frame time, GC/allocation, memory, loading, and thermal/device data |
| Packaging/release change | Cook/export/package and a player smoke run | Platform certification path, clean-machine install, rollback |

## Unreal Engine

- Read the engine association in the `.uproject`, module `*.Build.cs`/`*.Target.cs`, enabled plugins, and the project's automation entry point.
- Automation: Automation Test Framework, Automation Spec/CQTest where the version supports it, Functional Tests for level/gameplay checks, and Gauntlet for packaged multi-process/device sessions. Gauntlet consumes a cooked build; it does not create one for you.
- A command such as `UnrealEditor-Cmd ... -ExecCmds="Automation RunTest <filter>;Quit"` is a starting point, not a universal proof. Verify filter syntax, report output, and whether `Quit` can mask unfinished tests for the installed version. Treat missing reports, zero tests, crashes, and timeouts as failures.
- Packaging: cook content, package the intended target, and launch the packaged result. Record the build configuration (Development/Shipping), target platform, and whether the run used a cooked build.
- Performance: `stat unit`/`stat fps` for triage; Unreal Insights for frame, game/render/RHI thread, loading, and hitch traces; GPU/render-pass profiling for a GPU-bound result. Separate Game, Draw/RHI, and GPU times; they are not additive.
- Lifetime: UObject/GC ownership, weak/soft references, async task cancellation, `EndPlay`/destroy cleanup, replicated state authority, and asset streaming/residency must be considered when the change touches them.

Official starting points (verify the matching version):
- <https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine>
- <https://dev.epicgames.com/documentation/unreal-engine/gauntlet-automation-framework-in-unreal-engine>
- <https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-actor-lifecycle>

## Unity

- Read `ProjectSettings/ProjectVersion.txt`, `Packages/manifest.json` and its lock, the render pipeline (URP/HDRP/built-in), scripting backend (Mono/IL2CPP), and target platforms.
- EditMode tests cover editor/pure logic; PlayMode tests cover scenes, components, coroutines, and runtime lifecycle. Put test assemblies behind asmdefs and keep test code out of player builds where appropriate.
- A batch test command must be checked against the installed Unity version and the project's test assemblies. Parse the result XML/report; a zero exit code without a report or with zero tests is not a pass. Player tests need a built player and the matching test platform.
- Performance Testing Package can record Profiler markers/custom metrics in Editor and players; its player build is a development player unless the project proves otherwise. Use the Profiler and Frame Debugger for CPU/GPU/draw-call attribution; use the Memory Profiler for retention questions.
- Lifetime: `Awake`/`OnEnable`/`Start`/`OnDisable`/`OnDestroy`, coroutine handles, `Awaitable`/Task cancellation, Addressables handle release, `.meta` GUID stability, serialization/Domain Reload, and Jobs/Burst/NativeContainer ownership when the project actually uses them.
- IL2CPP: managed code stripping and reflection can break code that works in the Editor. Verify on the player build, not only in PlayMode.

Official starting points (verify the matching version):
- <https://docs.unity3d.com/Packages/com.unity.test-framework@1.3/manual/course/play-mode-tests.html>
- <https://docs.unity3d.com/Packages/com.unity.test-framework.performance@3.0>

## Godot

- Read `project.godot`, the declared renderer, feature tags, export presets, and whether the project uses GDScript, C#, or both. Godot C# has its own .NET/export constraints; check the project's actual support matrix.
- Import a clean checkout before running tests: `godot --headless --path <project> --import` (or the project's documented equivalent). Without the import cache, `class_name` and imported resources may fail.
- A `SceneTree` runner can test pure logic and some scene behavior. It must count failures and call `quit(1)`; a failed `assert()` in `_initialize()` can stop execution before `quit()` and hang CI. An unresolved `await` also hangs: add a timeout and a CI step timeout.
- Prefer the project's existing GUT/gdUnit4 setup if present. A headless run does not prove GPU rendering, visual output, or real-device performance; use the editor/game profiler and monitors on the intended renderer and hardware for those claims.
- Export/package the real preset and run a smoke check. Verify the player starts and the critical path works; the export command succeeding is not the same as the game running.
- Lifetime: Node/SceneTree ownership, `queue_free`, signals/connections, Resource sharing/UIDs, C# event unsubscribe, `RefCounted`, and WorkerThreadPool/main-thread restrictions.

Official starting points (verify the matching version):
- <https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html>
- <https://docs.godotengine.org/en/stable/classes/class_scenetree.html>

## Reporting

Record: engine/version, platform/device, build configuration, renderer/quality, scene/workload, command/entry point, report path, result (pass/fail/not run), and limitations. A static review can identify a hypothesis; it cannot prove runtime behavior or a performance gain. If the required evidence cannot be produced in the current environment, say so and leave the gate open rather than fabricating a pass.
