# Sources and substantial local modifications

This is a locally maintained game adaptation of Addy Osmani's MIT skill, not an
official upstream release. Review upstream changes deliberately; do not overwrite
this adapter with the original workflow.

## Source snapshot and retained capabilities

Addy Osmani, `addyosmani/agent-skills`, MIT, reviewed at commit
`301b02b12bff98e4688e6984af6556802322bbde`:

- [Doubt-driven development](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/doubt-driven-development/SKILL.md)
- [Upstream README](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/README.md)
- [Upstream MIT license](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/LICENSE)

Retained: CLAIM → EXTRACT → DOUBT → RECONCILE → STOP; artifact-and-contract review
without the author's conclusion; adversarial disproof; evidence-preserving
extraction; ordered classification of findings; orchestrator ownership; no
recursive reviewers; explicit external authorization; and a three-round bound.

## Local changes

- Narrow automatic use to consequential, uncertain game engineering decisions,
  rather than every non-trivial branch or module boundary.
- Prefer host-native genuinely fresh-context read-only review. Do not assume a
  named persona/tool exists or that a new role automatically isolates context.
- Explicitly prohibit worker recursion and using an external CLI to bypass it.
  Worker agents return the review request to the main session.
- Label self-review as same-context and degraded. A failing behavioral test does
  not count as independent context, even though it can disprove a claim.
- Remove the mandatory cross-model offer in every interactive cycle. External
  review is only a relevant option or a user request, not ordinary-task friction.
- Require explicit user selection and per-call authorization for external CLI or
  data transfer, including packet, destination, invocation, access, and cost.
  No CLI commands, automatic probes, installs, retries, or uploads are bundled.
- Count external escalation within the same maximum three review rounds; do not
  reset the bound by changing the reviewer or claiming a new session.
- Add game lifetime, authority, resource, streaming, compatibility, and save-data
  risks, plus actual runtime/version evidence. Preserve a compact review unit
  rather than expanding into an engine encyclopedia.
- Discover supporting skills from host-reported names and locations; do not use
  upstream personas, slash commands, or nonexistent sibling file paths as APIs.

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
