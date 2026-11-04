# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. `Type:` is research/prototype/grilling/task; `Status:` starts open and becomes claimed, resolved, or out-of-scope. Preserve the destination/map link and the reason for scope closure.
- **Blocking**: a Blocked by: NN, NN line near the top. Resolved and out-of-scope are terminal (closed) states; only open/claimed blockers block the frontier. Before closing a blocker as out-of-scope, reconsider each dependent edge: remove an obsolete dependency, or replace a still-needed decision with an explicit in-scope ticket. Closure is not evidence that an unanswered requirement was resolved. A dependent is ready only when all remaining blockers are closed.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: before work, obtain an exclusive per-ticket claim with a session/owner token using the host's atomic file-creation or tracker-lock primitive, then set Status: claimed. An ordinary overwrite or the same account's assignee is not mutual exclusion. If atomic claims are unavailable, serialize local sessions and state that concurrency is unsupported; never steal an existing claim.
- **Resolve**: as the claim owner, save the answer under ## Answer, set Status: resolved, then upsert one map pointer keyed by the ticket path. Serialize map writes under a map lock, reread before updating and use a task-owned temporary file plus atomic rename where supported. On retry repair a missing pointer without duplicating the answer. Close out-of-scope tickets in Out of scope, not Decisions-so-far. Release only your own claim after preserving the resolution.
