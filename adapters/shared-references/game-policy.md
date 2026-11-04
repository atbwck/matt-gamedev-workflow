# Matt + native game workflow policy

This is a local game adaptation of Matt Pocock's skills and the selected
awesome-gamedev skills. It is not an official upstream release. Read the
skill-specific `GAME-ADAPTATION.md` when linked. These documented adaptations
resolve host and native-game assumptions while preserving the original workflow.
User instructions and the target project's rules remain authoritative.

## Full retention, selective loading

All promoted Matt skills from `engineering` and `productivity` and their sibling
resources are retained. The user explicitly excludes `misc` low-use skills and
`in-progress` experimental skills; they are not published or installed and sync
must not bring them back. Do not initialize an unrelated TypeScript toolchain,
CI hooks, factory or writing workflow for a game task. `grill-with-docs` is the preferred design entry in a project;
`wayfinder` is preserved for work whose unresolved decisions span sessions.
Load one actual engine and the relevant domain skills, never the whole catalog.

Resolve a skill's actual installed name and physical location through the host.
Where upstream says "call the Skill tool", use that host's real skill-loading
mechanism, or read the discovered `SKILL.md` and required resources directly.
Do not invent tools, plugin namespaces, source category paths, or availability.
A link in a skill can locate a resource; it is not proof the host exposes a tool.
User-only skills remain user-only. Recommend the next user-only phase and wait
for a user request; do not chain user-only skills automatically. An explicit
short alias counts as an explicit request for its documented target, with the
same scope, arguments and stopping conditions. A worker never delegates again.

## Establish the game, not just the repository language

- Unreal: inspect the relevant `.uproject`, modules, plugins, engine association
  and actual engine/build metadata. A series string is not an exact patch.
- Unity: `Assets/`, `ProjectSettings/ProjectVersion.txt`, package manifest/lock,
  render pipeline, target platform and scripting backend.
- Godot: `project.godot`, main scene, renderer, export presets, actual executable,
  and `.csproj`/SDK/test addons for C# projects. C# alone does not imply Unity.
- A root `package.json` used by tooling does not turn the game into a web app.
  Preserve existing engine, package, architecture, renderer and asset identities.

Use the task's actual subproject boundary. These game adapters cover Unreal,
Unity and Godot. A separate web/backend/tooling project follows its own rules;
do not claim these native-game procedures validate it. TypeScript-only Matt
utilities remain available when that separate tooling is explicitly in scope.
Verify version-sensitive APIs against matching official docs or engine source.

## Keep Matt's decision and design mechanics

`grill-with-docs` drives `grilling` plus `domain-modeling`: challenge ambiguity,
use concrete edge cases, update resolved domain terms and meaningful ADRs as the
conversation progresses. Existing GDDs, glossary and ADR decisions are inputs;
reuse them and investigate contradictions. Do not flatten the interview to a
checklist or silently fill in player experience or product decisions.

`wayfinder` remains a map of decisions, not an implementation backlog. Preserve
the destination, dependency frontier, fog, out-of-scope boundary, context links,
and one resolved non-research ticket per session. Humans answer HITL tickets.
A map clears the route; `to-spec` synthesizes the decisions and `to-tickets`
creates buildable slices when the user requests those phases.

Use existing issue-tracker configuration. Without one, local Markdown under
`.scratch/<effort>/` is supported; do not require a hosted tracker. Keep glossary
terms free of implementation details; put design choices in ADR/spec documents.

## Test at real game seams

Preserve Matt's public-behavior seams and red-before-green, one vertical slice
at a time. Confirm a new/materially changed seam, and reuse seams already agreed
in the spec, tickets or project rules. Do not ask again merely because a new
session starts. This edition retains Matt's current choice to perform structural
refactoring during review; it does not silently substitute another TDD process.

For games, a seam may be a pure rules API, engine test fixture, scene/prefab/map,
save/load boundary, authority RPC boundary, or rendered player scenario. Test
observable outcomes, not internal call order. Use existing test frameworks.
For visual/feel work without automation, write a repeatable scene and expected
outcome before changes, retain before/after observations, and label manual
coverage. Never call a screenshot or an export an automated gameplay test.

Read [engine validation](engine-validation.md) and the selected `*-testing` skill.
Fast logic/static checks run in the edit loop; expensive engine builds, imports,
full regressions, cook/export, player smoke and device captures run at the
agreed task/CI/device stages. Timeouts, missing/malformed/stale reports, crashes,
and unexpected zero tests fail required gates. Headless is not GPU evidence;
Editor results are not shipping-player evidence. Record blocked checks honestly.

## Native prototypes and game architecture

Choose the cheapest prototype that can answer the actual question. Timing,
physics, rendering, input feel, asset loading and multiplayer behavior need a
version-matched engine scene/map/player or existing harness. HTML can illustrate
a pure state machine or HUD concept but cannot establish engine behavior.
Keep prototypes isolated and clearly disposable; record the question, result,
artifact path and limitations. Moving code to production needs its real tests.

Apply deep-module ideas alongside ECS, components, data assets and engine
lifecycles. Do not force inheritance or a service layer onto engine-native
boundaries. Preserve `.meta`/GUID/UID, old assets/saves, ownership, thread affinity,
async cancellation and resource release. Profile before proposing architecture
changes as optimizations. Use the selected `*-runtime-safety` skill as needed.

## Cross-wiring: Matt phases must reach game knowledge

The two layers are not merely adjacent. Whenever a Matt phase acts on real game code or assets, load `router` from its discovered location, establish the engine, then read the owning engine skill and the applicable `*-testing`, `*-runtime-safety` or `performance-optimization` before judging the change. This applies to `code-review`, `tdd`, `diagnosing-bugs`, `implement` and phase routing, not only to the coordinator entry.

Review in particular must cite the engine skill and executed reports it used; "looks correct for a game" without the selected engine evidence is not a Standards pass. If those skills are outside the installed profile, report the gap instead of reviewing against generic expectations.

## Game quality, performance and review

Reuse `CONSTRAINTS.md`; establish one only when the project needs it. Budgets
come from the project owner and comparable measurements. No invented FPS,
coverage percentage, memory limit, package limit or tolerance. A gate is enforced
only after its actual producer/parser/wrapper rejects deliberate violations,
execution errors, missing reports and empty selections and passes a clean control.

Matt's `code-review` keeps Standards and Spec reviews independent and reports
them separately. In Standards include the project's applicable game constraints:
lifetime, async/threading, asset/save identity, authority, resource retention and
frame/load/memory costs. Repository rules override generic code-smell heuristics.
Do not add a third mandatory review loop. Use `doubt-driven-development` only for
material unresolved high-risk decisions, with its explicit limits.

For performance use `performance-optimization`: target device/build/backend,
scene/seed/cache state, original trace/sample paths, median/tail and hitches.
CPU and GPU overlap and must not be summed as serial frame time. A synthetic
comparator test is not an engine measurement. Game logs, crash symbols, sampling
and actual build/test/package pipelines replace web metrics and deployment
recipes. No automatic telemetry vendor or extra framework installation.

## Host capabilities, permissions and delivery

Use available host tools for isolated reviewers, background research, task
tracking and context management. A fresh context must actually be supported;
otherwise disclose same-context review. Keep authorized work progressing inline
when independent execution is unavailable. Worktree parallelism requires a Git
repository and isolated ownership. Do not reset dirty worktrees or discard assets.
Native `/clear`, `/compact`, UI widgets, slash commands and shell availability
vary by host; recommend only verified controls. In Cindy `/review` and `/plan`
retain their built-in meaning; use `/code-review` or `/game-review` for this pack.

A workflow does not authorize commit, push, PR creation, publishing, external
messages, uploading packets, installing hooks/tools, changing permissions or
editing global config. Follow the user's actual request and existing scoped
authorization. Show concrete work before any necessary approval. Never simulate
a human answer, a review, a model call, a test result or a credential setup.
Use secure host forms for credentials, not chat, generated questionnaires or
committed files. Preserve uncommitted user work and signing/save/player data.

Report completed artifacts, actual commands and results, remaining decisions,
manual versus automated checks, and unavailable engine/device evidence.
