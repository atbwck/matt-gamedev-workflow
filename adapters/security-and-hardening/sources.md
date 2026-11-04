# Sources and substantial local modifications

This is a locally maintained game adaptation of Addy Osmani's MIT-licensed
`security-and-hardening` skill, not an official upstream release. It replaces the
web/service controls with native-game trust boundaries; review upstream changes
deliberately rather than overwriting this adapter.

## Source snapshot

Addy Osmani, `addyosmani/agent-skills`, MIT, reviewed at commit
`301b02b12bff98e4688e6984af6556802322bbde`:

- <https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/security-and-hardening/SKILL.md>
- <https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/LICENSE>

Retained: threat modeling before controls, trust boundaries, least privilege,
secret handling, supply-chain review, input validation, failure-safe behavior,
and evidence-based verification.

## Local changes

- Scope the workflow to Unreal, Unity, and Godot game boundaries: authority,
  replication/RPC, saves, mods/assets, plugins, platform credentials, and build
  signing.
- Remove web headers, cookies, CORS, browser XSS, SQL, and generic OWASP rows
  from the game workflow; a separate web/service backend uses its own review.
- Make server/host authority and client claims central; anti-cheat is not a
  substitute for authority.
- Add save versioning/migration, atomic failure behavior, old-save fixtures, mod
  path/size/type validation, plugin install-script gates, and release-key
  isolation.
- Add game-specific privacy and diagnostic-data constraints without requiring a
  telemetry vendor.
- Use `game-security-checklist.md` rather than the upstream web checklist.

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
