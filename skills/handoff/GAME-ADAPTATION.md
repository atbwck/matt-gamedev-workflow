# Game adaptation: handoff

Preserve the portable context document. Include engine/version/build evidence, GDD/spec/map/ticket pointers, exact scene/asset paths, current branch/worktree, commands and unrun gates. A text summary cannot carry an unsaved binary asset or a runtime state; save only authorized artifacts and identify them explicitly. Use host-verified session/context controls rather than assuming /compact or /clear exists.

Read [shared game policy](../../references/game-workflow/game-policy.md) for host loading, permissions, engine evidence and verification boundaries. This note records a local adaptation; all original sibling resources remain bundled.
