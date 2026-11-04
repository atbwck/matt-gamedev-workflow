---
name: unreal-runtime-safety
description: >
  Preserve Unreal runtime ownership, UObject/GC reachability, asset and save
  compatibility, and async teardown safety. Use when changing object lifetimes,
  streaming/loading, serialized gameplay data, or game-thread completion paths.
---

# Unreal Runtime Safety

Make the changed feature safe across destruction, world teardown, loading, and old data.
This is a locally authored production workflow, not a replacement Gameplay Framework.

## Identify the runtime contract

- Inspect the relevant `.uproject`, engine build association, modules/plugins,
  `.Build.cs`, UObject/component classes, loading paths, data assets, and save code.
- Record owner lifetime, world/session scope, creator, teardown path, and which
  thread may read or mutate each object. Match APIs to the project's engine version.
- Map serialized inputs and supported prior asset/save versions before changing them.
  Engine property serialization and a game's save compatibility are separate contracts.
- Reuse existing architecture. Introduce streaming, World Partition, or networking
  mechanisms only when the actual task and project already justify them.

## Preserve object lifetime and ownership

- Separate Actor/component destruction from ordinary C++ lifetime and UObject GC.
  An object reachable by GC can still be pending destruction or in an obsolete world.
- Keep persistent owning UObject references visible to GC through supported reflected
  strong references, such as `UPROPERTY` `TObjectPtr` on a reachable owner in UE5.
  A raw member pointer or an unreflected `TObjectPtr` is not a general GC root.
- Use weak references for observers/caches that must not keep an owner alive; resolve
  validity at use time and also check feature/world generation when relevant.
- `Outer`, Actor ownership, attachment, and GC reachability have distinct meanings;
  do not use one as an undocumented substitute for the others.
- Plain C++ owners need an explicit supported GC bridge if they retain UObjects.
  Do not use `TSharedPtr`/`delete` for UObjects or scatter `AddToRoot` as a leak fix.
- Pair registration, delegates, timers, latent work, and handles with idempotent cleanup
  at the appropriate EndPlay/unregister/service-stop boundary, including partial startup.
- Read [ownership and evidence details](references/safety-evidence.md) for affected paths.

## Keep asset and data contracts stable

- Distinguish strong, weak, and soft references. Soft paths do not load or retain an
  asset; use the project's Asset Manager/streaming ownership and cooking rules.
- Own async streaming handles deliberately and release them when no consumer needs
  them. Releasing a handle does not unload an asset held by other strong references.
- Verify runtime soft loads in cooked content. An Editor load or test-added hard
  reference can hide missing cook rules and invalidate the production evidence.
- For World Partition projects, respect cell/actor unload and reload; persistent
  references can affect residency. Add partition-specific work only for such projects.
- Preserve reflected field/type identities and asset references. For intentional renames,
  use project/version-supported redirects or compatibility code and test old fixtures.
- Preserve save schema/version handling, stable gameplay IDs, defaults, and supported
  old records. Do not serialize transient pointers as durable identity or overwrite
  an unreadable/newer save during a failed load.

## Make asynchronous work safe to stop

1. Define ownership and cancellation before launching a timer, async load, task,
   delegate, or save request. Include failure, early exit, and partial initialization.
2. Capture safe handles/immutable values rather than a raw owner that can be destroyed.
   Cancellation may only suppress delivery; it may not abort underlying I/O or work.
3. Invalidate a request generation on stop/world change. Recheck owner validity,
   cancellation, and world/generation before applying a completion.
4. Marshal UObject/world mutations to the game thread using supported project APIs.
   Do not assume arbitrary UObject access is safe in a worker or callback thread.
5. Avoid blocking the game thread waiting for work that needs a game-thread completion.
   Observe errors and release handles even when the request is no longer wanted.
6. Make repeated stop/unbind/release calls safe; a late completion must not restart
   a destroyed component, bind duplicate delegates, or mutate the replacement world.

## Gather acceptance evidence

Use existing tests and [Unreal testing gates](../unreal-testing/SKILL.md). For affected
paths, collect test IDs, logs/reports, and observations for all of these cases:

| Scenario | Required observation |
| --- | --- |
| Destroy/interruption during pending work | No stale access/completion; cleanup terminates |
| Repeated start/stop and world entry/exit | No duplicate delegates/timers or residual service state |
| Resource/level unload and reload | Owning handles released; expected residency and reload work |
| Prior asset and supported old save load | References/defaults/IDs preserved; save/reload succeeds |

Compare residency to a documented cache baseline; do not promise immediate exact RSS
recovery. Exercise relevant GC and cooked-runtime paths, and label Editor-only evidence.
Activate authority, disconnect, and fault-network cases only for a real multiplayer task
using the existing replication/session implementation; do not add a network framework.

## Handoff

Report the ownership and cancellation contract, serialized-data compatibility impact,
changed code/assets, acceptance artifacts, target configuration, and any unexecuted cases.
Static review can identify a risk; it cannot prove a leak fixed or a packaged run passed.

## Official sources

Use the project's engine version in Epic's selector. These sources do not claim that
any engine was run or that APIs were validated against an unspecified local installation.

- [Object pointers](https://dev.epicgames.com/documentation/en-us/unreal-engine/object-pointers-in-unreal-engine)
- [Unreal Object Handling](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-object-handling-in-unreal-engine)
- [Asynchronous asset loading](https://dev.epicgames.com/documentation/en-us/unreal-engine/asynchronous-asset-loading-in-unreal-engine)
- [Core Redirects](https://dev.epicgames.com/documentation/en-us/unreal-engine/core-redirects-in-unreal-engine)
- [World Partition](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine)
