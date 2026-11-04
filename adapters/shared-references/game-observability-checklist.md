# Game observability checklist

Use with `observability-and-instrumentation` for an Unreal, Unity, or Godot
project. This is engine-side game diagnostics.

## Questions first

- [ ] 2–4 concrete questions are written down (crash/hang, hitch, memory growth,
      load/save failure, disconnect).
- [ ] Every signal maps to one of those questions.
- [ ] A signal that cannot change a decision is removed.

## Logs

- [ ] Stable event/category names and engine-appropriate levels are used.
- [ ] Build/version, platform, and scene/session identity are included where
      useful.
- [ ] No secrets, tokens, platform credentials, full save payloads, or
      unredacted personal data.
- [ ] Fields are allowlisted; whole-object dumps are avoided.
- [ ] Hot paths do not serialize a JSON line every frame; sampling/buffering is
      used where needed.
- [ ] A failed load, rejected network message, or caught error has a terminal
      signal rather than an empty catch.

## Crash and hang

- [ ] A crash produces a usable artifact and the matching symbols/build identity
      are retained.
- [ ] Hangs record a wait location/thread and a bounded timeout.
- [ ] A deliberately induced crash was found in the expected local channel.
- [ ] The project did not add a third-party crash/telemetry SDK without an
      explicit decision.

## Performance and resources

- [ ] Frame time is reported as a distribution/tail plus hitches, not only
      average FPS.
- [ ] CPU and GPU timings are separate and not added into a fake total.
- [ ] Device, build configuration, renderer/quality, cache state, and scenario
      are recorded.
- [ ] Memory separates managed/GC, native, graphics, and resource residency.
- [ ] Loading records cold/warm, stage boundaries, and cooked/exported content.
- [ ] Editor/development data is labeled and not presented as shipping data.

## Save and network failures

- [ ] Save failures identify read/parse/validate/migrate/apply and preserve the
      original file.
- [ ] Network rejection records message type, sender/authority context, reason,
      and rate/size limit without full payloads or secrets.
- [ ] Reconnect/disconnect records the phase and whether durable state was
      applied once, twice, or not at all.

## Verify the instrumentation

- [ ] A forced error is found by the expected event/category.
- [ ] A crash artifact opens with the matching symbols.
- [ ] A frame/memory signal changes when the measured scenario changes.
- [ ] Logs/artifacts contain no secrets or personal data.
- [ ] Instrumentation itself does not create a visible frame or memory regression.
- [ ] A configured logger/dashboard is not claimed as proof that diagnosis works.

## Boundaries

- [ ] No always-on telemetry or correlation stack is added to a single-player
      game by default.
- [ ] A separate backend's telemetry remains that service's concern; it does not
      replace engine-side evidence.
- [ ] Unavailable runtime evidence is reported as not verified, not passed.
