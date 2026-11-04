---
name: unreal-testing
description: >
  Design and validate Unreal Engine test gates with Automation/Spec, Functional Tests,
  version-supported CQTest, and Gauntlet. Use for Unreal test selection, reliable CI
  results, lifecycle regressions, or packaged smoke tests; not storefront publishing.
---

# Unreal Testing

Build evidence for the changed behavior at the cheapest useful engine test layer.
This is a locally authored production workflow complementing the existing Unreal skills.

## Establish the project contract

- Read the relevant `.uproject`, engine association/build metadata, test modules,
  `.Build.cs`, enabled plugins, maps, targets, and existing CI entry points.
- A declared engine association does not prove the installed patch or custom build.
  Record the actual executable/build when available; otherwise label it unverified.
- Match official documentation to that engine version before choosing APIs, flags,
  report formats, completion hooks, or a platform/device runner.
- Reuse project conventions and authorized tooling. Do not install a framework,
  replace CI, or build an unrelated platform merely because this skill lists it.

## Select a layer

| Layer | Appropriate evidence |
| --- | --- |
| Automation tests / Automation Spec | Fast deterministic logic, fixtures, engine-facing assertions |
| Functional Tests | Map/world behavior, actors, components, physics, latent integration |
| CQTest | Fixture/latent C++ tests when that engine version and project support the plugin |
| Gauntlet | Launch, supervise, and evaluate real sessions, including packaged smoke |

- Keep pure logic below map/session tests; exercise real engine lifetime at integration level.
- Check test module loading phase, dependencies, context flags, discovery/filter names,
  and target inclusion. An Editor-only test cannot prove a packaged runtime path.
- CQTest is optional and version-dependent. Confirm its installed API and build support;
  retain existing Automation/Spec conventions when CQTest is unavailable or unnecessary.
- Gauntlet orchestrates sessions; the session still needs observable success/failure criteria.
  Read [layer and runner details](references/test-gates.md) for the chosen layer.

## Implement the regression

1. State the user-visible invariant and reproduce its failure at the selected layer.
2. Make setup independent of execution order, prior maps, editor state, and local saves.
3. Prefer condition/event completion with a deadline over arbitrary fixed sleeps.
4. Restore changed console variables, delegates, timers, worlds, files, and services.
   Teardown must also run after failure, timeout, or an interrupted latent operation.
5. For lifetime-sensitive changes, destroy the owner while work is pending, restart
   twice, unload/reload relevant resources, and load a representative old asset/save.
   Use [runtime safety](../unreal-runtime-safety/SKILL.md) for the ownership contract.

## Make the automation gate authoritative

- Derive the invocation from the project's exact engine-version documentation and
  existing working runner. Preserve the resolved executable, arguments, filter, and map.
- Do not copy `Automation RunTest ...;Quit` into CI: queued asynchronous tests may
  still be running when `Quit` executes. Validate the version's supported test-complete
  exit mechanism, or use an existing controller that waits for completion and report flush.
- Do not invent a universal command combining Automation, CQTest, and Gauntlet.
  Each selected runner has its own target, completion, reporting, and exit contract.
- Give every run a fresh artifact directory and a known expected test set/minimum count.
  Capture stdout/stderr, runner logs, report files, build identity, and elapsed time.
- Parse the version's structured report and test outcomes as well as the process result.
  Required failed, incomplete, cancelled, or unexpectedly skipped tests fail the gate.
- Zero discovered/executed required tests, a missing/malformed/stale report, a crash,
  or missing completion evidence must fail even when a process returns zero.
- Translate runner/report failure to a nonzero CI wrapper exit; preserve native codes.
  Verify this with an intentional failing test before relying on a new gate.
- Set per-test/latent deadlines and an outer wall-clock timeout. On timeout collect
  available diagnostics, stop only this run's process tree, and mark the run failed.

## Exercise the packaged artifact

- Use the project's existing build/cook/stage profile and the intended target platform.
  Record Development/Test/Shipping configuration and which test instrumentation exists.
- Launch the staged executable with a bounded Gauntlet session or existing smoke harness.
  Require the intended map, representative cooked/soft-loaded assets, a small gameplay
  action, and clean shutdown; successful cooking or process creation is insufficient.
- Test the shipping configuration's real startup path when relevant; do not assume
  editor tests, console commands, logging, or automation modules exist in Shipping.
- NullRHI/headless runs cover supported CPU/gameplay paths only. Use a rendered run
  on representative hardware for rendering/GPU or visual claims.
- Activate authority, reconnect, and adverse-network scenarios only for an actual
  multiplayer task using its existing networking implementation.

## Acceptance and handoff

Report engine/build identity, selected layers, discovered/executed counts, failures,
configuration/platform, exact validated invocation, report/log paths, timeout policy,
and packaged smoke outcome. Separate executed evidence from a proposed procedure.
For relevant safety changes include interruption, repeated start/stop, unload/reload,
and old asset/save fixture results. State unavailable engine/device/report evidence;
reading this skill or statically inspecting code does not constitute an engine run.

## Official sources

Select the project's version in Epic's documentation; these entry links are not proof
that a particular engine version was run or that its command syntax was validated.

- [Automation Test Framework](https://dev.epicgames.com/documentation/en-us/unreal-engine/automation-test-framework-in-unreal-engine)
- [Automation Spec](https://dev.epicgames.com/documentation/en-us/unreal-engine/automation-spec-in-unreal-engine)
- [Functional Testing](https://dev.epicgames.com/documentation/en-us/unreal-engine/functional-testing-in-unreal-engine)
- [Gauntlet Automation Framework](https://dev.epicgames.com/documentation/en-us/unreal-engine/gauntlet-automation-framework-in-unreal-engine)
- [Packaging projects](https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project)
