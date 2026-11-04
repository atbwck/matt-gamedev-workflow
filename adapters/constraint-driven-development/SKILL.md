---
name: constraint-driven-development
description: >
  Establish a game project's written quality contract, verify that its gates
  detect failures, and prevent silent lowering of standards. Use when setting
  quality gates, agreeing game performance budgets, adopting measured ratchets,
  or investigating checks weakened to obtain a pass. Supports Unreal, Unity,
  and Godot without prescribing FPS, coverage, or build frequency.
license: MIT
---

# Constraint-Driven Development for Games

This is a substantially modified local game adaptation of Addy Osmani's MIT
skill, not an upstream release. Read [sources and local changes](sources.md)
for provenance, retained mechanisms, and the license notice.

## Scope and discovery

Use this workflow to establish or deliberately revise a quality contract.
If a contract already exists, read and follow it; do not restart its intake or
rewrite its standards merely because a new task begins. A review request alone
needs review, not a new governance system.

Start at the task's runtime subproject. Read project rules, existing constraints,
CI, build/test wrappers, test filters, and engine/version evidence. Follow the
[runtime policy](../../references/game-workflow/runtime-policy.md) and consult
[engine validation](../../references/game-workflow/engine-validation.md) for applicable checks.
A root tooling manifest does not identify the game's runtime.

Before using another skill, resolve its actual `name` and `location` from the
host's discovered catalog and read that location. Names below are routing hints,
not proof of installation. Never construct a skill path from upstream categories.
If unavailable, use project tooling and report the capability gap; do not install
skills, packages, profilers, plugins, hooks, or services automatically.

## 1. Agree the contract from evidence

Summarize the current bar and unknowns before asking anything. Reuse decisions
already made. Ask only unresolved material choices, one question at a time:

- Which dimensions matter for this task and target devices: correctness,
  architecture, input trust, accessibility, performance, or another stated goal?
- Which checks block, which advise, and at which lifecycle stages?
- Which approved targets exist, or should comparable measurements establish a
  candidate baseline and ratchet? State measurement cost and uncertainty.
- What turnaround can this project tolerate locally and in CI or device testing?

No answer supplies consent to invented numbers. Candidate FPS, coverage, memory,
load, package, tolerance, or timing values remain **not enforced** until agreed.
In noninteractive runs, preserve existing rules, record missing decisions, and
continue independent work; do not simulate an interview or invent approval.

## 2. Write the quality contract

Adapt [CONSTRAINTS.template.md](assets/CONSTRAINTS.template.md) at the agreed
project boundary. Preserve existing rule files; add only a scoped pointer using
[AGENTS.template.md](assets/AGENTS.template.md) when authorized by the task.
`CONSTRAINTS.md` is canonical; wrappers and CI must mirror its versioned rules.

For each dimension record the rationale, target/scope, owner, approved threshold
or invariant, units, exact command and working directory, verdict parser, output
artifacts, and run stage. Separate draft, measured/advisory, and enforced rules.
A report-producing command alone does not enforce a threshold. A written floor
is a review obligation, not evidence that an automated guard exists.

Retain this floor and review its whole change set, including staged, unstaged,
untracked, removed, and relevant binary/configuration changes:

- No newly hidden checker results, suppression comments, ignored paths, or
  warning downgrades without a reviewed, scoped exception.
- No skipped/deleted tests, removed assertions, narrower discovery filters, or
  empty suites used to obtain green; inspect replacement coverage and intent.
- No unfinished required behavior concealed by stubs, empty catches, or TODOs.
- No secrets in source or reports; report rule and location, never secret values.
- No weakening the contract, gate wiring, or exception policy to pass the task.

Use engine-specific evidence: C++/C# warning suppressions, Unity ignored tests,
Godot warning ignores, Automation/Test Framework filters, asset validation
exclusions, and build flags can all lower the bar. Pattern matches require
context; do not label every intentional deletion or annotation a violation.

## 3. Place and prove every gate

Prefer existing maintained checks. Resolve missing tooling as a documented gap
or an explicitly authorized tooling task. Do not copy commands from another
stack into engine projects or invent an executable placeholder and call it verified.

Place cheap static checks and focused tests near the work; put costly engine
compilation, integration, asset import, cook/export, device tests, and profiling
at the project-agreed slice/task/CI stages. Do not require compilation after
every edit or prescribe universal time limits. Scope checks without hiding
cross-module regressions. Reuse valid reports from the same relevant revision.

Before marking **each gate**, including a floor guard or ratchet, enforced:

1. Run its exact lifecycle/CI command against a deliberate violation in an
   isolated fixture or reversible task-owned change; require a failing verdict.
2. Run a clean control; require a passing verdict. For numeric/severity gates,
   test the comparator boundary and a permitted value/finding as well.
3. Prove that producer/tool errors, timeout, absent/malformed/stale reports,
   unsupported report versions, and unexpected empty test/sample sets fail.
   A scanner that exits successfully with findings still needs verdict parsing.
4. Exercise the producer, parser, and final wrapper together, preserving evidence
   for all cases. Parser-only fixtures do not prove CI wiring. Label synthetic
   validation data; never present it as a measured runtime baseline.
5. Restore only task-owned validation changes; keep output paths and exit/verdict
   evidence. Any missing proof leaves the gate **not enforced**, with an owner.

Never turn an error or a missing report into an empty clean result. Distinguish
pass, violation, and execution error, with both latter outcomes failing the gate.
A floor guard must fail if its comparison base or change inventory is unavailable.

## 4. Measure budgets and ratchet honestly

Use [benchmark-scenario.template.md](assets/benchmark-scenario.template.md) to
record hardware/OS, exact engine/tool versions, renderer/backend, build settings,
scene/workload, seed, cache state, sampling, raw evidence, and repeat variability.
Keep frame-time distributions/hitches, CPU/GPU, allocations/GC where applicable,
memory, cold/warm loading, and package size separate; averages alone hide hitches.
Only derive a frame budget from an approved target: `1000 / target_fps` ms.

When no number exists, measure first and propose holding that comparable baseline.
A ratchet specifies direction, units, baseline artifact/revision, tolerance and
its measured rationale, comparator, update authority, and lifecycle stage.
It becomes enforced only after agreement and the same gate proof above.
Tighten on reproducible improvement under that authority; do not replace a baseline
with a lucky run, silently rebaseline regressions, or compare different devices,
cache states, build modes, render quality, or workloads as equivalent.

Budget design belongs upfront; optimization changes require measured evidence.
Use a discovered `performance-optimization` for baseline and hotspot work.
Check provenance: engine/vendor validation or measured target-device behavior can
supply evidence beyond author-written tests. Record absent independent evidence
as a limitation, not a reason to install a scanner or fabricate a pass.

## 5. Protect the bar and hand off

Compare contract, wrappers, filters, exclusions, assertions, baselines, rendering
settings, and exceptions with the agreed base. Lower resolution or fidelity can
improve a number while violating the contract. Make tradeoffs explicit.
An exception needs rule/path scope, reason, approver, owner, expiry, and follow-up;
an expired exception cannot authorize a pass. Never self-approve or silently extend it.

Report the contract location/version, enforced versus not enforced dimensions,
commands/stages and gate proof artifacts, baseline/ratchet decisions, guard
findings, exceptions, and unavailable checks. Use `ci-cd-and-automation` only when
pipeline work is in scope, and `code-review` for the final bar review.
