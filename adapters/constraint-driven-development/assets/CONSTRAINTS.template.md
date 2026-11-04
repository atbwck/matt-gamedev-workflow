# Project Quality Contract

Template status: **draft — not enforced**. Replace prose fields with project
evidence; no value in this template is an approved numeric requirement.
A filled-in candidate number remains **not enforced** until the named decision
owner approves it and its gate passes deliberate-failure and clean-control proof.

## Identity and authority

| Field | Project value |
| --- | --- |
| Contract version / last reviewed | Not supplied |
| Runtime subproject and rule-file scope | Not supplied |
| Change comparison base / revision | Not supplied |
| Decision owner / approval record | Not supplied |
| Supported target devices / platforms | Not supplied |
| Engine declaration evidence / version | Not supplied |
| Verified executable version / custom build | Not supplied; distinguish from declaration |
| Build/test/CI entry points and evidence | Not discovered |

`CONSTRAINTS.md` is canonical. Project wrappers and CI implement this contract;
report drift instead of silently picking a different threshold or stage.
Statuses: **not enforced** (draft/measured/advisory), **enforced** (approved and
proved), **blocked** (required evidence unavailable), **N/A** (reason recorded).
Do not report an advisory check as a passing blocking gate.

## Floor: review obligations

- Do not lower this bar, disable wiring, or rebaseline a regression to get green.
- Review new suppressions, ignored paths, warning downgrades, and engine flags.
- Review skipped/deleted tests, removed assertions, discovery filters, and empty suites.
- Do not conceal missing required behavior with stubs, silent catches, or TODOs.
- Keep secrets out of source, fixtures, reports, logs, and summaries; redact findings.
- Require a scoped, reviewed exception for an intentional deviation.

Floor review owner / stage / evidence: Not supplied — not enforced automatically.
Floor automation command and comparison-base handling: Not discovered — not enforced.
A manual review can satisfy a recorded review obligation, not an automated guard claim.

## Gate register

Add one record per gate; a number without an approved verdict mechanism is an aspiration.

| Field | Gate value |
| --- | --- |
| Rule ID / dimension / rationale | Not supplied |
| Invariant or candidate threshold / units / comparator | Not supplied — not enforced |
| Approval owner / date / record | Not supplied — not enforced |
| Target runtime / paths / platform / scenario | Not supplied |
| Existing checker / executable / tool and report format versions | Not discovered |
| Exact command or existing wrapper, arguments, working directory | Not discovered — not enforced; not an executable example |
| Environment variables / prerequisites (names only; no secrets) | Not supplied |
| Producer exit handling / verdict parser / wrapper | Not verified |
| Expected reports / raw output / revision and run identity checks | Not supplied |
| Stage: local static, slice, task, CI, runtime/device, or package | Not agreed |
| Required test discovery / sample count and empty-set handling | Not agreed — not enforced |
| Approved runtime cost / timeout / block or warn policy | Not agreed — not enforced |
| Rule owner / validation evidence / current status | Not supplied — not enforced |

### Gate proof (repeat for every gate)

Use an isolated fixture or reversible task-owned change; never damage live data.
Run the actual lifecycle command, not only a report parser. Synthetic reports
must be labeled and cannot establish a runtime performance baseline.

| Case | Required verdict | Actual verdict / exit / evidence |
| --- | --- | --- |
| Deliberate rule violation | Fail: violation | Not run — not enforced |
| Clean control | Pass | Not run — not enforced |
| Boundary and permitted value/finding, if applicable | Match approved comparator | Not run — not enforced |
| Producer/tool error or timeout | Fail: execution error | Not run — not enforced |
| Missing, malformed, stale, or unsupported-version report | Fail: execution error | Not run — not enforced |
| Unexpected empty tests / samples | Fail: execution error | Not run — not enforced |
| Invalid comparison base or incomplete change inventory, for floor guard | Fail: execution error | Not run — not enforced |

Both violation and execution error must block an enforced gate, regardless of a
producer's success exit code. Do not convert errors to empty clean results.
Restoration confirmation / task-owned changes removed: Not supplied.

## Candidate measurements and ratchets

Keep candidate measurements separate from approved rules. Use a project-owned
benchmark scenario record for the environment, cache conditions, sampling, and
raw artifacts. A new measurement does not grant rebaseline authority.

| Metric | Baseline / units / artifact / revision | Direction / proposed tolerance / rationale | Approval / gate ID / status |
| --- | --- | --- | --- |
| Frame-time distribution / hitches | Not measured | Not agreed | Not enforced |
| CPU / GPU stage time | Not measured | Not agreed | Not enforced |
| Allocations / GC pause and frequency, if applicable | Not measured; record runtime applicability | Not agreed | Not enforced |
| Memory: resident / managed / graphics / peak | Not measured; identify counters | Not agreed | Not enforced |
| Loading: cold / warm and stage boundaries | Not measured separately | Not agreed | Not enforced |
| Package: artifact type / compressed / installed / platform | Not measured separately | Not agreed | Not enforced |
| Coverage or other selected dimension | Not measured; define scope and exclusions | Not agreed | Not enforced |

Ratchet baseline update owner / approval policy: Not supplied — not enforced.
Comparable environment and scenario identity: Not supplied.
Sampling uncertainty / approved tolerance / repeated-run method: Not supplied — not enforced.
FPS and derived frame budget, only if approved: Not supplied — not enforced.
Do not add serial CPU/GPU timings as if overlapping stages were sequential.

## Exceptions and unresolved gaps

| ID | Rule / path / target scope | Reason and impact | Approver / approval evidence | Owner | Expires | Follow-up / compensating evidence |
| --- | --- | --- | --- | --- | --- | --- |
| No approved exception | Not supplied | Not supplied | Not supplied | Not supplied | Not supplied | Not supplied |

A draft exception grants no permission. Expired exceptions cannot authorize a pass;
only the decision owner can approve renewal or a deliberate contract change.
Missing tools, reports, runtime access, or approvals are gaps, not successful checks.
Record the affected stage, owner, next action, and completion consequence.

## Change record

Record threshold, command, stage, exclusion, renderer/quality, or baseline changes
with rationale, approval, and before/after evidence. Preserve previous baselines;
do not weaken the contract in the same task merely to satisfy a failing gate.
