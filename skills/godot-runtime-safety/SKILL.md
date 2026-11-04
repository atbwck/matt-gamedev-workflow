---
name: godot-runtime-safety
description: >
  Preserve Godot Node/RefCounted ownership, shared Resource and UID identity,
  old asset/save compatibility, and safe async/thread teardown. Use for scene
  lifecycle, resource loading, C# event, or WorkerThreadPool changes.
---

# Godot Runtime Safety

Keep scene changes, resource sharing, and pending work safe across the feature's lifetime.
This locally authored workflow complements the existing Godot scene/resource/C# skills.

## Establish the project contract

- Inspect `project.godot`, scenes/resources, autoloads, signals, threaded loading,
  save code, and `.csproj`/Godot.NET.Sdk plus addons when managed code is present.
- Record the declared engine series separately from a verified binary, renderer,
  .NET build/SDK, and export target. Use documentation matching those versions.
- Identify each object's creator, owner, scene/session lifetime, cleanup path,
  serialization identity, and thread allowed to mutate it.
- Reuse project architecture. Do not add a loading service, task framework, or network
  stack when the scoped feature can preserve its existing contract directly.

## Distinguish lifetime from scene serialization

- Nodes require explicit lifetime management; freeing a parent frees its children.
  `remove_child()` detaches a node and does not free it. Track detached-node owners.
- Prefer `queue_free()` at safe boundaries. A non-null variable can reference a freed
  instance; check validity, queued deletion, and current request/scene generation.
- A Node's `owner` controls PackedScene serialization, not reference counting or
  automatic lifetime. Set it appropriately for generated nodes that must be packed.
- RefCounted objects release by reference count; cycles or long-lived references can
  retain them. Resources inherit this model and are commonly shared/cached.
- Disconnect active-lifetime signals and cancel/invalidate work when leaving the tree
  where required. Final destruction is a distinct boundary from remove/re-enter.
- `_ready()` is not a universal reset on every re-entry. Use the correct enter/exit or
  explicit feature start/stop path, and make cleanup safe after partial initialization.
- Read [lifetime and evidence details](references/safety-evidence.md) for affected paths.

## Preserve Resource and persisted identity

- Treat a loaded Resource as shared unless the project explicitly creates a private
  instance. Keep mutable runtime state separate from shared authoring configuration.
- Choose Local to Scene or duplication only when its semantics match the desired
  sharing. Check the project's version for nested/external Resource duplication rules;
  do not assume one deep-copy flag makes every subresource independent.
- Preserve `.tscn`/`.tres` references, script class/exported field identities, and UID
  metadata. Move source sidecars with their files where that engine version uses them;
  do not regenerate UIDs to hide a broken reference.
- Distinguish source UID/import metadata from disposable `.godot` cache. Verify moves
  from a clean import and exported artifact, not only a warm editor's UID cache.
- Exported field/type/default changes can alter old resources/scenes and save data.
  Test representative prior fixtures and the project's supported schema conversions;
  engine Resource loading is not a general old-save compatibility guarantee.
- Write player data through the established `user://` path/serializer, preserve stable
  IDs and supported old saves, and avoid replacing unreadable/newer saves on failure.

## Bound async work and thread access

1. Tie signal waits, timers, C# tasks, threaded loads, and worker tasks to an owner
   and generation. Define stop, scene exit, destruction, error, and timeout outcomes.
2. A signal emitter can disappear before completion. Provide a bounded alternative
   route; language `await`/C# `ToSignal` is not automatic lifetime cancellation.
3. Recheck validity, queued deletion, cancellation, active state, and scene/request
   generation before applying a completion; dispose/discard stale results safely.
4. Scene swaps invalidate outgoing tree assumptions. Coordinate completion from a
   surviving owner or new scene; do not access the old scene's tree after replacement.
5. Workers operate on owned/plain data or explicitly supported thread-safe APIs.
   Active SceneTree access and most Node/UI mutation belong on the main thread.
6. Marshal results through a project/version-supported deferred/main-thread mechanism;
   deferred delivery still needs lifetime checks and is not an automatic ownership fix.
7. Use WorkerThreadPool only with explicit task/dependency/cleanup responsibility.
   Do not block the main thread on work that waits for main-thread delivery.
8. For C# keep delegate instances for cleanup, unsubscribe captures/custom events
   deliberately, and observe task failures. Managed GC does not free a Node on demand
   or guarantee a native Godot object remains valid while its wrapper is reachable.

## Gather acceptance evidence

Use the existing runner and [Godot testing gates](../godot-testing/SKILL.md), retaining
scenario/test IDs, engine/fixture versions, and current logs/reports for affected paths:

| Scenario | Required observation |
| --- | --- |
| Free/exit scene during pending work | No freed-instance access, stale mutation, or unresolved required wait |
| Repeated start/stop and scene re-entry | No duplicate connections, tasks, autoload state, or detached nodes |
| Resource unload and reload | Intended references/tasks released; sharing policy and reload remain correct |
| Prior scene/resource and old save load | UID/paths/fields/defaults/IDs survive load and save/reload |

Compare retention to the documented resource/cache baseline; immediate exact RSS is
not a universal unload guarantee. Include clean-import and exported-runtime evidence.
Headless evidence does not prove GPU behavior. Authority, reconnect, and fault-network
cases apply only to actual multiplayer tasks using the existing networking code.

## Handoff

Report lifetime/cancellation/sharing decisions, serialized-data compatibility impact,
acceptance artifacts, export/.NET constraints, and unexecuted cases. Do not present
static inspection as a successful Godot runtime, GPU, or managed build verification.

## Official sources

Select the project's release; `stable` may move to another version. These links do
not claim an engine or worker task was executed or validated in this session.

- [Node](https://docs.godotengine.org/en/stable/classes/class_node.html)
- [RefCounted](https://docs.godotengine.org/en/stable/classes/class_refcounted.html)
- [Resource](https://docs.godotengine.org/en/stable/classes/class_resource.html)
- [Thread-safe APIs](https://docs.godotengine.org/en/stable/tutorials/performance/thread_safe_apis.html)
- [WorkerThreadPool](https://docs.godotengine.org/en/stable/classes/class_workerthreadpool.html)
- [C# signals and event cleanup](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_signals.html)
