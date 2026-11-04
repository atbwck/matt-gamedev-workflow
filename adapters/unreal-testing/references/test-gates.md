# Unreal test layers and trustworthy gates

Read the section for the selected layer, then apply the result and artifact contract.
All API, flag, and report-schema choices require the project's engine version.

## Automation and Automation Spec

- Inspect existing test prefixes, module type/loading phase, supported application
  contexts, test flags, and build guards before adding a fixture. Confirm discovery
  in the intended Editor, commandlet, or runtime context rather than guessing flags.
- Use simple Automation tests for small synchronous cases; use Spec for readable
  behavior fixtures and scoped setup/teardown where the project already supports it.
- Keep fixtures isolated from developer settings, global registries, prior worlds,
  and saves. Set deterministic seeds and name any external files they create.
- A latent test must have an explicit failure deadline and a completion route on
  every branch. Wall-clock CI timeouts do not replace in-test cancellation/cleanup.
- Avoid synchronous waits that prevent the game thread from advancing the very
  timer, delegate, streaming completion, or world tick being awaited.

## Functional Tests and CQTest

Functional Tests exercise a known map and a ready world. Record the map, actors,
startup condition, expected outcome, and test timeout. A map loading successfully
is setup evidence; assert the feature's state transition and final cleanup.
Do not depend on transient editor actors or an uncooked developer-only test asset.

CQTest can improve C++ fixture and latent-test composition in supported engine
versions. Inspect that engine's plugin descriptor, public headers, documentation,
and project test modules before using it. Do not assume that an example for a later
release, an experimental plugin, or its builder syntax exists in the current one.
Enabling it is a project dependency choice, not a requirement of this workflow.

Exercise runtime destruction in the framework actually installed. An Editor-only
CQTest/Functional fixture still needs a separately observed packaged-runtime path
when the changed behavior depends on cooking, target platform, or build configuration.

## Gauntlet and packaged smoke

Reuse existing Gauntlet nodes/controllers and platform launch configuration where
present. A session contract identifies:

| Contract item | Evidence |
| --- | --- |
| Artifact | Staged build path, build identifier, platform, configuration, content set |
| Launch | Expected executable/process role and startup/map readiness signal |
| Scenario | A bounded action and observable gameplay/asset outcome |
| Completion | Success marker/state, controller result, and expected process shutdown |
| Failure | Assertion, fatal log, crash, wrong map, missing readiness, or deadline |
| Artifacts | Session logs, reports, crash dumps where available, device identity |

A successful launcher exit does not prove the game completed. Determine how the
installed Gauntlet version propagates controller/session failures into UAT and CI.
Capture each relevant process's result if an existing multiplayer task needs
multiple roles; do not create a networking framework to obtain smoke coverage.

For a cooked-content bug, include the actual soft reference or Asset Manager path,
not a direct hard reference added solely by the test that accidentally fixes cooking.
Compare instrumentation-enabled Development/Test evidence with the real Shipping
startup path as needed. Do not promise console exit/report features in Shipping.

## Invocation review without a universal command

Before accepting a project-specific command, verify these items against the exact
engine branch's official docs, installed tooling/help, and existing successful jobs:

1. Correct engine executable or UAT script, project, target, configuration, and map.
2. Exact selector syntax and discovery of the intended test names in that context.
3. Asynchronous completion and final report-writing sequence.
4. How test failure, no selected tests, and crash reach the wrapper's exit status.
5. Report destination and schema for that engine/framework version.
6. Timeout handling, process-tree ownership, and diagnostic collection.

`RunTest` followed by `Quit` can request shutdown before latent work and report
serialization finish. A documented test-exit option or an existing controller is
acceptable only after its completion and failure semantics are established for
this version. A command copied from another engine release is a candidate, not
verified automation. If engine access is unavailable, supply this checklist and
an invocation proposal labelled unverified instead of claiming a working command.

## Result decision table

Use a unique output directory/run identifier. Require a completed report tied to
that run, not a file left by a previous successful job.

| Observation | Gate outcome |
| --- | --- |
| Nonzero runner result, crash, or deadline exceeded | Fail; retain logs/native status |
| Zero status but required tests failed/incomplete/cancelled | Fail |
| Zero tests discovered/executed for a required suite | Fail discovery/filter contract |
| Required test unexpectedly skipped or absent | Fail; explicit approved exclusion is separate |
| Missing, stale, malformed, truncated, or unrecognized report | Fail evidence contract |
| Report success but process/session crashed afterward | Fail; completion must include shutdown |
| Valid current report, expected tests complete, clean process/session | Pass selected scope |

Parse test-level data and aggregate totals using the installed runner's schema.
Reject unknown result states until mapped deliberately. Keep the original report
alongside any CI conversion; an XML/JUnit conversion must retain failed/incomplete
outcomes and counts rather than silently dropping unsupported entries.
Use an explicit, documented waiver for an intentionally empty optional matrix job;
do not let that exception mask an unexpectedly empty required suite.

Validate a new wrapper with one known pass, one intentional failure, an empty
filter, suppressed/missing report, and a bounded hang. These are runner acceptance
checks, not permanent expensive scenarios to rerun for every documentation change.

## Lifecycle and compatibility evidence

For affected ownership/loading/data paths, attach test IDs and artifact paths for:

- Destroying an actor/component or tearing down the world while an async load,
  delegate, latent action, or save completion is pending; no stale owner mutation.
- Two or more start/stop or map-entry cycles; no duplicate timers/delegates/services.
- Unload/reload of the relevant level/assets after releasing the owning references;
  bounded residency relative to the documented cache baseline, not an exact RSS guess.
- Loading representative prior serialized assets and supported old saves in a clean
  process; correct defaults/identifiers and a successful save/reload when applicable.

Record omitted cases with their reason. Headless or NullRHI results do not establish
GPU correctness, visual fidelity, or target GPU performance.
