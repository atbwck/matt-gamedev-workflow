---
name: router
description: Select the actual Unreal, Unity or Godot engine and relevant game domain skills from project evidence. Use for game API, gameplay, asset, scene, UI, audio or engine-specific tasks; does not own Matt's engineering phase transitions.
---

# Native game knowledge router

Local game routing adaptation. Follow [game policy](../../references/game-workflow/game-policy.md).
Load skills by the host's discovered names and physical locations, not inferred
upstream category paths. Do not require every skill in the engine profile.

## Establish runtime from the task boundary

- Unreal: `.uproject`, gameplay modules and `.Build.cs`, plugin and engine metadata.
- Unity: `Assets/` plus `ProjectSettings/ProjectVersion.txt`, package manifest/lock.
- Godot: `project.godot`, scene/script files, export presets, .NET metadata if present.
- A root tooling `package.json` does not establish the game runtime, and C# alone
  does not distinguish Godot from Unity. Keep the project's engine and packages.

If multiple projects exist, use the one named in the task. If evidence remains
ambiguous, state the evidence and ask the one necessary target question while
continuing independent inspection. For another engine, report the coverage gap;
do not create a Godot project or install an engine as a fallback.

## Select a small knowledge set

| Target | Candidate discovered skills |
| --- | --- |
| Unreal gameplay / Blueprints | `unreal-cpp-gameplay`, `unreal-blueprints` |
| Unreal input / AI / FX / build | `unreal-enhanced-input`, `unreal-behavior-trees`, `unreal-niagara`, `unreal-packaging` |
| Unity gameplay / data / loading | `unity-csharp-scripting`, `unity-scriptableobjects`, `unity-build-pipeline` |
| Unity feature | `unity-input-system`, `unity-physics`, `unity-animation`, `unity-tilemap-2d`, `unity-navmesh` as relevant |
| Godot scenes / resources / language | `godot-nodes-scenes`, `godot-resources`, `godot-gdscript` or `godot-csharp` |
| Godot feature | Discover the installed animation, audio, UI, physics, signals, shaders, movement, export or multiplayer skill by its actual name |
| Engine testing / lifecycle | The selected engine's `*-testing` / `*-runtime-safety` |
| Cross-engine domain | `save-systems`, `game-ai`, `ai-behavior-trees-utility-ai`, `procedural-gen`, `dialogue-systems`, `audio-design`, `shader-programming`, `physics-tuning`, `level-design`, `input-systems`, `game-feel`, `game-ui-ux`, `camera-systems`, `create-game-assets` |
| Performance | The single local `performance-optimization` |

Keep claims tied to the installed project version and official documentation or
matching engine source. Skill examples describe authoring baselines, not proof
that those versions exist in the project. Report missing profile skills and use
project instructions; do not invent successful loading or install a second pack.

Matt remains responsible for interviews, decision maps, specs, tasks, design,
TDD, debugging and review. For a requested phase follow that phase directly;
this router must not recursively start `game-production-workflow` or user-only
Matt skills. `grill-with-docs` and `wayfinder` remain first-class explicit entries.
