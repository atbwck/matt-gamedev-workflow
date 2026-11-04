# Unity assembly, result, and Player evidence

Read assembly setup for discovery problems, gate handling for CI, and the target
Player/performance sections only when those runtime differences affect the task.

## Test assembly contract

Inspect existing `.asmdef` references, platform include/exclude rules, define/version
constraints, and the installed Test Framework's test-assembly markers/references.
Do not paste an assembly JSON schema from another package generation. Prefer the
project's working assembly or that version's Editor-generated test assembly setup.

| Assembly | Dependencies and constraints |
| --- | --- |
| Runtime production | No dependency on test or Editor assemblies |
| EditMode tests | Runtime under test plus version-supported test APIs; Editor-only |
| PlayMode tests | Runtime under test plus test APIs; no accidental Editor dependency |
| Player-compatible tests | Valid on target/backend; any required platform defines explicit |

An Editor PlayMode pass does not prove a PlayMode assembly can run in a Player.
Inspect code behind platform conditionals, references to Editor-only assets or
plugins, and test-only defines. Verify that the test build includes the fixtures
while an ordinary production build omits test assemblies and test-only content.
Do not make runtime code depend on tests to resolve discovery problems.

## Fixtures that survive reruns

Use setup/teardown for objects, additive scenes, file fixtures, changed time scale,
static state, and event registrations. Preserve user/project assets: write transient
outputs into test-owned locations, and undo only changes made by the fixture.
A test must remain meaningful when run alone, in a suite, and in a second session.

Use lifecycle or frame-aware assertions when a destroyed object's native teardown
is deferred. Do not assert immediately after `Destroy` that all native data has
already disappeared. Include explicit cancellation tests for asynchronous methods;
`await` is not automatically bound to a MonoBehaviour's enabled/destroyed state.

With Domain Reload disabled, repeated Editor Play sessions can retain statics and
event registrations. Test the project's actual reload settings; do not change them
to hide a leak. A clean-process Player test complements this Editor-specific case.

## Batch invocation and evidence

There is no package-independent command that proves all three test modes. Resolve
and record the executable, project, platform/build target, test selection, report
path, logging path, and completion behavior using the installed package's manual.
Check whether any proposed `-quit` option would terminate asynchronous tests early.
Keep build `-executeMethod` and Test Framework run completion contracts distinct.

Capture logs and results from the Editor and spawned Player when applicable. A
Player launch/connect failure must not turn into a successful empty Editor report.
Use fresh per-run paths; compare expected suite/test identifiers and required counts.

For the installed NUnit-style result schema, evaluate:

- A complete, parseable document belonging to the current run and selected mode.
- Required test-case IDs/names, executed totals, and failure/error/incomplete states.
- Required cases that are missing, filtered out, unexpectedly skipped, or not runnable.
- Suite-level setup/teardown/compilation failures, even with no failed test-case node.
- Native exit status, Player crashes/disconnects, and elapsed-time limits.

Different Test Framework/NUnit generations encode result and count attributes
differently. Do not assume a single attribute or grep for the word `Passed`.
An unrecognized schema or status is an evidence failure until explicitly handled.
An approved exclusion can waive an optional case; it cannot silently waive a
missing required suite. An empty required run always fails.

A CI wrapper returns nonzero if the process or parsed evidence fails. Preserve the
raw XML and native codes alongside converted CI reports. Validate a new gate using
a known pass, a deliberate failing assertion, an empty filter, a missing report,
and a bounded hang. Scope timeout cleanup to this run's Editor/Player processes;
collect available logs before terminating them.

## Target Player, AOT, and stripping

For a relevant IL2CPP bug, test the intended platform/backend and managed stripping
level. Include reflection-only constructors/methods, generic instantiations, custom
serializers, managed callbacks from native code, and plugins actually used by the
changed path. An Editor or Mono pass does not establish IL2CPP/AOT correctness.

If evidence shows removal, preserve only the necessary types/members with supported
linker annotations or `link.xml`, then retest that path. Broadly disabling stripping
or preserving an entire assembly conceals coverage gaps and can inflate builds.
Reflection preservation and AOT generic-code generation are distinct requirements;
verify both on target instead of treating a linker annotation as a universal cure.

Record `BuildReport.summary.result` and verify the artifact exists. Then run the
ordinary production player's startup/scene/content path. A Test Runner Player can
carry extra assemblies and settings, so it is separate evidence from this smoke.
Where supported, smoke should load real built Addressables content/catalogs rather
than rely on Editor Asset Database behavior.

## Performance Testing package, when justified

Keep the package/version already used by the project. Add it only when a measured
regression/budget benefits from repeatable sampling and the project supports it.
Do not add it for an ordinary correctness test or claim it is included everywhere.

Record the metric (frame time, allocation, load duration, etc.), units, sample count,
warmup, repetitions, statistic, variability, device, graphics settings, and cache
state. Avoid arbitrary universal thresholds; use the project's budget/baseline.

| Capture | Interpretation |
| --- | --- |
| Editor | Useful for local diagnosis; Editor work affects results |
| Development Player | Diagnostic instrumentation/safety checks can change cost |
| Non-Development production Player | Evidence for that shipping build/device/workload |

Do not combine these populations or claim a Development speedup as a measured
production speedup. Use stable hardware/workloads and report noise before setting
a CI performance threshold. `-nographics`/headless behavior cannot prove GPU timing,
shader compilation correctness, rendered output, or visual quality.

## Safety acceptance attachments

For affected paths, link the test and report that demonstrates destruction during
pending work, repeated enable/disable and Play sessions, load/unload/reload with
balanced resource ownership, and old scene/prefab/asset/save compatibility.
Record handle/native-memory baselines where relevant; exact RSS return is not a
reliable universal unload assertion because caches and allocators retain memory.
