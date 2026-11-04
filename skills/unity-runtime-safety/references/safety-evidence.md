# Unity lifetime, native ownership, and compatibility evidence

Use lifecycle checks for the changed feature; apply Addressables and Jobs sections
only when those packages/mechanisms exist or a measured task justifies them.

## Lifetime and repeatable cleanup

A managed wrapper can remain after its native `UnityEngine.Object` is destroyed.
A managed null check, Unity's overloaded null/equality, and a request-generation
check answer different questions. Verify native validity before Unity API access
and generation/active state before accepting an otherwise valid but stale result.

| Boundary | Responsibilities to identify |
| --- | --- |
| Enable / feature start | Subscribe once, initialize generation/state, acquire active resources |
| Disable / feature stop | Stop active work if required, unsubscribe, invalidate deliveries |
| Destroy / scene unload | Final owned native/engine-resource release; no stale callbacks |
| Play exit / application exit | Stop background work and reset session state where supported |

Coroutines stop when a GameObject is deactivated or their MonoBehaviour destroyed;
disabling only the component does not automatically stop them. Async methods are
not automatically stopped by these boundaries. Define each operation's owner and
cancellation behavior instead of treating coroutine and `await` lifetimes alike.

Cleanup must be safe after partial initialization and repeated stop. Store delegate
instances when necessary to remove capturing lambdas. Long-lived publishers/statics
must not retain scene listeners. Avoid synchronous main-thread waits on operations
whose completion needs the Unity loop.

For supported Unity versions, destruction/exit cancellation tokens can help; obtain
them before teardown and handle cancellation. Older projects need their existing
compatible cancellation mechanism, not an unsolicited engine upgrade. After each
await/background stage, check state before using the owner or returning to Unity APIs.

## Addressables handle ledger, when used

Read the installed package's ownership contract for each load/instantiate/scene API.
Record the operation, owner, acquired reference, outcome, release API, and whether
another consumer shares the asset. An acquired handle copy is not automatically an
independent acquisition; avoid counting struct copies as extra owning references.

- Check operation success/error before using its result. Release failed operations
  according to that API's contract as well as successful ones.
- Use the matching load/release, scene unload, or instance-release path. Respect
  instance tracking options; do not destroy an Addressables instance and assume its
  operation references were released by ordinary `Destroy`.
- Distinguish Addressables instantiation from manually instantiating a loaded prefab.
  A manual clone can still depend on the loaded prefab's bundles/materials; retain
  the load ownership for as long as these instances need it.
- A cancelled owner may not cancel the load itself. If the result arrives later,
  release the acquisition without binding it to the destroyed/replacement owner.
- Unload a scene/content group only after dependent consumers finish. Balanced
  handles do not imply every cached asset or OS allocation disappears immediately.

Test real built content and the intended catalog/profile where relevant. Editor
Asset Database access can hide a missing bundle or a stale content build.
Do not introduce Addressables to solve an ordinary object cleanup bug.

## NativeContainers, Jobs, and Burst, when present

Introducing Jobs/Burst requires a measured bottleneck, supported package/compiler
versions, appropriate data representation, and target support. They are not default
safety remedies. Keep the existing implementation when no measured need exists.

Track each NativeContainer's allocator, creator, job dependencies, readers/writers,
and final disposal. Check allocator lifetime limits for the installed Collections
version. A job cannot outlive its data; complete dependent work before immediate
disposal, or use that version's supported dependency-aware scheduled disposal.
Coordinate all users, not just the last handle stored in one component.

Do not read/write from the main thread while jobs have conflicting access. `IsCreated`
alone does not prove exclusive ownership, dependency completion, or absence of
invalid aliases. Never bypass safety restrictions merely to silence a race report.
Burst/native job code cannot use arbitrary managed objects or Unity APIs; marshal
results to an active main-thread owner after dependencies complete.

## Asset and save compatibility

Keep file/script `.meta` GUIDs with moves; inspect references and prefab overrides
rather than regenerating metadata. Serialize only supported field shapes. Shared
ScriptableObjects are configuration/asset identity, not an implicit player-save format.

Use `FormerlySerializedAs` for supported field renames when appropriate. It does not
convert custom JSON/binary saves or solve all type/assembly/`SerializeReference` moves.
For those changes inspect the installed serializer's compatibility mechanisms and
load old scene/prefab/asset fixtures before saving them. Keep enum numeric values
and persisted gameplay IDs stable or provide the project's explicit conversion.

Exercise the actual Domain Reload/Scene Reload combination. With Domain Reload off,
statics and event registrations can persist between Play sessions; an already-loaded
ScriptableObject need not re-run its usual reset on every entry. Use supported
initialization/reset hooks and prove repeated sessions do not accumulate state.

Load copies of supported old saves, validate defaults and IDs, then save/reload the
copy. Handle malformed/newer data through the established product contract without
overwriting the original. If reflection/serialization depends on preservation or
generic AOT code, use the intended IL2CPP and stripping level for acceptance.

## Acceptance matrix

| Case | Action | Evidence |
| --- | --- | --- |
| Interrupted owner | Disable/destroy/unload scene during async load or task/job | No stale mutation, terminal error/cancel outcome, balanced owned releases |
| Repeat lifecycle | At least two enable/disable and Play cycles with actual reload settings | Stable listener/static/service counts and reset state |
| Resource unload | Release instances/scenes/handles and native containers, then reload | Ownership/dependency accounting and residency trend versus cache baseline |
| Prior data | Load old scene/prefab/asset/save copies, then save/reload | Stable GUIDs/overrides/fields/IDs and current target report |

Retain test IDs, fixture versions, platform/backend/configuration, and raw log/report
paths. Mark a genuinely inapplicable mechanism with a reason; do not invent unused
save, Addressables, job, or networking infrastructure to fill the table.
