# Game adaptation: implement-spec

Preserve the dependency-frontier and integration-branch strategy when the host and repository actually support clean isolated worktrees. Scope workers to disjoint files/assets where possible; GUID/UID and binary asset merges may require serialization. Workers return review requests to the orchestrator instead of delegating again. Git, draft PR publication and closure remain scoped actions. Use a sequential graph walk when isolation is unavailable and disclose the reduced concurrency.

Read [shared game policy](../../references/game-workflow/game-policy.md) for host loading, permissions, engine evidence and verification boundaries. This note records a local adaptation; all original sibling resources remain bundled.
