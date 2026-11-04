---
name: unity-runtime-safety
description: >
  Preserve Unity object/native-resource ownership, serialized asset and save
  compatibility, and cancellable async lifetimes. Use for lifecycle, Addressables,
  Domain Reload, serialization, or existing NativeContainer/Jobs teardown changes.
---

# Unity Runtime Safety

Keep the changed Unity feature correct across disable, destruction, reload, and old data.
This is a locally authored workflow for the project's current runtime and packages.

## Establish versions and ownership

- Inspect `ProjectVersion.txt`, package manifest/lock, relevant `.asmdef` files,
  scenes/prefabs/ScriptableObjects, async code, reload options, and save serializers.
- Record the Editor/package versions, target/backend/stripping level, and actual
  production Build Profile. Match documentation to both Editor and package versions.
- For each object/handle/subscription, identify creator, owner, intended lifetime,
  release path, thread, and behavior if initialization or a pending request fails.
- Reuse installed architecture. Addressables is conditional on its use in the project;
  Jobs/Burst changes require measured need and compatible project/platform support.

## Separate managed and native lifetime

- A C# reference can outlive a destroyed `UnityEngine.Object`'s native object. Use
  Unity validity semantics before engine access; `ReferenceEquals`, `?.`, and `??`
  do not provide the same destroyed-object check as Unity's overloaded equality.
- Pair event/service registration in the correct active lifetime with unregistration.
  Stop owned work on disable when required; destruction is a separate final boundary.
- Deactivating a GameObject, disabling a component, unloading a scene, and destroying
  an object have different callback/coroutine effects. Test the actual transition.
- Use idempotent cleanup after partial startup. Destroy runtime-created engine objects
  when owned, and dispose native resources deliberately; C# GC alone does not do this.
- Keep long-lived static/services from retaining scene objects, closures, and listeners.
  Avoid depending on a global cross-object Awake/Start order.
- Read [ownership and evidence details](references/safety-evidence.md) for affected paths.

## Preserve assets, identity, and data

- Move/rename assets and scripts with their `.meta` files; GUID changes can break scenes,
  prefabs, materials, and saved references. Do not regenerate identity as a repair shortcut.
- Keep shared ScriptableObject configuration separate from per-instance mutable state.
  Define reset/clone ownership and avoid persisting unintended Editor play mutations.
- Respect Unity's supported serialized field/type rules. For a field rename use a
  supported compatibility attribute where appropriate, then test prior asset fixtures.
- Type/assembly moves, `SerializeReference` identities, enum values, prefab overrides,
  and custom serializers need their own compatibility evidence; field-rename support
  is not a general save-data converter. Preserve stable gameplay IDs and old defaults.
- Test actual Domain Reload and Scene Reload settings. With reload disabled, explicitly
  reset static state and subscriptions at supported initialization boundaries;
  do not assume every ScriptableObject `OnEnable` runs at each Play session.
- Preserve supported old saves and reject/handle unreadable/newer data deliberately.
  Test fixture copies; a failed load must not silently overwrite the original save.

## Handle async and native work deliberately

1. Tie requests to an active owner/generation and cancellation policy. Cache supported
   destruction/exit tokens while valid; use project-compatible cancellation on older APIs.
2. Define disable separately from destruction; `await` does not automatically stop at
   either boundary. Cancel/suppress delivery and observe errors on every terminal path.
3. Before applying a completion, recheck token, owner validity, active state, and request
   generation. Late results must release their owned resources without reviving the owner.
4. Marshal Unity API access to the main thread through a supported project mechanism.
   Background continuations and callbacks are not universally main-thread continuations.
5. With Addressables, track successful and failed operation handles and instantiated
   instance ownership; use the matching release API without double release or early unload.
6. With existing NativeContainers/Jobs, honor dependencies, allocator lifetime, exclusive
   access, and disposal order. Complete/schedule disposal safely before data can be freed.
7. Do not introduce Jobs/Burst merely as a safety fix or speculative optimization.
   Establish a measured bottleneck, package/API support, target compatibility, and evidence.

## Gather acceptance evidence

Use existing fixtures and [Unity testing gates](../unity-testing/SKILL.md). For affected
paths, retain the scenario/test ID, current report/logs, and concrete observations:

| Scenario | Required observation |
| --- | --- |
| Disable/destroy during pending work | No stale Unity access; cancellation/errors and releases observed |
| Repeated enable/disable and Play sessions | No duplicate listeners/statics; actual reload settings pass |
| Resource/scene unload and reload | Balanced Addressables/native ownership; content usable after reload |
| Prior scene/prefab/asset and old save load | GUIDs, fields/defaults, IDs and save/reload behavior preserved |

Measure retained resources against a documented cache baseline, not exact immediate RSS.
Use the intended backend/stripping level for reflection/AOT paths; Editor or Development
results do not establish production-player behavior or production performance.
Authority, reconnect, and adverse-network tests activate only for an actual multiplayer
task using the existing network stack; this skill does not add a network framework.

## Handoff

Report the ownership/cancellation changes, compatibility impact, configuration and
package versions, acceptance artifacts, and unavailable target evidence. Static review
cannot prove leak removal, IL2CPP correctness, or a successful player smoke test.

## Official sources

Select the project's Editor/package versions; the package URLs below are documentation
entry points, not a claim that these versions are installed or were run.

- [Object lifetime/equality](https://docs.unity3d.com/ScriptReference/Object-operator_eq.html)
- [Serialization rules](https://docs.unity3d.com/Manual/script-serialization-rules.html)
- [Domain Reload](https://docs.unity3d.com/Manual/domain-reloading.html)
- [Asset metadata](https://docs.unity3d.com/Manual/AssetMetadata.html)
- [Addressables memory management](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html)
- [NativeContainer safety](https://docs.unity3d.com/Manual/JobSystemNativeContainer.html)
