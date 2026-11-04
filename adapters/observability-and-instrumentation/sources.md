# Sources and substantial local modifications

This is a locally maintained game adaptation of Addy Osmani's MIT-licensed
`observability-and-instrumentation` skill, not an official upstream release. It
replaces the service telemetry model with engine-side game diagnostics; review
upstream changes deliberately rather than overwriting this adapter.

## Source snapshot

Addy Osmani, `addyosmani/agent-skills`, MIT, reviewed at commit
`301b02b12bff98e4688e6984af6556802322bbde`:

- <https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/observability-and-instrumentation/SKILL.md>
- <https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/LICENSE>

Retained: define questions before signals, event-based logging, correlation
where it already exists, privacy/redaction, sampled diagnostics, verifying the
telemetry itself, and distinguishing a configured signal from a working one.

## Local changes

- Remove service metrics, tracing, dashboards, alerting, and canary-deployment
  assumptions from the game workflow.
- Center engine logs, crash dumps/symbols, frame-time distributions, memory/GC,
  loading/streaming, save/load failures, and network rejection/disconnect.
- Forbid per-frame JSON serialization in hot loops; require sampling/buffering
  and measured logging overhead.
- Keep a separate backend's telemetry as that service's concern when one exists.
- Add engine/project evidence checks and game-specific privacy constraints.
- Use `game-observability-checklist.md` rather than a non-game checklist.

## MIT license notice

MIT License

Copyright (c) 2025 Addy Osmani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
