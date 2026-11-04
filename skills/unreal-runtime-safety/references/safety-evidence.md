# Unreal ownership, cancellation, and compatibility evidence

Use ownership checks for every affected retained object; read streaming/partition
and data sections only when those mechanisms exist in the task's project.

## Ownership ledger

For each retained object or subscription, record creator, retaining owner, intended
scope, cleanup event, and late-callback behavior. Distinguish these mechanisms:

| Mechanism | Contract |
| --- | --- |
| Reflected strong UObject reference | Retains through a reachable GC owner; not permission to use a destroyed Actor |
| Weak UObject reference | Does not retain; resolve/check before use and reject stale world/generation |
| Soft object path/reference | Identifies an asset; does not itself load or keep it resident |
| Outer / Actor owner / attachment | Engine identity, gameplay ownership, or transform hierarchy; not interchangeable GC guarantees |
| Streaming handle | A load/residency contract with explicit lifetime; other references may retain content |
| Delegate/timer/service registration | Work/subscription lifetime that needs an explicit unbind/stop owner |

For UE5 reflected persistent members, use `UPROPERTY` with appropriate supported
object pointer types. A local temporary can use a raw pointer within a safe scope;
do not mechanically convert every access to a strong reference and accidentally
pin worlds/assets. A non-UObject C++ owner needs a supported bridge such as
`FGCObject` or an appropriate strong handle when retention is actually required.

Do not manually delete UObjects. Avoid rooting as default ownership: every root
requires deliberate release and can retain a large graph. UObject reachability
is distinct from Actor/Component usability; EndPlay can make work invalid long
before GC reclaims memory. Clean gameplay work at EndPlay/unregister/feature stop,
not only in a final destructor or GC destruction callback.

## Teardown and async completion

Use the existing project's lifecycle hooks, preserving required base calls. Stop
new requests, invalidate the generation, detach delegates/timers, cancel/suppress
pending deliveries, and release owned resources. Cleanup must tolerate startup
failing halfway through and being called again.

A safe completion checks owner validity, the feature's active state, request token,
and world identity on the correct thread. Resolving a weak pointer alone does not
prove the result belongs to the current level or latest request. Avoid raw `this`
captures across lifetime boundaries; use the engine/project-supported weak callback
binding or a safe context plus a generation check.

Read each async API's contract: cancelling/releasing may not abort background I/O,
may race with callback delivery, or may leave result disposal to the caller. Ensure
all terminal paths release owned handles and observe errors. A stale completion
can discard its result without touching the destroyed owner.

Workers should process copied/plain data under an explicit synchronization contract.
Most world/UObject mutation belongs on the game thread. Use documented thread-safe
exceptions only when the API and project engine version establish them. Do not
wait synchronously on the game thread for a task that must marshal back there.

## Asset streaming and World Partition, when present

Check Asset Manager primary asset rules, bundles, soft paths, cook rules, and handle
ownership. Test the real production reference path in a cooked artifact; adding a
hard reference solely for a test can cook/retain an asset and hide the defect.

Release consumer references and handles before evaluating unload. Observe asset
residency/GC with available project tooling and a warm-cache baseline. A handle
release is evidence of balanced ownership, not proof all textures/resources are
instantly returned to the OS. Do not force a whole-project GC policy change for
a local lifecycle bug.

In a World Partition project, test cell unload/reentry or the relevant streaming
source transition. A long-lived reference can change actor/cell residency. Do not
assume an actor cached in a subsystem survives cell unload or that preventing unload
is a correct fix. Respect existing actor references and data-layer rules; use stable
identifiers/weak reacquisition where supported. Do not introduce World Partition
into a non-partitioned project to solve ordinary loading.

## Serialized assets and old saves

Inspect reflected property/type names, Blueprint subclasses, struct/enumeration
representations, data assets/tables, soft paths, and the actual SaveGame serializer.
A C++ compilation pass does not prove old content will deserialize correctly.

For renames, use the engine/project's supported Core Redirect or compatibility path,
then load representative old assets before re-saving anything. Redirecting reflected
engine names does not automatically update arbitrary gameplay IDs, JSON fields,
custom binary save layouts, or remote data. Keep game save schema handling explicit.

Use stable persisted IDs and documented defaults. Validate supported old records,
missing optional fields, and unknown/newer data according to the product contract.
On failed load, preserve the original and return a controlled error; do not silently
replace it with an empty current save. Test copies of old fixtures, never real saves.

## Acceptance matrix

| Case | Fixture/action | Evidence to retain |
| --- | --- | --- |
| Interrupted owner | Destroy actor/component or change world during pending load/task/save | Terminal outcome, no stale mutation/access, teardown log/test report |
| Repeat lifecycle | At least two start/stop and level-entry cycles | Delegate/timer/service counts and stable state after each cycle |
| Unload/reload | Drop intended owners/handles; unload relevant level/cell/content; reload | Handle accounting, residency baseline/trend, usable reloaded asset |
| Old data | Load prior asset/Blueprint/save fixtures in fresh process and save/reload copies | Stable references/IDs/defaults, schema result, artifact/report paths |

Record engine/configuration, fixture version, scenario/test ID, result, and raw log
or report location for each case. If no relevant unload or save path exists, state
the reason and identify the closest affected asset/lifetime case rather than invent
unused systems. Extend existing multiplayer tests only for an actual network task.
