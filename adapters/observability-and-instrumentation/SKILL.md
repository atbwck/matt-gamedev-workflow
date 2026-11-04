---
name: observability-and-instrumentation
description: Instrument native Unreal, Unity and Godot games with engine logs, crash dumps, frame and memory counters, loading/save/network failure diagnostics, and sampled state snapshots. Use for crashes, hitches, memory growth, loading or save failures; native-game diagnostics only.
license: MIT
---

# Game observability and instrumentation

This is a substantially modified local game adaptation of Addy Osmani's
MIT-licensed observability workflow. It is not an upstream release. Read
[sources and local changes](sources.md) for provenance and the license notice.

## Scope

Use this workflow to answer questions about a running game: why it crashed or
hung, where a frame hitch or memory growth came from, why loading or saving
failed, and why a session disconnected. A live backend may have its own
request/trace telemetry; that service's signals do not replace the game's
engine-side evidence.

Read [runtime policy](../../references/game-workflow/runtime-policy.md) first. Do not install
a telemetry vendor or always-on agent merely because this workflow is active.
Use the project's existing log, crash, profiler, and platform channels.

## 1. Write the questions first

Before adding a signal, write 2–4 questions a developer or on-call person will
ask:

- Did the game crash or hang, on which build/platform/scene, and at what step?
- Is the frame time or hitch distribution worse than the approved baseline?
- Is memory/GC/resource retention growing across a repeatable scenario?
- Did loading, streaming, or asset resolution fail, and for which asset?
- Did save/load fail, and was the original save preserved?
- Did a session disconnect or a network message get rejected, and why?

Map each signal to one question. A log line nobody will search for is noise.

## 2. Choose game-appropriate signals

| Signal | Use it for | Avoid |
| --- | --- | --- |
| Engine log with categories/levels | State transitions, load/save failures, rejected network input, subsystem errors | Per-frame free-form strings; secrets or full user content |
| Crash/minidump + symbols | Native crash, callstack, build identity | Shipping without symbols or a way to map addresses |
| Frame-time samples | Hitches, tail latency, CPU/GPU split | Reporting only average FPS; adding CPU and GPU times |
| Memory/GC counters | Leaks, managed allocation spikes, resource retention | A single RSS reading as proof of no leak |
| Loading/streaming events | Cold/warm load, asset residency, hitches | Treating editor cache as a shipping load |
| Save/network result codes | Corruption, incompatible data, disconnects, rejected messages | Logging full payloads or credentials |
| Sampled state snapshot | Reproducing a rare state bug | Continuous full-world dumps in a hot loop |

## 3. Logging rules

- Use stable event names/categories and the engine's log levels. `error` means
  an invariant broke; `warning` means degraded but handled; `info` is a
  significant state change; debug/trace is off by default in shipping.
- Include build/version, platform, scene/session identifier, and a correlation
  or session identifier only where the project already has one. Do not invent a
  correlation scheme for a single-player game.
- Never log secrets, tokens, platform credentials, full save contents, or
  unredacted personal data. Allowlist fields; do not dump whole objects.
- Do not serialize a JSON line every frame in a hot path. Sample, buffer, or log
  at meaningful transitions; measure the logging cost if it is on a frame path.
- Make failures observable: a swallowed exception, empty catch, or retry loop
  with no terminal signal is not instrumentation.

## 4. Crash and hang evidence

- Preserve the build identity, platform, scene/step, and symbol files needed to
  read a crash. A stack without matching symbols is not actionable.
- Capture minidumps/callstacks through the platform/engine crash handler; do not
  add a third-party crash SDK without an explicit project decision.
- For hangs/deadlocks, record the wait location, thread, and a bounded timeout.
  Do not rely on a user's description alone.
- Test that a deliberately induced crash produces the expected local artifact;
  a configured crash handler is not proof that it works.

## 5. Performance and resource diagnostics

- Report frame-time distributions and hitches, not only average FPS. Keep CPU
  and GPU stages separate; they overlap and must not be added into one number.
- Record the scenario, device, build configuration, renderer/quality, cache
  state, and sampling method. Editor/development results are diagnostic, not
  shipping performance.
- For memory, distinguish managed/GC, native, graphics, and asset residency.
  A cache baseline is more honest than promising immediate RSS recovery.
- For loading/streaming, record cold vs warm, stage boundaries, asset identity,
  and whether the run used cooked/exported content.
- Use the project's engine profiler; do not replace a trace with a guess or a
  synthetic benchmark.

## 6. Save and network failures

- Log structured result codes and the failing boundary (read, parse, validate,
  migrate, apply), not the full save payload.
- A failed load must not overwrite the original; verify the recovery path.
- For network rejection, record sender/authority context, message type, reason,
  and rate/size limit without logging secrets or full payloads.
- For disconnect/reconnect, record the phase and whether durable state was
  applied once, twice, or not at all.

## 7. Verify the instrumentation

- Force a representative error and find it by the expected event/category.
- Confirm a crash artifact can be opened with the matching symbols.
- Confirm a frame/memory signal changes when the measured scenario changes.
- Confirm secrets and personal data are absent from logs and artifacts.
- Confirm the signal does not itself create a visible frame or memory regression.

Read [game observability checklist](../../references/game-workflow/game-observability-checklist.md)
for the review list. A configured logger or dashboard is not proof that a
failure can be diagnosed; exercise the failure path and report the evidence.
