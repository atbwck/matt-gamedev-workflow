---
name: test
description: Run applicable tests for an Unreal, Unity or Godot project using its existing entry points, validate reports and state the engine/player coverage limits.
disable-model-invocation: true
---

# Test the actual game

Read [game policy](../../references/game-workflow/game-policy.md) and [engine validation](../../references/game-workflow/engine-validation.md).

1. Inspect project rules, engine/version, changed behavior/assets, existing runner, approved quality contract and requested verification stage. Use the target subproject, not a root tooling manifest.
2. Resolve the selected engine testing skill (`unreal-testing`, `unity-testing` or `godot-testing`) through its installed location and read it. If it is absent from the installed profile, report that gap; do not install a runner or substitute another engine.
3. Use the existing project commands for the relevant logic/static, engine integration, resource/scene and cook/export/player layers. Run the agreed checks; do not infer a universal command from this document. Keep costly device/performance runs at their agreed stage.
4. Preserve current stdout/stderr, structured reports, expected test set/count, engine/build identity and timeout status. Missing/stale/malformed reports, zero required tests, crashes and execution errors fail required gates even if an underlying process returned zero.
5. Report passed/failed/not-run layers separately. A package export does not prove player startup; headless does not prove rendered/GPU behavior. Missing engine/device access remains unverified, not passed.

This entry tests the existing implementation; it does not implicitly invoke a new interview, spec, TDD implementation phase or unrequested repair.
