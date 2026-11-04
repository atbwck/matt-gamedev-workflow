# Sources and substantial local modifications

This is a locally maintained, substantially modified game adaptation, not an
official Addy Osmani release. The skill and its templates retain the MIT notice
below. Upstream changes require deliberate review; do not overwrite this adapter
with the upstream file.

## Source snapshot

Addy Osmani, `addyosmani/agent-skills`, MIT, reviewed at commit
`301b02b12bff98e4688e6984af6556802322bbde`:

- [Constraint-driven development](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/constraint-driven-development/SKILL.md)
- [Floor-guard reference](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/constraint-driven-development/references/floor-guard.md)
- [Upstream README](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/README.md)
- [Upstream MIT license](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/LICENSE)

Retained capabilities: a persistent project quality contract; evidence-first
intake; review of quality-lowering changes; cost-based placement of gates;
measured ratchets; scoped, owned, expiring exceptions; and deliberate violation,
clean control, and execution-error proof for every enforced gate. The floor-guard
reference informed the complete-change-inventory and fail-closed comparison-base
requirements; its executable implementation is not bundled or claimed tested here.

## Local changes

- Replace Web-centered thresholds and install recipes with Unreal, Unity, and
  Godot project/runtime evidence, existing tools, and user-approved targets.
- Remove automatic dependency installation, default FPS/coverage/tolerance
  numbers, universal check timeouts, and compulsory compilation after every edit.
- Explicitly distinguish a draft/measured rule, a written review obligation,
  and a verified enforced gate. A candidate number is **not enforced** even if
  populated; baseline measurement alone does not approve a ratchet.
- Preserve end-to-end deliberate-failure and clean-control proof, adding explicit
  handling of missing, malformed, stale, unsupported, and empty outputs. Synthetic
  validation fixtures are not runtime performance data.
- Expand anti-lowering review to engine warnings, test filters, asset/configuration
  exclusions, renderer/fidelity changes, and relevant binary artifacts.
- Replace upstream default external-tool requirements with evidence provenance
  and explicit capability gaps; no independent evidence is fabricated or installed.
- Add fillable quality-contract, scoped agent-rule, and reproducible benchmark
  templates with environment/version/backend/build/cache identity and frame-time,
  allocation/GC, memory, load, and package-size measurement fields.
- Discover dependency skills by the host's actual `name` and `location`; do not
  depend on upstream directory/category layouts or unavailable helper scripts.

The repository's local performance adapter was consulted for runtime-subproject
routing, version honesty, comparable baseline capture, and no-unmeasured-speedup
boundaries. No gamedev upstream text or executable helper is copied into this
adapter. Shared runtime/validation policies are integration references rather
than proof that a particular project command was run.

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
