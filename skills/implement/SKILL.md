---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

> Local modification: game workflow policy and link adaptation applied; upstream license retained. Read [game policy](../../references/game-workflow/game-policy.md). Read [game adaptation notes](GAME-ADAPTATION.md).


Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Use the project's existing compiler/static checks and focused behavior tests during implementation. Run the applicable regression suite at the task gate. Consult the selected engine testing and runtime-safety skills for scene, asset, cook/export and player evidence; place expensive runs at the agreed stage and report unavailable gates.

Once done, call the Skill tool with "code-review" to review the work.

Commit to the intended branch only when the user's task authorizes committing. Otherwise leave a reviewable diff, report the checks and uncommitted state, and stop at the requested scope.
