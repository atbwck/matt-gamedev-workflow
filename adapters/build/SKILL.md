---
name: build
description: Implement a scoped game feature or ticket using Matt implement, agreed TDD seams and engine verification.
disable-model-invocation: true
---

# build

This is an explicit user alias for `implement`. Read [game policy](../../references/game-workflow/game-policy.md).

1. Resolve `implement` from the host's actual installed skill catalog and read its SKILL.md and required resources. Do not guess an upstream path.
2. The user's explicit invocation of this alias requests that target phase, with the same supplied arguments, scope, user-only restrictions and stopping conditions. Follow the target rather than inventing a second workflow.
3. Preserve existing GDD/glossary/ADRs, tracker configuration and approved game constraints. Use the actual target engine and project tooling.
4. If the target is unavailable, report the installation/profile gap and give its exact name. Do not claim the workflow ran or silently install another pack.
5. Report actual evidence and limitations. This alias does not authorize subsequent phases, Git publication, external messages, hooks or dependency installation.
