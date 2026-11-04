# Game adaptation: code-review

Route into game knowledge, do not only describe it. Before reviewing, run `router` on the actual changed paths and load the selected engine skill for the touched subsystem plus that engine's `*-testing` and `*-runtime-safety` when the diff changes engine code, assets, scenes/prefabs/maps, saves, threads/async or authority. For a measured performance claim also load `performance-optimization`. Cite what was actually read and which reports were executed; do not assert engine behavior from generic prose.

Retain separate Standards and Spec results and fresh read-only contexts when available. Standards include the selected engine lifecycle, cancellation/thread access, serialized/asset identity, authority and approved performance/quality rules. Spec checks player-visible behavior and agreed failure paths. Include staged/unstaged/untracked or relevant binary/config changes when requested; HEAD-only diff misses uncommitted code. Workers must not recursively spawn reviewers. /game-review explicitly aliases this skill; Cindy's /review stays native.

Read [shared game policy](../../references/game-workflow/game-policy.md) for host loading, permissions, engine evidence and verification boundaries. This note records a local adaptation; all original sibling resources remain bundled.
