# Sources and substantial local modifications

This is a locally maintained game adaptation of Addy Osmani's MIT-licensed
`ci-cd-and-automation` skill, not an official upstream release. It replaces the
non-game pipeline with engine build, test, cook/export, and packaged-smoke gates;
review upstream changes deliberately rather than overwriting this adapter.

## Source snapshot

Addy Osmani, `addyosmani/agent-skills`, MIT, reviewed at commit
`301b02b12bff98e4688e6984af6556802322bbde`:

- <https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/ci-cd-and-automation/SKILL.md>
- <https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/LICENSE>

Retained: shift-left checks, layered gates, caching, failure feedback, build
identity, artifact retention, and the rule that a green status must be backed by
a parsed result rather than a process exit code.

## Local changes

- Remove non-game install, test, preview-deployment, fixed-time-target, and
  request-level rollout examples.
- Add engine build/test/cook/export/package layers, self-hosted runner and cache
  considerations, and engine-specific handoff.
- Require expected test counts, current reports, timeout/crash/zero-test
  handling, and packaged player smoke.
- Add signing/credential isolation and release-artifact rules.
- Keep a separate backend/store pipeline explicitly out of the game client
  workflow.

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
