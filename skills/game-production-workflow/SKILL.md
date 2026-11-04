---
name: game-production-workflow
description: Route native game work through the complete Matt skill set and Unreal, Unity or Godot knowledge, preserving grill-with-docs for design and wayfinder for multi-session decisions. Use to choose the next game development phase and validation layer.
license: MIT
---

# Game production workflow

This local coordinator joins Matt's complete skill set to native-game knowledge
and the local validation layer. Read [game policy](../../references/game-workflow/game-policy.md).
It selects an appropriate phase, preserves existing decisions and stops where
that phase ends. It does not automatically invoke user-only Matt workflows.

## 1. Identify target and phase

Read the target project's rules, GDD/spec, glossary/ADRs, tracker configuration,
engine/version evidence, scene/asset layout and existing build/test entry points.
Use the discovered skill names and physical locations. A tooling manifest is not
the game runtime. Load only the relevant engine and domain knowledge through `router`.

| Situation | Entry the user can request | Outcome |
| --- | --- | --- |
| Design that fits a conversation | `grill-with-docs` | Resolved concepts, glossary, meaningful ADRs |
| Large effort with unclear dependencies | `wayfinder` | Shared decision map, frontier and durable context links |
| Discussion ready to become a specification | `to-spec` or `spec` | Scope, interfaces, agreed seams, acceptance and exclusions |
| Specification ready to split | `to-tickets` or `game-plan` | Independent vertical slices with blocking edges |
| One ticket or a well-scoped feature | `implement` or `build` | Behavior at agreed seams, engine evidence, review |
| Whole spec with independent tickets | `implement-spec` | Integration branch and isolated ready-frontier work, when authorized |
| Broken behavior or a regression | `diagnosing-bugs` or `debug` | Red-capable repro, diagnosis, fix and regression evidence |
| Quality agreement missing or changing | `constraint-driven-development` or `constraints` | Project-owned quality contract and gate proof |
| Engine verification requested | `test` | Applicable tests and artifacts, explicit coverage gaps |
| Review requested | `code-review` or `game-review` | Independent Standards/Spec findings plus game risk checks |
| Slow frame, load or memory regression | `performance-optimization` or `perf` | Measured baseline, bottleneck and comparable result |

`grill-with-docs` is the primary design entry in a project, not an optional
replacement for a generic checklist. `wayfinder` is a decision map, not an
implementation backlog. `ask-matt` remains the full Matt navigation reference;
read a target skill before describing its exact behavior. Matt's promoted engineering and productivity skills are retained in full;
low-use misc and experimental in-progress skills are excluded. A review request enters review directly; a small bug does not
require a new GDD, map or quality interview.

## 2. Connect decisions to game acceptance

For design work, model actual game concepts: who can act, when state transitions
happen, how authority resolves conflicts, what persists, and what the player
observes. Keep config assets separate from runtime instances. Consult existing
terminology and inspect the code when statements conflict. Record resolved
language in the glossary and consequential decisions in ADRs, using Matt formats.

If wayfinding, retain its destination, one question per decision ticket, typed
research/prototype/grilling/task tickets, blocking edges, frontier, fog and
out-of-scope boundaries. Research can run independently; HITL decisions need the
human. Preserve one resolved non-research ticket per session. No automatic push
or unrequested execution when the map becomes clear.

## 3. Implement through agreed seams

A slice covers one complete player/system behavior with its assets and failure
conditions. Respect Matt's `tdd`: red before green, public behavior, one slice at
a time, no implementation-coupled or tautological tests. Reuse already agreed
seams; establish newly material boundaries with the user. This edition retains
Matt's structural-refactoring-at-review choice. Do not silently add a second TDD
methodology or require full builds after every edit.

For pure logic, use the project's logic test entry. For engine behavior, use the
selected `unreal-testing`, `unity-testing` or `godot-testing` guidance and existing
framework. Visual/feel changes without automation need a repeatable scene,
before/after observation and a documented automation gap. Keep `.meta`/GUID/UID,
serialization and old saves intact. Use the corresponding runtime-safety skill
for lifetime, cancellation, resources or cross-thread changes.

## 4. Validate and review at the appropriate cost

Read [engine gates](../../references/game-workflow/engine-validation.md).
Run focused checks in the edit loop, affected integration tests at task/PR gates,
and actual cook/export/player/device scenarios when the change requires them.
Validate reports and expected test discovery; timeout or a missing report is not
success. A headless run is not GPU evidence and an exported artifact is not a
passed playable smoke scenario.

Use Matt's two-axis `code-review`, keeping Standards and Spec findings separate.
Standards include the approved game quality contract, authority, lifetime,
threads, save/asset compatibility and hot-path performance. Profiling is driven
by symptoms, risk and budgets; optimize only measured causes. An optional bounded
`doubt-driven-development` review can challenge a major uncertain decision before
it becomes expensive, without replacing the final two-axis review.

## 5. Deliver and leave durable context

Report the engine/build evidence, scope, actual changed files/assets, executed
commands/report paths, manual observations, approved budgets, review findings,
and checks not run. Use Matt's `handoff` when work needs to travel to another
session/harness/directory. Commit, push, issue publication, dependency changes,
hooks and external messages follow the user's scoped authorization. Do not
invent successful reviews, engine runs, isolated contexts or performance data.
