# Scoped Quality-Contract Instructions

This is a snippet to merge into the project's existing agent rule file only when
authorized. It is not permission to replace `AGENTS.md`, duplicate every host's
rule file, or alter unrelated project policy.

## Scope and contract

- Runtime subproject: Not supplied; resolve from task evidence before applying.
- Canonical contract path, relative to this rule file: Not supplied.
- Contract owner / version: Not supplied.
- Read that contract before implementation. If absent, report the gap rather than
  claiming its draft targets are enforced.
- Resolve other skills using the host's actually discovered `name` and `location`.
  Read the discovered file; never manufacture paths from upstream categories.

## Keep the bar intact

- Do not weaken thresholds, ratchets, test discovery, assertions, checker wiring,
  rendering settings, or exclusions to make the current task pass.
- Review staged, unstaged, untracked, removed, and relevant binary/config changes
  against the agreed base. Do not remove other contributors' changes.
- Treat unconfirmed numeric targets as **not enforced**, even when filled in.
- Do not install tools, dependencies, hooks, plugins, or telemetry automatically.
- Preserve the distinction between pass, violation, execution error, and not run.
  Tool errors, missing/malformed/stale reports, and unexpectedly empty tests or
  samples fail an enforced gate; they are never clean results.
- Before a new gate is called enforced, run its actual lifecycle command against
  a deliberate failure and clean control, then verify error and missing-report
  failure handling. Keep proof artifacts and restore only task-owned fixtures.

## Execution and exceptions

- Use the contract's verified commands, working directories, and run stages.
  No commands are supplied or verified by this template.
- Cheap focused checks belong near implementation. Engine compilation, cook,
  export, device checks, and profiling run at agreed stages, not every edit.
- Exceptions require scope, rationale, approval, owner, expiry, and follow-up.
  Missing approval or an expired exception cannot authorize a passing result.
- Keep raw evidence and environment identity for comparable benchmarks. Budget
  design upfront does not permit unmeasured optimization or an invented speedup.
- Report blocked checks and unresolved risks; do not declare completion by
  counting skipped checks as passes. Follow user restrictions on edits and commits.
