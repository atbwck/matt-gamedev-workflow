# Godot scene, resource, and task safety evidence

Read lifecycle/resource sections for affected objects; apply C# and worker sections
only when the task uses them. Check all version-sensitive APIs against project docs.

## Node, RefCounted, and scene ownership

| Concept | Consequence |
| --- | --- |
| Node parent/children | Freeing a parent frees children; detaching is not freeing |
| Node `owner` | Determines PackedScene persistence; does not manage reference-counted lifetime |
| `queue_free()` | Schedules deletion; queued deletion and feature state still need checking |
| `is_instance_valid()` | Detects freed native instances; does not prove current scene/request membership |
| RefCounted / Resource | Reference-based lifetime; cycles/shared caches can retain data |
| Autoload | Outlives scenes and can accidentally retain nodes, events, resources, or work |

Track who frees dynamically created or detached nodes. Prefer deferred deletion
when immediate free could invalidate a signal/physics iteration. At a completion
boundary, check native validity, queued-for-deletion state, active tree membership
when required, and generation. A valid node detached from the old scene may still
be an invalid recipient for a result.

`_exit_tree()` can happen before final destruction and can be followed by re-entry.
Use it for active-tree cleanup when appropriate, with an explicit reactivation path.
`_ready()` normally runs once unless readiness is requested again; do not rely on
it to reset every remove/add cycle. Repeated feature stop must tolerate no work
having started and resources already being released.

## Signal waits and managed events

GDScript signal connections often disconnect when their owning objects are freed,
but that is not a complete cancellation policy. Long-lived publishers, stored
Callables, bound/capturing lambdas, and an await whose emitter disappears need an
explicit lifetime contract. Store the Callable/delegate used to connect when manual
disconnection is required; constructing a new lambda does not identify the old one.

In C#, review custom signal events and lambdas that capture values against the
installed version's automatic-disconnection rules. Explicitly unsubscribe the active
owner's stored delegates when needed. Ordinary .NET events do not inherit Godot's
native connection lifetime guarantees. Avoid blanket claims that every C# event
subscription is automatically safe on Node destruction.

`await`/`ToSignal` does not imply owner cancellation or a guaranteed completion when
the emitter is freed. Reuse the project's bounded wait/cancellation mechanism,
observe task errors, and discard stale results. C# wrapper reachability is not native
Node validity; validate before Godot API access and keep Node freeing explicit.
Use the project's compatible .NET APIs rather than assuming Unity token APIs exist.

## Shared Resources and persisted identity

A Resource loaded by path may be shared with other scenes/consumers. Runtime mutation
can change every consumer; duplication or Local to Scene must match the intended
sharing model. Check nested arrays/dictionaries and embedded/external subresources
under the project's Godot version. Do not prescribe a newer deep-duplication API
or assume it exists everywhere. Keep immutable templates and mutable instance state
separate when this reduces unintended cross-instance changes.

Dropping one Resource variable does not prove unload: nodes, autoloads, preloads,
other resources, C# wrappers, and ongoing work may still retain it. Break unintended
cycles and release intended owners; measure resource/object retention against a
known warmed cache baseline rather than force an exact OS-memory return.

For moves/renames preserve source UID and import metadata used by that engine
version, including script/shader `.uid` sidecars where applicable. Generated
`.godot` cache is different from versioned source metadata. Prefer Editor-managed
moves; if editing files offline, move sidecars and validate path/UID resolution in
a clean import. A warm Editor can resolve stale paths that fail elsewhere.

Load old `.tscn`/`.tres` and supported save fixtures before re-saving them. Check
exported field/type changes, class names, defaults, stable gameplay IDs, UID/path
references, and PackedScene `owner` for generated children. Resource serialization
does not automatically convert arbitrary old JSON/custom/binary saves. Use the
project's schema handling and preserve unsupported/newer originals on load failure.

## Threaded loading and WorkerThreadPool

Prefer the existing ResourceLoader background loading path for supported resource
work; poll documented completion/status before retrieving a result that may block.
Determine the actual API's cancellation support. If the owner cancels but the load
continues, suppress stale delivery and release the obtained reference deliberately.

WorkerThreadPool is not permission to use the active SceneTree from a worker.
Process owned/copied data; use only APIs explicitly documented as thread-safe for
that engine version. Concurrent mutation of a shared Resource is not made safe by
its being RefCounted. Keep shared data synchronized or transfer ownership.

Record each submitted task ID, owner, completion state, shared buffers, and teardown
responsibility. Follow the version's task completion/wait requirements even when a
result is unwanted. Invalidate delivery before shutdown, arrange worker completion,
and never block the main thread on work that requires it to deliver/finish.
Main-thread/deferred callbacks still need validity and generation checks when run.

## Acceptance matrix

| Case | Action | Evidence |
| --- | --- | --- |
| Interrupted owner | Queue free/exit scene during signal wait, load, or C# task/worker | Bounded terminal state; no freed-instance access or old-scene mutation |
| Repeat lifecycle | At least two service start/stop and scene exit/re-entry cycles | Stable connection/task/autoload counts and no orphan detached nodes |
| Resource unload | Drop intended node/resource/task references, then reload | Object/resource trend versus cache baseline, correct instance sharing |
| Prior data | Clean-import old scene/resource and load old save copies, then save/reload | UID/path/default/ID preservation, fixture version and current report |

Use the existing GUT/gdUnit4/project runner and exported smoke path, not a second
custom test runner. Include .NET build/target evidence for C# and a rendered target
run for GPU claims. When a row's mechanism is absent, record why and the closest
relevant asset/lifetime case; do not introduce a save or network system just to test it.
Only actual multiplayer tasks activate authority/disconnect/adverse-network checks.
