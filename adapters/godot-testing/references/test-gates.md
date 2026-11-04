# Godot existing-runner and export gates

Read runner handling for test execution, clean-workspace checks for import failures,
and C# or rendered-device coverage only when relevant to the project.

## Discover rather than replace the runner

Inspect enabled addons, checked-in test scripts/scenes, CI jobs, and their pinned
versions. Prefer the established GUT, gdUnit4, or project entry; do not guess a CLI
from an unrelated addon release. Check required Godot series, supported scripting
languages, test discovery rules, and optional C# integration before selecting it.

For a project without testing infrastructure, delegate a lightweight GDScript entry
to the existing headless testing skill linked by `SKILL.md`. Reuse that runner;
this workflow defines additional acceptance checks rather than a second runner.
If extending a basic counter runner, require started/completed test identity and
runtime-error detection, not merely a final `failed == 0` count.

| Question | Evidence to keep |
| --- | --- |
| What was selected? | Existing entry, filters, expected cases/minimum count |
| Did discovery work? | Discovered and executed counts; required cases present |
| Did it finish? | Runner's explicit completed state and fresh final summary/report |
| Did it pass? | Required per-case outcomes, no aborted/unhandled-error path |
| Did failure reach CI? | Native code plus wrapper result derived from parsed evidence |

Use an addon-produced structured report where available. If the existing project
entry emits only counters, preserve its explicit machine-readable completion
summary and case outcomes. Add the narrow reporting needed to distinguish an
aborted function from a pass, without replacing the whole test framework.

`push_error()` and script errors can be printed while a process later returns zero.
A bare assertion can interrupt the function that would have reported or quit.
Fail the gate on unexpected engine script/parse errors using runner support and
captured stderr/stdout; an expected-error test needs a deliberate scoped matcher,
not a global filter hiding all errors. Require both semantic completion and process
completion, and reject missing/stale/unrecognized reports or zero required tests.

## Async and SceneTree integration

Tests needing timers/signals require a running tree/frame context. Wait for that
context through the existing runner before starting a timer or awaiting a signal.
Provide a deadline and a completion route if the owner/emitter exits early. Do not
hold the main thread in a blocking wait for a frame-dependent completion.

Clean up nodes, connections, temporary resources, autoload state, and test-owned
files on failure and interruption. A scene swap removes the outgoing scene before
all follow-up work necessarily finishes; avoid dereferencing its tree after the swap.
Test interruption while a load/signal/C# task is pending and verify no obsolete
completion mutates a replacement scene.

Use an outer wall-clock timeout as a separate backstop. `--quit-after` counts main
loop iterations, can end before a scenario completes, and cannot enforce a reliable
elapsed-time ceiling on a hung operation. On timeout preserve logs and fail the
wrapper, terminating only this run's processes.

Validate a newly added gate with a passing case, intentional assertion failure,
runtime-error case, zero-test filter, missing completion/report, and bounded hang.
These establish runner semantics; ordinary changes only need relevant regression runs.

## Clean import/build evidence

Use an isolated checkout or CI workspace without generated `.godot` imports. Do
not remove caches or generated files from a developer's active workspace merely
to simulate this state. Retain committed source UID/import metadata.

Import with the engine version used by the project, then run tests. Determine the
actual import options and completion behavior from that version's official CLI
documentation and existing scripts. Check import/parse errors and resource/class
resolution instead of treating command termination as enough evidence.

For C# inspect the `.csproj`, Godot.NET.Sdk, target frameworks, optional `global.json`,
engine .NET variant, installed SDK evidence, and test integration package versions.
Use the existing build command/profile. Matching a .NET language version alone does
not establish matching Godot bindings, platform export support, or test-runner support.
Record build logs and failures separately from GDScript test results. If prerequisites
are unavailable, provide an unexecuted procedure; do not install SDKs or claim success.

## Export smoke

Use the project's existing export preset, target, and matching templates. Resolve
flags against the project's Godot version rather than copying newer examples.
Capture export result/logs and identify the newly generated executable/data pack.
An old artifact in an output directory cannot prove the current export succeeded.

Run the exported artifact with the existing smoke entry/scenario and test-owned
`user://` data. Require main-scene readiness, resource and dynamic-data load, a small
feature action, explicit completion, and clean shutdown within a wall-clock limit.
Check non-resource inclusion filters when dynamic JSON/text data is part of the
feature; editor filesystem access can hide an omitted file in an export.

Keep debug and release template evidence separate. Debug checks/assertions and editor
APIs may be absent from release exports, so a test-only entry must not be the only
coverage for production startup. Validate supported old saves with a fresh process
and a fixture copy, preserving the original fixture and player data.

## Rendered coverage and conditional multiplayer

A headless pass proves only the exercised non-rendered path. GPU resource creation,
shader compilation, visual output, and GPU performance require a rendered run on
representative hardware with the intended renderer/platform configuration.
Record the limitation when only headless access exists.

For an actual multiplayer change, extend the existing session test with relevant
authority, disconnect/rejoin, latency/loss, and cleanup assertions. Keep those cases
inactive for offline tasks; this workflow does not introduce a network framework.
