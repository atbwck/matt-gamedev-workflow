---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
---

> Local modification: game workflow policy and link adaptation applied; upstream license retained. Read [game policy](../../references/game-workflow/game-policy.md). Read [game adaptation notes](GAME-ADAPTATION.md).


# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered, using the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → use a minimal engine or pure-logic harness for runtime-dependent behavior. For a deliberately engine-independent state-machine discussion, [LOGIC.md](LOGIC.md) supplies an optional single-file HTML illustration; label it as a model, with no engine-validation claim.
- **"What should this look or feel like in the game?"** → use the existing engine scene/map and relevant HUD, camera, input or rendering path. Explore meaningful variants with a cheap in-engine switch. [UI.md](UI.md) remains an optional browser sketch guide for an explicitly engine-independent visual concept.

Choose fidelity from the question: physics, timing, input feel, rendering, asset loading and networking require the actual engine path. If the user is unavailable, state a reversible assumption grounded in the project; do not decide unapproved gameplay tradeoffs.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious, but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **Trivial to run.** Give the actual engine/version, scene/map and project launch command, or the existing logic runner command. Optional HTML sketches are self-contained files. Verify the stated entry and disclose unavailable runtime access.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE, wipe me" name.
4. **Skip the polish.** Add only the setup validation, bounded cleanup and repeatable scenario needed to trust the answer; no speculative production architecture. A throwaway prototype is not production-tested code.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Capture it when done.** Record the question, verdict, artifact path and evidence limits in the issue or local decision record. Promote the validated decision to real code only within the authorized implementation scope, with production validation. Preserve a prototype branch and commit only when Git actions are authorized; otherwise keep a named local artifact and context pointer.
